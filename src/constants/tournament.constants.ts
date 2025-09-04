export enum TOURNAMENT_STATUSES {
  JOINING = "JOINING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
};

export const MAX_PLAYERS_PER_ROOM = 4;
export const MAX_PLAYERS_PER_TOURNAMENT = 100;

export const TOURNAMENT_CREATION = {
  SYSTEM: "system",
}

export const TOURNAMENT = {
  /**Every hour */
  // SCHEDULE_TIME: "0 * * * *"

  /**Every 5min */
  SCHEDULE_TIME: "*/5 * * * *"
}
