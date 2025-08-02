import mongoose, { Document, Schema } from "mongoose";

export interface IShopItem extends Document {
  itemId: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  amount: number;
  createdAt: Date;
}

const ShopItemSchema = new Schema<IShopItem>({
  itemId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  currency: { type: String, required: true },
  amount: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IShopItem>("ShopItem", ShopItemSchema);
