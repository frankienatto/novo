# Deploy Cloud Run de staging

O `Dockerfile` compila frontend e backend em estágio separado e a imagem final não contém `.env`, service accounts, `node_modules` de desenvolvimento nem segredos. Cloud Run fornece `PORT`; o servidor o respeita. Use `GET /health/liveness` para liveness e `GET /health/readiness` para prontidão.

## Artifact Registry

```bash
export PROJECT_ID=<GCP_STAGING_PROJECT_ID>
export REGION=<GCP_REGION>
export REPOSITORY=synapse
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
  --tag "$IMAGE" .
docker push "$IMAGE"
```

Esses build args são somente a configuração pública da Firebase Web App de staging e serão incorporados ao bundle frontend. Nunca passe secret server-side por build args. Também é aceitável usar Cloud Build com o mesmo Dockerfile, sem build args contendo segredos.

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
  --set-env-vars="NODE_ENV=production,FIREBASE_PROJECT_ID=${PROJECT_ID}" \
  --set-secrets="JWT_SECRET=JWT_SECRET:latest,STRIPE_SECRET_KEY=STRIPE_SECRET_KEY:latest,STRIPE_WEBHOOK_SECRET=STRIPE_WEBHOOK_SECRET:latest,N8N_SECRET=N8N_SECRET:latest"
```

Adicione `GEMINI_API_KEY`, OAuth, Aloha e Beds24 apenas quando a integração correspondente for ativada. Embora n8n possa ficar funcionalmente desativado, o runtime de produção atual exige `N8N_SECRET`. Para prontidão totalmente verde, injete também `GEMINI_API_KEY`; sem ele, a aplicação permanece fail-closed para IA e `/health/readiness` reporta configuração incompleta. Após o deploy, registre a URL de staging nos domínios autorizados do Firebase Auth e no endpoint de webhook Stripe em modo teste.
