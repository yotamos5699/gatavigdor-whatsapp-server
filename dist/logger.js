"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAction = void 0;
const handlers_1 = require("./handlers");
const log_fallback_url = "https://script.google.com/macros/s/AKfycbylQUU_1mh1ehP0fSRhmW364TQL5Q5eIX8aSnH3F5R-hls9hFWdVMF4sFls6zovfpFx/exec";
const logAction = ({ type, lead, msg, owner }) => {
    var _a;
    console.log(`sending log: ${type}`);
    const prem = (_a = handlers_1.requestsCache.get(owner)) === null || _a === void 0 ? void 0 : _a.premissions;
    if (!(prem === null || prem === void 0 ? void 0 : prem.log_url)) {
        fetch(`${log_fallback_url}?type=log&row=${encodeURIComponent(JSON.stringify(loadLogData("no_loging_url", lead, owner, msg)))}&updates=${1}&owner=${owner}`);
        return;
    }
    fetch(`${prem === null || prem === void 0 ? void 0 : prem.log_url}?type=log&row=${encodeURIComponent(JSON.stringify(loadLogData(type, lead, owner, msg)))}&updates=${1}`);
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