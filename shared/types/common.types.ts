export interface ApiResponse<T> {
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

// 2026 World Cup groups
export const WORLD_CUP_2026_GROUPS = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H',
  'I', 'J', 'K', 'L',
] as const;

export type WorldCupGroup = (typeof WORLD_CUP_2026_GROUPS)[number];
