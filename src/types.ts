export interface Action {
  action: "edit_code" | "execute_code";
  diff?: string;
  execution_result?: "success" | "error";
}

export interface RecordingData {
  issue: string;
  initial_code: string;
  pull_request: string;
  actions: Action[];
}
