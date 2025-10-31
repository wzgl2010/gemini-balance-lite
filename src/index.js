//import { handleRequest } from "./handle_request.js";
const map = new Map();

export default {
  async fetch(req, env, context) {
    const url = new URL(req.url);
    
    console.log('Request URL:', req.url);
    if (url.pathname === '/' || url.pathname === '/index.html') {
      return new Response('Proxy is Running!  More Details: https://github.com/tech-shrimp/gemini-balance-lite', {
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      });
    }

    try {
      console.log('Request URL:', req.url);
      return handleRequest2(req);
    } catch (error) {
      
      console.error('Failed to fetch:', error);
      return new Response('Internal Server Error\n' + error?.stack, {
        status: 500,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  }
}

function getKey(model, keys){
  if(keys){
    var index = 0;
    if(!map.has(model)){
      map.set(model , 0)
    } else {
      index = map.get(model) + 1;
      map.set(model, index)
    }

    var ks = keys.split(',');
    return ks[index % ks.length]
  }
}


async function handleRequest2(request) {

    const url = new URL(request.url);

    const match = url.pathname.match(/\/models\/([^:]+)/);
    const model = match ? match[1] : null
    const key = getKey(model, url.searchParams.get("key"));
    if(key){
      url.searchParams.set("key", key);
    } else{
      for (const [k, v] of request.headers) {
        if (k.trim().toLowerCase() === 'x-goog-api-key'){
          const key = getKey(model, url.searchParams.get("key"));
          if(key){
            request.headers.set(k, v);
          }
        }
      }
    }


    url.origin = "https://generativelanguage.googleapis.com";

    console.log('Request Sending to Gemini')
    console.log('targetUrl:'+url.toString())
    console.log(request.headers)

    const response = await fetch(url.toString(), {
      method: request.method,
      headers: headers,
      body: request.body
    });

    console.log('Request Sending to Gemini')
    console.log('targetUrl:'+targetUrl)
    console.log(headers)

      // 复制并清理请求头（移除 hop-by-hop headers）
    const hopByHop = new Set([
      'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization',
      'te', 'trailers', 'transfer-encoding', 'upgrade'
    ]);

    // 复制并清理响应头（移除 hop-by-hop headers）
    const respHeaders = new Headers();
    respHeaders.set('Referrer-Policy', 'no-referrer');

    for (const [k, v] of response.headers) {
      if (hopByHop.has(k.toLowerCase())){
        continue;
      }

      respHeaders.set(k, v);
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: respHeaders
    });
}
