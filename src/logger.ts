import { requestsCache } from "./handlers";
import { Lead, LogType } from "./types";

const log_fallback_url = "https://script.google.com/macros/s/AKfycbylQUU_1mh1ehP0fSRhmW364TQL5Q5eIX8aSnH3F5R-hls9hFWdVMF4sFls6zovfpFx/exec";

export const logAction = ({ type, lead, msg, owner }: { type: LogType; lead: Lead; msg?: string; owner: string }) => {
  const prem = requestsCache.get(owner)?.premissions;
  if (!prem?.log_url) {
    fetch(
      `${log_fallback_url}?type=log&row=${encodeURIComponent(
        JSON.stringify(loadLogData("no_loging_url", lead, owner, msg))
      )}&updates=${1}&owner=${owner}`
    );
    return;
  }

  fetch(`${prem?.log_url}?type=log&row=${encodeURIComponent(JSON.stringify(loadLogData(type, lead, owner, msg)))}&updates=${1}`);
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
