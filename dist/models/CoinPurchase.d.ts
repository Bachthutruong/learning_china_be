import mongoose, { Document } from 'mongoose';
export interface ICoinPurchase extends Document {
    userId: mongoose.Types.ObjectId;
    amount: number;
    coins: number;
    paymentMethod: string;
    bankAccount?: string;
    transactionId?: string;
    status: 'pending' | 'approved' | 'rejected';
    adminNotes?: string;
    proofOfPayment?: string;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<ICoinPurchase, {}, {}, {}, mongoose.Document<unknown, {}, ICoinPurchase, {}, {}> & ICoinPurchase & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=CoinPurchase.d.ts.map