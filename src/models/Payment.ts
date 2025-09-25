import mongoose, { Document, Schema } from 'mongoose';

export interface IPayment extends Document {
  userId: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  coins: number;
  paymentMethod: string;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  paymentProvider?: string;
  metadata?: any;
}

const PaymentSchema = new Schema<IPayment>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: 0
  },
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    default: 'VND'
  },
  coins: {
    type: Number,
    required: [true, 'Coins is required'],
    min: 0
  },
  paymentMethod: {
    type: String,
    required: [true, 'Payment method is required'],
    enum: ['credit_card', 'debit_card', 'bank_transfer', 'wallet', 'crypto']
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  transactionId: {
    type: String
  },
  paymentProvider: {
    type: String,
    enum: ['stripe', 'paypal', 'momo', 'zalopay', 'vnpay']
  },
  metadata: {
    type: Schema.Types.Mixed
  }
}, {
  timestamps: true
});

export default mongoose.model<IPayment>('Payment', PaymentSchema);


