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
export declare const WORLD_CUP_2026_GROUPS: readonly ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
export type WorldCupGroup = (typeof WORLD_CUP_2026_GROUPS)[number];
//# sourceMappingURL=common.types.d.ts.map