import { ZodError, ZodSchema } from "npm:zod@^4.1.12";

export async function parseJson<T>(request: Request, schema: ZodSchema<T>) {
  const payload = await request.json();
  return schema.parse(payload);
}

export function toValidationDetails(error: ZodError) {
  return error.flatten();
}
