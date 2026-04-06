export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  [key: string]: string | number | boolean | undefined;
}

/** Wrapper de respuesta única del backend */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

/** Wrapper de respuesta paginada del backend */
export interface ApiListResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    total_pages: number;
    current_page: number;
    per_page: number;
  };
}
