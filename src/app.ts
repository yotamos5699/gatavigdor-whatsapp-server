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
import { delay, editMessageVarient, messageParser } from "./helper";
import { handleListener, handleUiContacts, secondMessage, strat } from "./handlers";
import { Lead, SendingStrategy } from "./types";

const wss = new WebSocketServer({ port: 8080 });

// const password =
//   "44348688614eb9316d739e0d40d07e015dcaeff3c9ff06abdf30d00530f152aa3c71dfe9b361cb9592d073c5e46ed3edb8b9c88cc024c2eadff945ab64dc7954";
// const password = "123";

let actionCounter = 0;

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
export let sended: { number: string; name: string; stage: "first_sended" | "second_sended" | "new" }[] = [];
type RecivedMessage = { type: "init" } | { type: "error"; data: string };
type RecivedAction =
  | { type: "send"; schema: "from_ui"; leads: Lead[]; messages: string[] }
  | { type: "send"; schema: "listener" }
  | { type: "stop" };

export const sockets = new Map<string, WebSocket>();
export const strats = new Map<string, SendingStrategy>();
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
    if (sockets.get(id)?.readyState === WebSocket.OPEN) {
      qrcode.generate(qr, { small: true }, (qc) => {
        console.log({ qr, qc });
        sockets.get(id)?.send(JSON.stringify({ type: "qr", qr }));
      });
      console.log("socket ready qr listener");
    }
  });
  client.on("message", async (message) => {
    console.log("recived message: ", message.body);

    const number = message.id.remote;
    const lead = sended.filter((uf) => uf.number === number)[0];
    if (lead && blockedNumbers.indexOf(number) === -1) {
      actionCounter++;
      blockedNumbers.push(number);
      await delay(Math.floor(Math.random() * strat.max_delay_second + strat.min_delay_second));

      if (Math.random() > 0.5) {
        client.sendMessage(number, messageParser(strat, secondMessage, lead.name));
      } else {
        message.reply(messageParser(strat, secondMessage, lead.name));
      }
    }
    console.log({ blockedNumbers, sended });
  });

  handleActions(sockets?.get(id), client, id);
  client.initialize();
}

function handleActions(ws: WebSocket | undefined, client: Client, id: string) {
  if (!ws) return;
  ws.on("action", (data) => {
    const rm: RecivedAction = JSON.parse(data);

    switch (rm.type) {
      case "send": {
        if (rm.schema === "from_ui") {
          handleUiContacts(rm.leads, rm.messages, client, id);
          break;
        }
        if (rm.schema === "listener") {
          handleListener(client, id);
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
