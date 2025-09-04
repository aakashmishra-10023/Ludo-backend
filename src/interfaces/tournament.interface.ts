import { TOURNAMENT_STATUSES } from "src/constants/tournament.constants";

export interface Tournament {
    tournamentId: string;
    name: string;
    createdBy: string;
    status: TOURNAMENT_STATUSES;
    joiningOpen: boolean;
    maxPlayersPerRoom: number;
    currentRound: number;
    playerLimit: number;
    players: {
      userId: string;
      userName: string;
    }[];
    rooms: {
      roomId: string;
      players: {
        userId: string;
        userName: string;
        socketId?: string;
        isOnline: boolean;
      }[];
      gameStarted: boolean;
      gameState: any | null;
      createdAt: Date;
      maxPlayers: number;
    }[];
    createdAt?: number;
    updatedAt?: Date;
  }