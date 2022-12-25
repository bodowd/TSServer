import * as net from "net";
import * as wp from "workerpool";

const pool = wp.pool();

const PORT = 3000;
const IP = "127.0.0.1";
const BACKLOG = 100;

interface Request {
  protocol: string;
  method: string;
  url: string;
  headers: Map<string, string>;
  body: string;
}

interface Response {
  status: string;
  statusCode: number;
  protocol: string;
  headers: Map<string, string>;
  body: string;
}

const parseRequest = (s: string): Request => {
  const [firstLine, rest] = divideStringOn(s, "\r\n");
  const [method, url, protocol] = firstLine.split(" ", 3);
  const [headers, body] = divideStringOn(rest, "\r\n\r\n");
  const parsedHeaders = headers.split("\r\n").reduce((map, header) => {
    const [key, value] = divideStringOn(header, ": ");
    return map.set(key, value);
  }, new Map());
  return { protocol, method, url, headers: parsedHeaders, body };
};

const divideStringOn = (s: string, search: string) => {
  const index = s.indexOf(search);
  const first = s.slice(0, index);
  const rest = s.slice(index + search.length);
  return [first, rest];
};

const compileResponse = (r: Response): string => {
  return `${r.protocol} ${r.statusCode}
${r.status}
${Array.from(r.headers)
  .map((kv) => `${kv[0]}: ${kv[1]}`)
  .join("\r\n")}

${r.body}`;
};

net
  .createServer()
  .listen(PORT, IP, BACKLOG)
  .on("connection", (socket) => {
    console.log(
      `new connection from ${socket.remoteAddress}:${socket.remotePort}`
    );

    socket.on("data", (buffer) => {
      socket.write(
        compileResponse({
          protocol: "HTTP/1.1",
          headers: new Map(),
          status: "OK",
          statusCode: 200,
          body: `<html><body><h1>Greetings</h1></body></html>`,
        })
      );
      const request = buffer.toString();
      pool
        .exec(
          // have to define fibonacci function here or else
          // workerpool thinks it's undefined
          // tried alot to bring it in from a different file
          // like how the docs showed but got problems with
          // typescript not allowing imports or not knowing what
          // .ts file is...
          function fib(n: number): number {
            return n < 2 ? n : fib(n - 2) + fib(n - 1);
          },
          [45]
        )
        .then((res: number) => {
          socket.write(res.toString());
          console.log("connection closed");
          socket.end();
        })
        .catch((err: any) => console.log(err))
        .then(() => pool.terminate());
    });
  });
