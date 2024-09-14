import { requestsCache } from "./handlers";
import { Lead, LogType } from "./types";
// https://script.google.com/macros/s/AKfycbx-6JLVMVuWote6N0vtiCLl_zgtbdDGfP6W--KoLcT8X5w6dr69-5BUEAQUaMcl1qUo/exec?type=log&row=%5B%22838a63d7-8%22%2C%222024-08-18T12%3A35%3A02.056Z%22%2C%22regi_error%22%2C%22undefined%40c.us%22%2C%22bar%22%2C%22%22%2C%22error%22%2C%221234s%22%5D&updates=1&owner=test2
const log_fallback_url = "https://script.google.com/macros/s/AKfycbylQUU_1mh1ehP0fSRhmW364TQL5Q5eIX8aSnH3F5R-hls9hFWdVMF4sFls6zovfpFx/exec";

export const logAction = ({
  type,
  lead,
  msg,
  owner,
  actionId,
}: {
  type: LogType;
  lead: Lead;
  owner: string;
  actionId: string;
  msg?: string;
}) => {
  const prem = requestsCache.get(actionId)?.premissions;
  console.log("IN LOGING:", { prem });
  const full_url = `${prem?.log_url ?? ""}`;
  `${prem?.log_url ?? log_fallback_url}?type=log&row=${JSON.stringify(
    loadLogData("no_loging_url", lead, owner, msg)
  )}&updates=${1}&owner=${owner}`;
  console.log(`sending log: ${type} url: ${full_url}`);
  if (!prem?.log_url) {
    fetch(`${full_url}?type=log&row=${JSON.stringify(loadLogData("no_loging_url", lead, owner, msg))}&updates=${1}&owner=${owner}`);
    return;
  }

  fetch(`${full_url}?type=log&row=${JSON.stringify(loadLogData(type, lead, owner, msg))}&updates=${1}&owner=${owner}`);
};

function loadLogData(type: LogType, lead: Lead, owner: string, msg?: string) {
  const date = new Date().toISOString();
  const id = crypto.randomUUID().slice(0, 10);
  let logData = { id, date, type, number: lead.phone, name: lead.name, message: type as string, status: "", owner };
  switch (type) {
    case "second_msg_ok":
    case "first_msg_ok": {
      logData = { ...logData, message: msg ? msg.slice(0, 16) : type, status: "ok" };
      break;
    }
    case "first_msg_error":
    case "second_msg_error": {
      logData = { ...logData, message: msg ? msg.slice(0, 16) : type, status: "error" };
      break;
    }
    case "not_registered": {
      logData = { ...logData, status: "error" };
      break;
    }
    case "regi_error": {
      logData = { ...logData, status: "error" };
      break;
    }
    case "response": {
      logData = { ...logData, status: "error" };
      break;
    }
    default: {
      logData = { ...logData, message: "no log case exists", status: "error" };
      break;
    }
  }
  const { number, message, status, name } = logData;
  return [id, date, type, number, name, message, status, owner];
}
