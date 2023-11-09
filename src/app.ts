import express from "express";
import { createServer } from "http";
import cors from "cors";
import { Server, Socket } from "socket.io";
import { Client, LocalAuth } from "whatsapp-web.js";
import { MessageSender } from "./messageSender";
import { DefaultEventsMap } from "socket.io/dist/typed-events";

const app = express();
const PORT = process.env.PORT || 5000;

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

let clients = new Map<string, { client: Client; socket: Socket }>();

const setClient = async (id: string | undefined, socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) => {
  console.log("client number", { id });
  if (!id) return console.log("no client id in args:", { id });
  let client = clients?.get(id)?.client;
  if (!client) {
    console.log("setting new cllient");
    client = new Client({
      puppeteer: { headless: true },
      authStrategy: new LocalAuth({ clientId: id }),
    });
  } else {
    console.log("client exists", clients);
    const connected = await client.getState();
    console.log({ connected });
    if (connected === "CONNECTED") {
      io.to(socket.id).emit("ready", true);
      return;
    } else client.resetState();
  }
  try {
    client.on("qr", (qr) => {
      console.log("sending qr to client");
      socket.emit("qr", qr);
    });

    client.on("ready", () => {
      console.log("client ready");
      io.to(socket.id).emit("ready", true);
    });

    client
      .initialize()
      .then(() => {
        console.log("client initialized");

        // socket.emit("ready", true);
      })
      .catch((err) => console.log("initialized error", { err }));
    clients.set(id, { client: client, socket: socket });
  } catch (e) {
    console.log("in set config");
    return;
  }

  // console.log("Client already initialized");
};

io.on("connection", (socket) => {
  const number = socket.handshake.query.number?.toString();

  socket.on("disconnect", () => {
    console.log("disconnected:", { number });
    socket.disconnect();
  });
  socket.on("remove_connection", (number) => {
    console.log("removing number from list: ", { number }, clients.entries);
    clients.delete(number);
    // socket.disconnect();
  });
  if (!number) return;

  // Use the existing socket connection

  // Rest of your code...

  // Create a new client and socket connection

  setClient(number, socket);

  console.log("total connections:", io.engine.clientsCount, "\n", "total clients:", clients.keys.length);

  socket.on("send_messages", (data) => {
    const { numbers: messageNumbers, messages } = data;
    const msgsClient = clients.get(number ?? "")?.client;
    if (!msgsClient) return console.log("no sending messages client found!!");
    new MessageSender(msgsClient).sendMessages({ messages, numbers: messageNumbers });
  });
});

httpServer.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});

io.use((socket, next) => {
  console.log(`New connection from ${socket.id}`);
  next();
});
