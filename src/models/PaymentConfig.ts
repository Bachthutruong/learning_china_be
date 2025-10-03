import mongoose, { Document, Schema } from 'mongoose';

export interface IPaymentAccountConfig {
  qrCodeImage: string;
  exchangeRate: number; // coins per unit of currency
  bankAccount: string;
  bankName: string;
  accountHolder: string;
}

export interface IPaymentConfig extends Document {
  tw: IPaymentAccountConfig; // Taiwan account (TWD)
  vn: IPaymentAccountConfig; // Vietnam account (VND)
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentAccountConfigSchema = new Schema<IPaymentAccountConfig>({
  qrCodeImage: { type: String, required: true, trim: true },
  exchangeRate: { type: Number, required: true, min: 0.01 },
  bankAccount: { type: String, required: true, trim: true },
  bankName: { type: String, required: true, trim: true },
  accountHolder: { type: String, required: true, trim: true }
});

const PaymentConfigSchema = new Schema<IPaymentConfig>({
  tw: { type: PaymentAccountConfigSchema, required: true },
  vn: { type: PaymentAccountConfigSchema, required: true },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

// Ensure only one active config
PaymentConfigSchema.index({ isActive: 1 }, { unique: true, partialFilterExpression: { isActive: true } });

export default mongoose.model<IPaymentConfig>('PaymentConfig', PaymentConfigSchema);
