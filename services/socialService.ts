import { z } from "zod";
import Friend, { IFriend } from "../models/Friend";
import Invitation, { IInvitation } from "../models/Invitation";

export async function addFriend(data: {
  playerId: string;
  friendId: string;
  message?: string;
}) {
  const existing = await Friend.findOne({
    playerId: data.playerId,
    friendId: data.friendId,
  });
  if (existing) throw new Error("Friend request already sent");
  const friend = new Friend({
    playerId: data.playerId,
    friendId: data.friendId,
    status: "pending",
    message: data.message,
    createdAt: new Date(),
  });
  await friend.save();
  return friend;
}

export async function acceptFriendRequest(requestId: string) {
  const friend = await Friend.findByIdAndUpdate(
    requestId,
    { status: "accepted" },
    { new: true }
  );
  if (!friend) throw new Error("Friend request not found");
  return friend;
}

export async function getFriendsList(playerId: string) {
  const friends = await Friend.find({ playerId, status: "accepted" });
  return friends;
}

export async function sendGameInvitation(data: {
  invitationId: string;
  from: string;
  to: string;
  roomId: string;
  message?: string;
}) {
  const invitation = new Invitation({
    invitationId: data.invitationId,
    from: data.from,
    to: data.to,
    roomId: data.roomId,
    message: data.message,
    status: "pending",
    createdAt: new Date(),
  });
  await invitation.save();
  return invitation;
}

export async function acceptGameInvitation(invitationId: string) {
  const invitation = await Invitation.findOneAndUpdate(
    { invitationId },
    { status: "accepted" },
    { new: true }
  );
  if (!invitation) throw new Error("Invitation not found");
  return invitation;
}
