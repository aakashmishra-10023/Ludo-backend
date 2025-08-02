import { z } from "zod";
import GameState, { IGameState } from "../models/GameState";

export const startGameSchema = z.object({
  roomId: z.string(),
});

export async function startGame(data: z.infer<typeof startGameSchema>) {
  // Initialize game state for the room
  const existing = await GameState.findOne({ roomId: data.roomId });
  if (existing) throw new Error("Game already started");
  const gameState = new GameState({
    roomId: data.roomId,
    status: "started",
    currentTurn: null,
    diceValue: null,
    pieces: {},
    board: {},
  });
  await gameState.save();
  return gameState;
}

export async function getGameState(roomId: string) {
  const gameState = await GameState.findOne({ roomId });
  if (!gameState) throw new Error("Game state not found");
  return gameState;
}

export async function rollDice(roomId: string, playerId: string) {
  const gameState = await GameState.findOne({ roomId });
  if (!gameState) throw new Error("Game state not found");
  const diceValue = Math.floor(Math.random() * 6) + 1;
  gameState.diceValue = diceValue;
  await gameState.save();
  return { diceValue };
}

export async function movePiece(roomId: string, moveData: any) {
  const gameState = await GameState.findOne({ roomId });
  if (!gameState) throw new Error("Game state not found");
  // TODO: Update piece position in gameState.pieces
  await gameState.save();
  return gameState;
}

export async function skipTurn(roomId: string, playerId: string) {
  const gameState = await GameState.findOne({ roomId });
  if (!gameState) throw new Error("Game state not found");
  // TODO: Advance to next player
  await gameState.save();
  return gameState;
}

export async function endGame(
  roomId: string,
  winnerId: string,
  finalScore: any
) {
  const gameState = await GameState.findOne({ roomId });
  if (!gameState) throw new Error("Game state not found");
  gameState.status = "ended";
  // TODO: Store winner and finalScore
  await gameState.save();
  return gameState;
}
