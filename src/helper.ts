import { processesCache } from "./handlers";
import { Lead, MsgQ, Premmision_, SendingStrategy } from "./types";

const hash = [",", "!", "?", "=", "@", "#", "$", "/", ".", "+", "*", "&", "(", ")", "<", ">", "-", "_", "%", "`", "[", "]", "^"];

export const incrementProcess = (owner: string, type: "msg" | "req") => {
  const pc = processesCache.get(owner);
  if (!pc) return processesCache.set(owner, { requests: 0, sended: 0 });
  if (type === "msg") return processesCache.set(owner, { ...pc, sended: pc.sended + 1 });
  else if (type === "req") return processesCache.set(owner, { ...pc, requests: pc.requests + 1 });
  return;
};
export const decrementProcess = (owner: string, type: "msg" | "req") => {
  const pc = processesCache.get(owner);
  if (!pc) return;
  if (type === "msg") return processesCache.set(owner, { ...pc, sended: pc.sended - 1 });
  else if (type === "req") return processesCache.set(owner, { ...pc, requests: pc.requests - 1 });
  return;
};
export const processesOverLoad = (owner: string, prems: Premmision_) => {
  const pc = processesCache.get(owner);
  if (pc && pc.requests >= prems.max_requests) {
    console.log("to much requests open .", { owner, prems });
    return true;
  }
  return false;
};

export const sendedOverLoad = (owner: string, prems: Premmision_) => {
  const pc = processesCache.get(owner);
  if (pc && pc.sended >= prems.hard_cap) {
    console.error("exided max nuber of messages allowed: ..", { owner, prems });

    return true;
  }
  return false;
};

export const getNewLeads = async (url: string): Promise<Lead[] | null> =>
  fetch(`${url}?type=get_rows`)
    .then((res) => res.json())
    .then((data: { status: 1; data: string } | { status: 2; data: { name: string; phone: string }[] }) => {
      if (data.status === 2) return data.data;
      console.log(data.data);
      return null;
    });

const createVarient = (msg: string) => {
  let newMessage = "";

  for (let i = 0; i < msg.length; i++) {
    if (hash.includes(msg[i])) {
      newMessage += Math.random() > 0.5 ? msg[i] : "";
    } else {
      newMessage += msg[i];
    }
  }
  return newMessage;
};

const mult = 1000;
const stateCode = "";
export const formatPhone = (num: string) => `${stateCode}${num}@c.us`;
export const delay = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
export const normelizeNumbers = (st: SendingStrategy): SendingStrategy => ({
  ...st,
  max_delay_first: st.max_delay_first * mult,
  min_delay_first: st.min_delay_first * mult,
  max_delay_second: st.max_delay_second * mult,
  min_delay_second: st.min_delay_second * mult,
});

export const randomizeMessageRowGaps = (message: string) => {
  let msg = ``;
  const rows = message.split("\n");
  rows.forEach((row) => {
    if (row) {
      msg += row;
    } else if (Math.random() > 0.5) msg += row;
  });
  return msg;
};
export const editMessageVarient = (msg: string, name: string | null, varchars: boolean, embedded_name: boolean) => {
  let newMsg = msg;
  if (name && embedded_name) newMsg = msg.replace("NAME", name);
  if (varchars) newMsg = createVarient(newMsg);

  return newMsg;
};

export const getRandomMsgqFromList = (list: MsgQ[]) => list[Math.floor(Math.random() * list.length)].message;
export const getRandomStrFromList = (list: string[]) => list[Math.floor(Math.random() * list.length)];

export const messageParser = (strat: SendingStrategy, messages: string[], name: string | null = null, pos?: number) => {
  console.log("message pos: ", pos);
  let newMsg = strat.randomize_messages ? getRandomStrFromList(messages) : messages[0];
  if (strat.randimize_characters) newMsg = editMessageVarient(newMsg, name, true, strat.embedded_name);
  if (strat.randomize_empty_rows) newMsg = randomizeMessageRowGaps(newMsg);

  return newMsg;
};
