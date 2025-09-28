import mongoose, { Document } from 'mongoose';
export interface IUserVocabulary extends Document {
    userId: string;
    vocabularyId: string;
    status: 'learned' | 'studying' | 'skipped';
    personalTopicId?: string;
    learnedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const UserVocabulary: mongoose.Model<IUserVocabulary, {}, {}, {}, mongoose.Document<unknown, {}, IUserVocabulary, {}, {}> & IUserVocabulary & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=UserVocabulary.d.ts.map