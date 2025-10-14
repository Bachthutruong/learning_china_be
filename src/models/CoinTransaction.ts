import mongoose, { Schema, Document } from 'mongoose';

export type CoinTransactionType = 'earn' | 'spend' | 'adjust';

export interface ICoinTransaction extends Document {
  userId: mongoose.Types.ObjectId;
  amount: number; // positive for earn, negative for spend
  type: CoinTransactionType;
  category: string; // e.g. checkin, test, vocabulary, purchase, admin_adjust
  description?: string;
  balanceAfter: number; // user's coin balance after this transaction
  metadata?: any;
  createdAt: Date;
}

const CoinTransactionSchema = new Schema<ICoinTransaction>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['earn', 'spend', 'adjust'], required: true },
  category: { type: String, required: true },
  description: { type: String },
  balanceAfter: { type: Number, required: true },
  metadata: { type: Schema.Types.Mixed }
}, { timestamps: { createdAt: true, updatedAt: false } });

CoinTransactionSchema.index({ userId: 1, createdAt: -1 });

const CoinTransaction = mongoose.model<ICoinTransaction>('CoinTransaction', CoinTransactionSchema);
export default CoinTransaction;


