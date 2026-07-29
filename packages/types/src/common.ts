/** Standart sahifalangan API javobi. */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize?: number;
  limit?: number;
  total_pages?: number;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta: {
    request_id: string;
    page?: number;
    limit?: number;
    total?: number;
    total_pages?: number;
  };
}

/** Standart xato javobi. */
export interface ApiError {
  statusCode?: number;
  message: string;
  error?: string;
  success?: false;
  code?: string;
  fields?: unknown;
  meta?: {
    request_id: string;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
