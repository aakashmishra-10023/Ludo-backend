import { GameState } from "./game.interface";

export interface JoinRoomData {
    roomId?: string;
    userId: string;
    userName: string;
    createNewRoom: boolean;
}

export interface Player {
    userId: string;
    userName: string;
    socketId: string;
    avatarUrl?: string;
    color?: string;
    isReady?: boolean;
    position?: number;
}

export interface GameRoom {
    roomId: string;
    players: Player[];
    gameStarted: boolean;
    createdAt: number;
    maxPlayers: number;
    gameState?: GameState;
}