import express from "express";
import { createServer } from "http";
import cors from "cors";
import { Server, Socket } from "socket.io";
import { Store } from "whatsapp-web.js";

// import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { MongoStore } from "wwebjs-mongo";
import mongoose from "mongoose";
import { W_a_Client } from "./client";
import { sendMessages } from "./messageSender";

// import { Logger } from "./logger";
// import { openMessagesEvent } from "./messageSender";
const mongoUri = "mongodb+srv://yotamos:linux6926@cluster0.zj6wiy3.mongodb.net/mtxlog?retryWrites=true&w=majority";
const app = express();
const PORT = process.env.PORT || 5000;

let store: Store;

mongoose.connect(mongoUri).then((store = new MongoStore({ mongoose: mongoose })));

const corsConfig = {
  origin: "*",
  methods: ["GET", "POST"],
  credentials: true,
};
app.use(
  cors({
    ...corsConfig,
  })
);

app.get("/", (_req, res) => {
  res.status(200).send({
    success: true,
    message: "welcome to the beginning of greatness",
  });
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    ...corsConfig,
  },
});
export type Io_ = typeof io;
let clients = new Map<string, W_a_Client>();

const setClient = async (id: string | undefined) => {
  console.log("client number", { id });
  if (!id || !store) return console.log("no client id in args:", { id });
  console.log("clients:", clients.entries);
  let client = clients?.get(id);
  if (!client) {
    console.log("setting new cllient");
    client = new W_a_Client(store, id);
    client.listen(io);
    clients.set(id, client);
  } else client.stabelizeConnection(io);

  console.log("in set config");
};

const delete_connection = (number: string, socket: Socket) => {
  // console.log("disconnected:", { number });
  const client_ = clients.get(number);
  console.log({ number, client_ });
  if (number && client_) {
    clients.get(number)?.destroy(clients, socket);
  } else socket.disconnect();

  console.log("clients list length:", clients.entries.length);
};

io.on("connection", (socket) => {
  const number = socket.handshake.query.number?.toString();
  console.log("client connected:", { number });
  // socket.on("create_room", (room) => {
  //   console.log("creaying room:", { room });

  // });

  socket.on("disconnect", () => {
    console.log("disconnecting:", { number });
    // delete_connection(number, socket);
    socket.disconnect();
  });

  if (!number || !store) return console.log("no number provided");
  socket.join(number);
  socket.on("send_messages", (data) => {
    const client = clients.get(number)?.client;
    console.log("send messages:", { client });
    if (client) {
      sendMessages({ data, client }).then((res) => {
        console.log({ res });
        io.to(number).emit("messages_records", res);
      });
    }
  });
  socket.on("remove_connection", (number) => clients.get(number)?.destroy(clients, socket));
  console.log({ store });
  socket.on("get_session", () => setClient(number));

  // Logger({ clients, io });
  socket.on("delete_connection", (number) => {
    console.log("deleting connection..", { number });
    delete_connection(number, socket);
  });

  console.log("clients list length in io:", clients.entries.length);
});

httpServer.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});

// io.use((socket, next) => {
//   console.log(`New connection from ${socket.id}`);
//   next();
// });
