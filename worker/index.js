import { sha256 } from '../js/sha256.js';
import {
  onOptions as proxyOnOptions,
  onRequest as proxyOnRequest,
} from '../functions/proxy/[[path]].js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/proxy/')) {
      if (request.method === 'OPTIONS') {
        return proxyOnOptions({ request, env });
      }

      return proxyOnRequest({
        request,
        env,
        waitUntil: ctx.waitUntil.bind(ctx),
      });
    }

    const assetRequest = getAssetRequest(request, url);
    const response = await env.ASSETS.fetch(assetRequest);
    const contentType = response.headers.get('content-type') || '';

    if (!contentType.includes('text/html')) {
      return response;
    }

    let html = await response.text();
    html = await injectPasswordHashes(html, env);

    const headers = new Headers(response.headers);
    headers.delete('content-length');

    return new Response(html, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
};

function getAssetRequest(request, url) {
  if (url.pathname === '/' || url.pathname.startsWith('/s=')) {
    const indexUrl = new URL('/index.html', url);
    return new Request(indexUrl, request);
  }

  return request;
}

async function injectPasswordHashes(html, env) {
  const password = env.PASSWORD || '';
  const adminPassword = env.ADMINPASSWORD || '';
  const passwordHash = password ? await sha256(password) : '';
  const adminPasswordHash = adminPassword ? await sha256(adminPassword) : '';

  return html
    .replace(
      'window.__ENV__.PASSWORD = "{{PASSWORD}}";',
      `window.__ENV__.PASSWORD = "${passwordHash}";`,
    )
    .replace(
      'window.__ENV__.ADMINPASSWORD = "{{ADMINPASSWORD}}";',
      `window.__ENV__.ADMINPASSWORD = "${adminPasswordHash}";`,
    );
}
