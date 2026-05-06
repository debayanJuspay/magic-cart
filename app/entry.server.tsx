import type { EntryContext, AppLoadContext } from "@remix-run/node";
import { RemixServer } from "@remix-run/react";
import { renderToPipeableStream } from "react-dom/server";
import { PassThrough } from "stream";
import isbot from "isbot";

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
  _loadContext: AppLoadContext
) {
  // Handle Shopify iframe embedding requirements
  responseHeaders.set("X-Frame-Options", "ALLOWALL");
  responseHeaders.set(
    "Content-Security-Policy",
    "frame-ancestors https://*.shopify.com https://admin.shopify.com;"
  );

  return new Promise((resolve, reject) => {
    let didError = false;

    const { pipe, abort } = renderToPipeableStream(
      <RemixServer context={remixContext} url={request.url} />,
      {
        onShellReady() {
          const body = new PassThrough();

          responseHeaders.set("Content-Type", "text/html");

          resolve(
            new Response(body as any, {
              headers: responseHeaders,
              status: didError ? 500 : responseStatusCode,
            })
          );

          pipe(body);
        },
        onShellError(error: unknown) {
          reject(error);
        },
        onError(error: unknown) {
          didError = true;
          console.error(error);
        },
      }
    );

    setTimeout(() => {
      abort();
    }, 5000);
  });
}
