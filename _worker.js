const VALID_UUID = 'ab23f618-3f94-4d74-8c8b-d5703403b5be'; // 替换为你的 UUID
const PROXY_IPS = [
  'cf.jisucf.cloudns.ch' // 通用
];
const PROXY_PORT = '443';
const SUB_PATH = '/sub';
const FAKE_API_PATH = '/api';

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  if (request.headers.get('Upgrade') !== 'websocket') {
    if (url.pathname === SUB_PATH) {
      return handleSubscription(url);
    }
    if (url.pathname === FAKE_API_PATH) {
      return new Response(JSON.stringify({ status: 'ok', version: '1.0.0' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      });
    }
    return new Response(JSON.stringify({ message: 'Welcome to API' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });
  }

  const uuid = url.pathname.slice(1);
  if (uuid !== VALID_UUID) {
    return new Response(JSON.stringify({ error: 'Invalid UUID' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 403
    });
  }

  return handleWebSocket(request);
}

function handleSubscription(url) {
  const config = `vless://${VALID_UUID}@${url.host}:443?security=tls&type=ws&path=/?ed=2048&host=${url.host}#CF-VLESS`;
  return new Response(btoa(config), {
    headers: { 'Content-Type': 'text/plain' },
    status: 200
  });
}

async function handleWebSocket(request) {
  try {
    const [client, server] = Object.values(new WebSocketPair());
    server.accept();
    let targetWs;
    for (let i = 0; i < PROXY_IPS.length; i++) {
      try {
        const response = await fetch(`wss://${PROXY_IPS[i]}:${PROXY_PORT}`, {
          headers: { 'Upgrade': 'websocket' }
        });
        targetWs = response.webSocket;
        if (targetWs) {
          targetWs.accept();
          break;
        }
      } catch (e) {
        console.error(`Proxy IP ${PROXY_IPS[i]} failed: ${e.message}`);
        if (i === PROXY_IPS.length - 1) {
          return new Response(JSON.stringify({ error: 'All proxy IPs failed' }), {
            headers: { 'Content-Type': 'application/json' },
            status: 502
          });
        }
      }
    }
    server.addEventListener('message', ({ data }) => targetWs.send(data));
    targetWs.addEventListener('message', ({ data }) => server.send(data));
    server.addEventListener('error', ({ error }) => console.error(`Server WebSocket error: ${error.message}`));
    targetWs.addEventListener('error', ({ error }) => console.error(`Target WebSocket error: ${error.message}`));
    return new Response(null, { status: 101, webSocket: client });
  } catch (e) {
    console.error(`WebSocket setup error: ${e.message}, Stack: ${e.stack}`);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
}
