import { handleVerification } from './verify_keys.js';

const map = new Map();
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

async function index() {
    return new Response('Proxy is Running!  More Details: https://github.com/tech-shrimp/gemini-balance-lite', {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });
}


async function geminiRequest(request) {

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

    url.protocol = 'https:';
    url.hostname = 'generativelanguage.googleapis.com';
    //url.origin = "https://generativelanguage.googleapis.com";

    console.log('Request Sending to Gemini')
    console.log('targetUrl:'+url.toString())
    console.log(request.headers)

    const response = await fetch(url.toString(), {
      method: request.method,
      headers: request.headers,
      body: request.body
    });

    console.log("Call Gemini Success")
    console.log(response.headers)

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

export async function handleRequest(req) {

    try {
        const url = new URL(req.url); 
        console.log('Request URL:', req.url);
        if (url.pathname === '/' || url.pathname === '/index.html') {

            return index();
        } else if(url.pathname === '/verify' && req.method === 'POST'){

            return handleVerification(req);
        }else{

            return geminiRequest(req);
        }

    } catch (error) {
      
      console.error('Failed to fetch:', error);
      return new Response('Internal Server Error\n' + error?.stack, {
        status: 500,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
}
