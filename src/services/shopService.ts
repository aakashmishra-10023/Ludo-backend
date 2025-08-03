import { z } from "zod";
import Balance, { IBalance } from "../models/Balance";
import ShopItem, { IShopItem } from "../models/ShopItem";

export async function getPlayerBalance(playerId: string) {
  let balance = await Balance.findOne({ playerId });
  if (!balance) {
    balance = new Balance({ playerId, coins: 0, diamonds: 0 });
    await balance.save();
  }
  return balance;
}

export async function purchaseCoins(data: {
  playerId: string;
  amount: number;
}) {
  const balance = await Balance.findOne({ playerId: data.playerId });
  if (!balance) throw new Error("Player balance not found");
  balance.coins += data.amount;
  balance.updatedAt = new Date();
  await balance.save();
  return balance;
}

export async function getShopItems() {
  return ShopItem.find();
}

export async function purchaseItem(data: {
  playerId: string;
  itemId: string;
  currency: "coins" | "diamonds";
  amount: number;
}) {
  const balance = await Balance.findOne({ playerId: data.playerId });
  if (!balance) throw new Error("Player balance not found");
  if (balance[data.currency] < data.amount)
    throw new Error("INSUFFICIENT_FUNDS");
  balance[data.currency] -= data.amount;
  balance.updatedAt = new Date();
  await balance.save();
  // In a real app, you would also add the item to the player's inventory
  return balance;
}
