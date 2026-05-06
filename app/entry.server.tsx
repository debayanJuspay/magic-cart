import type { EntryContext } from "@remix-run/node";
import { RemixServer } from "@remix-run/react";
import { handleRequest } from "@vercel/remix";

export default function (
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) {
  // Handle Shopify iframe embedding requirements
  responseHeaders.set("X-Frame-Options", "ALLOWALL");
  responseHeaders.set(
    "Content-Security-Policy",
    "frame-ancestors https://*.shopify.com https://admin.shopify.com;"
  );

  return handleRequest(
    request,
    responseStatusCode,
    responseHeaders,
    remixContext
  );
}
