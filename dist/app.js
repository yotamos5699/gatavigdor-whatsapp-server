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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const qrcode_terminal_1 = __importDefault(require("qrcode-terminal"));
const cors_1 = __importDefault(require("cors"));
const whatsapp_web_js_1 = require("whatsapp-web.js");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
const client = new whatsapp_web_js_1.Client({
    authStrategy: new whatsapp_web_js_1.LocalAuth(),
    puppeteer: {
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-extensions"],
    },
});
app.set("trust proxy", 1);
client.on("qr", (qr) => {
    qrcode_terminal_1.default.generate(qr, { small: true }, (qrcode) => {
        console.log(qrcode);
    });
});
client.on("ready", () => {
    console.log("Client is ready!");
});
app.get("/", (_req, res) => {
    res.send("Hello World!");
});
app.use((0, cors_1.default)({
    origin: "*",
}));
app.use(express_1.default.json());
app.listen(PORT, () => console.log(`server? listening on port` + PORT));
app.post("/api/sendMsgs", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    console.log("send sms api");
    let { numbers, msg } = yield req.body;
    let actionLog = [];
    let record;
    let isArrey = Array.isArray(msg);
    if (isArrey && msg.length != numbers.length)
        return res.send({ status: "no", data: "msg arrey != numbers arrey" });
    const x = client;
    if ((_c = x === null || x === void 0 ? void 0 : x.pupBrowser) === null || _c === void 0 ? void 0 : _c._connection) {
        for (let i = 0; i <= numbers.length - 1; i++) {
            let log = ``;
            let Message = `${isArrey ? msg[i] : msg}`;
            try {
                console.log("number: ", numbers[i], " message: ", msg[i]);
                yield client.isRegisteredUser(`${numbers[i]}@c.us`).then(function (isRegistered) {
                    if (isRegistered) {
                        console.log("is registerd !!");
                        client.sendMessage(`${numbers[i]}@c.us`, Message);
                        record = {
                            number: numbers[i],
                            status: "ok",
                            row: i,
                            msg: Message,
                        };
                    }
                    else {
                        console.log("is not registerd !!");
                        log = `***** ${numbers[i]} is not registerd ******`;
                        record = {
                            number: numbers[i],
                            status: "registretion error",
                            row: i,
                            msg: log,
                        };
                    }
                });
            }
            catch (err) {
                record = {
                    number: numbers[i],
                    status: "catch error",
                    row: i,
                    msg: err,
                };
            }
            actionLog.push(record);
        }
        return res.send(actionLog);
    }
    else {
        client
            .initialize()
            .then((res) => __awaiter(void 0, void 0, void 0, function* () {
            console.log({ res });
            console.log("client initialize ....\n to init in initializ");
            for (let i = 0; i <= numbers.length - 1; i++) {
                let log = ``;
                let Message = `${isArrey ? msg[i] : msg}`;
                try {
                    yield client.isRegisteredUser(`${numbers[i]}@c.us`).then(function (isRegistered) {
                        if (isRegistered) {
                            client.sendMessage(`${numbers[i]}@c.us`, Message);
                            record = {
                                number: numbers[i],
                                status: "ok",
                                row: i,
                                msg: Message,
                            };
                        }
                        else {
                            log = `***** ${numbers[i]} is not registerd ******`;
                            record = {
                                number: numbers[i],
                                status: "registretion error",
                                row: i,
                                msg: log,
                            };
                        }
                    });
                }
                catch (err) {
                    record = {
                        number: numbers[i],
                        status: "catch error",
                        row: i,
                        msg: err,
                    };
                }
                actionLog.push(record);
            }
        }))
            .then(() => {
            return res.send(actionLog);
        })
            .catch((e) => {
            return res.send(e);
        });
    }
    console.log(actionLog);
}));
const serviceName = "972545940054@c.us";
client.on("message", (message) => __awaiter(void 0, void 0, void 0, function* () {
    console.log({ message });
    const mm = ` :???????? ${message._data.notifyName} :??????  ${message.body} `;
    console.log({ mm });
    client.sendMessage(serviceName, mm);
}));
console.log((_a = client === null || client === void 0 ? void 0 : client.pupBrowser) === null || _a === void 0 ? void 0 : _a.isConnected);
if (!((_b = client === null || client === void 0 ? void 0 : client.pupBrowser) === null || _b === void 0 ? void 0 : _b.isConnected))
    client
        .initialize()
        .then(() => {
        console.log("client initialize ....\n to init in initializ");
    })
        .catch((err) => console.log(err));
module.exports = client;
//# sourceMappingURL=app.js.map