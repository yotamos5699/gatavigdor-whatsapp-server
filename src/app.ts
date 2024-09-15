import { Client } from "whatsapp-web.js";
import { parse } from "url";
import { WebSocketServer, WebSocket } from "ws";
import { SocketMessage } from "./types";
import { handleClientConnection } from "./client";
import { handleSendMessages } from "./handlers";

const wss = new WebSocketServer({ port: 8080 });

const isNotInitialized = async (id: string) => {
  const s = sockets?.get(id);
  console.log({ s });
  if (!s) return true;
  try {
    const state = await s?.client?.getState();
    console.log("prev connection state: ", { state });
    if (state !== "CONNECTED" && state !== "OPENING") return true;
    return false;
  } catch {
    console.log("error retriving state");
    return true;
  }
};

const updateClientReady = (id: string) => {
  const s = sockets.get(id);
  if (!s) return;
  s.ws.send(JSON.stringify({ type: "ready" }));
};

type RecivedMessage = { type: "init" } | { type: "error"; data: string } | { type: "action"; data: SocketMessage };

export const sockets = new Map<string, { ws: WebSocket; client: Client }>();

wss.on("connection", function connection(ws, req) {
  console.log("client connected .. ");
  const url = req?.url ?? "";

  const {
    query: { id },
  } = parse(url, true);

  // ws.on("open", () => );
  ws.on("error", console.error);

  ws.on("message", function message(data) {
    const msg = JSON.parse(data.toString()) as RecivedMessage;
    switch (msg.type) {
      case "init": {
        isNotInitialized(id as string).then((needInit) => {
          if (needInit) return handleClientConnection((id as string) ?? "", ws);
          updateClientReady(id as string);
        });
        break;
      }
      case "action": {
        handleActions(id as string, msg.data);
        break;
      }
    }

    console.log("received: ");
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

function handleActions(owner: string, sm: SocketMessage) {
  try {
    //ssss
    console.log("in handle actions...");
    switch (sm.type) {
      case "send": {
        console.log({ owner, sm });
        handleSendMessages(owner, sm);
        break;
      }
    }
  } catch (handleActions_ERROR) {
    console.log({ handleActions_ERROR });
  }
}
