import express from "express";
import { createServer } from "http";
import cors from "cors";
import { Server } from "socket.io";
import { Client, RemoteAuth } from "whatsapp-web.js";
import { MongoStore } from "wwebjs-mongo";
import mongoose, { Mongoose } from "mongoose";

import { MessageSender } from "./messageSender";

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
const delCollection = ({ collection, mongoose }: { collection: "sessions" | "session"; mongoose: Mongoose }) => {
  mongoose.connection.db
    .collection(collection)
    .deleteMany({})
    .then(() => {
      console.log({ collection }, " deleted...");
    })
    .catch((err) => console.log({ collection }, " deletion failed: \n", { err }));
};

let store: typeof MongoStore;
const clients = new Map();
const numbers = new Map();
const MONGODB_URI = "mongodb+srv://yotamos:linux6926@cluster0.zj6wiy3.mongodb.net/mtxlog?retryWrites=true&w=majority";

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    store = new MongoStore({ mongoose: mongoose });

    io.on("connection", (socket) => {
      console.log("We are live and connected");
      console.log(socket.id);

      socket.on("identify", async (data) => {
        const { number } = data;
        console.log({ number });

        let client: Client;
        if (numbers.has(number)) {
          client = numbers.get(number);
        } else {
          client = new Client({
            authStrategy: new RemoteAuth({
              store: store,
              clientId: "whatsapp",
              backupSyncIntervalMs: 300000,
            }),
          });

          client.initialize().catch((err) => console.log("client init..", { err }));

          numbers.set(number, client);
        }

        clients.set(socket.id, client);

        client.on("qr", (qr) => {
          // Generate and send QR code to client
          io.to(socket.id).emit("qr", qr);
        });

        client.on("ready", () => {
          console.log("client ready");
          io.to(socket.id).emit("ready", true);
        });

        socket.on("send_messages", async (data) => {
          const { numbers: messageNumbers, messages } = data;
          new MessageSender(client).sendMessages({ messages, numbers: messageNumbers });
        });
      });
      socket.on("del_all", () => delCollection({ collection: "sessions", mongoose }));
      socket.on("disconnect", () => {
        clients.delete(socket.id);
      });
    });
  })
  .catch((err) => console.log("mongo init error", { err }));

httpServer.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});
