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
exports.processesCache = new Map();
exports.requestsCache = new Map();
const getInitData = (rm) => __awaiter(void 0, void 0, void 0, function* () {
    if (rm.type !== "send")
        return;
    exports.requestsCache.set(rm.actionId, {
        premissions: rm.premissions,
        strat: (0, helper_1.normelizeNumbers)(rm.strat),
        firstList: rm.firstList.map(({ message }) => message),
        secondList: rm.secondList.map(({ message }) => message),
    });
});
function handleSendMessages(owner, rm) {
    return __awaiter(this, void 0, void 0, function* () {
        (0, helper_1.incrementProcess)(owner, "req");
        if (rm.type !== "send")
            return;
        console.log("request of sending type:..", { shema: rm.schema });
        yield getInitData(rm);
        const rc = exports.requestsCache.get(rm.actionId);
        console.log("handle send messages...", { rc });
        if (!rc)
            return console.log("no strat on id: ", { owner, rc });
        const { firstList: messages, strat, premissions } = rc;
        if ((0, helper_1.processesOverLoad)(owner, premissions))
            return;
        if (rm.schema === "from_ui")
            return sendLeadsMessages({
                leads: rm.leads,
                owner,
                actionId: rm.actionId,
                messages,
            });
        else if (rm.schema === "listener") {
            setInterval(() => __awaiter(this, void 0, void 0, function* () {
                const leads = yield (0, helper_1.getNewLeads)(strat.web_hook);
                if (leads) {
                    sendLeadsMessages({
                        leads,
                        owner,
                        actionId: rm.actionId,
                        messages,
                    });
                }
            }), 12000);
        }
    });
}
let blockedNumbers = ["393889212914@c.us", "393338594778@c.us", "393335438809@c.us", "393278696422@c.us"];
let actionCounter = 0;
const sendLeadsMessages = (_a) => __awaiter(void 0, [_a], void 0, function* ({ leads, actionId, owner, messages, }) {
    var _b, _c;
    const client = (_b = app_1.sockets.get(owner)) === null || _b === void 0 ? void 0 : _b.client;
    const data = exports.requestsCache.get(actionId);
    if (!data || !client)
        return;
    const { premissions, strat, secondList } = data;
    listenToLeadResponse(owner, actionId, client, strat, secondList);
    for (let i = 0; i < leads.length; i++) {
        console.log(`sending ${i} name:${(_c = leads[i]) === null || _c === void 0 ? void 0 : _c.name} phone:${leads[i].phone} `);
        let lead = leads[i];
        let delayTime = Math.floor(Math.random() * strat.min_delay_first + strat.min_delay_first);
        let number = (0, helper_1.formatPhone)(lead.phone);
        console.log({ delayTime, formatedNumber: number });
        yield (0, helper_1.delay)(delayTime);
        if ((0, helper_1.sendedOverLoad)(owner, premissions)) {
            return;
        }
        console.log({ lead, number });
        try {
            if (app_1.sended.map((s) => s.number).indexOf(number) !== -1)
                return (0, logger_1.logAction)({
                    type: "sended_already_block",
                    lead,
                    owner,
                    actionId,
                    msg: "recived first message allreedy !!",
                });
            app_1.sended.push({ number, name: lead.name, stage: "first_sended" });
            console.log(number);
            let selFirstMessage = (0, helper_1.messageParser)(strat, messages, lead.name);
            console.log({ selFirstMessage });
            if (!number || !selFirstMessage) {
                console.log("error: ", { number, selFirstMessage });
            }
            client
                .sendMessage(number, selFirstMessage)
                .then(() => {
                (0, logger_1.logAction)({
                    type: "first_msg_ok",
                    lead,
                    owner,
                    actionId,
                    msg: selFirstMessage.slice(0, 12),
                });
            })
                .catch((err) => (0, logger_1.logAction)({
                type: "first_msg_error",
                lead,
                owner,
                actionId,
                msg: JSON.stringify(err).slice(0, 32),
            }));
        }
        catch (err) {
            console.log("error:", { err });
            (0, logger_1.logAction)({
                type: "regi_error",
                lead,
                owner,
                actionId,
                msg: JSON.stringify(err).slice(0, 32),
            });
        }
        (0, helper_1.decrementProcess)(owner, "req");
    }
});
const listenToLeadResponse = (owner, actionId, client, strat, list) => {
    client.on("message", (message) => __awaiter(void 0, void 0, void 0, function* () {
        const number = message.id.remote;
        const lead = app_1.sended.filter((uf) => uf.number === number)[0];
        (0, logger_1.logAction)({
            type: "replaying_message",
            lead: { name: lead.name, phone: number },
            actionId,
            owner,
        });
        if (lead && blockedNumbers.indexOf(number) === -1) {
            actionCounter++;
            blockedNumbers.push(number);
            yield (0, helper_1.delay)(Math.floor(Math.random() * strat.max_delay_second + strat.min_delay_second));
            if (Math.random() > 0.5) {
                client.sendMessage(number, (0, helper_1.messageParser)(strat, list, lead.name));
            }
            else {
                message.reply((0, helper_1.messageParser)(strat, list, lead.name));
            }
        }
    }));
};
//# sourceMappingURL=handlers.js.map