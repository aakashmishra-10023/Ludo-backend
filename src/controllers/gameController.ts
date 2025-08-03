import { Request, Response } from "express";
import * as gameService from "../services/gameService";

export const startGame = async (req: Request, res: Response) => {
  // TODO: Implement startGame logic
  res.status(200).json({});
};

export const getGameState = async (req: Request, res: Response) => {
  // TODO: Implement getGameState logic
  res.status(200).json({});
};

export const rollDice = async (req: Request, res: Response) => {
  // TODO: Implement rollDice logic
  res.status(200).json({});
};

export const movePiece = async (req: Request, res: Response) => {
  // TODO: Implement movePiece logic
  res.status(200).json({});
};

export const skipTurn = async (req: Request, res: Response) => {
  // TODO: Implement skipTurn logic
  res.status(200).json({});
};

export const endGame = async (req: Request, res: Response) => {
  // TODO: Implement endGame logic
  res.status(200).json({});
};
