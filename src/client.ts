import { Socket } from "socket.io";
import { Client, RemoteAuth, Store } from "whatsapp-web.js";
// import { openMessagesEvent } from "./messageSender";
import { Io_ } from "./app";

type Mennager = {
  number: string;
  job: "admin" | "mennager";
};

export const format_num = (num: string) => `${num}@c.us`;
export class W_a_Client {
  client: Client;
  // socket: Socket;
  id: string;
  constructor(store: Store, id: string) {
    this.client = new Client({
      puppeteer: { headless: true },
      authStrategy: new RemoteAuth({ clientId: id, store: store, backupSyncIntervalMs: 120000 }),
    });
    // this.socket = socket;
    this.id = id;
  }

  sendToMennagers(messages: string[], mennagers: Mennager[]) {
    mennagers.forEach((mennager, i) => this.client.sendMessage(format_num(mennager.number), messages[i]));
  }
  async state() {
    return await this.client.getState();
  }
  getClient() {
    return this.client;
  }
  // getSocket() {
  //   return this.socket;
  // }
  async destroy(clients: Map<string, W_a_Client>, socket: Socket) {
    socket.disconnect()._error((err: any) => console.log("disconnect:", { err }));
    this.client.destroy().catch((err: any) => console.log("destroy:", { err }));

    console.log("disconnected:", { number: this.id });
    clients.delete(this.id);
    console.log("removing number from list: ", { number: this.id }, clients.entries.length);
  }
  listen(io: Io_) {
    this.client.on("qr", (qr) => {
      console.log("sending qr to client");
      io.to(this.id).emit("qr", qr);
    });

    this.client.on("ready", () => {
      console.log("client ready");
      io.to(this.id).emit("ready", true);
    });

    this.client

      .initialize()
      .then(() => {
        console.log("client initialized", this.client);
        // openMessagesEvent(this, io);
      })
      .catch((err) => console.log("initialized error", { err }));
  }
  handleErrors() {
    console.log("handle errors function in client class");
  }
  async stabelizeConnection(io: Io_) {
    console.log("client exists \nclient:");

    try {
      const connected = await this.client.getState();
      console.log({ connected });
      if (connected === "CONNECTED") {
        console.log("client connected");
        io.to(this.id).emit("ready", true);
        return;
      } else this.client.resetState();
    } catch (stabelize_error) {
      console.log({ stabelize_error });
      this.client.initialize().catch((error) => console.log("stabelize connection error:", { error }));
    }
  }
}
