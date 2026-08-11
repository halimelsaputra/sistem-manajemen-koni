/**
 * Helper pagination untuk seluruh list endpoint.
 *
 * Konvensi bersama:
 * - Query params `page` (default 1) dan `pageSize` (default 20, maks 100).
 * - Jika salah satu param diberikan, response GET list berbentuk:
 *       data: { items: [...], pagination: { page, pageSize, total, totalPages } }
 * - Tanpa param `page`/`pageSize`, endpoint mengembalikan seluruh data sebagai
 *   array biasa — mode kompatibilitas untuk kebutuhan yang memang butuh semua
 *   data (dropdown atlet/cabor dan grafik tren dashboard).
 */
export interface Pagination {
    page: number;
    pageSize: number;
}

export function parsePagination(searchParams: URLSearchParams): Pagination | null {
    const pageRaw = searchParams.get("page");
    const sizeRaw = searchParams.get("pageSize");

    // Tidak ada param pagination -> mode non-paginated (backward compatible)
    if (!pageRaw && !sizeRaw) return null;

    const page = Math.max(1, Number.parseInt(pageRaw || "1", 10) || 1);
    const pageSize = Math.min(100, Math.max(1, Number.parseInt(sizeRaw || "20", 10) || 20));

    return { page, pageSize };
}

/**
 * Type guard untuk hasil paginated repository ({ items, total }).
 */
export function isPaginatedResult(result: unknown): result is { items: unknown[]; total: number } {
    return (
        typeof result === "object" &&
        result !== null &&
        "items" in result &&
        "total" in result
    );
}

export function buildPaginationMeta(page: Pagination, total: number) {
    return {
        page: page.page,
        pageSize: page.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / page.pageSize))
    };
}

export function toPaginatedData(items: unknown[], total: number, page: Pagination) {
    return {
        items,
        pagination: buildPaginationMeta(page, total)
    };
}
