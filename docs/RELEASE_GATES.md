# Gates obrigatórios de staging e produção

## CI isolado

O workflow `.github/workflows/ci.yml` executa Node 22, Java 21, `npm ci`, testes, lint, build e Firestore Emulator. Não usa secrets nem faz deploy.

## Validação de staging

1. Rules Emulator e bloqueio de escrita direta em registros financeiros, feeds, locks, eventos Stripe e `aiRuns`.
2. Duas Reservations e dois Direct Bookings concorrentes: somente uma reserva vencedora por unidade/período; períodos adjacentes permitidos.
3. Cancelamento libera `occupancyLocks`; iCal import/update/cancel/conflict/export não duplica nem expõe PII.
4. Mesmo ID em tenants/properties distintos não cruza dados ou transações.
5. Gemini ausente falha fechado; Gemini configurado responde com tenant/audit corretos.
6. Stripe em test mode: PaymentIntent, webhook assinado, idempotência e assinatura inválida rejeitada.
7. E2E: frontend, login/logout, provisioning controlado de tenant/property/unidade/rate, booking público, PMS, calendários, Reception, Housekeeping, Maintenance, Revenue, CRM, IA/governança, logs e reinício Cloud Run com persistência.

## DNS rebinding

O downloader iCal bloqueia esquemas inseguros, redirects e todos os IPs DNS privados/locais antes do download. Ele ainda não fixa a conexão ao IP validado. Para produção com feeds de terceiros não controlados, adote socket/IP pinning ou proxy/downloader com resolução controlada. Em staging, use feeds controlados.

## Integrações opcionais

Google Calendar OAuth/persistência, n8n multi-tenant e Beds24 backend não bloqueiam o core enquanto desligados/fail-closed. Credenciais reais e deploy Cloud são gates operacionais; não são incluídos no Git.
