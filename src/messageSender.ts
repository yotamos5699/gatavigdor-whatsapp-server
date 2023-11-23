// messageSender.ts
import { Client } from "whatsapp-web.js";
import { W_a_Client } from "./client";
// import { Socket } from "socket.io";
import { Io_ } from "./app";
type MessageRecord = {
  number: string;
  status: "ok" | "catch error" | "registretion error";
  row: number;
  msg: string;
  data: string | null;
};
type Mennager = {
  number: string;
  job: "admin" | "mennager";
};

export const format_num = (num: string) => `${num}@c.us`;

export const openMessagesEvent = (waClient: W_a_Client, io: Io_) => {
  console.log("openning MessagesEvents for number:", waClient.id);
  io.on("send_messages", (data) => {
    console.log("send messages");
    sendMessages({ data, client: waClient.client });
  });
};

type sendMessagesType = { data: { numbers: string[]; messages: string[] }; client: Client };
export async function sendMessages({ data, client }: sendMessagesType) {
  const { messages, numbers } = data;
  console.log({ data });
  const messagesRecords: MessageRecord[] = [];
  const messagesRequests = [];
  for (let i = 0; i <= numbers.length - 1; i++) {
    let number = format_num(numbers[i]);
    messagesRequests.push(
      client
        .sendMessage(number, messages[i])
        .then(() => messagesRecords.push({ msg: messages[i], number: numbers[i], row: i, status: "ok", data: null }))
        .catch((error) =>
          client.isRegisteredUser(number).then((reg) => {
            messagesRecords.push({
              msg: messages[i],
              number: numbers[i],
              row: i,
              status: reg ? "catch error" : "registretion error",
              data: reg ? null : error,
            });
          })
        )
    );
  }
  await Promise.allSettled(messagesRequests);
  console.log({ messagesRecords });
  return messagesRecords;
}
export function sendToMennagers(messages: string[], mennagers: Mennager[], client: Client) {
  mennagers.forEach((mennager, i) => client.sendMessage(format_num(mennager.number), messages[i]));
}
