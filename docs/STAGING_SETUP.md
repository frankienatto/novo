# Staging Google Cloud e Firebase

> Execute estes comandos somente após autenticação explícita no `gcloud`, usando um projeto de staging separado. Substitua todos os placeholders; nenhum comando abaixo deve ser executado com um projeto de produção.

## Projeto e APIs

Escolha uma região próxima à operação e aos usuários — por exemplo, `<GCP_REGION>` — e mantenha Firestore, Cloud Run e integrações na mesma região quando possível.

```bash
export PROJECT_ID=<GCP_STAGING_PROJECT_ID>
export REGION=<GCP_REGION>
gcloud projects create "$PROJECT_ID"
gcloud config set project "$PROJECT_ID"
gcloud services enable run.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com cloudbuild.googleapis.com firestore.googleapis.com identitytoolkit.googleapis.com logging.googleapis.com monitoring.googleapis.com
```

Associe o projeto ao Firebase pelo Console Firebase ou `firebase projects:addfirebase "$PROJECT_ID"`. Configure Firebase Auth com os provedores realmente usados pela aplicação e inclua os domínios de staging em **Authorized domains**. A configuração Web Firebase é pública e deve ser exclusiva de staging; restrinja sua API key por domínio/API. Não use service-account JSON na imagem.

Crie Firestore vazio para staging, aplique as regras e não importe fixtures automaticamente:

```bash
firebase use "$PROJECT_ID"
firebase deploy --only firestore:rules --project "$PROJECT_ID"
```

Se índices forem adicionados futuramente, use `firebase deploy --only firestore:indexes --project "$PROJECT_ID"`. O repositório atual não contém `firestore.indexes.json`.

## Secrets e IAM

Crie uma identidade de runtime dedicada e não conceda Owner ou Editor:

```bash
gcloud iam service-accounts create synapse-staging-runtime --display-name="Synapse staging runtime"
export RUNTIME_SA="synapse-staging-runtime@${PROJECT_ID}.iam.gserviceaccount.com"
gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:${RUNTIME_SA}" --role="roles/datastore.user"
gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:${RUNTIME_SA}" --role="roles/secretmanager.secretAccessor"
```

Cloud Run já envia logs ao Cloud Logging pela identidade de runtime. Acrescente somente permissões adicionais comprovadamente necessárias; a identidade não deve administrar IAM, Firestore, Cloud Run ou segredos.

Crie secrets sem colocá-los em histórico, argumentos de build ou `VITE_*`:

```bash
gcloud secrets create JWT_SECRET --replication-policy=automatic
printf '%s' '<STAGING_VALUE>' | gcloud secrets versions add JWT_SECRET --data-file=-
gcloud secrets create STRIPE_SECRET_KEY --replication-policy=automatic
printf '%s' '<STAGING_VALUE>' | gcloud secrets versions add STRIPE_SECRET_KEY --data-file=-
gcloud secrets create STRIPE_WEBHOOK_SECRET --replication-policy=automatic
printf '%s' '<STAGING_VALUE>' | gcloud secrets versions add STRIPE_WEBHOOK_SECRET --data-file=-
gcloud secrets create N8N_SECRET --replication-policy=automatic
printf '%s' '<STAGING_VALUE>' | gcloud secrets versions add N8N_SECRET --data-file=-
```

O runtime atual exige `N8N_SECRET` em produção, mesmo que os fluxos n8n permaneçam desabilitados; injete um valor exclusivo de staging. `GEMINI_API_KEY`, `ALOHA_PRO_WEBHOOK_SECRET`, `ALOHA_API_KEY`, `GOOGLE_CALENDAR_CLIENT_SECRET` e `BEDS24_API_TOKEN` seguem o mesmo padrão apenas quando a integração correspondente for habilitada. O endpoint de prontidão fica degradado sem `GEMINI_API_KEY`; configure-o para uma prontidão totalmente verde. Credenciais Google Calendar incluem também `GOOGLE_CALENDAR_CLIENT_ID` e `GOOGLE_CALENDAR_REDIRECT_URI`; OAuth/persistência ainda não está implementado. `N8N_ORGANIZATION_ID` e `N8N_PROPERTY_ID` não são secrets, mas restringem um deployment a um tenant.

## Dados de staging

Staging começa vazio. Provisione manualmente uma organization, property, unidades, catálogo público e pricing de teste. Não migre `P01`, `beach`, `sanctuary`, `org_dev_default`, `prop_dev_default`, `INITIAL_ROOMS` ou `database.ts`.
