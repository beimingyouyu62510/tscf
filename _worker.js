// ====================================================================
// Cloudflare Worker: VL over WebSocket + NAT64 + DOH + 兜底
// --------------------------------------------------------------------
// 环境变量 (Vars) 说明：
//   UUID        必填，VL 用户的 UUID                        
//   ID          可选，订阅路径 (默认 123456)                 
//   PROXYIP     可选，反代兜底地址 "ip:sb"     
//   NAT64       可选，是否启用 NAT64 (true|false，默认 true)      
//   PROXYDOMAINS 可选，从环境变量读取要强制走 NAT64 的域名列表，每行一个，支持前缀“*”通配符  
//   私钥        可选，自定义私钥内容，与 "私钥开关" 配合使用       
//   私钥开关    可选，true|false，开启后需请求头带 my-key 防探测
//   隐藏        可选，true|false，true 时订阅接口只返回嘲讽语
//   嘲讽语      可选，自定义隐藏提示语                          
//   启用反代功能 可选，true|false (默认 true)，是否启用反代兜底
// ====================================================================

import { connect } from 'cloudflare:sockets';

////////////////////////////////////////////////////////////////////////// DOH 模块 //////////////////////////////////////////////////////////////////////////
let DOH服务器列表 = [
  "https://dns.google/dns-query",
  "https://cloudflare-dns.com/dns-query",
  "https://1.1.1.1/dns-query",
  "https://dns.quad9.net/dns-query",
];

async function 查询最快IP(访问域名) {
  const 构造请求 = (type) =>
    DOH服务器列表.map(DOH =>
      fetch(`${DOH}?name=${访问域名}&type=${type}`, {
        headers: { 'Accept': 'application/dns-json' }
      }).then(res => res.json())
        .then(json => {
          const ip = json.Answer?.find(r => r.type === (type === 'A' ? 1 : 28))?.data;
          if (ip) return ip;
          return Promise.reject(`无 ${type} 记录`);
        })
        .catch(err => Promise.reject(`${DOH} ${type} 请求失败: ${err}`))
    );
  try {
    return await Promise.any(构造请求('A'));
  } catch {
    return 访问域名;
  }
}

////////////////////////////////////////////////////////////////////////// 配置区块 //////////////////////////////////////////////////////////////////////////
let 转码 = 'vl', 转码2 = 'ess', 符号 = '://';

let 哎呀呀这是我的ID啊 = "511622";
let 哎呀呀这是我的VL密钥 = "ab23f618-3f94-4d74-8c8b-d5703403b5be";

let 私钥开关 = false;
let 咦这是我的私钥哎 = "";

let 隐藏订阅 = false;
let 嘲讽语 = "哎呀你找到了我，但是我就是不给你看，气不气，嘿嘿嘿";

let 我的优选 = ['laji.jisucf.cloudns.biz'];
let 我的优选TXT = [''];

let 启用反代功能 = true;
let 反代IP = 'cf.jisucf.cloudns.ch';

let NAT64 = true;
let proxydomains = ["*openai.com", "*twitch.tv", "*ttvnw.net", "*tapecontent.net", "*cloudatacdn.com", "*.loadshare.org"];

let 我的节点名字 = 'ts-cf';

const 读取环境变量 = (name, fallback, env) => {
  const raw = import.meta?.env?.[name] ?? env?.[name];
  if (raw === undefined || raw === null || raw === '') return fallback;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed === 'true') return true;
    if (trimmed === 'false') return false;
    if (trimmed.includes('\n')) {
      return trimmed.split('\n').map(item => item.trim()).filter(Boolean);
    }
    if (!isNaN(trimmed) && trimmed !== '') return Number(trimmed);
    return trimmed;
  }
  return raw;
};

/* ---------- NAT64 工具 ---------- */
function convertToNAT64IPv6(ipv4) {
  const parts = ipv4.split('.');
  if (parts.length !== 4) throw new Error('无效的IPv4地址');
  const hex = parts.map(p => Number(p).toString(16).padStart(2, '0'));
  return `[2001:67c:2960:6464::${hex[0]}${hex[1]}:${hex[2]}${hex[3]}]`;
}

async function getIPv6ProxyAddress(domain) {
  const r = await fetch(`https://cloudflare-dns.com/dns-query?name=${domain}&type=A`, {
    headers: { 'Accept': 'application/dns-json' }
  });
  const j = await r.json();
  const a = j.Answer?.find(x => x.type === 1);
  if (!a) throw new Error('无法解析域名的IPv4地址');
  return convertToNAT64IPv6(a.data);
}

export default {
  async fetch(访问请求, env) {
    // 读取环境变量
    哎呀呀这是我的ID啊   = 读取环境变量('ID',        哎呀呀这是我的ID啊, env);
    哎呀呀这是我的VL密钥 = 读取环境变量('UUID',      哎呀呀这是我的VL密钥, env);
    我的优选             = 读取环境变量('IP',        我的优选,         env);
    我的优选TXT          = 读取环境变量('TXT',       我的优选TXT,      env);
    反代IP               = 读取环境变量('PROXYIP',   反代IP,           env);
    私钥开关             = 读取环境变量('私钥开关',   私钥开关,         env);
    咦这是我的私钥哎       = 读取环境变量('私钥',       咦这是我的私钥哎, env);
    隐藏订阅             = 读取环境变量('隐藏',       隐藏订阅,         env);
    嘲讽语               = 读取环境变量('嘲讽语',     嘲讽语,           env);
    启用反代功能         = 读取环境变量('启用反代功能', 启用反代功能, env);
    NAT64               = 读取环境变量('NAT64',      NAT64,           env);
    proxydomains        = 读取环境变量('PROXYDOMAINS', proxydomains,   env);
    我的节点名字           = 读取环境变量('我的节点名字', 我的节点名字,   env);

    const 升级标头 = 访问请求.headers.get('Upgrade');
    const url = new URL(访问请求.url);

    if (!升级标头 || 升级标头 !== 'websocket') {
      /* ---- 订阅/普通响应保持原样 ---- */
      if (我的优选TXT) {
        const 链接数组 = Array.isArray(我的优选TXT) ? 我的优选TXT : [我的优选TXT];
        const 所有节点 = [];
        for (const 链接 of 链接数组) {
          try {
            const 响应 = await fetch(链接);
            const 文本 = await 响应.text();
            const 节点 = 文本.split('\n').map(line => line.trim()).filter(line => line);
            所有节点.push(...节点);
          } catch (e) {
            console.warn(`无法获取或解析链接: ${链接}`, e);
          }
        }
        if (所有节点.length > 0) 我的优选 = 所有节点;
      }
      switch (url.pathname) {
        case `/${哎呀呀这是我的ID啊}`:
          return new Response(给我订阅页面(哎呀呀这是我的ID啊, 访问请求.headers.get('Host')), {
            status: 200, headers: { "Content-Type": "text/plain;charset=utf-8" }
          });
        case `/${哎呀呀这是我的ID啊}/${转码}${转码2}`:
          if (隐藏订阅) {
            return new Response(嘲讽语, { status: 200, headers: { "Content-Type": "text/plain;charset=utf-8" } });
          }
          return new Response(给我通用配置文件(访问请求.headers.get('Host')), {
            status: 200, headers: { "Content-Type": "text/plain;charset=utf-8" }
          });
        default:
          return new Response('Hello World!', { status: 200 });
      }
    } else {
      /* ---- WebSocket 升级 ---- */
      if (私钥开关) {
        const k = 访问请求.headers.get('my-key');
        if (k !== 咦这是我的私钥哎) return new Response('私钥验证失败', { status: 403 });
      }
      const enc = 访问请求.headers.get('sec-websocket-protocol');
      const data = 使用64位加解密(enc);
      if (验证VL的密钥(new Uint8Array(data.slice(1, 17))) !== 哎呀呀这是我的VL密钥) {
        return new Response('无效的UUID', { status: 403 });
      }
      const { tcpSocket, initialData } = await 解析VL标头(data);
      return await 升级WS请求(访问请求, tcpSocket, initialData);
    }
  }
};

async function 升级WS请求(访问请求, tcpSocket, initialData) {
  const { 0: 客户端, 1: WS接口 } = new WebSocketPair();
  WS接口.accept();
  建立传输管道(WS接口, tcpSocket, initialData);
  return new Response(null, { status: 101, webSocket: 客户端 });
}

function 使用64位加解密(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(str), c => c.charCodeAt(0)).buffer;
}

async function 解析VL标头(buf) {
  const b = new DataView(buf), c = new Uint8Array(buf);
  const addrTypeIndex = c[17];
  const port = b.getUint16(18 + addrTypeIndex + 1);
  let offset = 18 + addrTypeIndex + 4;
  let host;
  if (c[offset - 1] === 1) {
    host = Array.from(c.slice(offset, offset + 4)).join('.');
    offset += 4;
  } else if (c[offset - 1] === 2) {
    const len = c[offset];
    host = new TextDecoder().decode(c.slice(offset + 1, offset + 1 + len));
    offset += len + 1;
  } else {
    const dv = new DataView(buf);
    host = Array(8).fill().map((_, i) => dv.getUint16(offset + 2 * i).toString(16)).join(':');
    offset += 16;
  }
  const initialData = buf.slice(offset);

  /* --------- 1. 直连（DOH 解析） --------- */
  try {
    const ip = await 查询最快IP(host);
    const tcpSocket = await connect({ hostname: ip, port });
    await tcpSocket.opened;
    return { tcpSocket, initialData };
  } catch { /* ignore */ }

  /* --------- 2. NAT64 --------- */
  if (NAT64 || proxydomains.some(pattern => {
    if (pattern.startsWith('*')) {
      return host.endsWith(pattern.slice(1));
    }
    return host === pattern;
  })) {
    try {
      let natTarget;
      if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
        natTarget = convertToNAT64IPv6(host);
      } else if (host.includes(':')) {
        throw new Error('IPv6 地址无需 NAT64');
      } else {
        natTarget = await getIPv6ProxyAddress(host);
      }
      const natSock = await connect({ hostname: natTarget.replace(/^['`"]+|['`"]+$/g, ''), port });
      await natSock.opened;
      return { tcpSocket: natSock, initialData };
    } catch { /* ignore */ }
  }

  /* --------- 3. 反代兜底 --------- */
  if (!启用反代功能 || !反代IP) throw Error('连接失败');
  const [h, p] = 反代IP.split(':');
  const tcpSocket = await connect({ hostname: h, port: Number(p) || port });
  await tcpSocket.opened;
  return { tcpSocket, initialData };
}

/* --------- 4. 建立传输 --------- */
async function 建立传输管道(ws, tcp, init) {
  const MAX = 200 * 1024 * 1024;
  const MIN = 1024;

  ws.send(new Uint8Array([0, 0]));
  const writer = tcp.writable.getWriter();
  const reader = tcp.readable.getReader();
  if (init) await writer.write(init);

  ws.addEventListener('message', e => {
    const data = e.data;
    let offset = 0;
    const size = Math.min(MAX, Math.max(MIN, Math.floor(data.byteLength / 10)));
    while (offset < data.byteLength) {
      const chunk = data.slice(offset, offset + size);
      writer.write(chunk);
      offset += size;
    }
  });

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (value) {
        let offset = 0;
        const size = Math.min(MAX, Math.max(MIN, Math.floor(value.byteLength / 10)));
        while (offset < value.byteLength) {
          const chunk = value.slice(offset, offset + size);
          ws.send(chunk);
          offset += size;
        }
      }
    }
  } finally {
    try { ws.close(); } catch {}
    try { reader.cancel(); } catch {}
    try { writer.releaseLock(); } catch {}
    tcp.close();
  }
}

function 验证VL的密钥(a) {
  const hex = Array.from(a, v => v.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}

function 给我订阅页面(ID, host) {
  return `
1、本worker的私钥功能只支持通用订阅，其他请关闭私钥功能  
2、其他需求自行研究  
通用的：https${符号}${host}/${ID}/${转码}${转码2}
`;
}

function 给我通用配置文件(host) {
  我的优选.push(`${host}:443#测试节点`);
  if (私钥开关) return '请先关闭私钥功能';

  return 我的优选.map(item => {
    const [main, tls] = item.split("@");
    const [addrPort, name = 我的节点名字] = main.split("#");
    const parts = addrPort.split(":");
    const port = parts.length > 1 ? Number(parts.pop()) : 443;
    const addr = parts.join(":");
    const tlsOpt = tls === 'notls' ? 'security=none' : 'security=tls';
    return `${转码}${转码2}${符号}${哎呀呀这是我的VL密钥}@${addr}:${port}?encryption=none&${tlsOpt}&sni=${host}&type=ws&host=${host}&path=%2F%3Fed%3D2560#${name}`;
  }).join("\n");
}
