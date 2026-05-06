import { corsHeaders, withCors } from "../_shared/cors.ts";
import { env } from "../_shared/env.ts";
import { processVapiWebhookPayload } from "../_shared/lead-system.ts";

function hasValidWebhookSecret(request: Request) {
  if (!env.vapiWebhookSecret) {
    return true;
  }

  const bearer = request.headers.get("authorization");
  const secretHeader =
    request.headers.get("x-vapi-secret") ??
    request.headers.get("x-webhook-secret");

  return (
    bearer === `Bearer ${env.vapiWebhookSecret}` ||
    secretHeader === env.vapiWebhookSecret
  );
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return withCors(
      Response.json(
        {
          success: false,
          error: {
            code: "METHOD_NOT_ALLOWED",
            message: "Method not allowed.",
          },
        },
        { status: 405 },
      ),
    );
  }

  if (!hasValidWebhookSecret(request)) {
    return withCors(
      Response.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Invalid Vapi webhook secret.",
          },
        },
        { status: 401 },
      ),
    );
  }

  try {
    const payload = await request.json();
    const result = await processVapiWebhookPayload(payload);

    return withCors(
      Response.json({
        success: true,
        data: result,
      }),
    );
  } catch (error) {
    return withCors(
      Response.json(
        {
          success: false,
          error: {
            code: "VAPI_WEBHOOK_FAILED",
            message:
              error instanceof Error
                ? error.message
                : "Unable to process Vapi webhook.",
          },
        },
        { status: 500 },
      ),
    );
  }
});
