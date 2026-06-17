export interface HangarExecStatus {
  status: string;
  nextChangeAt: string;
  secondsRemaining: number;
  cycleNumber: number;
  initialOpenTime: string;
  versionLabel?: string | null;
  lastModified?: string | null;
  sourceUrl: string;
}

export interface HangarExecScheduleEvent {
  eventType: string;
  at: string;
  cycleNumber: number;
}

export interface HangarExecStatusResponse {
  status: HangarExecStatus;
  upcoming: HangarExecScheduleEvent[];
}

export interface HangarTerminalPreset {
  id: string;
  label: string;
  location: string;
  timerSeconds: number;
}

export interface HangarTerminalTimer {
  terminalId: string;
  endsAt: string;
  secondsRemaining: number;
}

export interface HangarExecTimersResponse {
  terminals: HangarTerminalPreset[];
  activeTimers: HangarTerminalTimer[];
}
