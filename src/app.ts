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

//let toSend: boolean = true;
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
  // toSend = true;
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

// function delay() {
//   console.log("in delay !!");
//   if (toSend) return;
//   return new Promise((resolve) => {
//     const interval = setInterval(() => {
//       console.log("in interval", { toSend });
//       if (toSend) {
//         clearInterval(interval);
//         resolve(true);
//         console.log("ready to send");
//       }
//     }, 2000);
//   });
// }

app.post(
  "/api/sendMsgs",
  async (
    req: {
      body: PromiseLike<{ numbers: any; msg: any }> | { numbers: any; msg: any };
    },
    res: { send: (arg0: unknown) => void }
  ) => {
    console.log("send sms api");
    let { numbers, msg } = await req.body;
    //console.log({ numbers, msg }, typeof numbers, typeof msg);
    let actionLog: any[] = [];
    let record: any;
    let isArrey: boolean = Array.isArray(msg);

    if (isArrey && msg.length != numbers.length) return res.send({ status: "no", data: "msg arrey != numbers arrey" });
    const x: any = client;
    // console.log("conenction stat on top", x?.pupBrowser?._connection, client.pupBrowser?.isConnected);
    if (x?.pupBrowser?._connection) {
      // console.log("conenction stat on _conection == true", x?.pupBrowser?._connection, client.pupBrowser?.isConnected);
      for (let i = 0; i <= numbers.length - 1; i++) {
        let log = ``;
        let Message = `${isArrey ? msg[i] : msg}`;
        try {
          console.log("number: ", numbers[i], " message: ", msg[i]);
          await client.isRegisteredUser(`${numbers[i]}@c.us`).then(function (isRegistered: any) {
            if (isRegistered) {
              console.log("is registerd !!");
              client.sendMessage(`${numbers[i]}@c.us`, Message);
              record = {
                number: numbers[i],
                status: "ok",
                row: i,
                msg: Message,
              };
            } else {
              console.log("is not registerd !!");
              log = `***** ${numbers[i]} is not registerd ******`;
              record = {
                number: numbers[i],
                status: "registretion error",
                row: i,
                msg: log,
              };
            }
          });
        } catch (err) {
          record = {
            number: numbers[i],
            status: "catch error",
            row: i,
            msg: err,
          };
        }
        actionLog.push(record);
      }
      return res.send(actionLog);
    } else {
      client
        .initialize()
        .then(async (res) => {
          console.log({ res });

          console.log("client initialize ....\n to init in initializ");

          for (let i = 0; i <= numbers.length - 1; i++) {
            let log = ``;
            let Message = `${isArrey ? msg[i] : msg}`;
            try {
              await client.isRegisteredUser(`${numbers[i]}@c.us`).then(function (isRegistered: any) {
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
              });
            } catch (err) {
              record = {
                number: numbers[i],
                status: "catch error",
                row: i,
                msg: err,
              };
            }
            actionLog.push(record);
          }
        })
        .then(() => {
          return res.send(actionLog);
        })
        .catch((e) => {
          return res.send(e);
        });
    }
    console.log(actionLog);
    //console.log("conenction stat on end == true", x?.pupBrowser?._connection, client.pupBrowser?.isConnected);
  }
);

const serviceName = "972545940054@c.us";

client.on("message", async (message: Message | any) => {
  console.log({ message });
  const mm = ` :???????? ${message._data.notifyName} :??????  ${message.body} `;
  console.log({ mm });
  client.sendMessage(serviceName, mm);
});
console.log(client?.pupBrowser?.isConnected);

if (!client?.pupBrowser?.isConnected)
  client
    .initialize()
    .then(() => {
      // toSend = true;
      console.log("client initialize ....\n to init in initializ");
    })
    .catch((err: any) => console.log(err));

module.exports = client;
