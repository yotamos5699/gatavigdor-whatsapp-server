import express from "express";
import qrcode from "qrcode-terminal";
import cors from "cors";
import { Client, LocalAuth, Message } from "whatsapp-web.js"; //@ts-ignore
import fs, { writeFileSync } from "fs";
//
// import path from "path";
// import axios from "axios";
//const RETURN_MESSAGES_NUMBER = `+972545940054@c.us`;
// const baseUrl: string =
//   "https://script.google.com/macros/s/AKfycbyPFqFnKqnp7nfvt6VBbHOZuEj6pKlay-0Y_TjAngi2r8gfKZ_iQeegdeOItpF3iTvu/exec";
const app = express();
const PORT = process.env.PORT || 5000;
let toSend: boolean = false;
const client = new Client({
  // session: session,
  authStrategy: new LocalAuth(),

  puppeteer: {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-extensions"],
  },
});

app.set("trust proxy", 1); // trust first proxy
client.on("qr", (qr: any) => {
  qrcode.generate(qr, { small: true }, (qrcode) => {
    console.log(qrcode);
  });
});

client.on("ready", () => {
  toSend = false;
  console.log("Client is ready!");
});
//npm i --save-dev @types/node
// ******************************** SERVER INIT **************************************//
app.get("/", (_req: any, res: { send: (arg0: string) => void }): void => {
  res.send("Hello World!");
});
app.use(
  cors({
    origin: "*",
  })
);
app.use(express.json());
app.listen(PORT, () => console.log(`server? listening on port` + PORT));
//******************************  main sript  *************************************/

function delay() {
  if (toSend) return;
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      if (toSend) {
        clearInterval(interval);
        resolve(true);
        console.log("ready to send");
      }
    }, 2000);
  });
}

app.post(
  "/api/sendMsgs",
  async (
    req: {
      body:
        | PromiseLike<{ numbers: any; msg: any }>
        | { numbers: any; msg: any };
    },
    res: { send: (arg0: unknown) => void }
  ) => {
    let { numbers, msg } = await req.body;
    let actionLog: any[] = [];
    let record: any;
    let isArrey: boolean = Array.isArray(msg);

    if (isArrey && msg.length != numbers.length)
      return res.send({ status: "no", data: "msg arrey != numbers arrey" });

    const stop = await delay();
    console.log("pass condition status ", stop);
    try {
      for (let i = 0; i <= numbers.length - 1; i++) {
        let log = ``;
        let Message = `${isArrey ? msg[i] : msg}`;
        await client
          .isRegisteredUser(`${numbers[i]}@c.us`)
          .then(function (isRegistered: any) {
            if (isRegistered) {
              client.sendMessage(`${numbers[i]}@c.us`, Message);
              record = {
                number: numbers[i],
                status: "ok",
                row: i,
                msg: Message,
              };
            } else {
              log = `***** ${numbers[i]} is not registerd ******`;
              record = {
                number: numbers[i],
                status: "registretion error",
                row: i,
                msg: log,
              };
            }
          })
          .catch((err: any) => {
            record = {
              number: numbers[i],
              status: "catch error",
              row: i,
              msg: err,
            };
          });
        actionLog.push(record);
      }
    } catch (e) {
      res.send(e);
    }
    console.log(actionLog);
    return res.send(JSON.stringify(actionLog));
  }
);

const serviceName = "972545940054@c.us";

client.on("message", async (message: Message | any) => {
  console.log({ message });
  const mm = ` :לקוח ${message._data.notifyName} :שלח  ${message.body} `;
  console.log({ mm });
  client.sendMessage(serviceName, mm);
});

client
  .initialize()
  .then(() => {
    toSend = true;
    console.log("client initialize ....\n to init in initializ");
  })
  .catch((err: any) => console.log(err));

module.exports = client;
