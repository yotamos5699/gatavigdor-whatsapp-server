import express from "express";
import qrcode from "qrcode-terminal";
import cors from "cors";
import { Client, LocalAuth } from "whatsapp-web.js";
const app = express();
const PORT = process.env.PORT || 5000;

/* 
** Aliases
type User = {
  readonly id: number,
  name: string,
  retire: (date:Date) =< void
}


** Union types

function kgToLbs(weight: number | string): number {
if(typeof weight ==='number') return weight * 2.2
return parseInt(wight) * 2.2

}

literal types 

type DoorStatus = 'open' | 'close'
let current status = 'close'

*/
const client = new Client({ authStrategy: new LocalAuth() });

app.set("trust proxy", 1); // trust first proxy
client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.log("Client is ready!");
});
//npm i --save-dev @types/node
// ******************************** SERVER INIT **************************************//
app.get("/", (_req, res): void => {
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

app.post("/api/sendMsgs", async (req, res) => {
  let { numbers, msg } = await req.body;
  let actionLog: any[] = [];
  let record: any;
  try {
    numbers.forEach((number: string, index: Number) => {
      let log = ``;

      client
        .isRegisteredUser(`${number}@c.us`)
        .then(function (isRegistered) {
          if (isRegistered) {
            client.sendMessage(`${number}@c.us`, msg);
            record = { number: number, status: "ok", row: index, msg: msg };
          } else {
            log = `***** ${number} is not registerd ******`;
            record = {
              number: number,
              status: "registretion error",
              row: index,
              msg: log,
            };
          }
        })
        .catch((err) => {
          record = {
            number: number,
            status: "catch error",
            row: index,
            msg: err,
          };
        });
      actionLog.push(record);
    });
    res.send(JSON.stringify(actionLog));
  } catch (e) {
    console.log(e);
  }
});

client.on("message", async (message: any) => {
  console.log(message._data.notifyName);
  let response = `hi ${message._data.notifyName}`;
  client.sendMessage(message.from, response);
});

//getting response
client
  .initialize()
  .then(() => console.log("client initialize ....\n to init in initializ"))
  .catch((err) => console.log(err));

module.exports = client;
