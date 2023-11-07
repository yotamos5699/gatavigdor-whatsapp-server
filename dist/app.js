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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const cors_1 = __importDefault(require("cors"));
const socket_io_1 = require("socket.io");
const whatsapp_web_js_1 = require("whatsapp-web.js");
const wwebjs_mongo_1 = require("wwebjs-mongo");
const mongoose_1 = __importDefault(require("mongoose"));
const messageSender_1 = require("./messageSender");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
const corsConfig = {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
};
app.use((0, cors_1.default)(Object.assign({}, corsConfig)));
app.get("/", (_req, res) => {
    res.status(200).send({
        success: true,
        message: "welcome to the beginning of greatness",
    });
});
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: Object.assign({}, corsConfig),
});
const delCollection = ({ collection, mongoose }) => {
    mongoose.connection.db
        .collection(collection)
        .deleteMany({})
        .then(() => {
        console.log({ collection }, " deleted...");
    })
        .catch((err) => console.log({ collection }, " deletion failed: \n", { err }));
};
let store;
const clients = new Map();
const numbers = new Map();
const MONGODB_URI = "mongodb+srv://yotamos:linux6926@cluster0.zj6wiy3.mongodb.net/mtxlog?retryWrites=true&w=majority";
mongoose_1.default
    .connect(MONGODB_URI)
    .then(() => {
    store = new wwebjs_mongo_1.MongoStore({ mongoose: mongoose_1.default });
    io.on("connection", (socket) => {
        console.log("We are live and connected");
        console.log(socket.id);
        socket.on("identify", (data) => __awaiter(void 0, void 0, void 0, function* () {
            const { number } = data;
            console.log({ number });
            let client;
            if (numbers.has(number)) {
                client = numbers.get(number);
            }
            else {
                client = new whatsapp_web_js_1.Client({
                    authStrategy: new whatsapp_web_js_1.RemoteAuth({
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
                io.to(socket.id).emit("qr", qr);
            });
            client.on("ready", () => {
                console.log("client ready");
                io.to(socket.id).emit("ready", true);
            });
            socket.on("send_messages", (data) => __awaiter(void 0, void 0, void 0, function* () {
                const { numbers: messageNumbers, messages } = data;
                new messageSender_1.MessageSender(client).sendMessages({ messages, numbers: messageNumbers });
            }));
        }));
        socket.on("del_all", () => delCollection({ collection: "sessions", mongoose: mongoose_1.default }));
        socket.on("disconnect", () => {
            clients.delete(socket.id);
        });
    });
})
    .catch((err) => console.log("mongo init error", { err }));
httpServer.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}`);
});
//# sourceMappingURL=app.js.map