import mongoose, { Document, Schema } from 'mongoose';

export interface IUserCompetitionRequest extends Document {
  competition: mongoose.Types.ObjectId;
  requester: mongoose.Types.ObjectId;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: Date;
  processedAt?: Date;
  processedBy?: mongoose.Types.ObjectId;
}

const UserCompetitionRequestSchema: Schema = new Schema({
  competition: {
    type: Schema.Types.ObjectId,
    ref: 'UserCompetition',
    required: [true, 'Competition is required']
  },
  requester: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Requester is required']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  processedAt: {
    type: Date
  },
  processedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Compound index to ensure a user can only request once per competition
UserCompetitionRequestSchema.index({ competition: 1, requester: 1 }, { unique: true });
UserCompetitionRequestSchema.index({ competition: 1, status: 1 });
UserCompetitionRequestSchema.index({ requester: 1, status: 1 });

export default mongoose.model<IUserCompetitionRequest>('UserCompetitionRequest', UserCompetitionRequestSchema);
