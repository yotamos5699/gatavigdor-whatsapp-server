import { createVarient } from "./app";
import { MsgQ, SendingStrategy } from "./types";

const mult = 1000;

export const normelizeNumbers = (st: SendingStrategy): SendingStrategy => ({
  ...st,
  max_delay_first: st.max_delay_first * mult,
  min_delay_first: st.min_delay_first * mult,
  max_delay_second: st.max_delay_second * mult,
  min_delay_second: st.min_delay_second * mult,
});

export const editMessageVarient = (msg: string, name: string | null, varchars: boolean) => {
  let newMsg = msg;
  if (name) newMsg = msg.replace("NAME", name);
  if (varchars) newMsg = createVarient(newMsg);

  return newMsg;
};

export const getRandomStrFromList = (list: MsgQ[]) => list[Math.floor(Math.random() * list.length)].message;
