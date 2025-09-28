import mongoose, { Document } from 'mongoose';
export interface ILevel extends Document {
    name: string;
    number: number;
    description?: string;
    requiredExperience: number;
    color: string;
    icon?: string;
}
declare const _default: mongoose.Model<ILevel, {}, {}, {}, mongoose.Document<unknown, {}, ILevel, {}, {}> & ILevel & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Level.d.ts.map