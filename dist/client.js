"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.W_a_Client = exports.format_num = void 0;
const whatsapp_web_js_1 = require("whatsapp-web.js");
const format_num = (num) => `${num}@c.us`;
exports.format_num = format_num;
class W_a_Client {
    constructor(store, id) {
        this.client = new whatsapp_web_js_1.Client({
            puppeteer: { headless: true },
            authStrategy: new whatsapp_web_js_1.RemoteAuth({ clientId: id, store: store, backupSyncIntervalMs: 120000 }),
        });
        this.store = store;
        this.id = id;
    }
    sendToMennagers(messages, mennagers) {
        mennagers.forEach((mennager, i) => this.client.sendMessage((0, exports.format_num)(mennager.number), messages[i]));
    }
    state() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.client.getState();
        });
    }
    getClient() {
        return this.client;
    }
    destroy(clients, socket) {
        return __awaiter(this, void 0, void 0, function* () {
            socket.disconnect()._error((err) => console.log("disconnect:", { err }));
            this.client.destroy().catch((err) => console.log("destroy:", { err }));
            console.log("disconnected:", { number: this.id });
            clients.delete(this.id);
            console.log("removing number from list: ", { number: this.id }, clients.entries.length);
        });
    }
    listen(io) {
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
            .then(() => console.log("client initialized"))
            .catch((err) => console.log("initialized error", { err }));
    }
    stabelizeConnection(io) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("client exists ");
            try {
                if (!this.store)
                    return;
                const connected = yield this.client.getState();
                console.log({ connected });
                if (connected === "CONNECTED") {
                    console.log("client connected");
                    io.to(this.id).emit("ready", true);
                    return;
                }
                else if (connected)
                    this.client.resetState();
            }
            catch (stabelize_error) {
                console.log({ stabelize_error });
            }
            this.listen(io);
        });
    }
}
exports.W_a_Client = W_a_Client;
//# sourceMappingURL=client.js.map