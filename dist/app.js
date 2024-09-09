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
exports.createVarient = exports.hash = void 0;
const whatsapp_web_js_1 = require("whatsapp-web.js");
const qrcode_terminal_1 = __importDefault(require("qrcode-terminal"));
const url_1 = require("url");
const ws_1 = require("ws");
const helper_1 = require("./helper");
const wss = new ws_1.WebSocketServer({ port: 8080 });
const baseUrl = "https://script.google.com/macros/s/AKfycbylQUU_1mh1ehP0fSRhmW364TQL5Q5eIX8aSnH3F5R-hls9hFWdVMF4sFls6zovfpFx/exec?";
let actionCounter = 0;
const logAction = ({ type, number, name, message, status, updates, }) => {
    const date = new Date().toISOString();
    const id = crypto.randomUUID().slice(0, 10);
    actionCounter++;
    fetch(`${baseUrl}type=log&row=${encodeURIComponent(JSON.stringify([id, date, type, number, name, message, status]))}&updates=${updates}`);
};
const URL_LISTS = "https://script.google.com/macros/s/AKfycbx-6JLVMVuWote6N0vtiCLl_zgtbdDGfP6W--KoLcT8X5w6dr69-5BUEAQUaMcl1qUo/exec?type=lists";
let firstMsg = [];
let secondMessage = [];
let strat;
const getInitData = () => __awaiter(void 0, void 0, void 0, function* () {
    return fetch(URL_LISTS)
        .then((res) => res.json())
        .then((data) => data.data)
        .then((data) => {
        console.log({ data });
        console.log({ strat: data.strat });
        strat = (0, helper_1.normelizeNumbers)(data.strat);
        firstMsg = data.first.map((fm) => fm.message);
        secondMessage = data.second.map((sm) => sm.message);
    });
});
const getNewLeads = () => fetch(`${baseUrl}type=get_rows`)
    .then((res) => res.json())
    .then((data) => {
    if (data.status === 2)
        return data.data;
    console.log(data.data);
    return null;
});
let inProgress = false;
const delay = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};
const stateCode = "";
const formatPhone = (num) => `${stateCode}${num}@c.us`;
exports.hash = [",", "!", "?", "=", "@", "#", "$", "/", ".", "+", "*", "&", "(", ")", "<", ">", "-", "_", "%", "`", "[", "]", "^"];
const createVarient = (msg) => {
    let newMessage = "";
    for (let i = 0; i < msg.length; i++) {
        if (exports.hash.includes(msg[i])) {
            newMessage += Math.random() > 0.5 ? msg[i] : "";
        }
        else {
            newMessage += msg[i];
        }
    }
    return newMessage;
};
exports.createVarient = createVarient;
let sended = [];
const sockets = new Map();
wss.on("connection", function connection(ws, req) {
    var _a;
    const url = (_a = req === null || req === void 0 ? void 0 : req.url) !== null && _a !== void 0 ? _a : "";
    const { query: { id }, } = (0, url_1.parse)(url, true);
    ws.on("open", () => {
        console.log("sss");
    });
    console.log({ id });
    ws.on("error", console.error);
    ws.on("message", function message(data) {
        var _a;
        const msg = JSON.parse(data.toString());
        if (msg.type === "init") {
            id && sockets.set(id, ws);
            handleClientConnection((_a = id) !== null && _a !== void 0 ? _a : "");
        }
        console.log("received: %s", data);
    });
    ws.send(JSON.stringify({ data: "something" }));
    ws.onclose = () => {
        sockets.delete(id);
        console.log("WebSocket connection closed.");
    };
    ws.onerror = (event) => {
        console.error("WebSocket error:", event);
    };
});
let blockedNumbers = ["393889212914@c.us", "393338594778@c.us", "393335438809@c.us", "393278696422@c.us"];
function handleClientConnection(id) {
    var _a;
    const client = new whatsapp_web_js_1.Client({
        authStrategy: new whatsapp_web_js_1.LocalAuth({
            clientId: id,
        }),
    });
    (_a = sockets.get(id)) === null || _a === void 0 ? void 0 : _a.send(JSON.stringify({ type: "test", data: "hi test" }));
    client.on("ready", () => {
        var _a;
        (_a = sockets.get(id)) === null || _a === void 0 ? void 0 : _a.send(JSON.stringify({ type: "ready" }));
        console.log("Client is ready!");
        getInitData().then(() => {
            setInterval(() => __awaiter(this, void 0, void 0, function* () {
                if (inProgress) {
                    console.log("sending in progress..");
                    return;
                }
                const newLeads = yield getNewLeads();
                if (newLeads) {
                    inProgress = true;
                    for (let i = 0; i < newLeads.length; i++) {
                        let lead = newLeads[i];
                        yield delay(Math.floor(Math.random() * strat.min_delay_first + strat.min_delay_first));
                        let number = formatPhone(lead.phone);
                        client
                            .isRegisteredUser(number)
                            .then((isRegistered) => {
                            if (!isRegistered) {
                                logAction({ type: "not_registered", message: "client not reg", name: lead.name, number, updates: 1, status: "error" });
                            }
                            else {
                                if (sended.map((s) => s.number).indexOf(number) !== -1) {
                                    console.log("recived first message allreedy !!", { number });
                                    return;
                                }
                                sended.push({ number, name: lead.name, stage: "first_sended" });
                                console.log(number);
                                let selFirstMessage = firstMsg[Math.floor(Math.random() * firstMsg.length)];
                                client
                                    .sendMessage(number, (0, helper_1.editMessageVarient)(selFirstMessage, lead.name, true))
                                    .then(() => {
                                    logAction({
                                        type: "first_message",
                                        message: selFirstMessage.slice(0, 12),
                                        name: lead.name,
                                        number,
                                        updates: 1,
                                        status: "ok",
                                    });
                                })
                                    .catch((err) => logAction({
                                    type: "first_message",
                                    message: JSON.stringify(err).slice(0, 32),
                                    name: lead.name,
                                    number,
                                    updates: 1,
                                    status: "error",
                                }));
                            }
                        })
                            .catch((err) => {
                            logAction({
                                type: "regi_error",
                                message: JSON.stringify(err).slice(0, 32),
                                name: lead.name,
                                number,
                                updates: 1,
                                status: "error",
                            });
                        });
                    }
                    inProgress = false;
                }
            }), 12000);
        });
    });
    client.on("qr", (qr) => {
        var _a;
        if (((_a = sockets.get(id)) === null || _a === void 0 ? void 0 : _a.readyState) === ws_1.WebSocket.OPEN) {
            qrcode_terminal_1.default.generate(qr, { small: true }, (qc) => {
                var _a;
                console.log({ qr, qc });
                (_a = sockets.get(id)) === null || _a === void 0 ? void 0 : _a.send(JSON.stringify({ type: "qr", qr }));
            });
            console.log("socket ready qr listener");
        }
    });
    client.on("message", (message) => __awaiter(this, void 0, void 0, function* () {
        console.log("recived message: ", message.body);
        const number = message.id.remote;
        const lead = sended.filter((uf) => uf.number === number)[0];
        if (lead && blockedNumbers.indexOf(number) === -1) {
            actionCounter++;
            blockedNumbers.push(number);
            yield delay(Math.floor(Math.random() * strat.max_delay_second + strat.min_delay_second));
            let selSecondMessage = secondMessage[Math.floor(Math.random() * secondMessage.length)];
            if (Math.random() > 0.5) {
                client.sendMessage(number, (0, helper_1.editMessageVarient)(selSecondMessage, lead.name, true));
            }
            else {
                message.reply((0, helper_1.editMessageVarient)(selSecondMessage, lead.name, true));
            }
        }
        console.log({ blockedNumbers, sended });
    }));
    client.initialize();
}
//# sourceMappingURL=app.js.map