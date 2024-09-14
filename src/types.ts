export type LogType =
  | "first_msg_error"
  | "first_msg_ok"
  | "second_msg_ok"
  | "second_msg_error"
  | "response"
  | "not_registered"
  | "regi_error"
  | "no_loging_url"
  | "sended_already_block"
  | "replaying_message";
export type MsgQ = { id: string; owner: string; pos: "first" | "second"; message: string; use: boolean };

export type InitData = { strat: SendingStrategy; first: MsgQ[]; second: MsgQ[]; premissions: Premmision_ };

export type Premmision_ = {
  id: string;
  owner: string;
  mail: string;
  max_requests: number;
  active_requests: number;
  max_leads_per_req: number;
  hard_cap: number;
  sended: number;
  max_req_duration: number;
  request_time_range: string;
  blocked: boolean;
  active: boolean;
  view: boolean;
  upload: boolean;
  ws_url: string;
  log_url: string;
  strat: boolean;
};
type BaseMsg = { id: string; message: string };
export type SocketMessage =
  | {
      version: "2msg_lists";
      actionId: string;
      type: "send";
      schema: "from_ui";
      owner: string;
      firstList: BaseMsg[];
      secondList: BaseMsg[];
      strat: SendingStrategy;
      premissions: Premmision_;
      leads: Lead[];
    }
  | { version: "2msg_lists"; actionId: string; type: "stop"; schema: "from_ui"; owner: string };

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
  default: boolean;
  web_hook: string;
  use: boolean;
};

export type Lead = { name: string; phone: string };
