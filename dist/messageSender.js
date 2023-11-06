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
exports.MessageSender = void 0;
const format_num = (num) => `${num}@c.us`;
class MessageSender {
    constructor(client) {
        this.client = client;
    }
    sendMessages({ numbers, messages }) {
        return __awaiter(this, void 0, void 0, function* () {
            const messagesRecords = [];
            const messagesRequests = [];
            for (let i = 0; i <= numbers.length - 1; i++) {
                let number = format_num(numbers[i]);
                messagesRequests.push(this.client
                    .sendMessage(number, messages[i])
                    .then(() => messagesRecords.push({ msg: messages[i], number: numbers[i], row: i, status: "ok", data: null }))
                    .catch((error) => this.client.isRegisteredUser(number).then((reg) => {
                    messagesRecords.push({
                        msg: messages[i],
                        number: numbers[i],
                        row: i,
                        status: reg ? "catch error" : "registretion error",
                        data: reg ? null : error,
                    });
                })));
            }
            const results = yield Promise.allSettled(messagesRequests);
            return results;
        });
    }
    sendToMennagers(messages, mennagers) {
        mennagers.forEach((mennager, i) => this.client.sendMessage(format_num(mennager.number), messages[i]));
    }
    state() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.client.getState();
        });
    }
}
exports.MessageSender = MessageSender;
//# sourceMappingURL=messageSender.js.map