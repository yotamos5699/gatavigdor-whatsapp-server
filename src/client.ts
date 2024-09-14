import { Client, LocalAuth } from "whatsapp-web.js";
import { sockets } from "./app";

import qrcode from "qrcode-terminal";
import { WebSocket } from "ws";

export function handleClientConnection(id: string, ws: WebSocket) {
  console.log("initializing wa client..", { id });
  const client = new Client({
    authStrategy: new LocalAuth({
      clientId: id,
    }),
  });

  client.on("ready", () => {
    console.log("wa client ready ..");
    sockets.get(id)?.ws.send(JSON.stringify({ type: "ready" }));
  });

  client.on("qr", (qr) => {
    if (sockets.get(id)?.ws.readyState === WebSocket.OPEN) {
      console.log("sending qr code...");
      qrcode.generate(qr, { small: true }, () => {
        sockets.get(id)?.ws.send(JSON.stringify({ type: "qr", qr }));
      });
    }
  });

  client.initialize();
  sockets.set(id as string, { ws, client });
  //   return client;
}
