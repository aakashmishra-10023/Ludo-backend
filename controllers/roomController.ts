import { Request, Response } from "express";
import * as roomService from "../services/roomService";

export const createRoom = async (req: Request, res: Response) => {
  try {
    const data = roomService.createRoomSchema.parse(req.body);
    const room = await roomService.createRoom(data);
    res.status(201).json({ room });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const joinRoom = async (req: Request, res: Response) => {
  // TODO: Implement joinRoom logic
  res.status(200).json({});
};

export const getRoom = async (req: Request, res: Response) => {
  // TODO: Implement getRoom logic
  res.status(200).json({});
};

export const leaveRoom = async (req: Request, res: Response) => {
  // TODO: Implement leaveRoom logic
  res.status(200).json({});
};

export const listRooms = async (req: Request, res: Response) => {
  // TODO: Implement listRooms logic
  res.status(200).json([]);
};
