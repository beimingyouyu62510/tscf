addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const VALID_UUID = env.UUID || 'your-uuid-here'; // 从环境变量获取 UUID
  const PROXY_IPS = ['20.187.89.16', '129.154.199.251', '146.56.149.205', '47.74.51.138'];
  const PROXY_PORT = env.PROXY_PORT || '443';
  const SUB_PATH = '/sub';
  const FAKE_API_PATH = '/api';

  // 处理非 WebSocket 请求
  if (request.headers.get('Upgrade') !== 'websocket') {
    if (url.pathname === SUB_PATH) {
      return handleSubscription(url, VALID_UUID);
    }
    if (url.pathname === FAKE_API_PATH) {
      return new Response(JSON.stringify({ status: 'ok', version: '1.0.0', ts: Date.now() }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      });
    }
    return new Response(JSON.stringify({ message: 'Welcome to API' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });
  }

  // UUID 验证
  const uuid = url.pathname.slice(1);
  if (uuid !== VALID_UUID) {
    return new Response(JSON.stringify({ error: 'Invalid UUID' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 403
    });
  }

  // WebSocket 处理
  return handleWebSocket(request, PROXY_IPS, PROXY_PORT);
}

function handleSubscription(url, uuid) {
  const config = `vless://${uuid}@${url.host}:443?security=tls&type=ws&path=/?ed=2048&host=${url.host}#CF-VLESS`;
  return new Response(btoa(config), {
    headers: { 'Content-Type': 'text/plain' },
    status: 200
  });
}

async function handleWebSocket(request, proxyIps, proxyPort) {
  try {
    const [client, server] = Object.values(new WebSocketPair());
    server.accept();
    let targetWs;
    for (let i = 0; i < proxyIps.length; i++) {
      try {
        const response = await fetch(`wss://${proxyIps[i]}:${proxyPort}`, {
          headers: { 'Upgrade': 'websocket' }
        });
        targetWs = response.webSocket;
        if (targetWs) {
          targetWs.accept();
          break;
        }
      } catch (e) {
        console.error(`Proxy IP ${proxyIps[i]} failed: ${e.message}`);
        if (i === proxyIps.length - 1) {
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
