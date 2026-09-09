# Operação iCal

Cada feed é cadastrado por backend autenticado para uma unidade específica. Um `feedId` é persistido com organização, propriedade, unidade, provedor e URL do feed; várias OTAs podem ser vinculadas à mesma unidade.

Use `POST /api/integration/ical/feeds/:feedId/sync` para iniciar uma sincronização. O servidor baixa o conteúdo: timeout de 10 segundos, máximo de 1 MB, até três tentativas com backoff limitado e redirects desabilitados. URLs localhost, privadas, link-local ou de infraestrutura são bloqueadas no cadastro e antes do download; todos os endereços retornados pela resolução DNS são validados.

O runtime atual usa `fetch` nativo e não fixa o socket no IP previamente validado. Portanto, há risco residual de DNS rebinding entre a validação e a conexão; este risco deve ser reavaliado antes de permitir feeds de domínios não confiáveis.

Eventos são identificados por tenant, unidade, feed e UID. `STATUS:CANCELLED` explícito pode cancelar o vínculo correspondente; a ausência de um evento no feed não implica cancelamento. Conflitos não sobrescrevem Reservations e são registrados para tratamento posterior.

O export iCal fornece somente disponibilidade, UID e período: não contém PII, valores, status financeiro ou observações. O lease de sync é de cinco minutos e previne sincronizações simultâneas do mesmo feed. Scheduler ainda não está configurado.

Antes de release, CI/ambiente isolado deve executar Firestore Rules, concorrência real de Reservations/Direct Booking, locks de ocupação, liberação em cancelamento, iCal versus Reservation e transações cross-tenant.
