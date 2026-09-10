# Classificação de `npm audit --omit=dev`

Relatório local: 2 critical, 7 high, 8 moderate e 2 low. Nenhum `npm audit
fix --force` foi aplicado.

| Pacote | Severidade | Origem | Superfície | Ação / residual |
| --- | --- | --- | --- | --- |
| `tar@7.5.13` | critical | transitivo de `@capacitor/cli` | tooling de empacotamento Android futuro; não é carregado pelo servidor Cloud Run | Atualização depende do ecossistema Capacitor. Residual não alcançável no runtime web atual; atualizar no bloco APK. |
| `websocket-driver@0.7.4` | critical | `firebase` → Realtime Database → `faye-websocket` | cliente Firebase; o produto canônico não usa Realtime Database | Residual de pacote transitivo. Não remover `firebase` sem revalidar Auth/Firestore; revisar upgrade Firebase em bloco dedicado. |
| `@grpc/grpc-js@1.9.15` | high | `firebase` → Firestore | SDK Firestore browser transitivo; chamadas operacionais do browser são bloqueadas fora de demo | Atualização exige upgrade da cadeia Firebase; residual documentado. |
| `protobufjs@7.5.5` | high | Firebase/Google GenAI/Google TTS | SDKs Google | Cadeia compartilhada; upgrade coordenado requerido. |
| `@xmldom/xmldom@0.9.10` | high | `@capacitor/cli` | tooling APK futuro | Não alcançável pelo servidor atual. |
| `brace-expansion` | high | Capacitor/Google tooling | tooling | Não alcançável por requisições de produção. |
| `nanoid@3.3.11` e `postcss@8.5.12` | high | Vite/Tailwind | build/dev tooling; Vite não roda no container de produção | Atualizar junto de Vite/Tailwind compatíveis. |
| `vite@6.4.2` | high | dependência direta dev | servidor de desenvolvimento Windows | Não é runtime Cloud Run; atualizar em manutenção de tooling após smoke build. |

## Decisão

Não há evidência de pacote critical/high diretamente carregado pelo backend
Express para processar uma entrada exposta, exceto SDKs Firebase/Google mantidos
atrás de autenticação e APIs canônicas. A atualização deve ser feita como bloco
de dependências compatível, com Rules Emulator, PMS, pagamentos e build
revalidados; não é seguro aplicar upgrades transitivos às cegas neste passe.
