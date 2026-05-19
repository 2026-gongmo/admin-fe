export type ApiSuccess<T> = {
  success: true;
  data: T;
  message: null;
  code?: null;
};

export type ApiFailure = {
  success: false;
  data: null;
  message: string;
  code: string;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}
