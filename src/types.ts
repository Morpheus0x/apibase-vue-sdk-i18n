// types.ts

export type ApiAuthResponse = {
  success: boolean;
  text: string;
  httpStatus: number;
  redirect: string | undefined;
};

export type JsonResponse<T> = {
  id: number;
  msg: string;
  data: T;
};

export type RedirectTarget = {
  ref: string;
  target: string;
};

export type ApiResponse<T> = {
  success: boolean;
  text: string;
  httpStatus: number;
  data: T;
};

export type ApiResponseStream<T> = {
  stage: number;
  content: string;
  data: T;
};
