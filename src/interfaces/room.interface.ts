import { GameState } from "./game.interface";

export interface JoinRoomData {
    roomId?: string;
    userId: string;
    username: string;
    avatarUrl?: string;
    createNewRoom?: boolean;
}

export interface Player {
    userId: string;
    username: string;
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