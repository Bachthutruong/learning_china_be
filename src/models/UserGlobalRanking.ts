import mongoose, { Document, Schema } from 'mongoose';

export interface IUserGlobalRanking extends Document {
  user: mongoose.Types.ObjectId;
  totalPoints: number; // Total points from all competitions
  competitionsParticipated: number; // Number of competitions the user has participated in
  lastUpdated: Date; // Last time ranking was updated
  rank?: number; // Current global rank (calculated on the fly or updated periodically)
}

const UserGlobalRankingSchema: Schema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required'],
    unique: true
  },
  totalPoints: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  competitionsParticipated: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  rank: {
    type: Number,
    min: 1
  }
}, {
  timestamps: true
});

// Index for efficient ranking queries
UserGlobalRankingSchema.index({ totalPoints: -1, competitionsParticipated: -1 });
UserGlobalRankingSchema.index({ user: 1 });

export default mongoose.model<IUserGlobalRanking>('UserGlobalRanking', UserGlobalRankingSchema);

