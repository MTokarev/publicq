export interface ApiResponse<T> {
  data: T;
  status: string;
  message: string;
  errors: string[];
  isSuccess: boolean;
  isFailed: boolean;
}
