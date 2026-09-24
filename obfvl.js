const DOMAIN = process.env.DOMAIN || 'node66.lunes.host';
const PORT = process.env.PORT || 3135;  // 服务端口

const _0xS = [
  "aHR0cA==",
  "ZnM=",
  "YXhpb3M=",
  "bmV0",
  "cGF0aA==",
  "YnVmZmVy",
  "d3M=",
  "MTM0ZmJhNmItNzA0YS00MzE2LThhYWUtY2YzYzc3OWMzZDc0",
  "c3ViMzM=",
  "",
  "",
  "aHR0cHM6Ly9zcGVlZC5jbG91ZGZsYXJlLmNvbS9tZXRh",
  "Xw==",
  "VW5rbm93bg==",
  "Lw==",
  "aW5kZXguaHRtbA==",
  "dXRmOA==",
  "Q29udGVudC1UeXBl",
  "dGV4dC9odG1s",
  "SGVsbG8gd29ybGQh",
  "Q29udGVudC1UeXBl",
  "dGV4dC9odG1s",
  "YmFzZTY0",
  "Q29udGVudC1UeXBl",
  "dGV4dC9wbGFpbg==",
  "Cg==",
  "Q29udGVudC1UeXBl",
  "dGV4dC9wbGFpbg==",
  "Tm90IEZvdW5kCg==",
  "",
  "OC44LjQuNA==",
  "MS4xLjEuMQ==",
  "QWNjZXB0",
  "YXBwbGljYXRpb24vZG5zLWpzb24=",
  "Lg==",
  "Og==",
  "",
  "ZXJyb3I=",
  "Y29ubmVjdGlvbg==",
  "bWVzc2FnZQ==",

  "dmxlc3M6Ly8=",
  "QGNkbnMuZG9vbi5ldS5vcmc6NDQzP2VuY3J5cHRpb249bm9uZSZzZWN1cml0eT10bHMmc25pPQ==",
  "JmZwPWNocm9tZSZ0eXBlPXdzJmhvc3Q=",
  "JnBhdGg9JTJG",
  "Iw==",
  "ZXJyb3I=",
  "dGV4dC9wbGFpbg=="
];

const _0xD = _0xN =>
  globalThis.Buffer.from(_0xS[_0xN], "base64").toString("utf8");

const http = require(_0xD(0));
const fs = require(_0xD(1));
const axios = require(_0xD(2));
const net = require(_0xD(3));
const path = require(_0xD(4));
const { Buffer } = require(_0xD(5));
const {
  WebSocket,
  createWebSocketStream
} = require(_0xD(6));

const _0xA1 =
  process.env.UUID ||
  _0xD(7);

const _0xA2 =
  process.env.WSPATH ||
  _0xA1.slice(0, 8);

const _0xA3 =
  process.env.SUB_PATH ||
  _0xD(8);

const _0xA4 =
  process.env.NAME ||
  _0xD(9);

let _0xA5 = _0xD(10);

const _0xA6 = async () => {
  try {
    const _0xC7 =
      await axios.get(_0xD(11));

    const _0xC8 =
      _0xC7.data;

    _0xA5 =
      `${_0xC8.country}-${_0xC8.asOrganization}`
        .replace(/ /g, _0xD(12));

  } catch (_0xE1) {
    _0xA5 = _0xD(13);
  }
};

_0xA6();

const _0xA7 =
  http.createServer((req, _0xR) => {

    if (req.url === _0xD(14)) {

      const _0xF1 =
        path.join(
          __dirname,
          _0xD(15)
        );

      fs.readFile(
        _0xF1,
        _0xD(16),
        (_0xE2, _0xC9) => {

          if (_0xE2) {

            _0xR.writeHead(
              200,
              {
                [_0xD(17)]: _0xD(18)
              }
            );

            _0xR.end(
              _0xD(19)
            );

            return;
          }

          _0xR.writeHead(
            200,
            {
              [_0xD(20)]: _0xD(21)
            }
          );

          _0xR.end(_0xC9);
        }
      );

      return;
    }

    if (req.url === `/${_0xA3}`) {

      const _0xB1 =
        _0xA4
          ? `${_0xA4}-${_0xA5}`
          : _0xA5;

      const _0xB2 =
        _0xD(40) +
        _0xA1 +
        _0xD(41) +
        DOMAIN +
        _0xD(42) +
        DOMAIN +
        _0xD(43) +
        _0xA2 +
        _0xD(44) +
        _0xB1;

      const _0xB3 =
        Buffer
          .from(_0xB2)
          .toString(_0xD(22));

      _0xR.writeHead(
        200,
        {
          [_0xD(23)]: _0xD(24)
        }
      );

      _0xR.end(
        _0xB3 + _0xD(25)
      );

      return;
    }

    _0xR.writeHead(
      404,
      {
        [_0xD(26)]: _0xD(27)
      }
    );

    _0xR.end(
      _0xD(28)
    );
  });

const _0xA8 =
  new WebSocket.Server({
    server: _0xA7
  });

const _0xA9 =
  _0xA1.replace(
    /-/g,
    _0xD(34)
  );

const _0xAA = [
  _0xD(30),
  _0xD(31)
];

function _0xAB(host) {

  return new Promise(
    (resolve, reject) => {

      if (
        /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
          .test(host)
      ) {

        resolve(host);
        return;
      }

      let _0xB4 = 0;

      function _0xB5() {

        if (
          _0xB4 >= _0xAA.length
        ) {

          reject(
            new Error(
              `Failed to resolve ${host} with all DNS servers`
            )
          );

          return;
        }

        const _0xB6 =
          _0xAA[_0xB4++];

        const _0xB7 =
          `https://dns.google/resolve?name=${encodeURIComponent(host)}&type=A`;

        axios.get(
          _0xB7,
          {
            timeout: 5000,

            headers: {
              [_0xD(32)]:
                _0xD(33)
            }
          }
        )
        .then(_0xC1 => {

          const _0xC2 =
            _0xC1.data;

          if (
            _0xC2.Status === 0 &&
            _0xC2.Answer &&
            _0xC2.Answer.length > 0
          ) {

            const _0xC3 =
              _0xC2.Answer.find(
                _0xC4 =>
                  _0xC4.type === 1
              );

            if (_0xC3) {
              resolve(_0xC3.data);
              return;
            }
          }

          _0xB5();

        })
        .catch(() => {
          _0xB5();
        });
      }

      _0xB5();
    }
  );
}

function _0xAC(ws, msg) {

  const [_0xC5] = msg;

  const _0xC6 =
    msg.slice(1, 17);

  if (
    !_0xC6.every(
      (v, i) =>
        v ==
        parseInt(
          _0xA9.substr(
            i * 2,
            2
          ),
          16
        )
    )
  ) {
    return false;
  }

  let i =
    msg
      .slice(17, 18)
      .readUInt8() + 19;

  const port =
    msg
      .slice(i, i += 2)
      .readUInt16BE(0);

  const _0xC7 =
    msg
      .slice(i, i += 1)
      .readUInt8();

  const host =
    _0xC7 === 1

      ? msg
          .slice(i, i += 4)
          .join(_0xD(35))

      : _0xC7 === 2

        ? new TextDecoder().decode(
            msg.slice(
              i + 1,
              i +=
                1 +
                msg
                  .slice(i, i + 1)
                  .readUInt8()
            )
          )

        : _0xC7 === 3

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
              .join(_0xD(36))

          : '';

  ws.send(
    new Uint8Array([
      _0xC5,
      0
    ])
  );

  const _0xC8 =
    createWebSocketStream(ws);

  _0xAB(host)
    .then(_0xC9 => {

      net.connect(
        {
          host: _0xC9,
          port
        },

        function () {

          this.write(
            msg.slice(i)
          );

          _0xC8
            .on(_0xD(37), () => {})
            .pipe(this)
            .on(_0xD(37), () => {})
            .pipe(_0xC8);
        }

      ).on(
        _0xD(37),
        () => {}
      );

    })
    .catch(() => {

      net.connect(
        {
          host,
          port
        },

        function () {

          this.write(
            msg.slice(i)
          );

          _0xC8
            .on(_0xD(37), () => {})
            .pipe(this)
            .on(_0xD(37), () => {})
            .pipe(_0xC8);
        }

      ).on(
        _0xD(37),
        () => {}
      );
    });

  return true;
}

_0xA8.on(
  _0xD(38),
  (ws, req) => {

    const _0xC1 =
      req.url || '';

    ws.once(
      _0xD(39),
      msg => {

        if (
          msg.length > 17 &&
          msg[0] === 0
        ) {

          const _0xC2 =
            msg.slice(1, 17);

          const _0xC3 =
            _0xC2.every(
              (v, i) =>
                v ==
                parseInt(
                  _0xA9.substr(
                    i * 2,
                    2
                  ),
                  16
                )
            );

          if (_0xC3) {

            if (
              !_0xAC(
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
    )
    .on(
      _0xD(37),
      () => {}
    );
  }
);

_0xA7.listen(
  PORT,
  () => {
    console.log(
      `Server is running on port ${PORT}`
    );
  }
);
