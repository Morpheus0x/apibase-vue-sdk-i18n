// types.ts

export type ApiResponse = {
  success: boolean;
  text: string;
  httpStatus: number;
  redirect: string | undefined;
};

export type JsonResponse = {
  id: number;
  msg: string;
  data: object;
};

export type RedirectTarget = {
  ref: string;
  target: string;
};
