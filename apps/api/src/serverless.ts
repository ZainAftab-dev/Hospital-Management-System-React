import type { IncomingMessage, ServerResponse } from 'http';
import { createConfiguredApp } from './app-setup';

type RequestHandler = (req: IncomingMessage, res: ServerResponse) => void;

let handler: Promise<RequestHandler> | undefined;

/**
 * Express request handler for running the API as a serverless function (used by api/index.js on Vercel).
 * The Nest app is created once per instance and reused across requests.
 */
export function getRequestHandler(): Promise<RequestHandler> {
  handler ??= createConfiguredApp().then(async (app) => {
    await app.init();
    return app.getHttpAdapter().getInstance() as RequestHandler;
  });
  return handler;
}
