"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleClientConnection = handleClientConnection;
const whatsapp_web_js_1 = require("whatsapp-web.js");
const app_1 = require("./app");
const qrcode_terminal_1 = __importDefault(require("qrcode-terminal"));
const ws_1 = require("ws");
function handleClientConnection(id, ws) {
    console.log("initializing wa client..", { id });
    const client = new whatsapp_web_js_1.Client({
        authStrategy: new whatsapp_web_js_1.LocalAuth({
            clientId: id,
        }),
    });
    client.on("ready", () => {
        var _a;
        console.log("wa client ready ..");
        (_a = app_1.sockets.get(id)) === null || _a === void 0 ? void 0 : _a.ws.send(JSON.stringify({ type: "ready" }));
    });
    client.on("qr", (qr) => {
        var _a;
        if (((_a = app_1.sockets.get(id)) === null || _a === void 0 ? void 0 : _a.ws.readyState) === ws_1.WebSocket.OPEN) {
            console.log("sending qr code...");
            qrcode_terminal_1.default.generate(qr, { small: true }, () => {
                var _a;
                (_a = app_1.sockets.get(id)) === null || _a === void 0 ? void 0 : _a.ws.send(JSON.stringify({ type: "qr", qr }));
            });
        }
    });
    client.initialize();
    app_1.sockets.set(id, { ws, client });
}
//# sourceMappingURL=client.js.map