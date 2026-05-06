import { corsHeaders, withCors } from "../_shared/cors.ts";
import { dispatchQueuedCalls } from "../_shared/lead-system.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST" && request.method !== "GET") {
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

  try {
    const payload =
      request.method === "POST"
        ? await request.json().catch(() => ({}))
        : {};
    const result = await dispatchQueuedCalls({
      callThreadId:
        typeof payload.callThreadId === "string" ? payload.callThreadId : undefined,
      limit:
        typeof payload.limit === "number" && Number.isFinite(payload.limit)
          ? payload.limit
          : undefined,
    });

    return withCors(
      Response.json({
        success: true,
        data: {
          processed: result.length,
          results: result,
        },
      }),
    );
  } catch (error) {
    return withCors(
      Response.json(
        {
          success: false,
          error: {
            code: "DISPATCH_FAILED",
            message:
              error instanceof Error
                ? error.message
                : "Unable to dispatch queued calls.",
          },
        },
        { status: 500 },
      ),
    );
  }
});
