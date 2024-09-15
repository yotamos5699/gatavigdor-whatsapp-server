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
import { Lead, Premmision_, SendingStrategy, SocketMessage } from "./types";
import { sockets } from "./app";
import { logAction } from "./logger";
import { Client } from "whatsapp-web.js";
import { getSendedByActionId, updateJsonFile } from "./db/filesHandler";

// const URL_LISTS =
//   "https://script.google.com/macros/s/AKfycbx-6JLVMVuWote6N0vtiCLl_zgtbdDGfP6W--KoLcT8X5w6dr69-5BUEAQUaMcl1qUo/exec?type=lists";

export let processesCache = new Map<string, { requests: number; sended: number }>();
export let requestsCache = new Map<
  string,
  { strat: SendingStrategy; firstList: string[]; secondList: string[]; premissions: Premmision_ }
>();

const getInitData = async (rm: SocketMessage) => {
  if (rm.type !== "send") return;

  requestsCache.set(rm.actionId, {
    premissions: rm.premissions,
    strat: normelizeNumbers(rm.strat),
    firstList: rm.firstList.map(({ message }) => message),
    secondList: rm.secondList.map(({ message }) => message),
  });
};

export async function handleSendMessages(owner: string, rm: SocketMessage) {
  incrementProcess(owner, "req");
  if (rm.type !== "send") return;
  console.log("request of sending type:..", { shema: rm.schema });

  await getInitData(rm);

  const rc = requestsCache.get(rm.actionId);
  console.log("handle send messages...", { rc });
  if (!rc) return console.log("no strat on id: ", { owner, rc });
  const { firstList: messages, strat, premissions } = rc;
  if (processesOverLoad(owner, premissions)) return;

  if (rm.schema === "from_ui")
    return sendLeadsMessages({
      leads: rm.leads,
      owner,
      actionId: rm.actionId,
      messages,
    });
  else if (rm.schema === "listener") {
    setInterval(async () => {
      const leads = await getNewLeads(strat.web_hook);
      if (leads) {
        sendLeadsMessages({
          leads,
          owner,

          actionId: rm.actionId,
          messages,
        });
      }
    }, 12000);
  }
}

let blockedNumbers: string[] = ["393889212914@c.us", "393338594778@c.us", "393335438809@c.us", "393278696422@c.us"];
let actionCounter = 0;

const sendLeadsMessages = async ({
  leads,
  actionId,
  owner,
  messages,
}: {
  leads: Lead[];
  actionId: string;
  owner: string;
  messages: string[];
}) => {
  const client = sockets.get(owner)?.client;
  const rc = requestsCache.get(actionId);
  // console.log("send leads messagse", { data, client });
  if (!rc || !client) return;
  const { premissions, strat, secondList } = rc;

  listenToLeadResponse(owner, actionId, client, strat, secondList);

  for (let i = 0; i < leads.length; i++) {
    console.log(`sending ${i} name:${leads[i]?.name} phone:${leads[i].phone} `);
    let lead = leads[i];
    let delayTime = Math.floor(Math.random() * strat.min_delay_first + strat.min_delay_first);
    let number = formatPhone(lead.phone);
    console.log({ delayTime, formatedNumber: number });
    await delay(delayTime);

    if (sendedOverLoad(owner, premissions)) {
      return;
    }

    console.log({ lead, number });
    const { data, error } = await getSendedByActionId(actionId);
    if (error) return console.log({ error });
    const sended = data.filter((sm) => sm.phone);

    try {
      if (sended.map((s) => s.phone).indexOf(number) !== -1)
        return logAction({
          type: "sended_already_block",
          lead,
          owner,
          actionId,
          msg: "recived first message allreedy !!",
        });

      // sended.push({ number, name: lead.name, stage: "first_sended" });
      // console.log(number);
      updateJsonFile([
        {
          id: crypto.randomUUID().slice(0, 12),
          date: new Date().toISOString(),
          phone: number,
          name: lead.name,
          owner,
          actionId,
          stage: "first_sended",
        },
      ]);
      let selFirstMessage = messageParser(strat, messages, lead.name);
      console.log({ selFirstMessage });
      if (!number || !selFirstMessage) {
        console.log("error: ", { number, selFirstMessage });
      }
      client
        .sendMessage(number, selFirstMessage)
        .then(() => {
          logAction({
            type: "first_msg_ok",
            lead,
            owner,
            actionId,
            msg: selFirstMessage.slice(0, 12),
          });
        })
        .catch((err) =>
          logAction({
            type: "first_msg_error",
            lead,
            owner,
            actionId,
            msg: JSON.stringify(err).slice(0, 32),
          })
        );
    } catch (err) {
      console.log("error:", { err });
      logAction({
        type: "regi_error",
        lead,
        owner,
        actionId,
        msg: JSON.stringify(err).slice(0, 32),
      });
    }

    decrementProcess(owner, "req");
  }
};
const listenToLeadResponse = (owner: string, actionId: string, client: Client, strat: SendingStrategy, list: string[]) => {
  client.on("message", async (message) => {
    // if (!rc) return console.log("no request cache", { rc });
    // const { strat, secondList } = rc;

    const number = message.id.remote;
    const { data, error } = await getSendedByActionId(actionId);
    if (error) return console.log({ error });
    const lead = data.filter((uf) => uf.phone === number)[0];

    logAction({
      type: "replaying_message",
      lead: { name: lead.name, phone: number },

      actionId,
      owner,
    });
    if (lead && blockedNumbers.indexOf(number) === -1) {
      actionCounter++;
      blockedNumbers.push(number);
      await delay(Math.floor(Math.random() * strat.max_delay_second + strat.min_delay_second));

      if (Math.random() > 0.5) {
        client.sendMessage(number, messageParser(strat, list, lead.name));
      } else {
        message.reply(messageParser(strat, list, lead.name));
      }
    }
  });
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
