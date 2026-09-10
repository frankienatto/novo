# Integração Canônica: PMS, reservas e catálogo público

## Fonte de verdade

Em staging e produção, o navegador não é autoridade para dados operacionais:

- autenticação Firebase fornece apenas o ID token;
- `/api/saas/session` resolve usuário, tenant e propriedade no servidor;
- `/api/pms/categories`, `/api/pms/units` e `/api/pms/reservations` são as fontes de leitura do PMS;
- as UHs canônicas são persistidas em `roomUnits`; a coleção legada `rooms` não participa do runtime canônico;
- mudanças de status de UH usam `PATCH /api/pms/units/:id/status`, com `manage_properties`;
- reservas internas usam `/api/pms/reservations` e exigem `manage_bookings` para mutações.

O cliente não envia `organizationId` nem `propertyId` como autoridade. O servidor deriva o contexto a partir do Firebase ID token, do registro SaaS e do `tenantMiddleware`.

## Catálogo e reserva pública

O catálogo público é disponibilizado exclusivamente por mapeamentos administrados no servidor:

- `GET /api/public-booking/catalog/:publicPropertyId` retorna somente a projeção pública de UHs ativas e planos tarifários;
- `POST /api/public-booking/quote` calcula valor no servidor;
- `POST /api/public-booking/reservations` cria a reserva canônica e a capability de checkout;
- pagamentos continuam em `/api/public-booking/reservations/:reservationId/payments` com capability e idempotência.

Identificadores internos de tenant, propriedade e UH não são incluídos no catálogo público. Sem mapeamento/catálogo ativo, a resposta é indisponível; nunca há substituição por preço, inventário ou propriedade demo.

## Dados demo e desenvolvimento

Os conjuntos de exemplo permanecem no repositório para preview, demonstração, testes e desenvolvimento. Eles são habilitados somente no modo de desenvolvimento.

Em staging/produção:

- listeners e gravações Firestore originados pelo cliente legado são desabilitados;
- dados vazios permanecem estruturalmente seguros, sem inventário fictício;
- o bootstrap de staging usa identificadores `stg_*` próprios, nunca `P01`, `beach`, `sanctuary`, `org_dev_default`, `prop_dev_default`, `uh_*` ou `INITIAL_ROOMS`.

Uma futura ação administrativa de “Carregar dados de exemplo”/“Limpar dados de exemplo” deve ser server-side, auditada, explicitamente marcada como `sample` e isolada dos registros canônicos. Ela não é executada automaticamente nesta fase.

## Portal do hóspede, pré-chegada e mobile

Em produção/staging, o `GuestPortalView`, o check-in online e a pré-chegada legados não são renderizados: eles dependem da base visual legada. O aplicativo mostra estado controlado até existir uma associação canônica, autorizada e tenant-scoped entre Firebase UID, perfil CRM e reserva. Isso impede fixture, acesso cross-tenant e gravação direta no Firestore.

O shell preserva safe areas, bloqueia overflow horizontal e mantém controles de formulário legíveis em mobile. A futura migração do portal deve consumir APIs server-side para perfil, reservas, serviços, documentos e mensagens; documentos não devem ser persistidos como data URL em uma reserva.
