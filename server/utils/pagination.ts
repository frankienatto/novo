import { cacheConfig } from '../config/cacheConfig.ts';

export interface PaginationParams {
  page: number;
  limit: number;
  sort?: string;
  direction: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export function parsePaginationParams(
  query: Record<string, any>,
  maxLimit: number = cacheConfig.MAX_LOG_PAGE_SIZE,
  defaultLimit: number = 10
): PaginationParams {
  const rawPage = Number(query.page);
  const rawLimit = Number(query.limit);

  const page = !isNaN(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
  let limit = !isNaN(rawLimit) && rawLimit > 0 ? Math.floor(rawLimit) : defaultLimit;

  if (limit > maxLimit) {
    limit = maxLimit;
  }

  const sort = query.sort ? String(query.sort) : undefined;
  const rawDir = query.direction ? String(query.direction).toLowerCase() : 'desc';
  const direction: 'asc' | 'desc' = rawDir === 'asc' ? 'asc' : 'desc';

  return { page, limit, sort, direction };
}

export function paginateArray<T>(
  items: T[],
  params: PaginationParams,
  sortKeyGetter?: (item: T) => any
): PaginatedResult<T> {
  let sorted = [...items];

  if (sortKeyGetter && params.sort) {
    sorted.sort((a, b) => {
      const valA = sortKeyGetter(a);
      const valB = sortKeyGetter(b);
      if (valA < valB) return params.direction === 'asc' ? -1 : 1;
      if (valA > valB) return params.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  const totalItems = sorted.length;
  const totalPages = Math.ceil(totalItems / params.limit) || 1;
  const currentPage = Math.min(params.page, totalPages);

  const startIndex = (currentPage - 1) * params.limit;
  const paginatedData = sorted.slice(startIndex, startIndex + params.limit);

  return {
    data: paginatedData,
    pagination: {
      page: currentPage,
      limit: params.limit,
      totalItems,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
    }
  };
}
