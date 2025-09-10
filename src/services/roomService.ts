import { z } from "zod";
import Room, { IRoom } from "../models/Room";
import bcrypt from "bcryptjs";

export const createRoomSchema = z.object({
  roomId: z.string(),
  gameType: z.string(),
  maxPlayers: z.number().int().min(2).max(4),
  entryAmount: z.number().int().min(0),
  isPrivate: z.boolean(),
  password: z.string().optional(),
  createdBy: z.string(),
  createdAt: z.date(),
  settings: z.any().optional(),
});

export async function createRoom(data: z.infer<typeof createRoomSchema>) {
  const existing = await Room.findOne({ roomId: data.roomId });
  if (existing) throw new Error("Room already exists");
  let passwordHash = "";
  if (data.isPrivate && data.password && data.password.length > 0) {
    passwordHash = await bcrypt.hash(data.password, 10);
  }
  const room = new Room({
    ...data,
    password: passwordHash,
    players: [],
    gameState: {},
  });
  await room.save();
  return room;
}

export async function joinRoom(
  roomId: string,
  player: any,
  password?: string,
  avatarUrl?: string
) {
  const room = await Room.findOne({ roomId });
  if (!room) throw new Error("Room not found");
  if (room.players.length >= room.maxPlayers) throw new Error("Room is full");
  if (room.isPrivate && room.password) {
    if (!password || !(await bcrypt.compare(password, room.password))) {
      throw new Error("Invalid room password");
    }
  }
  if (room.players.some((p: any) => p.uid === player.uid)) {
    throw new Error("Player already in room");
  }
  room.players.push(player);
  await room.save();
  return room;
}

export async function getRoom(roomId: string) {
  const room = await Room.findOne({ roomId });
  if (!room) throw new Error("Room not found");
  return room;
}

export async function leaveRoom(roomId: string, playerId: string) {
  const room = await Room.findOne({ roomId });
  if (!room) throw new Error("Room not found");
  room.players = room.players.filter((p: any) => p.uid !== playerId);
  await room.save();
  return room;
}

export async function listRooms(query: any) {
  const filter: any = {};
  if (query.status) filter["gameState.status"] = query.status;
  if (query.gameType) filter.gameType = query.gameType;
  const limit = query.limit ? parseInt(query.limit, 10) : 20;
  return Room.find(filter).limit(limit);
}
