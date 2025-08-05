import { connect } from 'cloudflare:sockets';
//////////////////////////////////////////////////////////////////////////配置区块////////////////////////////////////////////////////////////////////////
let 哎呀呀这是我的ID啊 = "511622"; // 订阅路径，支持任意大小写字母和数字，[域名/ID]进入订阅页面
let 哎呀呀这是我的VL密钥 = "ab23f618-3f94-4d74-8c8b-d5703403b5be"; // UUID，建议修改为自己的规范化UUID
let 私钥开关 = false; // 是否启用私钥功能，true启用，false关闭，通用订阅需关闭私钥
let 咦这是我的私钥哎 = ""; // 私钥，提高安全性，防止被薅请求数
let 隐藏订阅 = false; // 是否隐藏订阅页面，true隐藏，false不隐藏
let 嘲讽语 = "哎呀你找到了我，但是我就是不给你看，气不气，嘿嘿嘿"; // 隐藏订阅时的提示语
let 我的优选 = ['127.0.0.1:1234'] //格式127.0.0.1:1234#US // Cloudflare边缘节点IP或自定义IP，格式如[2606:4700::6810:0a1e]:443#US或127.0.0.1:443#US
let 我的优选TXT = []; // 优选TXT路径，格式如[https://ip.txt]，优先于我的优选
let 我的节点名字 = 'ts-cf'; // 统一节点名字
let 启动控流机制 = false; // 控流机制，true启用，false关闭，提升连接稳定性
let DOH服务器列表 = [
  "https://dns.google/dns-query",
  "https://cloudflare-dns.com/dns-query",
  "https://1.1.1.1/dns-query",
  "https://dns.quad9.net/dns-query",
];
//////////////////////////////////////////////////////////////////////////网页入口////////////////////////////////////////////////////////////////////////
export default {
  async fetch(访问请求, env) {
    const 读取我的请求标头 = 访问请求.headers.get('Upgrade');
    const url = new URL(访问请求.url);
    if (!读取我的请求标头 || 读取我的请求标头 !== 'websocket') {
      if (我的优选TXT.length > 0) {
        const 所有节点 = [];
        for (const 链接 of 我的优选TXT) {
          try {
            const 响应 = await fetch(链接);
            const 文本 = await 响应.text();
            const 节点 = 文本.split('\n').map(line => line.trim()).filter(line => line);
            所有节点.push(...节点);
          } catch (e) {
            console.warn(`无法获取或解析链接: ${链接}`, e);
          }
        }
        if (所有节点.length > 0) {
          我的优选 = 所有节点;
        }
      }
      switch (url.pathname) {
        case `/${哎呀呀这是我的ID啊}`: {
          if (隐藏订阅) {
            return new Response(`${嘲讽语}`, { status: 200 });
          } else {
            const 订阅页面 = 给我订阅页面(哎呀呀这是我的ID啊, 访问请求.headers.get('Host'));
            return new Response(`${订阅页面}`, {
              status: 200,
              headers: { "Content-Type": "text/plain;charset=utf-8" }
            });
          }
        }
        case `/${哎呀呀这是我的ID啊}/${转码}${转码2}`: {
          if (隐藏订阅) {
            return new Response(`${嘲讽语}`, { status: 200 });
          } else {
            const 通用配置文件 = 给我通用配置文件(访问请求.headers.get('Host'));
            return new Response(`${通用配置文件}`, {
              status: 200,
              headers: { "Content-Type": "text/plain;charset=utf-8" }
            });
          }
        }
        case `/${哎呀呀这是我的ID啊}/${小猫}${咪}`: {
          if (隐藏订阅) {
            return new Response(`${嘲讽语}`, { status: 200 });
          } else {
            const 小猫咪配置文件 = 给我小猫咪配置文件(访问请求.headers.get('Host'));
            return new Response(`${小猫咪配置文件}`, {
              status: 200,
              headers: { "Content-Type": "text/plain;charset=utf-8" }
            });
          }
        }
        default:
          return new Response('Hello World!', { status: 200 });
      }
    } else if (读取我的请求标头 === 'websocket') {
      if (私钥开关) {
        const 验证我的私钥 = 访问请求.headers.get('my-key');
        if (验证我的私钥 !== 咦这是我的私钥哎) {
          return new Response('私钥验证失败', { status: 403 });
        }
      }
      return await 升级WS请求(访问请求);
    }
  }
};
////////////////////////////////////////////////////////////////////////脚本主要架构//////////////////////////////////////////////////////////////////////
async function 升级WS请求(访问请求) {
  const 创建WS接口 = new WebSocketPair();
  const [客户端, WS接口] = Object.values(创建WS接口);
  const 读取WS数据头 = 访问请求.headers.get('sec-websocket-protocol');
  const 转换二进制数据 = 转换WS数据头为二进制数据(读取WS数据头);
  await 解析VL标头(转换二进制数据, WS接口);
  return new Response(null, { status: 101, webSocket: 客户端 });
}
function 转换WS数据头为二进制数据(WS数据头) {
  const base64URL转换为标准base64 = WS数据头.replace(/-/g, '+').replace(/_/g, '/');
  const 解码base64 = atob(base64URL转换为标准base64);
  const 转换为二进制数组 = Uint8Array.from(解码base64, c => c.charCodeAt(0));
  return 转换为二进制数组;
}
async function 解析VL标头(二进制数据, WS接口) {
  let 识别地址类型, 地址信息索引, 访问地址, 地址长度;
  try {
    if (!私钥开关 && 验证VL的密钥(二进制数据.slice(1, 17)) !== 哎呀呀这是我的VL密钥) {
      throw new Error('UUID验证失败');
    }
    const 获取数据定位 = 二进制数据[17];
    const 提取端口索引 = 18 + 获取数据定位 + 1;
    const 访问端口 = new DataView(二进制数据.buffer, 提取端口索引, 2).getUint16(0);
    if (访问端口 === 53) throw new Error('拒绝DNS连接');
    const 提取地址索引 = 提取端口索引 + 2;
    识别地址类型 = 二进制数据[提取地址索引];
    地址信息索引 = 提取地址索引 + 1;
    switch (识别地址类型) {
      case 1:
        地址长度 = 4;
        访问地址 = 二进制数据.slice(地址信息索引, 地址信息索引 + 地址长度).join('.');
        break;
      case 2:
        地址长度 = 二进制数据[地址信息索引];
        地址信息索引 += 1;
        const 访问域名 = new TextDecoder().decode(二进制数据.slice(地址信息索引, 地址信息索引 + 地址长度));
        访问地址 = await 查询最快IP(访问域名);
        if (访问地址 !== 访问域名) 识别地址类型 = 访问地址.includes(':') ? 3 : 1;
        break;
      case 3:
        地址长度 = 16;
        const ipv6 = [];
        const 读取IPV6地址 = new DataView(二进制数据.buffer, 地址信息索引, 16);
        for (let i = 0; i < 8; i++) ipv6.push(读取IPV6地址.getUint16(i * 2).toString(16));
        访问地址 = ipv6.join(':');
        break;
      default:
        throw new Error('无效的访问地址');
    }
    const TCP接口 = connect({ hostname: 访问地址, port: 访问端口 });
    await TCP接口.opened;
    const 传输数据 = TCP接口.writable.getWriter();
    const 读取数据 = TCP接口.readable.getReader();
    await 传输数据.write(二进制数据.slice(地址信息索引 + 地址长度));
    const 返回数据 = (await 读取数据.read()).value;
    if (!返回数据 || 返回数据.length === 0) throw new Error('无返回数据');
    WS接口.accept();
    WS接口.send(new Uint8Array([0, 0]));
    WS接口.send(返回数据);
    if (返回数据.length >= 4096) {
      while (true) {
        const 返回数据 = (await 读取数据.read()).value;
        WS接口.send(返回数据);
        if (返回数据.length < 4096) break;
      }
    }
    建立传输管道(传输数据, 读取数据, WS接口);
  } catch (e) {
    return new Response(`连接握手失败: ${e}`, { status: 500 });
  }
}
function 验证VL的密钥(字节数组, 起始位置 = 0) {
  const 十六进制表 = Array.from({ length: 256 }, (_, 值) =>
    (值 + 256).toString(16).slice(1)
  );
  const 分段结构 = [4, 2, 2, 2, 6];
  let 当前索引 = 起始位置;
  const 格式化UUID = 分段结构
    .map(段长度 =>
      Array.from({ length: 段长度 }, () => 十六进制表[字节数组[当前索引++]]).join('')
    )
    .join('-')
    .toLowerCase();
  return 格式化UUID;
}
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
async function 建立传输管道(传输数据, 读取数据, WS接口, 传输队列 = Promise.resolve(), 字节计数 = 0, 累计接收字节数 = 0, 已结束 = false) {
  WS接口.addEventListener('message', event => 传输队列 = 传输队列.then(async () => {
    const WS数据 = new Uint8Array(event.data);
    await 传输数据.write(WS数据);
    累计接收字节数 += WS数据.length;
  }).catch());
  const 保活 = setInterval(async () => {
    if (已结束) {
      clearInterval(保活);
    } else {
      await 传输数据.write(new Uint8Array(0));
    }
  }, 30000);
  while (true) {
    const { done: 流结束, value: 返回数据 } = await 读取数据.read();
    if (流结束) { 已结束 = true; break; }
    传输队列 = 传输队列.then(() => WS接口.send(返回数据)).catch();
    累计接收字节数 += 返回数据.length;
    if (启动控流机制 && (累计接收字节数 - 字节计数) > 2*1024*1024 && 返回数据.length < 4096) {
      传输队列 = 传输队列.then(async () => await new Promise(resolve => setTimeout(resolve, 300))).catch();
      字节计数 = 累计接收字节数;
    }
  }
}
//////////////////////////////////////////////////////////////////////////订阅页面////////////////////////////////////////////////////////////////////////
let 转码 = 'vl', 转码2 = 'ess', 符号 = '://', 小猫 = 'cla', 咪 = 'sh', 我的私钥;
if (私钥开关) {
  我的私钥 = `my-key: ${咦这是我的私钥哎}`;
} else {
  我的私钥 = "";
}
function 给我订阅页面(哎呀呀这是我的ID啊, hostName) {
  return `
1、本worker的私钥功能只支持${小猫}${咪}，仅open${小猫}${咪}和${小猫}${咪} meta测试过，其他${小猫}${咪}类软件自行测试
2、若使用通用订阅请关闭私钥功能
3、其他需求自行研究
通用的：https${符号}${hostName}/${哎呀呀这是我的ID啊}/${转码}${转码2}
猫咪的：https${符号}${hostName}/${哎呀呀这是我的ID啊}/${小猫}${咪}
`;
}
function 给我通用配置文件(hostName) {
  我的优选.push(`${hostName}:443#备用节点`);
  if (私钥开关) {
    return `请先关闭私钥功能`;
  } else {
    return 我的优选.map(获取优选 => {
      const [主内容, tls] = 获取优选.split("@");
      const [地址端口, 节点名字 = 我的节点名字] = 主内容.split("#");
      const 拆分地址端口 = 地址端口.split(":");
      const 端口 = 拆分地址端口.length > 1 ? Number(拆分地址端口.pop()) : 443;
      const 地址 = 拆分地址端口.join(":");
      const TLS开关 = tls === 'notls' ? 'security=none' : 'security=tls';
      return `${转码}${转码2}${符号}${哎呀呀这是我的VL密钥}@${地址}:${端口}?encryption=none&${TLS开关}&sni=${hostName}&type=ws&host=${hostName}&path=%2F%3Fed%3D2560#${节点名字}`;
    }).join("\n");
  }
}
function 给我小猫咪配置文件(hostName) {
  我的优选.push(`${hostName}:443#备用节点`);
  function 生成节点(节点输入列表, hostName) {
    const 节点配置列表 = [];
    const 节点名称列表 = [];
    const 负载均衡节点名称列表 = [];
    for (const 获取优选 of 节点输入列表) {
      const [主内容, tls] = 获取优选.split("@");
      const [地址端口, 节点名字 = "默认节点"] = 主内容.split("#");
      const 拆分地址端口 = 地址端口.split(":");
      const 端口 = 拆分地址端口.length > 1 ? Number(拆分地址端口.pop()) : 443;
      const 地址 = 拆分地址端口.join(":").replace(/^\[(.+)\]$/, '$1');
      const TLS开关 = tls === "notls" ? "false" : "true";
      const 名称 = `${节点名字}-${地址}-${端口}`;
      节点配置列表.push(`- name: ${名称}
  type: ${转码}${转码2}
  server: ${地址}
  port: ${端口}
  uuid: ${哎呀呀这是我的VL密钥}
  udp: false
  tls: ${TLS开关}
  sni: ${hostName}
  network: ws
  ws-opts:
    path: "/?ed=2560"
    headers:
      Host: ${hostName}
      ${我的私钥}`);
      节点名称列表.push(`    - ${名称}`);
      if (名称.includes("负载均衡")) {
        负载均衡节点名称列表.push(`    - ${名称}`);
      }
    }
    let 负载均衡配置 = "";
    let 负载均衡组名 = "负载均衡";
    if (负载均衡节点名称列表.length > 0) {
      负载均衡配置 = `- name: ${负载均衡组名}
  type: load-balance
  strategy: round-robin
  url: http://www.gstatic.com/generate_204
  interval: 60
  proxies:
${负载均衡节点名称列表.join("\n")}`;
    }
    return {
      节点配置列表,
      节点名称列表,
      负载均衡配置,
      负载均衡组名: 负载均衡节点名称列表.length > 0 ? 负载均衡组名 : null,
    };
  }
  const { 节点配置列表, 节点名称列表, 负载均衡配置, 负载均衡组名 } = 生成节点(我的优选, hostName);
  const 生成节点配置 = 节点配置列表.join("\n");
  const 选择组 = `- name: 🚀 节点选择
  type: select
  proxies:
    - 自动选择
${负载均衡组名 ? `    - ${负载均衡组名}` : ""}
${节点名称列表.join("\n")}`;
  const 自动选择组 = `- name: 自动选择
  type: url-test
  url: http://www.gstatic.com/generate_204
  interval: 60
  tolerance: 30
  proxies:
${负载均衡组名 ? `    - ${负载均衡组名}` : ""}
${节点名称列表.join("\n")}`;
  return `
dns:
  nameserver:
    - 180.76.76.76
    - 2400:da00::6666
  fallback:
    - 8.8.8.8
    - 2001:4860:4860::8888
proxies:
${生成节点配置}
proxy-groups:
${选择组}
${自动选择组}
${负载均衡配置 || ""}
- name: 漏网之鱼
  type: select
  proxies:
    - DIRECT
    - 🚀 节点选择
rules:
- GEOSITE,category-ads,REJECT
- GEOSITE,cn,DIRECT
- GEOIP,CN,DIRECT,no-resolve
- GEOSITE,cloudflare,🚀 节点选择
- GEOIP,CLOUDFLARE,🚀 节点选择,no-resolve
- GEOSITE,gfw,🚀 节点选择
- GEOSITE,google,🚀 节点选择
- GEOIP,GOOGLE,🚀 节点选择,no-resolve
- GEOSITE,netflix,🚀 节点选择
- GEOIP,NETFLIX,🚀 节点选择,no-resolve
- GEOSITE,telegram,🚀 节点选择
- GEOIP,TELEGRAM,🚀 节点选择,no-resolve
- GEOSITE,openai,🚀 节点选择
- MATCH,漏网之鱼
`;
}
