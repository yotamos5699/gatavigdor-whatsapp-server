export type LogType = "first_message" | "second_message" | "response" | "not_registered" | "regi_error";
export type MsgQ = { id: string; owner: string; pos: "first" | "second"; message: string; use: boolean };

export type InitData = { strat: SendingStrategy; first: MsgQ[]; second: MsgQ[] };

export type SendingStrategy = {
  id: string;
  owner: string;
  name: string;
  min_delay_first: number;
  max_delay_first: number;
  min_delay_second: number;
  max_delay_second: number;
  conntacts: "listener" | "from_ui";
  randomize_empty_rows: boolean;
  randomize_messages: boolean;
  randimize_characters: boolean;
  use: boolean;
};

export type Lead = { name: string; phone: string };
