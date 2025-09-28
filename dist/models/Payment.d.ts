import mongoose, { Document } from 'mongoose';
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
declare const _default: mongoose.Model<IPayment, {}, {}, {}, mongoose.Document<unknown, {}, IPayment, {}, {}> & IPayment & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Payment.d.ts.map