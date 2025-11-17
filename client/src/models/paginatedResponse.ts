export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  pageSize: number;
  pageNumber: number;

  // These properties are typically calculated on the backend and returned
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}
