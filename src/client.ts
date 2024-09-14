import { Client, LocalAuth } from "whatsapp-web.js";
import { sockets, sended } from "./app";
import { requestsCache } from "./handlers";
import qrcode from "qrcode-terminal";
import { delay, messageParser } from "./helper";

let blockedNumbers: string[] = ["393889212914@c.us", "393338594778@c.us", "393335438809@c.us", "393278696422@c.us"];
let actionCounter = 0;

export function handleClientConnection(id: string) {
  const client = new Client({
    authStrategy: new LocalAuth({
      clientId: id,
    }),
  });

  client.on("ready", () => {
    sockets.get(id)?.ws.send(JSON.stringify({ type: "ready" }));
  });

  client.on("qr", (qr) => {
    if (sockets.get(id)?.ws.readyState === WebSocket.OPEN) {
      qrcode.generate(qr, { small: true }, () => {
        sockets.get(id)?.ws.send(JSON.stringify({ type: "qr", qr }));
      });
    }
  });
  client.on("message", async (message) => {
    const rc = requestsCache.get(id);

    if (!rc) return;
    const { strat, secondList } = rc;

    const number = message.id.remote;
    const lead = sended.filter((uf) => uf.number === number)[0];
    if (lead && blockedNumbers.indexOf(number) === -1) {
      actionCounter++;
      blockedNumbers.push(number);
      await delay(Math.floor(Math.random() * strat.max_delay_second + strat.min_delay_second));

      if (Math.random() > 0.5) {
        client.sendMessage(number, messageParser(strat, secondList, lead.name));
      } else {
        message.reply(messageParser(strat, secondList, lead.name));
      }
    }
  });

  client.initialize();
  return client;
}
