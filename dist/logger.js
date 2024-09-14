"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAction = void 0;
const handlers_1 = require("./handlers");
const log_fallback_url = "https://script.google.com/macros/s/AKfycbylQUU_1mh1ehP0fSRhmW364TQL5Q5eIX8aSnH3F5R-hls9hFWdVMF4sFls6zovfpFx/exec";
const logAction = ({ type, lead, msg, owner, actionId, }) => {
    var _a, _b, _c;
    const prem = (_a = handlers_1.requestsCache.get(actionId)) === null || _a === void 0 ? void 0 : _a.premissions;
    console.log("IN LOGING:", { prem });
    const full_url = `${(_b = prem === null || prem === void 0 ? void 0 : prem.log_url) !== null && _b !== void 0 ? _b : ""}`;
    `${(_c = prem === null || prem === void 0 ? void 0 : prem.log_url) !== null && _c !== void 0 ? _c : log_fallback_url}?type=log&row=${JSON.stringify(loadLogData("no_loging_url", lead, owner, msg))}&updates=${1}&owner=${owner}`;
    console.log(`sending log: ${type} url: ${full_url}`);
    if (!(prem === null || prem === void 0 ? void 0 : prem.log_url)) {
        fetch(`${full_url}?type=log&row=${JSON.stringify(loadLogData("no_loging_url", lead, owner, msg))}&updates=${1}&owner=${owner}`);
        return;
    }
    fetch(`${full_url}?type=log&row=${JSON.stringify(loadLogData(type, lead, owner, msg))}&updates=${1}&owner=${owner}`);
};
exports.logAction = logAction;
function loadLogData(type, lead, owner, msg) {
    const date = new Date().toISOString();
    const id = crypto.randomUUID().slice(0, 10);
    let logData = { id, date, type, number: lead.phone, name: lead.name, message: type, status: "", owner };
    switch (type) {
        case "second_msg_ok":
        case "first_msg_ok": {
            logData = Object.assign(Object.assign({}, logData), { message: msg ? msg.slice(0, 16) : type, status: "ok" });
            break;
        }
        case "first_msg_error":
        case "second_msg_error": {
            logData = Object.assign(Object.assign({}, logData), { message: msg ? msg.slice(0, 16) : type, status: "error" });
            break;
        }
        case "not_registered": {
            logData = Object.assign(Object.assign({}, logData), { status: "error" });
            break;
        }
        case "regi_error": {
            logData = Object.assign(Object.assign({}, logData), { status: "error" });
            break;
        }
        case "response": {
            logData = Object.assign(Object.assign({}, logData), { status: "error" });
            break;
        }
        default: {
            logData = Object.assign(Object.assign({}, logData), { message: "no log case exists", status: "error" });
            break;
        }
    }
    const { number, message, status, name } = logData;
    return [id, date, type, number, name, message, status, owner];
}
//# sourceMappingURL=logger.js.map