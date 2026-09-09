# Payment Core canônico

O domínio financeiro do Synapse é independente do provedor: cada registro em
`paymentRecords` referencia a Reservation, organização, propriedade, método,
valor, moeda, estado canônico e referência externa. O navegador escolhe apenas
`provider` e `method`; valor, moeda, tenant e confirmação financeira são sempre
derivados e validados no servidor.

Combinações suportadas:

| Provedor | Cartão | Pix |
| --- | --- | --- |
| Stripe | Sim | Não |
| Mercado Pago | Sim | Sim |
| PicPay | Não | Sim |

`pix` é um método canônico, e não um conceito de negócio acoplado a Mercado
Pago ou PicPay. QR code e código copia-e-cola mantêm a cobrança como `pending`;
somente a confirmação autenticada e consultada no provedor pode marcar o
pagamento/Reservation como `paid`.

## Rotas

- `POST /api/public-booking/reservations/:reservationId/payments`: requer
  `x-checkout-capability` e aceita apenas `provider`, `method` e dados de
  tokenização/apresentação do provedor.
- `POST /api/payments/stripe/webhook`: assinatura Stripe e corpo bruto. A rota
  anterior `/api/public-booking/stripe/webhook` permanece como compatibilidade.
- `POST /api/payments/mercadopago/webhook`: valida o HMAC da notificação e
  consulta o pagamento no Mercado Pago antes de alterar estado canônico.
- `POST /api/payments/picpay/webhook`: valida o token de callback recebido no
  header `Authorization` e consulta a cobrança PicPay antes de alterar estado
  canônico. O callback é somente um gatilho: nunca é prova financeira isolada.

Os registros `paymentRecords`, `paymentWebhookEvents`, `stripeEvents`,
`checkoutCapabilities` e `publicReservationIdempotency` são exclusivamente do
servidor nas regras Firestore. Replays são persistidos por evento de provedor.

## Configuração por capacidade

O core precisa de `JWT_SECRET` em produção. Provedores ausentes não impedem o
processo de iniciar; apenas suas rotas retornam erro controlado de configuração.

| Capacidade | Segredos server-side | Configuração pública opcional |
| --- | --- | --- |
| Stripe cartão | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | `VITE_STRIPE_PUBLISHABLE_KEY` |
| Mercado Pago | `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET`, `PAYMENTS_PUBLIC_BASE_URL` | `VITE_MERCADOPAGO_PUBLIC_KEY`, quando a tokenização web for ativada |
| PicPay Pix | `PICPAY_CLIENT_ID`, `PICPAY_CLIENT_SECRET`, `PICPAY_WEBHOOK_TOKEN` | nenhuma |

`PICPAY_PIX_API_BASE_URL` é apenas override server-side de endpoint. Nunca use
segredos em `VITE_*`. Antes de habilitar PicPay em staging, confirme no portal
do parceiro a URL HTTPS de notificação e armazene o token exibido no painel em
`PICPAY_WEBHOOK_TOKEN`; o callback continua a consultar a cobrança no provedor
antes da confirmação local.

## Tentativas e retries

`Idempotency-Key` é obrigatório na criação de pagamento. O servidor persiste
somente seu hash e deriva um identificador de tentativa estável. Reenvio da
mesma requisição retorna a mesma tentativa; uma tentativa que falhou, expirou
ou foi cancelada deve usar uma nova chave para produzir uma nova cobrança.
