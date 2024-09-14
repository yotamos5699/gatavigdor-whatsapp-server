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
exports.sockets = exports.sended = void 0;
const url_1 = require("url");
const ws_1 = require("ws");
const client_1 = require("./client");
const handlers_1 = require("./handlers");
const wss = new ws_1.WebSocketServer({ port: 8080 });
const isNotInitialized = (id) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const s = exports.sockets === null || exports.sockets === void 0 ? void 0 : exports.sockets.get(id);
    console.log({ s });
    if (!s)
        return true;
    try {
        const state = yield ((_a = s === null || s === void 0 ? void 0 : s.client) === null || _a === void 0 ? void 0 : _a.getState());
        console.log("prev connection state: ", { state });
        if (state !== "CONNECTED" && state !== "OPENING")
            return true;
        return false;
    }
    catch (_b) {
        console.log("error retriving state");
        return true;
    }
});
const updateClientReady = (id) => {
    const s = exports.sockets.get(id);
    if (!s)
        return;
    s.ws.send(JSON.stringify({ type: "ready" }));
};
exports.sended = [];
exports.sockets = new Map();
wss.on("connection", function connection(ws, req) {
    var _a;
    console.log("client connected .. ");
    const url = (_a = req === null || req === void 0 ? void 0 : req.url) !== null && _a !== void 0 ? _a : "";
    const { query: { id }, } = (0, url_1.parse)(url, true);
    ws.on("error", console.error);
    ws.on("message", function message(data) {
        const msg = JSON.parse(data.toString());
        switch (msg.type) {
            case "init": {
                isNotInitialized(id).then((needInit) => {
                    var _a;
                    if (needInit)
                        return (0, client_1.handleClientConnection)((_a = id) !== null && _a !== void 0 ? _a : "", ws);
                    updateClientReady(id);
                });
                break;
            }
            case "action": {
                handleActions(id, msg.data);
                break;
            }
        }
        console.log("received: ");
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
function handleActions(owner, sm) {
    try {
        console.log("in handle actions...");
        switch (sm.type) {
            case "send": {
                console.log({ owner, sm });
                (0, handlers_1.handleSendMessages)(owner, sm);
                break;
            }
        }
    }
    catch (handleActions_ERROR) {
        console.log({ handleActions_ERROR });
    }
}
//# sourceMappingURL=app.js.map