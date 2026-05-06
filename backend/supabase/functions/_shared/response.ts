import { withCors } from "./cors.ts";

export function success(data: unknown, init: ResponseInit = {}) {
  return withCors(
    Response.json(
      {
        success: true,
        data,
      },
      {
        status: init.status ?? 200,
        headers: init.headers,
      },
    ),
  );
}

export function failure(
  code: string,
  message: string,
  status = 400,
  details?: unknown,
) {
  return withCors(
    Response.json(
      {
        success: false,
        error: {
          code,
          message,
          details: details ?? null,
        },
      },
      {
        status,
      },
    ),
  );
}
