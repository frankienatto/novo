# Módulos de gestão canônicos

POS, Financeiro, Projetos e gestão de equipe usam rotas autenticadas sob
`/api/management` e `/api/saas/staff`. A organização e a propriedade vêm do
token Firebase validado e do middleware de tenant; campos equivalentes no corpo
da requisição não possuem autoridade.

- `posCatalogItems`, `posSales`, `financialEntries`, `projects` e `projectTasks`
  são coleções server-only. As Rules negam leitura e escrita diretas do browser.
- O servidor lê o preço ativo do catálogo, recalcula subtotal/desconto/total e
  rejeita fechamento sem referência ao Payment Core quando esse método é usado.
- Entradas financeiras usam chave lógica idempotente por ocorrência econômica.
  Fechamento manual de POS gera uma única receita; cancelamento gera reversão
  lógica, sem apagar registros.
- Equipe reutiliza `users` canônico. Elevação própria, permissões que o ator não
  possui, propriedade externa e alteração entre organizações são rejeitadas.
- Fora de desenvolvimento/demo, a navegação administrativa mostra apenas a
  projeção proveniente dessas APIs; DBState/fixtures não são autoridade.

Capacidades operacionais avançadas de POS, analytics financeira e colaboração
de projetos podem evoluir sem alterar a autoridade desses registros.
