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

Associe o projeto ao Firebase pelo Console Firebase ou `firebase projects:addfirebase "$PROJECT_ID"`. Crie uma Web App de staging, configure apenas os provedores de Auth realmente usados pela aplicação e inclua os domínios de staging em **Authorized domains**. A configuração Web Firebase é pública e deve ser exclusiva de staging; restrinja sua API key por domínio/API. Forneça-a no build por `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_MEASUREMENT_ID` e `VITE_FIRESTORE_DATABASE_ID`. Para este staging, defina explicitamente `VITE_FIRESTORE_DATABASE_ID=synapse-staging`; não deixe o client cair em `(default)`. Não use service-account JSON na imagem.

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

## Identidades permanentes de teste

O administrador já provisionado é reconhecido por `GET /api/saas/session`: o Firebase ID token é validado e o backend resolve `users/<UID>`, organização, propriedade, papel e permissões. Não recrie ou altere esse perfil.

Para contas criadas manualmente no Firebase Auth, use somente o vínculo server-side temporário abaixo. Ele não cria contas Firebase, não recebe senha e fica invisível enquanto desativado:

```text
STAGING_IDENTITY_PROVISIONING_ENABLED=true
STAGING_IDENTITY_PROVISIONING_ORGANIZATION_ID=stg_org_synapse_core
STAGING_TEST_STAFF_UID=<UID_FIREBASE_DO_STAFF_DE_TESTE>
STAGING_TEST_STAFF_EMAIL=<EMAIL_DO_STAFF_DE_TESTE>
STAGING_TEST_STAFF_NAME=<NOME_DO_STAFF_DE_TESTE>
STAGING_TEST_GUEST_UID=<UID_FIREBASE_DO_HOSPEDE_DE_TESTE>
STAGING_TEST_GUEST_EMAIL=<EMAIL_DO_HOSPEDE_DE_TESTE>
STAGING_TEST_GUEST_NAME=<NOME_DO_HOSPEDE_DE_TESTE>
STAGING_TEST_GUEST_PHONE=<TELEFONE_SINTETICO_APENAS_STAGING>
```

Após um deploy de configuração autorizado, um administrador com `manage_staff_permissions` abre **SaaS → Identidades de Staging** e usa o único botão de provisionamento. A sessão Firebase do navegador é usada automaticamente para a chamada protegida; nenhum token, senha, UID, e-mail, `guestId`, tenant ou papel é enviado pelo navegador. O backend obtém as coordenadas não secretas exclusivamente da configuração acima, valida UID/e-mail/conta Firebase pelo Admin SDK, deriva tenant/propriedade da sessão administrativa e cria atomica e idempotentemente `users/<UID>`, `staff/<UID>` e auditoria server-only. O papel Staff é fixo em `receptionist`: `view_dashboard`, `manage_bookings`, `view_pos` e `operate_pos`; não há permissões owner/admin, financeiras, de gestão de equipe ou de mudança de papel.

No mesmo clique, o servidor chama o CRM canônico (`crmService.createGuest`) com o e-mail configurado. Esse contrato localiza por e-mail e reutiliza o perfil já existente; se não existir, cria um perfil CRM no tenant do administrador e devolve o `guestId` real. Só então ele valida o hóspede no Firebase Admin e cria `guestIdentities/<UID>` com auditoria server-only. Ele nunca cria `users/<UID>` ou `staff/<UID>` para hóspedes. Depois desative `STAGING_IDENTITY_PROVISIONING_ENABLED` e faça novo deploy de configuração; a ferramenta volta a responder como indisponível.

As rotas de baixo nível continuam disponíveis somente para recuperação administrativa controlada (`POST /api/staging/identities/staff` e `POST /api/staging/identities/guest`), mas o procedimento padrão para staging é a ferramenta autenticada. `GET /api/staging/identities/status` não retorna UID, e-mail, telefone, segredo ou token: apenas informa se a operação temporária está habilitada e completamente configurada.

## Dados demo e amostras

Fixtures, mocks e exemplos existentes continuam no repositório para demonstração, preview, onboarding, desenvolvimento e testes. Eles não são autoridade de produção e não são carregados automaticamente quando Firestore está vazio. O bootstrap de staging não reutiliza seus IDs nem seu inventário. Uma futura ação administrativa de **carregar/limpar dados de amostra** deverá ser server-side, explicitamente identificada como `sample`/`demo`, escopada por tenant e incapaz de alterar registros canônicos; ela não é implementada por este bootstrap.
