# Deploy Cloud Run de staging

O `Dockerfile` compila frontend e backend em estágio separado e a imagem final não contém `.env`, service accounts, `node_modules` de desenvolvimento nem segredos. Cloud Run fornece `PORT`; o servidor o respeita. Use `GET /health/liveness` para liveness e `GET /health/readiness` para prontidão.

## Artifact Registry e build do frontend

Antes de iniciar uma build, exporte os nove valores públicos da Firebase Web
App e do deployment. Eles não são secrets, mas são obrigatórios: o Vite os
incorpora ao bundle estático e o `Dockerfile` interrompe a build se qualquer
um estiver ausente. Não use `.env` na imagem e não passe secrets server-side
por `--build-arg`.

```bash
export PROJECT_ID=<GCP_STAGING_PROJECT_ID>
export REGION=<GCP_REGION>
export REPOSITORY=synapse
export FIRESTORE_DATABASE_ID=<FIRESTORE_STAGING_DATABASE_ID>
export IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/synapse:${GIT_SHA}"
gcloud artifacts repositories create "$REPOSITORY" --repository-format=docker --location="$REGION" --description="Synapse staging images"
gcloud auth configure-docker "${REGION}-docker.pkg.dev"
docker build \
  --build-arg VITE_FIREBASE_API_KEY="$VITE_FIREBASE_API_KEY" \
  --build-arg VITE_FIREBASE_AUTH_DOMAIN="$VITE_FIREBASE_AUTH_DOMAIN" \
  --build-arg VITE_FIREBASE_PROJECT_ID="$VITE_FIREBASE_PROJECT_ID" \
  --build-arg VITE_FIREBASE_APP_ID="$VITE_FIREBASE_APP_ID" \
  --build-arg VITE_FIREBASE_STORAGE_BUCKET="$VITE_FIREBASE_STORAGE_BUCKET" \
  --build-arg VITE_FIREBASE_MESSAGING_SENDER_ID="$VITE_FIREBASE_MESSAGING_SENDER_ID" \
  --build-arg VITE_FIREBASE_MEASUREMENT_ID="$VITE_FIREBASE_MEASUREMENT_ID" \
  --build-arg VITE_FIRESTORE_DATABASE_ID="$VITE_FIRESTORE_DATABASE_ID" \
  --build-arg VITE_PUBLIC_PROPERTY_ID="$VITE_PUBLIC_PROPERTY_ID" \
  --tag "$IMAGE" .
docker push "$IMAGE"
```

Os nove build args são obrigatórios e públicos: `VITE_FIREBASE_API_KEY`,
`VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`,
`VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_STORAGE_BUCKET`,
`VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_MEASUREMENT_ID`,
`VITE_FIRESTORE_DATABASE_ID` e `VITE_PUBLIC_PROPERTY_ID`.

Para o staging atual, use `VITE_FIRESTORE_DATABASE_ID=synapse-staging` e
`VITE_PUBLIC_PROPERTY_ID=stg-public-synapse-core`. Este último continua sendo
um identificador público opaco; não o substitua por `organizationId` ou pelo
`propertyId` interno. O fallback de host do frontend é limitado ao Cloud Run
de staging e não cria fallback automático em produção.

### Cloud Build (recomendado)

O repositório inclui `cloudbuild.staging.yaml`. Ele exige a passagem explícita
de todos os nove valores e os encaminha ao Dockerfile. No Cloud Shell, carregue
os valores públicos de uma fonte local segura (por exemplo, variáveis da
sessão), sem gravá-los no Git, e execute:

```bash
gcloud builds submit --config=cloudbuild.staging.yaml \
  --substitutions=_IMAGE_URI="$IMAGE",_VITE_FIREBASE_API_KEY="$VITE_FIREBASE_API_KEY",_VITE_FIREBASE_AUTH_DOMAIN="$VITE_FIREBASE_AUTH_DOMAIN",_VITE_FIREBASE_PROJECT_ID="$VITE_FIREBASE_PROJECT_ID",_VITE_FIREBASE_APP_ID="$VITE_FIREBASE_APP_ID",_VITE_FIREBASE_STORAGE_BUCKET="$VITE_FIREBASE_STORAGE_BUCKET",_VITE_FIREBASE_MESSAGING_SENDER_ID="$VITE_FIREBASE_MESSAGING_SENDER_ID",_VITE_FIREBASE_MEASUREMENT_ID="$VITE_FIREBASE_MEASUREMENT_ID",_VITE_FIRESTORE_DATABASE_ID="$VITE_FIRESTORE_DATABASE_ID",_VITE_PUBLIC_PROPERTY_ID="$VITE_PUBLIC_PROPERTY_ID" \
  .
```

Não forneça `JWT_SECRET`, tokens de provedores de pagamento, segredos de
webhook, Gemini ou qualquer outro secret nessa build.

## Serviço

O frontend, public booking e o webhook Stripe exigem alcance público. Portanto, o serviço pode usar `--allow-unauthenticated`, desde que a autorização da aplicação permaneça ativa: middleware Firebase/Auth, tenant/RBAC, capability de checkout e assinatura Stripe continuam obrigatórios.

```bash
export RUNTIME_SA="synapse-staging-runtime@${PROJECT_ID}.iam.gserviceaccount.com"
gcloud run deploy synapse-staging \
  --image="$IMAGE" \
  --project="$PROJECT_ID" \
  --region="$REGION" \
  --service-account="$RUNTIME_SA" \
  --allow-unauthenticated \
  --port=8080 \
  --cpu=1 --memory=512Mi --min-instances=0 --max-instances=3 \
  --set-env-vars="NODE_ENV=production,FIREBASE_PROJECT_ID=${PROJECT_ID},FIRESTORE_DATABASE_ID=${FIRESTORE_DATABASE_ID}" \
  --set-secrets="JWT_SECRET=JWT_SECRET:latest"
```

Adicione `STRIPE_SECRET_KEY` e `STRIPE_WEBHOOK_SECRET`, ou os segredos do
Mercado Pago/PicPay, somente quando o respectivo provedor for ativado. Gemini,
n8n, OAuth, Aloha e Beds24 também são opcionais e falham fechados quando não
configurados. Após o deploy, registre a URL de staging nos domínios autorizados
do Firebase Auth e no endpoint de webhook do provedor configurado em modo teste.
