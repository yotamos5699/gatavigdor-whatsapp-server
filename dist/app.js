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
let clients = new Map();
const setClient = (id, socket) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log("client number", { id });
    if (!id)
        return console.log("no client id in args:", { id });
    let client = (_a = clients === null || clients === void 0 ? void 0 : clients.get(id)) === null || _a === void 0 ? void 0 : _a.client;
    if (!client) {
        console.log("setting new cllient");
        client = new whatsapp_web_js_1.Client({
            puppeteer: { headless: true },
            authStrategy: new whatsapp_web_js_1.LocalAuth({ clientId: id }),
        });
    }
    else {
        console.log("client exists", clients);
        const connected = yield client.getState();
        console.log({ connected });
        if (connected === "CONNECTED") {
            io.to(socket.id).emit("ready", true);
            return;
        }
        else
            client.resetState();
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
        })
            .catch((err) => console.log("initialized error", { err }));
        clients.set(id, { client: client, socket: socket });
    }
    catch (e) {
        console.log("in set config");
        return;
    }
});
io.on("connection", (socket) => {
    var _a;
    const number = (_a = socket.handshake.query.number) === null || _a === void 0 ? void 0 : _a.toString();
    socket.on("disconnect", () => {
        console.log("disconnected:", { number });
        socket.disconnect();
    });
    socket.on("remove_connection", (number) => {
        console.log("removing number from list: ", { number }, clients.entries);
        clients.delete(number);
    });
    if (!number)
        return;
    setClient(number, socket);
    console.log("total connections:", io.engine.clientsCount, "\n", "total clients:", clients.keys.length);
    socket.on("send_messages", (data) => {
        var _a;
        const { numbers: messageNumbers, messages } = data;
        const msgsClient = (_a = clients.get(number !== null && number !== void 0 ? number : "")) === null || _a === void 0 ? void 0 : _a.client;
        if (!msgsClient)
            return console.log("no sending messages client found!!");
        new messageSender_1.MessageSender(msgsClient).sendMessages({ messages, numbers: messageNumbers });
    });
});
httpServer.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}`);
});
io.use((socket, next) => {
    console.log(`New connection from ${socket.id}`);
    next();
});
//# sourceMappingURL=app.js.map