"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRandomStrFromList = exports.editMessageVarient = exports.normelizeNumbers = void 0;
const app_1 = require("./app");
const mult = 1000;
const normelizeNumbers = (st) => (Object.assign(Object.assign({}, st), { max_delay_first: st.max_delay_first * mult, min_delay_first: st.min_delay_first * mult, max_delay_second: st.max_delay_second * mult, min_delay_second: st.min_delay_second * mult }));
exports.normelizeNumbers = normelizeNumbers;
const editMessageVarient = (msg, name, varchars) => {
    let newMsg = msg;
    if (name)
        newMsg = msg.replace("NAME", name);
    if (varchars)
        newMsg = (0, app_1.createVarient)(newMsg);
    return newMsg;
};
exports.editMessageVarient = editMessageVarient;
const getRandomStrFromList = (list) => list[Math.floor(Math.random() * list.length)].message;
exports.getRandomStrFromList = getRandomStrFromList;
//# sourceMappingURL=helper.js.map