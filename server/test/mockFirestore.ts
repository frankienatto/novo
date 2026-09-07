/**
 * Synapse Hospitality — In-Memory Firestore Mock para Testes Unitários e de Integração
 * Proporciona persistência determinística e isolada sem depender de gRPC ou credenciais reais.
 */

export interface MockStore {
  [collection: string]: {
    [docId: string]: any;
  };
}

export function createMockFirestore(initialData: MockStore = {}) {
  const store: MockStore = JSON.parse(JSON.stringify(initialData));

  return {
    _store: store,
    collection: (collectionName: string) => {
      if (!store[collectionName]) {
        store[collectionName] = {};
      }
      const col = store[collectionName];

      const makeQuery = (
        filters: Array<{ field: string; op: string; val: any }>,
        order?: { field: string; direction: 'asc' | 'desc' },
        limitCount?: number
      ) => {
        const queryObj = {
          where: (field: string, op: string, val: any) => {
            return makeQuery([...filters, { field, op, val }], order, limitCount);
          },
          orderBy: (field: string, direction: 'asc' | 'desc' = 'asc') => {
            return makeQuery(filters, { field, direction }, limitCount);
          },
          limit: (n: number) => {
            return makeQuery(filters, order, n);
          },
          get: async () => {
            let matches = Object.values(col).filter((item: any) => {
              return filters.every((f) => {
                if (f.op === '==') return item[f.field] === f.val;
                if (f.op === '!=') return item[f.field] !== f.val;
                if (f.op === '>') return item[f.field] > f.val;
                if (f.op === '>=') return item[f.field] >= f.val;
                if (f.op === '<') return item[f.field] < f.val;
                if (f.op === '<=') return item[f.field] <= f.val;
                if (f.op === 'in') return Array.isArray(f.val) && f.val.includes(item[f.field]);
                if (f.op === 'array-contains') return Array.isArray(item[f.field]) && item[f.field].includes(f.val);
                return true;
              });
            });

            if (order) {
              matches.sort((a, b) => {
                const valA = a[order.field];
                const valB = b[order.field];
                if (valA < valB) return order.direction === 'asc' ? -1 : 1;
                if (valA > valB) return order.direction === 'asc' ? 1 : -1;
                return 0;
              });
            }

            if (limitCount && limitCount > 0) {
              matches = matches.slice(0, limitCount);
            }

            return {
              empty: matches.length === 0,
              size: matches.length,
              docs: matches.map((data) => ({
                id: data.id || data._id || 'mock_id',
                data: () => JSON.parse(JSON.stringify(data)),
                exists: true,
              })),
              forEach: (cb: (doc: any) => void) => {
                matches.forEach((data) =>
                  cb({
                    id: data.id || data._id || 'mock_id',
                    data: () => JSON.parse(JSON.stringify(data)),
                    exists: true,
                  })
                );
              },
            };
          },
        };
        return queryObj;
      };

      return {
        doc: (docId: string) => ({
          id: docId,
          get: async () => ({
            id: docId,
            exists: !!col[docId],
            data: () => (col[docId] ? JSON.parse(JSON.stringify(col[docId])) : undefined),
          }),
          set: async (data: any, options?: { merge?: boolean }) => {
            if (options?.merge && col[docId]) {
              col[docId] = JSON.parse(JSON.stringify({ ...col[docId], ...data, id: docId }));
            } else {
              col[docId] = JSON.parse(JSON.stringify({ ...data, id: docId }));
            }
          },
          update: async (data: any) => {
            if (!col[docId]) {
              throw new Error(`Document ${docId} does not exist`);
            }
            col[docId] = JSON.parse(JSON.stringify({ ...col[docId], ...data }));
          },
          delete: async () => {
            delete col[docId];
          },
        }),
        add: async (data: any) => {
          const autoId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
          col[autoId] = JSON.parse(JSON.stringify({ ...data, id: autoId }));
          return {
            id: autoId,
            get: async () => ({
              id: autoId,
              exists: true,
              data: () => JSON.parse(JSON.stringify(col[autoId])),
            }),
          };
        },
        where: (field: string, op: string, val: any) => {
          return makeQuery([{ field, op, val }]);
        },
        orderBy: (field: string, direction: 'asc' | 'desc' = 'asc') => {
          return makeQuery([], { field, direction });
        },
        limit: (n: number) => {
          return makeQuery([], undefined, n);
        },
        get: async () => {
          const docs = Object.values(col);
          return {
            empty: docs.length === 0,
            size: docs.length,
            docs: docs.map((data) => ({
              id: data.id || 'mock_id',
              data: () => JSON.parse(JSON.stringify(data)),
              exists: true,
            })),
            forEach: (cb: (doc: any) => void) => {
              docs.forEach((data) =>
                cb({
                  id: data.id || 'mock_id',
                  data: () => JSON.parse(JSON.stringify(data)),
                  exists: true,
                })
              );
            },
          };
        },
      };
    },
  };
}
