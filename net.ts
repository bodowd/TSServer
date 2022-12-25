import * as net from "net";

const PORT = 3000;
const IP = "127.0.0.1";
const BACKLOG = 100;

export interface Request {
  protocol: string;
  method: string;
  url: string;
  headers: Map<string, string>;
  body: string;
}

export interface Response {
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
      const request = buffer.toString();
      socket.write(
        compileResponse({
          protocol: "HTTP/1.1",
          headers: new Map(),
          status: "OK",
          statusCode: 200,
          body: `<html><body><h1>Greetings</h1></body></html>`,
        })
      );
      socket.write(fibonacci(50).toString());
      socket.end();
      console.log("connection closed");
    });
  });

const fibonacci = (n: number): number => {
  return n < 2 ? n : fibonacci(n - 2) + fibonacci(n - 1);
};
