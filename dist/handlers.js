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
exports.requestsCache = exports.processesCache = void 0;
exports.handleSendMessages = handleSendMessages;
const helper_1 = require("./helper");
const app_1 = require("./app");
const logger_1 = require("./logger");
const URL_LISTS = "https://script.google.com/macros/s/AKfycbx-6JLVMVuWote6N0vtiCLl_zgtbdDGfP6W--KoLcT8X5w6dr69-5BUEAQUaMcl1qUo/exec?type=lists";
exports.processesCache = new Map();
exports.requestsCache = new Map();
const getInitData = (rm) => __awaiter(void 0, void 0, void 0, function* () {
    if (rm.type !== "send")
        return;
    return fetch(URL_LISTS)
        .then((res) => res.json())
        .then((data) => data.data)
        .then((data) => {
        console.log({ data });
        console.log({ strat: data.strat });
        exports.requestsCache.set(rm.actionId, {
            premissions: rm.premissions,
            strat: (0, helper_1.normelizeNumbers)(rm.strat),
            firstList: rm.firstList.map(({ message }) => message),
            secondList: rm.secondList.map(({ message }) => message),
        });
    });
});
function handleSendMessages(owner, rm) {
    return __awaiter(this, void 0, void 0, function* () {
        const rc = exports.requestsCache.get(owner);
        if (!rc)
            return console.log("no start on id: ", { owner });
        const { firstList: messages, strat, premissions } = rc;
        if (rm.type !== "send")
            return;
        yield getInitData(rm);
        if (rm.schema === "from_ui")
            return sendLeadsMessages({
                leads: rm.leads,
                owner,
                messages,
            });
        setInterval(() => __awaiter(this, void 0, void 0, function* () {
            if ((0, helper_1.processesOverLoad)(owner, premissions))
                return console.log("sending in progress..");
            const leads = yield (0, helper_1.getNewLeads)(strat.web_hook);
            if (leads) {
                (0, helper_1.incrementProcess)(owner);
                sendLeadsMessages({
                    leads,
                    owner,
                    messages,
                });
            }
        }), 12000);
    });
}
const sendLeadsMessages = (_a) => __awaiter(void 0, [_a], void 0, function* ({ leads, owner, messages }) {
    var _b, _c;
    const client = (_b = app_1.sockets.get(owner)) === null || _b === void 0 ? void 0 : _b.client;
    const strat = (_c = exports.requestsCache.get(owner)) === null || _c === void 0 ? void 0 : _c.strat;
    if (!strat || !client)
        return;
    for (let i = 0; i < leads.length; i++) {
        let lead = leads[i];
        yield (0, helper_1.delay)(Math.floor(Math.random() * strat.min_delay_first + strat.min_delay_first));
        let number = (0, helper_1.formatPhone)(lead.phone);
        client
            .isRegisteredUser(number)
            .then((isRegistered) => {
            if (!isRegistered) {
                (0, logger_1.logAction)({
                    type: "not_registered",
                    lead,
                    owner,
                });
            }
            else {
                if (app_1.sended.map((s) => s.number).indexOf(number) !== -1) {
                    console.log("recived first message allreedy !!", { number });
                    return;
                }
                app_1.sended.push({ number, name: lead.name, stage: "first_sended" });
                console.log(number);
                let selFirstMessage = (0, helper_1.messageParser)(strat, messages, lead.name);
                client
                    .sendMessage(number, selFirstMessage)
                    .then(() => {
                    (0, logger_1.logAction)({
                        type: "first_msg_ok",
                        lead,
                        owner,
                        msg: selFirstMessage.slice(0, 12),
                    });
                })
                    .catch((err) => (0, logger_1.logAction)({
                    type: "first_msg_error",
                    lead,
                    owner,
                    msg: JSON.stringify(err).slice(0, 32),
                }));
            }
        })
            .catch((err) => {
            (0, logger_1.logAction)({
                type: "regi_error",
                lead,
                owner,
                msg: JSON.stringify(err).slice(0, 32),
            });
        });
    }
    (0, helper_1.decrementProcess)(owner);
});
//# sourceMappingURL=handlers.js.map