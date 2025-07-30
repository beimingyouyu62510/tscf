const VALID_UUID = 'ab23f618-3f94-4d74-8c8b-d5703403b5be'; // 替换为你的 UUID，建议通过环境变量配置
const PROXY_IPS = ['cf.jisucf.cloudns.ch'];
const PROXY_PORT = '443';
const SUB_PATH = '/sub'; // 订阅路径
const FAKE_API_PATH = '/api'; // 伪装 API 路径

// 主请求处理函数
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

// 处理所有请求
async function handleRequest(request) {
  const url = new URL(request.url);
  const clientIp = request.headers.get('CF-Connecting-IP');

  // 处理非 WebSocket 请求
  if (request.headers.get('Upgrade') !== 'websocket') {
    // 返回订阅链接
    if (url.pathname === SUB_PATH) {
      return handleSubscription(url);
    }
    // 伪装 API 响应
    if (url.pathname === FAKE_API_PATH) {
      return new Response(JSON.stringify({ status: 'ok', version: '1.0.0' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      });
    }
    // 默认伪装响应
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
  return handleWebSocket(request);
}

// 处理订阅链接生成
function handleSubscription(url) {
  const config = `vless://${VALID_UUID}@${url.host}:443?security=tls&type=ws&path=/?ed=2048&host=${url.host}#CF-VLESS`;
  return new Response(btoa(config), {
    headers: { 'Content-Type': 'text/plain' },
    status: 200
  });
}

// 处理 WebSocket 连接
async function handleWebSocket(request) {
  try {
    const [client, server] = Object.values(new WebSocketPair());
    server.accept();

    // 尝试连接反代 IP
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

    // 双向数据转发
    server.addEventListener('message', ({ data }) => targetWs.send(data));
    targetWs.addEventListener('message', ({ data }) => server.send(data));
    server.addEventListener('error', ({ error }) => {
      console.error(`Server WebSocket error: ${error.message}`);
    });
    targetWs.addEventListener('error', ({ error }) => {
      console.error(`Target WebSocket error: ${error.message}`);
    });

    return new Response(null, { status: 101, webSocket: client });
  } catch (e) {
    console.error(`WebSocket setup error: ${e.message}, Stack: ${e.stack}`);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
}
