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
exports.messageParser = exports.getRandomStrFromList = exports.getRandomMsgqFromList = exports.editMessageVarient = exports.randomizeMessageRowGaps = exports.normelizeNumbers = exports.delay = exports.formatPhone = exports.getNewLeads = exports.sendedOverLoad = exports.processesOverLoad = exports.decrementProcess = exports.incrementProcess = void 0;
const handlers_1 = require("./handlers");
const hash = [",", "!", "?", "=", "@", "#", "$", "/", ".", "+", "*", "&", "(", ")", "<", ">", "-", "_", "%", "`", "[", "]", "^"];
const incrementProcess = (owner, type) => {
    const pc = handlers_1.processesCache.get(owner);
    if (!pc)
        return handlers_1.processesCache.set(owner, { requests: 0, sended: 0 });
    if (type === "msg")
        return handlers_1.processesCache.set(owner, Object.assign(Object.assign({}, pc), { sended: pc.sended + 1 }));
    else if (type === "req")
        return handlers_1.processesCache.set(owner, Object.assign(Object.assign({}, pc), { requests: pc.requests + 1 }));
    return;
};
exports.incrementProcess = incrementProcess;
const decrementProcess = (owner, type) => {
    const pc = handlers_1.processesCache.get(owner);
    if (!pc)
        return;
    if (type === "msg")
        return handlers_1.processesCache.set(owner, Object.assign(Object.assign({}, pc), { sended: pc.sended - 1 }));
    else if (type === "req")
        return handlers_1.processesCache.set(owner, Object.assign(Object.assign({}, pc), { requests: pc.requests - 1 }));
    return;
};
exports.decrementProcess = decrementProcess;
const processesOverLoad = (owner, prems) => {
    const pc = handlers_1.processesCache.get(owner);
    if (pc && pc.requests >= prems.max_requests) {
        console.log("to much requests open .", { owner, prems });
        return true;
    }
    return false;
};
exports.processesOverLoad = processesOverLoad;
const sendedOverLoad = (owner, prems) => {
    const pc = handlers_1.processesCache.get(owner);
    if (pc && pc.sended >= prems.hard_cap) {
        console.error("exided max nuber of messages allowed: ..", { owner, prems });
        return true;
    }
    return false;
};
exports.sendedOverLoad = sendedOverLoad;
const getNewLeads = (url) => __awaiter(void 0, void 0, void 0, function* () {
    return fetch(`${url}?type=get_rows`)
        .then((res) => res.json())
        .then((data) => {
        if (data.status === 2)
            return data.data;
        console.log(data.data);
        return null;
    });
});
exports.getNewLeads = getNewLeads;
const createVarient = (msg) => {
    let newMessage = "";
    for (let i = 0; i < msg.length; i++) {
        if (hash.includes(msg[i])) {
            newMessage += Math.random() > 0.5 ? msg[i] : "";
        }
        else {
            newMessage += msg[i];
        }
    }
    return newMessage;
};
const mult = 1000;
const stateCode = "";
const formatPhone = (num) => `${stateCode}${num}@c.us`;
exports.formatPhone = formatPhone;
const delay = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};
exports.delay = delay;
const normelizeNumbers = (st) => (Object.assign(Object.assign({}, st), { max_delay_first: st.max_delay_first * mult, min_delay_first: st.min_delay_first * mult, max_delay_second: st.max_delay_second * mult, min_delay_second: st.min_delay_second * mult }));
exports.normelizeNumbers = normelizeNumbers;
const randomizeMessageRowGaps = (message) => {
    let msg = ``;
    const rows = message.split("\n");
    rows.forEach((row) => {
        if (row) {
            msg += row;
        }
        else if (Math.random() > 0.5)
            msg += row;
    });
    return msg;
};
exports.randomizeMessageRowGaps = randomizeMessageRowGaps;
const editMessageVarient = (msg, name, varchars) => {
    let newMsg = msg;
    if (name)
        newMsg = msg.replace("NAME", name);
    if (varchars)
        newMsg = createVarient(newMsg);
    return newMsg;
};
exports.editMessageVarient = editMessageVarient;
const getRandomMsgqFromList = (list) => list[Math.floor(Math.random() * list.length)].message;
exports.getRandomMsgqFromList = getRandomMsgqFromList;
const getRandomStrFromList = (list) => list[Math.floor(Math.random() * list.length)];
exports.getRandomStrFromList = getRandomStrFromList;
const messageParser = (strat, messages, name = null, pos) => {
    console.log("message pos: ", pos);
    let newMsg = strat.randomize_messages ? (0, exports.getRandomStrFromList)(messages) : messages[0];
    if (strat.randimize_characters)
        newMsg = (0, exports.editMessageVarient)(newMsg, name, true);
    if (strat.randomize_empty_rows)
        newMsg = (0, exports.randomizeMessageRowGaps)(newMsg);
    return newMsg;
};
exports.messageParser = messageParser;
//# sourceMappingURL=helper.js.map