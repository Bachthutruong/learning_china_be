import mongoose, { Document } from 'mongoose';
export interface ITopic extends Document {
    name: string;
    description?: string;
    color: string;
}
declare const _default: mongoose.Model<ITopic, {}, {}, {}, mongoose.Document<unknown, {}, ITopic, {}, {}> & ITopic & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Topic.d.ts.map