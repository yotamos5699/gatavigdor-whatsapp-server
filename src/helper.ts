import { createVarient } from "./app";
import { MsgQ, SendingStrategy } from "./types";

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
export const editMessageVarient = (msg: string, name: string | null, varchars: boolean) => {
  let newMsg = msg;
  if (name) newMsg = msg.replace("NAME", name);
  if (varchars) newMsg = createVarient(newMsg);

  return newMsg;
};

export const getRandomMsgqFromList = (list: MsgQ[]) => list[Math.floor(Math.random() * list.length)].message;
export const getRandomStrFromList = (list: string[]) => list[Math.floor(Math.random() * list.length)];

export const messageParser = (strat: SendingStrategy, messages: string[], name: string | null = null, pos?: number) => {
  console.log("message pos: ", pos);
  let newMsg = strat.randomize_messages ? getRandomStrFromList(messages) : messages[0];
  if (strat.randimize_characters) newMsg = editMessageVarient(newMsg, name, true);
  if (strat.randomize_empty_rows) newMsg = randomizeMessageRowGaps(newMsg);

  return newMsg;
};
