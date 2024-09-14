import {
  normelizeNumbers,
  formatPhone,
  delay,
  messageParser,
  getNewLeads,
  incrementProcess,
  processesOverLoad,
  decrementProcess,
  sendedOverLoad,
} from "./helper";
import { InitData, Lead, Premmision_, SendingStrategy, SocketMessage } from "./types";
import { sended, sockets } from "./app";
import { logAction } from "./logger";

const URL_LISTS =
  "https://script.google.com/macros/s/AKfycbx-6JLVMVuWote6N0vtiCLl_zgtbdDGfP6W--KoLcT8X5w6dr69-5BUEAQUaMcl1qUo/exec?type=lists";

export let processesCache = new Map<string, { requests: number; sended: number }>();
export let requestsCache = new Map<
  string,
  { strat: SendingStrategy; firstList: string[]; secondList: string[]; premissions: Premmision_ }
>();

const getInitData = async (rm: SocketMessage) => {
  if (rm.type !== "send") return;
  return fetch(URL_LISTS)
    .then((res) => res.json())
    .then((data) => data.data as InitData)
    .then((data) => {
      console.log({ data });
      console.log({ strat: data.strat });
      requestsCache.set(rm.actionId, {
        premissions: rm.premissions,
        strat: normelizeNumbers(rm.strat),
        firstList: rm.firstList.map(({ message }) => message),
        secondList: rm.secondList.map(({ message }) => message),
      });
    });
};

export async function handleSendMessages(owner: string, rm: SocketMessage) {
  const rc = requestsCache.get(owner);
  if (!rc) return console.log("no start on id: ", { owner });

  const { firstList: messages, strat, premissions } = rc;
  if (processesOverLoad(owner, premissions)) return console.log("sending in progress..");

  if (rm.type !== "send") return;

  await getInitData(rm);

  if (rm.schema === "from_ui")
    return sendLeadsMessages({
      leads: rm.leads,
      owner,
      messages,
    });

  setInterval(async () => {
    const leads = await getNewLeads(strat.web_hook);
    if (leads) {
      incrementProcess(owner, "req");
      sendLeadsMessages({
        leads,
        owner,
        messages,
      });
    }
  }, 12000);
}

const sendLeadsMessages = async ({ leads, owner, messages }: { leads: Lead[]; owner: string; messages: string[] }) => {
  const client = sockets.get(owner)?.client;
  const data = requestsCache.get(owner);

  if (!data || !client) return;
  const { premissions, strat } = data;
  for (let i = 0; i < leads.length; i++) {
    let lead = leads[i];
    await delay(Math.floor(Math.random() * strat.min_delay_first + strat.min_delay_first));
    let number = formatPhone(lead.phone);

    if (sendedOverLoad(owner, premissions)) return;

    client
      .isRegisteredUser(number)
      .then((isRegistered) => {
        if (!isRegistered) {
          logAction({
            type: "not_registered",
            lead,
            owner,
          });
        } else {
          if (sended.map((s) => s.number).indexOf(number) !== -1) {
            console.log("recived first message allreedy !!", { number });
            return;
          }
          sended.push({ number, name: lead.name, stage: "first_sended" });
          console.log(number);
          let selFirstMessage = messageParser(strat, messages, lead.name);
          client
            .sendMessage(number, selFirstMessage)
            .then(() => {
              logAction({
                type: "first_msg_ok",
                lead,
                owner,
                msg: selFirstMessage.slice(0, 12),
              });
            })
            .catch((err) =>
              logAction({
                type: "first_msg_error",
                lead,
                owner,
                msg: JSON.stringify(err).slice(0, 32),
              })
            );
        }
      })
      .catch((err) => {
        logAction({
          type: "regi_error",
          lead,
          owner,
          msg: JSON.stringify(err).slice(0, 32),
        });
      })
      .finally(() => incrementProcess(owner, "msg"));
  }
  decrementProcess(owner, "req");
};

// function replacer(key: string, value: any) {
//   if (value instanceof Map) {
//     return { __type: "Map", value: Object.fromEntries(value) };
//   }
//   if (value instanceof Set) {
//     return { __type: "Set", value: Array.from(value) };
//   }
//   return value;
// }

// function reviver(key: string, value: any) {
//   if (value?.__type === "Set") {
//     return new Set(value.value);
//   }
//   if (value?.__type === "Map") {
//     return new Map(Object.entries(value.value));
//   }
//   return value;
// }
// export function jsonSaveParse<T>({
//   type,
//   data,
// }: { type: "stringify"; data: any } | { type: "parse"; data: string }):
//   | { error: null; data: T }
//   | { error: null; data: string }
//   | { error: string; data: null } {
//   let str = "";
//   let parsed: T;
//   try {
//     if (type === "stringify") {
//       str = JSON.stringify(data, replacer);
//       return { error: null, data: str };
//     } else if (type === "parse") {
//       parsed = JSON.parse(data, reviver);
//       return { data: parsed, error: null };
//     } else return { error: "safe json no action type", data: null };
//   } catch (error) {
//     return { data: null, error: `safe json ${type} error` };
//   }
// }
