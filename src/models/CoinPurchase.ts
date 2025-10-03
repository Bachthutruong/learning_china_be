import mongoose, { Document, Schema } from 'mongoose';

export interface ICoinPurchase extends Document {
  userId: mongoose.Types.ObjectId;
  amount: number; // Amount in original currency
  currency: string; // Currency (TWD or VND)
  coins: number; // Coins to be added
  paymentMethod: string;
  bankAccount?: string;
  transactionId?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  adminNotes?: string;
  receiptImage?: string; // URL to uploaded receipt image
  canEdit: boolean; // Whether user can edit this purchase
  createdAt: Date;
  updatedAt: Date;
}

const CoinPurchaseSchema = new Schema<ICoinPurchase>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 1 // Minimum amount
  },
  currency: {
    type: String,
    required: true,
    default: 'TWD',
    enum: ['TWD', 'VND']
  },
  coins: {
    type: Number,
    required: true,
    min: 1
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['bank_transfer'],
    default: 'bank_transfer'
  },
  bankAccount: {
    type: String,
    trim: true
  },
  transactionId: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending'
  },
  adminNotes: {
    type: String,
    trim: true
  },
  receiptImage: {
    type: String,
    trim: true
  },
  canEdit: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
CoinPurchaseSchema.index({ userId: 1, status: 1 });
CoinPurchaseSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model<ICoinPurchase>('CoinPurchase', CoinPurchaseSchema);
