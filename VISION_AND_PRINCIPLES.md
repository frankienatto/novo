# Synapse Hospitality — Visão, Princípios e Constituição da Plataforma

Este documento estabelece as diretrizes estratégicas, arquiteturais e operacionais inegociáveis da plataforma **Synapse Hospitality AHOS**. Ele funciona como a "Constituição" do produto, devendo orientar todas as decisões de engenharia, produto, design e negócios.

---

## 1. Missão da Synapse Hospitality
Empoderar meios de hospedagem independentes (pousadas, boutique hotéis, chalés e hostels) com inteligência operacional autônoma e de alta performance, nivelando o campo de jogo contra os grandes conglomerados hoteleiros sem a necessidade de equipes de TI dedicadas.

---

## 2. O Problema que Realmente Resolvemos
A fragmentação operacional e o excesso de sistemas desconectados (PMS engessados, OTAs predatórias, WhatsApps caóticos, planilhas manuais). A Synapse Hospitality elimina o **trabalho braçal repetitivo** (atendimento de rotina, conciliação manual de reservas, atualização de tarifas) e transforma dados dispersos em decisões estratégicas automáticas.

---

## 3. O que NUNCA Faremos
* **Não seremos um PMS legado genérico e pesado:** Não acumularemos telas infinitas de cadastros obsoletos nem fluxos burocráticos.
* **Não exporemos chaves ou APIs no Client-side:** Toda inteligência e integrações sensíveis residem estritamente no backend.
* **Não cobraremos taxas predatórias sobre reservas:** A Synapse é uma plataforma de inteligência SaaS, não uma intermediária de receita.
* **Não criaremos funcionalidades decorativas ("AI Slop"):** Recursos de IA sem utilidade clara de negócio são proibidos.

---

## 4. Princípios Arquiteturais Inegociáveis
1. **Simplicidade Pragmática acima de Abstrações Precoces:** Preferir a solução mais simples e legível. Overengineering é considerado defeito crítico.
2. **Serverless & Event-Driven:** Toda a infraestrutura roda sob demanda em containers Cloud Run e microsserviços gerenciados. Zero gestão de servidores dedicados.
3. **Isolamento e Segurança Multi-Tenant:** Segregação estrita por `tenantId` e `propertyId` na camada de banco de dados e APIs.
4. **Resiliência e Fallbacks Ativos:** Todo serviço de IA e integração externa possui mocks inteligentes, tratamentos de retries com backoff e mecanismos de gravação graciosa.

---

## 5. Princípios de UX Inegociáveis
1. **Zero Curva de Aprendizado:** Operação intuitiva inspirada no uso cotidiano. Se o hoteleiro precisa de treinamento pesado, o design falhou.
2. **Visão Unificada e Sem Troca de Contexto:** Painéis claros com baixa densidade cognitiva ("One-Click Actions").
3. **Invisibilidade da IA:** O usuário não interage com "prompts complexos", mas sim com assistentes operacionais que respondem e agem com contexto do hotel.
4. **Design Limpo e Responsivo:** Tipografia legível, esquema de cores sóbrio e suporte completo a dispositivos móveis.

---

## 6. Princípios de IA Inegociáveis
1. **Garantias Guardrailed:** Nenhum agente de IA concede descontos ou altera reservas sem respeitar os parâmetros delimitados pela gerência.
2. **Pipeline Unificado de IA:** Toda chamada de IA passa obrigatoriamente pelo `runGeminiCoreExecution` e pelo `Prompt Registry` server-side.
3. **Contexto Relevante (RAG Enxuto):** Injeção precisa de dados operacionais (Knowledge Center) sem sobrecarregar a janela de contexto.
4. **Determinismo Estruturado:** Saídas de IA destinadas a automação operam estritamente sob JSON Schemas tipados.

---

## 7. Equilíbrio entre Simplicidade e Poder
* **Complexidade no Backend, Simplicidade na Interface:** A complexidade da orquestração de múltiplos agentes, RAG e chamadas de API fica 100% oculta no servidor.
* **Workflows Pré-configurados (Out-of-the-box):** O cliente recebe agentes e modelos operacionais prontos para uso no Onboarding, ajustando apenas variáveis básicas.

---

## 8. Como Evitar Overengineering
* **Regra do "Três Casos Reais":** Não crie abstrações, frameworks internos ou generalizações antes de ter pelo menos três funcionalidades concretas que demandem essa estrutura.
* **Aproveitamento Máximo do Ecossistema Gerenciado:** Priorizar serviços nativos da plataforma (Firestore, Cloud Run, Firebase Auth, Google Workspace APIs) em vez de manter infraestruturas personalizadas.

---

## 9. Critério de Aceitação de Novas Funcionalidades (Filtro da Constituição)
Para que uma funcionalidade entre no backlog e seja implementada, ela deve responder "SIM" às três perguntas:
1. *Esta funcionalidade reduz o tempo de trabalho manual da equipe do hotel ou aumenta a venda direta?*
2. *Ela pode ser utilizada sem necessidade de treinamento técnico por parte do usuário final?*
3. *Ela consegue ser mantida e sustentada com a arquitetura serverless atual?*

Se a resposta for "NÃO" para qualquer uma das perguntas, a funcionalidade é descartada.

---

## 10. Sustentabilidade para Equipe Enxunta
* **Manutenibilidade Absoluta:** O código deve ser compreensível por qualquer desenvolvedor em poucos minutos.
* **Automação de CI/CD, Lint e Build:** Testes rigorosos de compilação antes de cada release para mitigar bugs em produção.
* **Documentação Dinâmica e Atualizada:** Cada avanço relevante é obrigatoriamente documentado em `CHANGELOG.md`, `PROJECT_PROGRESS.md` e `ARCHITECTURE_DECISIONS.md`.

---

## 11. Baixo Custo de Infraestrutura (FinOps / Serverless)
* **Escala ao Zero (Scale-to-Zero):** Pagamento estrito por uso real sem custos ociosos de computação.
* **Otimização de Contexto e Caching:** Utilização eficiente de modelos leves (ex: Gemini 2.5 Flash) e reutilização de prompts para minimizar consumo de tokens.

---

## 12. Compatibilidade Futura com o Ecossistema Google
A arquitetura foi desenhada nativamente sobre as tecnologias da Google:
* **Gemini SDK (`@google/genai`):** Utilização das últimas APIs oficiais para suporte a multimodalidade e respostas rápidas.
* **Google Workspace & Drive:** Sincronização direta de documentos do hotel (PDFs, Planilhas de tarifas, Manuais) para alimentação do Knowledge Center.
* **NotebookLM & Vertex AI:** Prontidão para conectar fontes de conhecimento estendidas e agentes especialistas via ecossistema Google.

---

## 13. Evolução Estratégica (Visão de 5 Anos: 2026–2031)
* **Fase 1 (Ano 1):** Consolidação do Núcleo PMS + IA Operacional (Atendimento WhatsApp, Reservas e Gestão de Tarifas).
* **Fase 2 (Anos 2-3):** Expansão do Ecossistema SaaS (Conectores Nativos OTA, Hub de Marketing e Copiloto Financeiro).
* **Fase 3 (Anos 4-5):** Rede Autônoma de Pousadas e Hotéis (Benchmarking regional anonimizado, precificação preditiva dinâmica em tempo real e orquestração de ecossistemas locais de turismo).

---

## 14. Métricas de Sucesso do Produto
* **Negócio (SaaS):** LTV/CAC > 3, Churn mensal < 2%, NPS de Clientes > 70.
* **Eficiência Operacional (Hotel):** Redução de > 60% no tempo de resposta a hóspedes; aumento de > 25% em vendas diretas sem comissão de OTAs.
* **Técnico:** Disponibilidade > 99.9%, Tempo médio de resposta de APIs < 200ms (excluindo chamadas de IA), taxa de sucesso das chamadas de IA > 99%.

---

## 15. Priorização Universal da Simplicidade
Quando houver divergência entre duas soluções válidas:
> **A solução mais simples, com menor número de dependências, menor quantidade de código e menor custo operacional DEVE SER SEMPRE A ESCOLHIDA.**

---
*Aprovado pela Liderança de Arquitetura e Engenharia em 03 de Agosto de 2026.*
