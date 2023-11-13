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
exports.sendToMennagers = exports.sendMessages = exports.openMessagesEvent = exports.format_num = void 0;
const format_num = (num) => `${num}@c.us`;
exports.format_num = format_num;
const openMessagesEvent = (waClient, io) => {
    console.log("openning MessagesEvents for number:", waClient.id);
    io.on("send_messages", (data) => {
        console.log("send messages");
        sendMessages({ data, client: waClient.client });
    });
};
exports.openMessagesEvent = openMessagesEvent;
function sendMessages({ data, client }) {
    return __awaiter(this, void 0, void 0, function* () {
        const { messages, numbers } = data;
        console.log({ data });
        const messagesRecords = [];
        const messagesRequests = [];
        for (let i = 0; i <= numbers.length - 1; i++) {
            let number = (0, exports.format_num)(numbers[i]);
            messagesRequests.push(client
                .sendMessage(number, messages[i])
                .then(() => messagesRecords.push({ msg: messages[i], number: numbers[i], row: i, status: "ok", data: null }))
                .catch((error) => client.isRegisteredUser(number).then((reg) => {
                messagesRecords.push({
                    msg: messages[i],
                    number: numbers[i],
                    row: i,
                    status: reg ? "catch error" : "registretion error",
                    data: reg ? null : error,
                });
            })));
        }
        yield Promise.allSettled(messagesRequests);
        return messagesRecords;
    });
}
exports.sendMessages = sendMessages;
function sendToMennagers(messages, mennagers, client) {
    mennagers.forEach((mennager, i) => client.sendMessage((0, exports.format_num)(mennager.number), messages[i]));
}
exports.sendToMennagers = sendToMennagers;
//# sourceMappingURL=messageSender.js.map