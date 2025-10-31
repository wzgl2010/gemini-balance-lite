import { handleRequest } from "./new_request.js";

async function denoHandleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  return handleRequest(req);
};

Deno.serve({ port: 80 },denoHandleRequest); 
