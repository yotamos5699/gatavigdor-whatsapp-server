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
const wwebjs_mongo_1 = require("wwebjs-mongo");
const mongoose_1 = __importDefault(require("mongoose"));
const client_1 = require("./client");
const messageSender_1 = require("./messageSender");
const mongoUri = "mongodb+srv://yotamos:linux6926@cluster0.zj6wiy3.mongodb.net/mtxlog?retryWrites=true&w=majority";
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
let store;
mongoose_1.default.connect(mongoUri).then((store = new wwebjs_mongo_1.MongoStore({ mongoose: mongoose_1.default })));
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
const setClient = (id) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("client number", { id });
    if (!id || !store)
        return console.log("no client id in args:", { id });
    console.log("clients:", clients.entries);
    let client = clients === null || clients === void 0 ? void 0 : clients.get(id);
    if (!client) {
        console.log("setting new cllient");
        client = new client_1.W_a_Client(store, id);
        client.listen(io);
        clients.set(id, client);
    }
    else
        client.stabelizeConnection(io);
    console.log("in set config");
});
const delete_connection = (number, socket) => {
    var _a;
    const client_ = clients.get(number);
    console.log({ number, client_ });
    if (number && client_) {
        (_a = clients.get(number)) === null || _a === void 0 ? void 0 : _a.destroy(clients, socket);
    }
    else
        socket.disconnect();
    console.log("clients list length:", clients.entries.length);
};
io.on("connection", (socket) => {
    var _a;
    const number = (_a = socket.handshake.query.number) === null || _a === void 0 ? void 0 : _a.toString();
    console.log("client connected:", { number });
    socket.on("disconnect", () => {
        console.log("disconnecting:", { number });
        socket.disconnect();
    });
    if (!number || !store)
        return console.log("no number provided");
    socket.join(number);
    socket.on("send_messages", (data) => __awaiter(void 0, void 0, void 0, function* () {
        var _b;
        if (number) {
            yield setClient(number);
            const client = (_b = clients.get(number)) === null || _b === void 0 ? void 0 : _b.client;
            if (!client)
                return;
            (0, messageSender_1.sendMessages)({ data, client }).then((res) => {
                console.log({ res });
                io.to(number).emit("messages_records", res);
            });
        }
    }));
    socket.on("remove_connection", (number) => { var _a; return (_a = clients.get(number)) === null || _a === void 0 ? void 0 : _a.destroy(clients, socket); });
    console.log({ store });
    socket.on("get_session", () => setClient(number));
    socket.on("delete_connection", (number) => {
        console.log("deleting connection..", { number });
        delete_connection(number, socket);
    });
    console.log("clients list length in io:", clients.entries.length);
});
httpServer.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}`);
});
//# sourceMappingURL=app.js.map