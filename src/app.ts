import { Client } from "whatsapp-web.js";
import { parse } from "url";
import { WebSocketServer, WebSocket } from "ws";
import { SocketMessage } from "./types";
import { handleClientConnection } from "./client";

const wss = new WebSocketServer({ port: 8080 });

export let sended: { number: string; name: string; stage: "first_sended" | "second_sended" | "new" }[] = [];
type RecivedMessage = { type: "init" } | { type: "error"; data: string } | { type: "action"; data: SocketMessage };

export const sockets = new Map<string, { ws: WebSocket; client: Client }>();

wss.on("connection", function connection(ws, req) {
  const url = req?.url ?? "";

  const {
    query: { id },
  } = parse(url, true);

  ws.on("open", () => console.log("client connected .. "));
  ws.on("error", console.error);

  ws.on("message", function message(data) {
    const msg = JSON.parse(data.toString()) as RecivedMessage;
    switch (msg.type) {
      case "init": {
        const client = handleClientConnection((id as string) ?? "");
        id && sockets.set(id as string, { ws, client });
        break;
      }
      case "action": {
        handleActions(id as string, msg.data);
        break;
      }
    }

    console.log("received: %s", data);
  });

  ws.send(JSON.stringify({ data: "something" }));

  ws.onclose = () => {
    sockets.delete(id as string);
    console.log("WebSocket connection closed.");
  };

  ws.onerror = (event) => {
    console.error("WebSocket error:", event);
  };
});

function handleActions(id: string, sm: SocketMessage) {
  try {
    //ssss
    console.log("in handle actions...", { id, sm });
    switch (sm.type) {
      case "send": {
        console.log({ id, sm });

        break;
      }
    }
  } catch (handleActions_ERROR) {
    console.log({ handleActions_ERROR });
  }
}
