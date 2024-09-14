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
exports.sockets = exports.sended = void 0;
const whatsapp_web_js_1 = require("whatsapp-web.js");
const qrcode_terminal_1 = __importDefault(require("qrcode-terminal"));
const url_1 = require("url");
const ws_1 = require("ws");
const helper_1 = require("./helper");
const handlers_1 = require("./handlers");
const wss = new ws_1.WebSocketServer({ port: 8080 });
let blockedNumbers = ["393889212914@c.us", "393338594778@c.us", "393335438809@c.us", "393278696422@c.us"];
let actionCounter = 0;
exports.sended = [];
exports.sockets = new Map();
wss.on("connection", function connection(ws, req) {
    var _a;
    const url = (_a = req === null || req === void 0 ? void 0 : req.url) !== null && _a !== void 0 ? _a : "";
    const { query: { id }, } = (0, url_1.parse)(url, true);
    ws.on("open", () => console.log("client connected .. "));
    ws.on("error", console.error);
    ws.on("message", function message(data) {
        var _a;
        const msg = JSON.parse(data.toString());
        switch (msg.type) {
            case "init": {
                const client = handleClientConnection((_a = id) !== null && _a !== void 0 ? _a : "");
                id && exports.sockets.set(id, { ws, client });
                break;
            }
            case "action": {
                handleActions(id, msg.data);
                break;
            }
        }
        console.log("received: %s", data);
    });
    ws.send(JSON.stringify({ data: "something" }));
    ws.onclose = () => {
        exports.sockets.delete(id);
        console.log("WebSocket connection closed.");
    };
    ws.onerror = (event) => {
        console.error("WebSocket error:", event);
    };
});
function handleClientConnection(id) {
    const client = new whatsapp_web_js_1.Client({
        authStrategy: new whatsapp_web_js_1.LocalAuth({
            clientId: id,
        }),
    });
    client.on("ready", () => {
        var _a;
        (_a = exports.sockets.get(id)) === null || _a === void 0 ? void 0 : _a.ws.send(JSON.stringify({ type: "ready" }));
    });
    client.on("qr", (qr) => {
        var _a;
        if (((_a = exports.sockets.get(id)) === null || _a === void 0 ? void 0 : _a.ws.readyState) === ws_1.WebSocket.OPEN) {
            qrcode_terminal_1.default.generate(qr, { small: true }, () => {
                var _a;
                (_a = exports.sockets.get(id)) === null || _a === void 0 ? void 0 : _a.ws.send(JSON.stringify({ type: "qr", qr }));
            });
        }
    });
    client.on("message", (message) => __awaiter(this, void 0, void 0, function* () {
        const rc = handlers_1.requestsCache.get(id);
        if (!rc)
            return;
        const { strat, secondList } = rc;
        const number = message.id.remote;
        const lead = exports.sended.filter((uf) => uf.number === number)[0];
        if (lead && blockedNumbers.indexOf(number) === -1) {
            actionCounter++;
            blockedNumbers.push(number);
            yield (0, helper_1.delay)(Math.floor(Math.random() * strat.max_delay_second + strat.min_delay_second));
            if (Math.random() > 0.5) {
                client.sendMessage(number, (0, helper_1.messageParser)(strat, secondList, lead.name));
            }
            else {
                message.reply((0, helper_1.messageParser)(strat, secondList, lead.name));
            }
        }
    }));
    client.initialize();
    return client;
}
function handleActions(id, sm) {
    console.log("in handle actions...", { id, sm });
    switch (sm.type) {
        case "send": {
            console.log({ id, sm });
            break;
        }
    }
}
//# sourceMappingURL=app.js.map