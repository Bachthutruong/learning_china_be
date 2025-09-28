import mongoose, { Document, Schema } from 'mongoose';

export interface ICoinPurchase extends Document {
  userId: mongoose.Types.ObjectId;
  amount: number; // Amount in VND
  coins: number; // Coins to be added
  paymentMethod: string;
  bankAccount?: string;
  transactionId?: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNotes?: string;
  proofOfPayment?: string; // URL to uploaded proof image
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
    min: 10000 // Minimum 10,000 VND
  },
  coins: {
    type: Number,
    required: true,
    min: 1
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['bank_transfer', 'momo', 'zalopay', 'vnpay']
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
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  adminNotes: {
    type: String,
    trim: true
  },
  proofOfPayment: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
CoinPurchaseSchema.index({ userId: 1, status: 1 });
CoinPurchaseSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model<ICoinPurchase>('CoinPurchase', CoinPurchaseSchema);
