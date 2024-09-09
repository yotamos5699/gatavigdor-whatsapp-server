import { Client } from "whatsapp-web.js";
import { normelizeNumbers, formatPhone, editMessageVarient, delay, messageParser } from "./helper";
import { InitData, Lead, LogType, SendingStrategy } from "./types";
import { sended, strats } from "./app";

const URL_LISTS =
  "https://script.google.com/macros/s/AKfycbx-6JLVMVuWote6N0vtiCLl_zgtbdDGfP6W--KoLcT8X5w6dr69-5BUEAQUaMcl1qUo/exec?type=lists";
const baseUrl = "https://script.google.com/macros/s/AKfycbylQUU_1mh1ehP0fSRhmW364TQL5Q5eIX8aSnH3F5R-hls9hFWdVMF4sFls6zovfpFx/exec?";

const baseUrl2 = "https://script.google.com/macros/s/AKfycbx-6JLVMVuWote6N0vtiCLl_zgtbdDGfP6W--KoLcT8X5w6dr69-5BUEAQUaMcl1qUo/exec?";
const logAction = ({
  type,
  number,
  name,
  message,
  status,
  updates,
  owner,
}: {
  type: LogType;
  number: string;
  name: string;
  message: string;
  status: "ok" | "error";
  updates: number;
  owner: string;
}) => {
  const date = new Date().toISOString();
  const id = crypto.randomUUID().slice(0, 10);

  [baseUrl, baseUrl2].forEach((url) =>
    fetch(
      `${url}type=log&row=${encodeURIComponent(JSON.stringify([id, date, type, number, name, message, status, owner]))}&updates=${updates}`
    )
  );
};

let firstMsg: string[] = [];

const getNewLeads = async (): Promise<Lead[] | null> =>
  fetch(`${baseUrl}type=get_rows`)
    .then((res) => res.json())
    .then((data: { status: 1; data: string } | { status: 2; data: { name: string; phone: string }[] }) => {
      if (data.status === 2) return data.data;
      console.log(data.data);
      return null;
    });
export let secondMessage: string[] = [];
export let strat: SendingStrategy;
const getInitData = async () => {
  return fetch(URL_LISTS)
    .then((res) => res.json())
    .then((data) => data.data as InitData)
    .then((data) => {
      console.log({ data });
      console.log({ strat: data.strat });
      strat = normelizeNumbers(data.strat);
      firstMsg = data.first.map((fm) => fm.message);
      secondMessage = data.second.map((sm) => sm.message);
    });
};

export function handleListener(client: Client, id: string) {
  const strat = strats.get(id);
  if (!strat) {
    return console.log("no start on id: ", { id });
  }
  let inProgress = false;
  getInitData().then(() => {
    setInterval(async () => {
      if (inProgress) {
        console.log("sending in progress..");
        return;
      }
      const newLeads = await getNewLeads();
      if (newLeads) {
        inProgress = true;
        for (let i = 0; i < newLeads.length; i++) {
          let lead = newLeads[i];
          await delay(Math.floor(Math.random() * strat.min_delay_first + strat.min_delay_first));
          let number = formatPhone(lead.phone);

          client
            .isRegisteredUser(number)
            .then((isRegistered) => {
              if (!isRegistered) {
                logAction({
                  type: "not_registered",
                  message: "client not reg",
                  name: lead.name,
                  number,
                  updates: 1,
                  status: "error",
                  owner: id,
                });
              } else {
                if (sended.map((s) => s.number).indexOf(number) !== -1) {
                  console.log("recived first message allreedy !!", { number });
                  return;
                }
                sended.push({ number, name: lead.name, stage: "first_sended" });
                console.log(number);
                let selFirstMessage = messageParser(strat, firstMsg, lead.name);
                client
                  .sendMessage(number, selFirstMessage)
                  .then(() => {
                    logAction({
                      type: "first_message",
                      message: selFirstMessage.slice(0, 12),
                      name: lead.name,
                      number,
                      updates: 1,
                      status: "ok",
                      owner: id,
                    });
                  })
                  .catch((err) =>
                    logAction({
                      type: "first_message",
                      message: JSON.stringify(err).slice(0, 32),
                      name: lead.name,
                      number,
                      updates: 1,
                      status: "error",
                      owner: id,
                    })
                  );
              }
            })
            .catch((err) => {
              logAction({
                type: "regi_error",
                message: JSON.stringify(err).slice(0, 32),
                name: lead.name,
                number,
                updates: 1,
                status: "error",
                owner: id,
              });
            });
        }
        inProgress = false;
      }
    }, 12000);
  });
}

// const hase = { 0: "new", 1: "first_sended", 2: "second_sended" };

let inProgressIds: string[];
export const handleUiContacts = async (newLeads: Lead[], messages: string[], client: Client, id: string, pos?: number) => {
  if (inProgressIds.includes(id)) {
    setTimeout(() => handleUiContacts(newLeads, messages, client, id, pos), 5000);
  } else {
    inProgressIds.push(id);
    const strat = strats.get(id);
    if (!strat) {
      inProgressIds.splice(inProgressIds.indexOf(id), 1);
      return;
    }
    for (let i = 0; i < newLeads.length; i++) {
      let lead = newLeads[i];
      await delay(Math.floor(Math.random() * strat.min_delay_first + strat.min_delay_first));
      let number = formatPhone(lead.phone);

      client.isRegisteredUser(number).then((isRegistered) => {
        if (!isRegistered) {
          logAction({
            type: "not_registered",
            message: "client not reg",
            name: lead.name,
            number,
            updates: 1,
            status: "error",
            owner: id,
          });
        } else {
          client.sendMessage(formatPhone(newLeads[i].phone), messageParser(strat, messages, newLeads[i].name));
        }
      });
    }
    inProgressIds.splice(inProgressIds.indexOf(id), 1);
  }
};
