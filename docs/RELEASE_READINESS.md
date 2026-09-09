# Release readiness e handoff

## Fonte de verdade

O repositório GitHub, branch `main`, é a fonte de verdade. Para handoff ao AI Studio, abrir o commit consolidado mais recente de `main`; o AI Studio não deve sobrescrever arquivos, dependências, regras Firestore, `.env.example` ou configuração de deploy sem revisão via Git.

## Estado de código

O build (`npm run build`), lint (`npm run lint`) e suíte padrão (`npm test`) são determinísticos e não usam credenciais, Gemini ou Firestore de produção. Testes que exigem infraestrutura são pulados explicitamente sem configuração:

- `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npm test -- server/test/firestoreRulesEmulator.test.ts`
- `SYNAPSE_E2E_BASE_URL=http://host-isolado:3000 npm test -- server/modules/ai/validation/apiRoutesE2E.test.ts`

Antes de produção, executar em CI/runner isolado: Rules Emulator, concorrência de Reservation/Direct Booking, `occupancyLocks`, liberação por cancelamento, conflito iCal versus Reservation e transações cross-tenant.

## Ambiente de produção

Use Secret Manager e variáveis de runtime do Cloud Run; nunca arquivos `.env`, contas de serviço ou segredos no frontend.

### Obrigatórias para o core

| Variável | Finalidade | Local em produção |
| --- | --- | --- |
| `NODE_ENV=production` | habilita falhas fechadas | Cloud Run env |
| `PORT` | porta fornecida pelo Cloud Run | Cloud Run env |
| `FIREBASE_PROJECT_ID` ou `GCP_PROJECT`/`GCLOUD_PROJECT` | Firebase Admin/Firestore | Cloud Run env/identidade do serviço |
| `FIRESTORE_DATABASE_ID` | banco Firestore nomeado, se utilizado | Cloud Run env |
| `JWT_SECRET` | sessão/autorização | Secret Manager |
| `STRIPE_SECRET_KEY` | PaymentIntent server-side | Secret Manager |
| `STRIPE_WEBHOOK_SECRET` | assinatura Stripe | Secret Manager |

### Integrações opcionais

| Variável | Integração | Estado |
| --- | --- | --- |
| `GEMINI_API_KEY` | Gemini | configurável, fail-closed |
| `N8N_SECRET`, `N8N_ORGANIZATION_ID`, `N8N_PROPERTY_ID` | n8n | configurável, um tenant por deployment |

Os provedores de pagamento são capacidades opcionais e independentes: o core
inicia com `JWT_SECRET`; uma solicitação a provedor não configurado falha
fechada. Stripe exige `STRIPE_SECRET_KEY` e `STRIPE_WEBHOOK_SECRET`; Mercado
Pago exige `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET` e
`PAYMENTS_PUBLIC_BASE_URL`; PicPay Pix exige `PICPAY_CLIENT_ID`,
`PICPAY_CLIENT_SECRET` e `PICPAY_WEBHOOK_TOKEN`. Nenhuma dessas variáveis deve
ser `VITE_*`.
| `ALOHA_PRO_WEBHOOK_SECRET`, `ALOHA_API_KEY` | Aloha | configurável |
| `SYSTEM_WEBHOOK_EMAIL`, `SYSTEM_WEBHOOK_PASSWORD` | legado removido | **DEPRECATED**; não configurar — webhooks usam a identidade ADC do Cloud Run |
| `GOOGLE_CALENDAR_CLIENT_ID`, `GOOGLE_CALENDAR_CLIENT_SECRET`, `GOOGLE_CALENDAR_REDIRECT_URI` | Google Calendar | OAuth/persistência pendentes |
| `BEDS24_API_TOKEN` | Beds24 | backend pendente; desativado com segurança |
| `GOOGLE_ADS_API_KEY`, `META_ADS_ACCESS_TOKEN`, `META_ADS_AD_ACCOUNT_ID` | Ads | não implementadas; endpoints falham fechados |

`VITE_STRIPE_PUBLISHABLE_KEY` e a configuração Firebase Web são identificadores públicos de cliente, não segredos. Para builds de staging/produção, forneça `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_MEASUREMENT_ID` e, quando aplicável, `VITE_FIRESTORE_DATABASE_ID`. Restrinja a chave Firebase por domínio/API; ausência dessa configuração faz o frontend falhar fechado em produção.

## Google Cloud recomendado

Cloud Run executa o container Node/Express; Firestore e Firebase Auth permanecem os serviços de dados/identidade. Use Artifact Registry, Secret Manager e Cloud Logging/Monitoring. Não há necessidade atual de Cloud SQL. O `Dockerfile` faz build multi-stage, não incorpora `.env` nem credenciais e usa `PORT` do runtime. Probe: `GET /health/liveness`; prontidão: `GET /health/readiness`.

## Provisionamento e homologação

Nenhum fixture (`P01`, `beach`, `sanctuary`, `org_dev_default` ou `prop_dev_default`) é dado de produção. Antes do go-live, provisionar organização, property, unidades, catálogo público, pricing/rate plans e integrações reais.

Checklist de homologação: login/RBAC/tenant; property e unidades reais; reserva pública; PaymentIntent e webhook Stripe; disponibilidade, iCal import/export, conflito/overbooking, cancelamento/liberação; IA e governança; logs/erros; reinício do backend; e os testes isolados listados acima.

## Integrações e gates

- iCal é o mecanismo OTA disponível e é configurável por feed persistente.
- Google Calendar, n8n multi-tenant e Beds24 não bloqueiam o core enquanto permanecerem desativados/configurados com falha fechada.
- DNS rebinding continua risco residual: a URL é validada antes do `fetch`, com todos os IPs DNS checados e redirects bloqueados, mas o socket não é fixado no IP validado.
- Credenciais reais, homologação E2E e deploy Cloud são gates de infraestrutura, não mudanças de código pendentes.
