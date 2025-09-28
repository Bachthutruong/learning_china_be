import mongoose, { Document, Schema } from 'mongoose';

export interface IPaymentConfig extends Document {
  qrCodeImage: string;
  exchangeRate: number; // 1 TWD = ? coins
  bankAccount: string;
  bankName: string;
  accountHolder: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentConfigSchema = new Schema<IPaymentConfig>({
  qrCodeImage: {
    type: String,
    required: true,
    trim: true
  },
  exchangeRate: {
    type: Number,
    required: true,
    min: 0.01 // Minimum 0.01 coins per TWD
  },
  bankAccount: {
    type: String,
    required: true,
    trim: true
  },
  bankName: {
    type: String,
    required: true,
    trim: true
  },
  accountHolder: {
    type: String,
    required: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Ensure only one active config
PaymentConfigSchema.index({ isActive: 1 }, { unique: true, partialFilterExpression: { isActive: true } });

export default mongoose.model<IPaymentConfig>('PaymentConfig', PaymentConfigSchema);
