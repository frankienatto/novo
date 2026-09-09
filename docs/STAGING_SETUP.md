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

Associe o projeto ao Firebase pelo Console Firebase ou `firebase projects:addfirebase "$PROJECT_ID"`. Crie uma Web App de staging, configure apenas os provedores de Auth realmente usados pela aplicação e inclua os domínios de staging em **Authorized domains**. A configuração Web Firebase é pública e deve ser exclusiva de staging; restrinja sua API key por domínio/API. Forneça-a no build por `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_MEASUREMENT_ID` e, quando não for `(default)`, `VITE_FIRESTORE_DATABASE_ID`. Não use service-account JSON na imagem.

Crie Firestore vazio para staging, aplique as regras e não importe fixtures automaticamente. Este repositório declara explicitamente apenas o banco nomeado `synapse-staging`; portanto, o comando abaixo não altera `(default)` nem qualquer banco legado/AI Studio do mesmo projeto:

```bash
firebase deploy --only firestore:synapse-staging --project servidor-hospedagem1
```

Não use `firebase deploy --only firestore:rules` casualmente neste projeto multi-database: esse alvo pode implantar regras para todos os bancos configurados no `firebase.json`. Se índices forem adicionados futuramente, associe-os explicitamente ao mesmo `database` antes de configurar um deploy. O repositório atual não contém `firestore.indexes.json`.

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

`N8N_SECRET`, `GEMINI_API_KEY`, credenciais Stripe, Mercado Pago, PicPay,
Aloha, Google Calendar e Beds24 são capacidades opcionais: ausência delas não
impede o processo de iniciar, mas cada integração correspondente falha fechada.
O endpoint de prontidão informa as capacidades configuradas sem expor valores.
Credenciais Google Calendar incluem também `GOOGLE_CALENDAR_CLIENT_ID` e
`GOOGLE_CALENDAR_REDIRECT_URI`; OAuth/persistência ainda não está implementado.
`N8N_ORGANIZATION_ID` e `N8N_PROPERTY_ID` não são secrets, mas restringem um
deployment a um tenant.

## Dados de staging

Staging começa vazio. Provisione manualmente uma organization, property, unidades, catálogo público e pricing de teste. Não migre `P01`, `beach`, `sanctuary`, `org_dev_default`, `prop_dev_default`, `INITIAL_ROOMS` ou `database.ts`.

Enquanto esse provisionamento autorizado não existir, a aplicação deve permanecer utilizável: áreas internas exibem um estado de acesso/configuração pendente e o caminho público de reserva informa que o catálogo canônico ainda não foi provisionado. Não habilite auto-seed no navegador nem use fixtures locais como fallback de produção; a reserva pública só pode operar depois da configuração canônica de catálogo e disponibilidade.

## Bootstrap server-side único de staging

O primeiro tenant de staging é criado somente pelo backend, em uma transação Firestore e com registros sintéticos `stg_*`. Antes de executar, configure no runtime (nunca em `VITE_*`):

```text
STAGING_BOOTSTRAP_ENABLED=true
STAGING_BOOTSTRAP_UID=<UID_FIREBASE_AUTH_DO_ADMIN_DE_STAGING>
```

Após o deploy que contém essa configuração, o operador autenticado como esse UID chama `POST /api/staging/bootstrap` com um Firebase ID token no cabeçalho `Authorization: Bearer <ID_TOKEN>`. O corpo é ignorado. A resposta contém somente IDs sintéticos de organization, property e catálogo público; uma segunda execução retorna `already_provisioned` sem duplicar documentos. Remova ou defina `STAGING_BOOTSTRAP_ENABLED=false` imediatamente após sucesso e faça novo deploy de configuração.

Exemplo de execução pós-deploy (o token deve ser obtido pelo cliente autenticado e mantido fora de histórico/shell compartilhado):

```bash
curl --fail-with-body --request POST "$STAGING_SERVICE_URL/api/staging/bootstrap" \
  --header "Authorization: Bearer $FIREBASE_ID_TOKEN" \
  --header "Content-Type: application/json" \
  --data '{}'
```

O bootstrap cria `organizations`, `properties`, `users`, o perfil `staff` associado ao UID, uma categoria PMS, duas unidades, `publicBookingProperties`, `publicBookingUnits` e um audit server-only. Não cria reserva, pagamento, integração ou dado de produção. Para verificar: faça login, confirme a resolução do perfil `users/<UID>` para a propriedade staging e solicite cotação pública usando o `publicPropertyId` e um dos `publicUnitId` retornados.

## Dados demo e amostras

Fixtures, mocks e exemplos existentes continuam no repositório para demonstração, preview, onboarding, desenvolvimento e testes. Eles não são autoridade de produção e não são carregados automaticamente quando Firestore está vazio. O bootstrap de staging não reutiliza seus IDs nem seu inventário. Uma futura ação administrativa de **carregar/limpar dados de amostra** deverá ser server-side, explicitamente identificada como `sample`/`demo`, escopada por tenant e incapaz de alterar registros canônicos; ela não é implementada por este bootstrap.
