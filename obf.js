const os = require('os');
const http = require('http');
const fs = require('fs');
const axios = require('axios');
const net = require('net');
const path = require('path');
const crypto = require('crypto');
const { Buffer } = require('buffer');
const { exec, execSync } = require('child_process');
const { WebSocket, createWebSocketStream } = require('ws');

// ============================================================
// VLESS 配置
// ============================================================

const UUID = process.env.UUID || '134fba6b-704a-4316-8aae-cf3c779c3d74';
const DOMAIN = process.env.DOMAIN || 'web.wz7465.cloudns.org';
const WSPATH = process.env.WSPATH || UUID.slice(0, 8);
const SUB_PATH = process.env.SUB_PATH || 'sub33';
const NAME = process.env.NAME || '';
const PORT = process.env.PORT || 35518;

// ============================================================
// ISP
// ============================================================

let ISP = '';

const GetISP = async () => {
  try {
    const res = await axios.get('https://speed.cloudflare.com/meta');
    const data = res.data;
    ISP = `${data.country}-${data.asOrganization}`.replace(/ /g, '_');
  } catch (e) {
    ISP = 'Unknown';
  }
};

GetISP();

// ============================================================
// HTTP Server
// ============================================================

const httpServer = http.createServer((req, res) => {

  // 首页
  if (req.url === '/') {

    const filePath = path.join(__dirname, 'index.html');

    fs.readFile(filePath, 'utf8', (err, content) => {

      if (err) {
        res.writeHead(200, {
          'Content-Type': 'text/html'
        });

        res.end('Hello world!');
        return;
      }

      res.writeHead(200, {
        'Content-Type': 'text/html'
      });

      res.end(content);
    });

    return;
  }

  // VLESS 订阅
  else if (req.url === `/${SUB_PATH}`) {

    const namePart = NAME
      ? `${NAME}-${ISP}`
      : ISP;

    const vlessURL =
      `vless://${UUID}@cdns.doon.eu.org:443` +
      `?encryption=none` +
      `&security=tls` +
      `&sni=${DOMAIN}` +
      `&fp=chrome` +
      `&type=ws` +
      `&host=${DOMAIN}` +
      `&path=%2F${WSPATH}` +
      `#${namePart}`;

    const subscription = vlessURL;

    const base64Content =
      Buffer.from(subscription).toString('base64');

    res.writeHead(200, {
      'Content-Type': 'text/plain'
    });

    res.end(base64Content + '\n');

    return;
  }

  // 404
  else {

    res.writeHead(404, {
      'Content-Type': 'text/plain'
    });

    res.end('Not Found\n');
  }
});

// ============================================================
// VLESS WebSocket Server
// ============================================================

const wss = new WebSocket.Server({
  server: httpServer
});

const uuid = UUID.replace(/-/g, '');

const DNS_SERVERS = [
  '8.8.4.4',
  '1.1.1.1'
];

// ============================================================
// DNS
// ============================================================

function resolveHost(host) {

  return new Promise((resolve, reject) => {

    // IPv4 直接返回
    if (
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
        .test(host)
    ) {

      resolve(host);
      return;
    }

    let attempts = 0;

    function tryNextDNS() {

      if (attempts >= DNS_SERVERS.length) {

        reject(
          new Error(
            `Failed to resolve ${host} with all DNS servers`
          )
        );

        return;
      }

      const dnsServer =
        DNS_SERVERS[attempts];

      attempts++;

      const dnsQuery =
        `https://dns.google/resolve?name=${encodeURIComponent(host)}&type=A`;

      axios.get(dnsQuery, {

        timeout: 5000,

        headers: {
          'Accept': 'application/dns-json'
        }

      })

      .then(response => {

        const data = response.data;

        if (
          data.Status === 0 &&
          data.Answer &&
          data.Answer.length > 0
        ) {

          const ip =
            data.Answer.find(
              record => record.type === 1
            );

          if (ip) {

            resolve(ip.data);
            return;
          }
        }

        tryNextDNS();
      })

      .catch(error => {

        tryNextDNS();
      });
    }

    tryNextDNS();
  });
}

// ============================================================
// VLESS 处理
// ============================================================

function handleVlessConnection(ws, msg) {

  const [VERSION] = msg;

  // UUID
  const id = msg.slice(1, 17);

  if (
    !id.every(
      (v, i) =>
        v ==
        parseInt(
          uuid.substr(i * 2, 2),
          16
        )
    )
  ) {

    return false;
  }

  // 地址信息开始位置
  let i =
    msg.slice(17, 18).readUInt8() + 19;

  // 目标端口
  const port =
    msg.slice(i, i += 2)
      .readUInt16BE(0);

  // 地址类型
  const ATYP =
    msg.slice(i, i += 1)
      .readUInt8();

  // 目标地址
  const host =
    ATYP == 1

      ? msg
          .slice(i, i += 4)
          .join('.')

      : (
        ATYP == 2

          ? new TextDecoder()
              .decode(
                msg.slice(
                  i + 1,
                  i +=
                    1 +
                    msg
                      .slice(i, i + 1)
                      .readUInt8()
                )
              )

          : (
            ATYP == 3

              ? msg
                  .slice(i, i += 16)
                  .reduce(
                    (s, b, i, a) =>
                      i % 2
                        ? s.concat(
                            a.slice(
                              i - 1,
                              i + 1
                            )
                          )
                        : s,
                    []
                  )
                  .map(
                    b =>
                      b
                        .readUInt16BE(0)
                        .toString(16)
                  )
                  .join(':')

              : ''
          )
      );

  // ==========================================================
  // VLESS Response
  // 这个非常关键，不能删除
  // ==========================================================

  ws.send(
    new Uint8Array([
      VERSION,
      0
    ])
  );

  // ==========================================================
  // WebSocket <-> TCP
  // ==========================================================

  const duplex =
    createWebSocketStream(ws);

  resolveHost(host)

    .then(resolvedIP => {

      net.connect(
        {
          host: resolvedIP,
          port
        },

        function () {

          // 发送 VLESS 首包剩余数据
          this.write(
            msg.slice(i)
          );

          // 双向转发
          duplex
            .on('error', () => {})
            .pipe(this)
            .on('error', () => {})
            .pipe(duplex);
        }

      ).on(
        'error',
        () => {}
      );
    })

    .catch(error => {

      net.connect(
        {
          host,
          port
        },

        function () {

          this.write(
            msg.slice(i)
          );

          duplex
            .on('error', () => {})
            .pipe(this)
            .on('error', () => {})
            .pipe(duplex);
        }

      ).on(
        'error',
        () => {}
      );
    });

  return true;
}

// ============================================================
// VLESS WebSocket 连接处理
// ============================================================

wss.on(
  'connection',
  (ws, req) => {

    const url =
      req.url || '';

    ws.once(
      'message',
      msg => {

        // VLESS 首包
        if (
          msg.length > 17 &&
          msg[0] === 0
        ) {

          const id =
            msg.slice(1, 17);

          const isVless =
            id.every(
              (v, i) =>
                v ==
                parseInt(
                  uuid.substr(
                    i * 2,
                    2
                  ),
                  16
                )
            );

          if (isVless) {

            if (
              !handleVlessConnection(
                ws,
                msg
              )
            ) {

              ws.close();
            }

            return;
          }
        }
      }
    ).on(
      'error',
      () => {}
    );
  }
);

// ============================================================
// WSS TCP Tunnel Client
// ============================================================
//
// 这里整合你原来的 client(1).js
//
// VPS server.js
//      |
//      | WSS :8080
//      |
//      v
// 当前 app.js
//
// 一个 WSS 同时承载多个 TCP 连接
//
// ============================================================

// VPS WSS 地址
const WS_URL =
  'wss://152.69.193.133:8080';

// 必须与 VPS server.js 一致
const AUTH_TOKEN =
  'CHANGE_THIS_TO_A_LONG_RANDOM_TOKEN';

// ============================================================
// 路由
// ============================================================
//
// VPS:80
//     ↓
// 127.0.0.1:30008
//
// VPS:81
//     ↓
// 152.69.193.133:32769
//
// VPS:82
//     ↓
// 152.69.193.133:32771
//
// ============================================================

const ROUTES = [

  {
    publicPort: 80,
    localHost: '127.0.0.1',
    localPort: 35518
  },

  {
    publicPort: 81,
    localHost: '152.69.193.133',
    localPort: 32769
  },

  {
    publicPort: 82,
    localHost: '152.69.193.133',
    localPort: 32771
  }

];

// ============================================================
// 自动重连
// ============================================================

const RECONNECT_DELAY =
  3000;

// ============================================================
// TCP 连接管理
// ============================================================
//
// Connection ID
//      ↓
// TCP Socket
//
// 一个 WSS 可以同时承载很多 TCP
// ============================================================

const connections =
  new Map();

let tunnelWs =
  null;

// ============================================================
// 检查路由
// ============================================================

function validateRoutes() {

  if (
    !Array.isArray(ROUTES)
  ) {

    throw new Error(
      'ROUTES 必须是数组'
    );
  }

  const publicPorts =
    new Set();

  for (
    const route of ROUTES
  ) {

    // publicPort
    if (
      !Number.isInteger(
        route.publicPort
      ) ||

      route.publicPort < 1 ||

      route.publicPort > 65535
    ) {

      throw new Error(
        `无效 publicPort: ${route.publicPort}`
      );
    }

    // 重复端口
    if (
      publicPorts.has(
        route.publicPort
      )
    ) {

      throw new Error(
        `重复 publicPort: ${route.publicPort}`
      );
    }

    publicPorts.add(
      route.publicPort
    );

    // localHost
    if (
      typeof route.localHost !==
      'string' ||

      !route.localHost
    ) {

      throw new Error(
        `无效 localHost: ${route.localHost}`
      );
    }

    // localPort
    if (
      !Number.isInteger(
        route.localPort
      ) ||

      route.localPort < 1 ||

      route.localPort > 65535
    ) {

      throw new Error(
        `无效 localPort: ${route.localPort}`
      );
    }
  }
}

validateRoutes();

// ============================================================
// 连接 VPS WSS
// ============================================================

function connectWebSocket() {

  const wsURL =
    `${WS_URL}?token=${encodeURIComponent(
      AUTH_TOKEN
    )}`;

  console.log(
    `正在连接 ${WS_URL} ...`
  );

  tunnelWs =
    new WebSocket(
      wsURL,
      {
        // VPS 使用自签名证书
        rejectUnauthorized: false
      }
    );

  // ==========================================================
  // WSS 建立
  // ==========================================================

  tunnelWs.on(
    'open',
    () => {

      console.log(
        'WSS 连接成功'
      );

      // ======================================================
      // 注册端口
      // ======================================================

      const registerMessage = {

        type: 'register',

        routes:
          ROUTES.map(
            route => ({

              publicPort:
                route.publicPort,

              localHost:
                route.localHost,

              localPort:
                route.localPort
            })
          )
      };

      console.log(
        '正在注册端口映射:'
      );

      for (
        const route of ROUTES
      ) {

        console.log(
          `  VPS:${route.publicPort}` +
          ` → ${route.localHost}:${route.localPort}`
        );
      }

      tunnelWs.send(
        JSON.stringify(
          registerMessage
        )
      );
    }
  );

  // ==========================================================
  // 接收 VPS 数据
  // ==========================================================

  tunnelWs.on(
    'message',
    (data, isBinary) => {

      try {

        // ====================================================
        // 二进制 TCP 数据
        //
        // [4字节 Connection ID][TCP Data]
        //
        // ====================================================

        if (isBinary) {

          const packet =
            Buffer.from(data);

          if (
            packet.length < 4
          ) {

            return;
          }

          const connectionId =
            packet.readUInt32BE(0);

          const payload =
            packet.subarray(4);

          const socket =
            connections.get(
              connectionId
            );

          if (!socket) {

            return;
          }

          if (
            !socket.destroyed &&
            payload.length > 0
          ) {

            socket.write(
              payload
            );
          }

          return;
        }

        // ====================================================
        // JSON 控制消息
        // ====================================================

        const message =
          JSON.parse(
            data.toString()
          );

        handleControlMessage(
          message
        );

      } catch (err) {

        console.error(
          '处理 WSS 数据失败:',
          err.message
        );
      }
    }
  );

  // ==========================================================
  // WSS 错误
  // ==========================================================

  tunnelWs.on(
    'error',
    err => {

      console.error(
        'WSS 错误:',
        err.message
      );
    }
  );

  // ==========================================================
  // WSS 关闭
  // ==========================================================

  tunnelWs.on(
    'close',
    (code, reason) => {

      console.log(
        `WSS 连接断开 ` +
        `code=${code} ` +
        `reason=${reason.toString()}`
      );

      // 清理所有 TCP
      for (
        const [id, socket]
        of connections
      ) {

        try {

          socket.destroy();

        } catch {}

        connections.delete(
          id
        );
      }

      tunnelWs =
        null;

      console.log(
        `${RECONNECT_DELAY / 1000}` +
        ` 秒后重新连接...`
      );

      setTimeout(
        connectWebSocket,
        RECONNECT_DELAY
      );
    }
  );
}

// ============================================================
// 控制消息
// ============================================================

function handleControlMessage(
  message
) {

  switch (
    message.type
  ) {

    // ========================================================
    // VPS 要求建立 TCP
    // ========================================================

    case 'open':

      handleOpenRequest(
        message
      );

      break;

    // ========================================================
    // 注册成功
    // ========================================================

    case 'registered':

      console.log(
        'VPS 端口注册成功'
      );

      if (
        Array.isArray(
          message.routes
        )
      ) {

        for (
          const route
          of message.routes
        ) {

          console.log(
            `  VPS:${route.publicPort}` +
            ` → ${route.localHost}:${route.localPort}`
          );
        }
      }

      break;

    // ========================================================
    // TCP 建立成功
    // ========================================================

    case 'opened':

      console.log(
        `TCP 连接已建立 ID=${message.id}`
      );

      break;

    // ========================================================
    // TCP 关闭
    // ========================================================

    case 'close':

      console.log(
        `服务端要求关闭 TCP 连接 ID=${message.id}`
      );

      closeConnection(
        message.id
      );

      break;

    // ========================================================
    // 错误
    // ========================================================

    case 'error':

      console.error(
        `远程连接错误 ID=${message.id}:`,
        message.error
      );

      break;

    default:

      console.log(
        '未知控制消息:',
        message
      );
  }
}

// ============================================================
// VPS 要求打开 TCP
// ============================================================

function handleOpenRequest(
  message
) {

  const connectionId =
    message.id;

  const localHost =
    message.localHost;

  const localPort =
    message.localPort;

  if (
    !Number.isInteger(
      connectionId
    ) ||

    !localHost ||

    !Number.isInteger(
      localPort
    )
  ) {

    console.error(
      '收到无效 open 请求:',
      message
    );

    return;
  }

  // 防止重复创建
  if (
    connections.has(
      connectionId
    )
  ) {

    return;
  }

  createTCPConnection(
    connectionId,
    localHost,
    localPort
  );
}

// ============================================================
// 创建本地 TCP
// ============================================================

function createTCPConnection(
  connectionId,
  localHost,
  localPort
) {

  console.log(
    `正在连接本地 TCP ` +
    `${localHost}:${localPort} ` +
    `ID=${connectionId}`
  );

  const socket =
    net.createConnection({

      host:
        localHost,

      port:
        localPort
    });

  // 保存连接
  connections.set(
    connectionId,
    socket
  );

  // ==========================================================
  // TCP 建立
  // ==========================================================

  socket.on(
    'connect',
    () => {

      console.log(
        `本地 TCP 连接成功 ID=${connectionId}`
      );

      if (
        !tunnelWs ||

        tunnelWs.readyState !==
        WebSocket.OPEN
      ) {

        socket.destroy();

        connections.delete(
          connectionId
        );

        return;
      }

      tunnelWs.send(
        JSON.stringify({

          type:
            'opened',

          id:
            connectionId
        })
      );
    }
  );

  // ==========================================================
  // 本地 TCP → WSS
  //
  // [4字节 ID][TCP 数据]
  // ==========================================================

  socket.on(
    'data',
    data => {

      if (
        !tunnelWs ||

        tunnelWs.readyState !==
        WebSocket.OPEN
      ) {

        return;
      }

      const header =
        Buffer.allocUnsafe(4);

      header.writeUInt32BE(
        connectionId,
        0
      );

      const packet =
        Buffer.concat([
          header,
          data
        ]);

      try {

        tunnelWs.send(
          packet
        );

      } catch (err) {

        console.error(
          `ID=${connectionId} ` +
          `WebSocket send error:`,
          err.message
        );

        socket.destroy();
      }
    }
  );

  // ==========================================================
  // TCP 正常关闭
  // ==========================================================

  socket.on(
    'close',
    () => {

      connections.delete(
        connectionId
      );

      if (
        tunnelWs &&

        tunnelWs.readyState ===
        WebSocket.OPEN
      ) {

        tunnelWs.send(
          JSON.stringify({

            type:
              'close',

            id:
              connectionId
          })
        );
      }

      console.log(
        `本地 TCP 连接关闭 ID=${connectionId}`
      );
    }
  );

  // ==========================================================
  // TCP 错误
  // ==========================================================

  socket.on(
    'error',
    err => {

      console.error(
        `本地 TCP 错误 ID=${connectionId}:`,
        err.message
      );

      connections.delete(
        connectionId
      );

      if (
        tunnelWs &&

        tunnelWs.readyState ===
        WebSocket.OPEN
      ) {

        tunnelWs.send(
          JSON.stringify({

            type:
              'close',

            id:
              connectionId
          })
        );
      }
    }
  );
}

// ============================================================
// 关闭 TCP
// ============================================================

function closeConnection(
  connectionId
) {

  const socket =
    connections.get(
      connectionId
    );

  if (!socket) {

    return;
  }

  connections.delete(
    connectionId
  );

  try {

    socket.destroy();

  } catch {}
}

// ============================================================
// 启动日志
// ============================================================

console.log(
  '================================='
);

console.log(
  '       WSS TCP Tunnel Client'
);

console.log(
  '================================='
);

console.log(
  `WSS    : ${WS_URL}`
);

console.log(
  'Routes :'
);

for (
  const route of ROUTES
) {

  console.log(
    `  VPS:${route.publicPort}` +
    ` → ${route.localHost}:${route.localPort}`
  );
}

console.log(
  'TLS    : 证书验证已关闭'
);

console.log(
  '================================='
);

// ============================================================
// 启动 WSS 隧道
// ============================================================

connectWebSocket();

// ============================================================
// 启动 VLESS HTTP / WebSocket
// ============================================================

httpServer.listen(
  PORT,
  () => {

    console.log(
      `Server is running on port ${PORT}`
    );

    console.log(
      `VLESS WebSocket path: /${WSPATH}`
    );

    console.log(
      `Subscription path: /${SUB_PATH}`
    );
  }
);
