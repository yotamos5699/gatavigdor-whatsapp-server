// import express from "express";
// import { createServer } from "http";
// import cors from "cors";
// import { Server, Socket } from "socket.io";
// import { Store } from "whatsapp-web.js";

// import { json } from "body-parser";
import { Client, LocalAuth } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import { parse } from "url";
import { WebSocketServer, WebSocket } from "ws";
import { InitData, LogType, SendingStrategy } from "./types";
import { editMessageVarient, normelizeNumbers } from "./helper";

const wss = new WebSocketServer({ port: 8080 });

// const password =
//   "44348688614eb9316d739e0d40d07e015dcaeff3c9ff06abdf30d00530f152aa3c71dfe9b361cb9592d073c5e46ed3edb8b9c88cc024c2eadff945ab64dc7954";
// const password = "123";

const baseUrl = "https://script.google.com/macros/s/AKfycbylQUU_1mh1ehP0fSRhmW364TQL5Q5eIX8aSnH3F5R-hls9hFWdVMF4sFls6zovfpFx/exec?";
let actionCounter = 0;

const logAction = ({
  type,
  number,
  name,
  message,
  status,
  updates,
}: {
  type: LogType;
  number: string;
  name: string;
  message: string;
  status: "ok" | "error";
  updates: number;
}) => {
  const date = new Date().toISOString();
  const id = crypto.randomUUID().slice(0, 10);
  actionCounter++;
  fetch(`${baseUrl}type=log&row=${encodeURIComponent(JSON.stringify([id, date, type, number, name, message, status]))}&updates=${updates}`);
};
const URL_LISTS =
  "https://script.google.com/macros/s/AKfycbx-6JLVMVuWote6N0vtiCLl_zgtbdDGfP6W--KoLcT8X5w6dr69-5BUEAQUaMcl1qUo/exec?type=lists";

let firstMsg: string[] = [];
let secondMessage: string[] = [];
let strat: SendingStrategy;
const getInitData = async () => {
  return fetch(URL_LISTS)
    .then((res) => res.json())
    .then((data) => data.data as InitData)
    .then((data) => {
      console.log({ data });
      console.log({ strat: data.strat });
      strat = normelizeNumbers(data.strat);
      firstMsg = data.first.map((fm) => fm.message);
      secondMessage = data.second.map((sm) => sm.message);
    });
};
const getNewLeads = () =>
  fetch(`${baseUrl}type=get_rows`)
    .then((res) => res.json())
    .then((data: { status: 1; data: string } | { status: 2; data: { name: string; phone: string }[] }) => {
      if (data.status === 2) return data.data;
      console.log(data.data);
      return null;
    });

let inProgress = false;
const delay = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const stateCode = "";

const formatPhone = (num: string) => `${stateCode}${num}@c.us`;
export const hash = [",", "!", "?", "=", "@", "#", "$", "/", ".", "+", "*", "&", "(", ")", "<", ">", "-", "_", "%", "`", "[", "]", "^"];

export const createVarient = (msg: string) => {
  let newMessage = "";

  for (let i = 0; i < msg.length; i++) {
    if (hash.includes(msg[i])) {
      newMessage += Math.random() > 0.5 ? msg[i] : "";
    } else {
      newMessage += msg[i];
    }
  }
  return newMessage;
};

// const socketsMap = new Map<string, WebSocket>();
let sended: { number: string; name: string; stage: "first_sended" | "second_sended" | "new" }[] = [];
type RecivedMessage = { type: "init" } | { type: "error"; data: string };
type RecivedAction =
  | { type: "send"; schema: "from_ui"; contacts: { name: string; number: string }[] }
  | { type: "send" }
  | { type: "stop" };

const sockets = new Map<string, WebSocket>();
wss.on("connection", function connection(ws, req) {
  const url = req?.url ?? "";

  const {
    query: { id },
  } = parse(url, true);

  ws.on("open", () => {
    console.log("sss");
  });
  console.log({ id });

  ws.on("error", console.error);

  ws.on("message", function message(data) {
    const msg = JSON.parse(data.toString()) as RecivedMessage;
    switch (msg.type) {
      case "init": {
        id && sockets.set(id as string, ws);
        handleClientConnection((id as string) ?? "");
        break;
      }
    }

    console.log("received: %s", data);
  });
  // ws.send(JSON.stringify("SENDING MESSAGE init"));
  // if (id as string) socketsMap.set(id as string, ws);
  ws.send(JSON.stringify({ data: "something" }));

  // Handle WebSocket close event
  ws.onclose = () => {
    sockets.delete(id as string);
    console.log("WebSocket connection closed.");
    // You may want to implement reconnection logic here
  };

  // Handle WebSocket error event
  ws.onerror = (event) => {
    console.error("WebSocket error:", event);
    // You may want to implement error handling and possibly reconnection logic here
  };
});

let blockedNumbers: string[] = ["393889212914@c.us", "393338594778@c.us", "393335438809@c.us", "393278696422@c.us"];
// let qrSent = false;

function handleClientConnection(id: string) {
  const client = new Client({
    authStrategy: new LocalAuth({
      clientId: id,
    }),
  });
  sockets.get(id)?.send(JSON.stringify({ type: "test", data: "hi test" }));

  client.on("ready", () => {
    sockets.get(id)?.send(JSON.stringify({ type: "ready" }));

    console.log("Client is ready!");
  });

  client.on("qr", (qr) => {
    // ws.emit("qr", JSON.stringify({ type: "qr", qr }));
    if (sockets.get(id)?.readyState === WebSocket.OPEN) {
      qrcode.generate(qr, { small: true }, (qc) => {
        console.log({ qr, qc });
        sockets.get(id)?.send(JSON.stringify({ type: "qr", qr }));
      });
      console.log("socket ready qr listener");

      // qrSent = true;
    }

    // ws?.emit("message", JSON.stringify({ type: "qr", qr }));
  });
  client.on("message", async (message) => {
    console.log("recived message: ", message.body);

    const number = message.id.remote;
    const lead = sended.filter((uf) => uf.number === number)[0];
    if (lead && blockedNumbers.indexOf(number) === -1) {
      actionCounter++;
      blockedNumbers.push(number);
      await delay(Math.floor(Math.random() * strat.max_delay_second + strat.min_delay_second));

      let selSecondMessage = secondMessage[Math.floor(Math.random() * secondMessage.length)];
      if (Math.random() > 0.5) {
        client.sendMessage(number, editMessageVarient(selSecondMessage, lead.name, true));
      } else {
        message.reply(editMessageVarient(selSecondMessage, lead.name, true));
      }
    }
    console.log({ blockedNumbers, sended });
  });

  handleActions(sockets?.get(id), client);
  client.initialize();
}

function handleListener() {
  getInitData().then(() => {
    setInterval(async () => {
      if (inProgress) {
        console.log("sending in progress..");
        return;
      }
      const newLeads = await getNewLeads();
      if (newLeads) {
        inProgress = true;
        for (let i = 0; i < newLeads.length; i++) {
          let lead = newLeads[i];
          await delay(Math.floor(Math.random() * strat.min_delay_first + strat.min_delay_first));
          let number = formatPhone(lead.phone);

          client
            .isRegisteredUser(number)
            .then((isRegistered) => {
              if (!isRegistered) {
                logAction({ type: "not_registered", message: "client not reg", name: lead.name, number, updates: 1, status: "error" });
              } else {
                if (sended.map((s) => s.number).indexOf(number) !== -1) {
                  console.log("recived first message allreedy !!", { number });
                  return;
                }
                sended.push({ number, name: lead.name, stage: "first_sended" });
                console.log(number);
                let selFirstMessage = firstMsg[Math.floor(Math.random() * firstMsg.length)];
                client
                  .sendMessage(number, editMessageVarient(selFirstMessage, lead.name, true))
                  .then(() => {
                    logAction({
                      type: "first_message",
                      message: selFirstMessage.slice(0, 12),
                      name: lead.name,
                      number,
                      updates: 1,
                      status: "ok",
                    });
                  })
                  .catch((err) =>
                    logAction({
                      type: "first_message",
                      message: JSON.stringify(err).slice(0, 32),
                      name: lead.name,
                      number,
                      updates: 1,
                      status: "error",
                    })
                  );
              }
            })
            .catch((err) => {
              logAction({
                type: "regi_error",
                message: JSON.stringify(err).slice(0, 32),
                name: lead.name,
                number,
                updates: 1,
                status: "error",
              });
            });
        }
        inProgress = false;
      }
    }, 12000);
  });
}
function handleActions(ws: WebSocket | undefined, client: Client) {
  if (!ws) return;
  ws.on("action", (data) => {
    const rm: RecivedMessage = JSON.parse(data);

    switch (rm.type) {
      case "send": {
        if (rm.schema === "from_ui") {
          break;
        }
      }
    }
  });
}

// type Contact = { num: string; name: string; first_message: string; second_message: string; sender: string };
// let waitingNumbers: string[] = [];

// const wss = new WebSocketServer({ port: 8080 });

// // let wsc: null | WebSocket = null;

// const sendFirstMessages = async (cons: Contact[], client: Client) => {
//   for (let i = 0; i < cons.length; i++) {
//     await client.isRegisteredUser(cons[i].num).then(async (registerd) => {
//       if (registerd) {
//         client.sendMessage(cons[i].num, cons[i].first_message).then((message) => {
//           waitingNumbers.push(message.to);
//         });
//       }
//     });
//   }
// };

// let secondMessage = "";

// const sendSecondMessage = (message: WAWebJS.Message, client: Client) => {
//   const index = waitingNumbers.findIndex((wn) => wn === message.from);
//   if (index === -1) return;
//   waitingNumbers.splice(index, 1);
//   client.sendMessage(message.from, secondMessage);
// };

// wss.on("connection", function connection(ws) {
//   // wsc = ws;
//   console.log("client connected,,,");

//   const client = new Client({});
//   ws.on("error", console.error);
//   ws.on("message", function message(data) {
//     console.log("received: %s", data);
//     const messages = JSON.parse(data.toString()) as Contact[];
//     sendFirstMessages(messages, client);
//   });
//   client.on("ready", () => {
//     console.log("Client is ready!");
//     ws?.send(JSON.stringify({ type: "ready", info: client.info }));
//   });

//   client.on("auth_failure", () => ws?.send(JSON.stringify({ type: "failed" })));

//   client.on("qr", (qr) => {
//     console.log("Client QR");
//     ws?.send(JSON.stringify({ type: "qr", qr }));

//     // qrcode.generate(qr, { small: true });
//   });
//   // client.on("message_create", (message) => {
//   //   // if (message.body === "!ping") {
//   //   // send back "pong" to the chat the message was sent in
//   //   client.sendMessage(message.from, "יא קוקסינל");
//   //   // }
//   // });
//   client.on("message", (message) => {
//     sendSecondMessage(message, client);
//     // if (message.body === "!ping") {
//     // send back "pong" to the chat the message was sent in
//     // client.sendMessage(message.from, "יא קוקסינל");
//     // }
//   });
//   client.initialize();

//   // ws.send('something');
// });
// // @ts-ignore

// // // import { DefaultEventsMap } from "socket.io/dist/typed-events";
// // import { MongoStore } from "wwebjs-mongo";
// // import mongoose from "mongoose";
// // import { W_a_Client } from "./client";
// // import { sendMessages } from "./messageSender";

// // // import { Logger } from "./logger";
// // // import { openMessagesEvent } from "./messageSender";
// // const mongoUri = "mongodb+srv://yotamos:linux6926@cluster0.zj6wiy3.mongodb.net/mtxlog?retryWrites=true&w=majority";
// // const app = express();
// // const PORT = process.env.PORT || 5000;

// // let store: Store;

// // mongoose.connect(mongoUri).then((store = new MongoStore({ mongoose: mongoose })));

// // const corsConfig = {
// //   origin: "*",
// //   methods: ["GET", "POST"],
// //   credentials: true,
// // };
// // app.use(
// //   cors({
// //     ...corsConfig,
// //   })
// // );

// // app.get("/", (_req, res) => {
// //   res.status(200).send({
// //     success: true,
// //     message: "welcome to the beginning of greatness",
// //   });
// // });

// // const httpServer = createServer(app);
// // const io = new Server(httpServer, {
// //   cors: {
// //     ...corsConfig,
// //   },
// // });
// // export type Io_ = typeof io;
// // let clients = new Map<string, W_a_Client>();

// // const setClient = async (id: string | undefined) => {
// //   console.log("client number", { id });
// //   if (!id || !store) return console.log("no client id in args:", { id });
// //   console.log("clients:", clients.entries);
// //   let client = clients?.get(id);
// //   if (!client) {
// //     console.log("setting new cllient");
// //     client = new W_a_Client(store, id);
// //     client.listen(io);
// //     clients.set(id, client);
// //   } else client.stabelizeConnection(io);

// //   console.log("in set config");
// // };

// // const delete_connection = (number: string, socket: Socket) => {
// //   // console.log("disconnected:", { number });
// //   const client_ = clients.get(number);
// //   console.log({ number, client_ });
// //   if (number && client_) {
// //     clients.get(number)?.destroy(clients, socket);
// //   } else socket.disconnect();

// //   console.log("clients list length:", clients.entries.length);
// // };

// // io.on("connection", (socket) => {
// //   const number = socket.handshake.query.number?.toString();
// //   console.log("client connected:", { number });
// //   // socket.on("create_room", (room) => {
// //   //   console.log("creaying room:", { room });

// //   // });

// //   socket.on("disconnect", () => {
// //     console.log("disconnecting:", { number });
// //     // delete_connection(number, socket);
// //     socket.disconnect();
// //   });

// //   if (!number || !store) return console.log("no number provided");
// //   socket.join(number);
// //   socket.on("send_messages", async (data) => {
// //     // console.log("send messages:", { client });
// //     if (number) {
// //       await setClient(number);
// //       const client = clients.get(number)?.client;
// //       if (!client) return;
// //       sendMessages({ data, client }).then((res) => {
// //         console.log({ res });
// //         io.to(number).emit("messages_records", res);
// //       });
// //     }
// //   });
// //   socket.on("remove_connection", (number) => clients.get(number)?.destroy(clients, socket));
// //   console.log({ store });
// //   socket.on("get_session", () => setClient(number));

// //   // Logger({ clients, io });
// //   socket.on("delete_connection", (number) => {
// //     console.log("deleting connection..", { number });
// //     delete_connection(number, socket);
// //   });

// //   console.log("clients list length in io:", clients.entries.length);
// // });

// // httpServer.listen(PORT, () => {
// //   console.log(`Example app listening on port ${PORT}`);
// // });

// // // io.use((socket, next) => {
// // //   console.log(`New connection from ${socket.id}`);
// // //   next();
// // // });
