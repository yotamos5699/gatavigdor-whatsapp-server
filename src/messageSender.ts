// messageSender.ts
import { Client } from "whatsapp-web.js";
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

const format_num = (num: string) => `${num}@c.us`;
export class MessageSender {
  private client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  public async sendMessages({ numbers, messages }: { numbers: string[]; messages: string[] }) {
    const messagesRecords: MessageRecord[] = [];
    const messagesRequests = [];
    for (let i = 0; i <= numbers.length - 1; i++) {
      let number = format_num(numbers[i]);
      messagesRequests.push(
        this.client
          .sendMessage(number, messages[i])
          .then(() => messagesRecords.push({ msg: messages[i], number: numbers[i], row: i, status: "ok", data: null }))
          .catch((error) =>
            this.client.isRegisteredUser(number).then((reg) => {
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
    const results = await Promise.allSettled(messagesRequests);
    return results;
  }
  public sendToMennagers(messages: string[], mennagers: Mennager[]) {
    mennagers.forEach((mennager, i) => this.client.sendMessage(format_num(mennager.number), messages[i]));
  }
  public async state() {
    return await this.client.getState();
  }
}

// const getMessage = (actionLog: msgObj[]) => {
//     const IsErrors = actionLog.filter((m) => m.status == "catch error" || m.status == "registretion error")[0];
//     if (IsErrors) return `got some errors\n ${JSON.stringify(IsErrors)}`;
//     return "all good";
//   };

//   const sendToMennagers = (actionLog: msgObj[], msg?: string) => {
//     const Message = msg ?? getMessage(actionLog);
//     mennagersNumbers.forEach((number) => client.sendMessage(number, Message));
//   };
