import mongoose, { Document, Schema } from 'mongoose';

export interface ICompetition extends Document {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  participants: mongoose.Types.ObjectId[];
  cost: number;
  reward: {
    xp: number;
    coins: number;
  };
  status: 'active' | 'upcoming' | 'ended';
  level: string;
  maxParticipants?: number;
  rules: string[];
  prizes: {
    first: { xp: number; coins: number };
    second: { xp: number; coins: number };
    third: { xp: number; coins: number };
  };
}

const CompetitionSchema = new Schema<ICompetition>({
  title: {
    type: String,
    required: [true, 'Competition title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Competition description is required'],
    trim: true
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  participants: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  cost: {
    type: Number,
    required: [true, 'Cost is required'],
    min: 0
  },
  reward: {
    xp: {
      type: Number,
      required: true,
      min: 0
    },
    coins: {
      type: Number,
      required: true,
      min: 0
    }
  },
  status: {
    type: String,
    enum: ['active', 'upcoming', 'ended'],
    default: 'upcoming'
  },
  level: {
    type: String,
    required: [true, 'Level is required'],
    enum: ['Beginner', 'Intermediate', 'Advanced', 'All']
  },
  maxParticipants: {
    type: Number,
    min: 2
  },
  rules: [{
    type: String,
    required: true
  }],
  prizes: {
    first: {
      xp: { type: Number, required: true, min: 0 },
      coins: { type: Number, required: true, min: 0 }
    },
    second: {
      xp: { type: Number, required: true, min: 0 },
      coins: { type: Number, required: true, min: 0 }
    },
    third: {
      xp: { type: Number, required: true, min: 0 },
      coins: { type: Number, required: true, min: 0 }
    }
  }
}, {
  timestamps: true
});

// Pre-save middleware to update status based on dates
CompetitionSchema.pre('save', function(next) {
  const now = new Date();
  if (this.startDate > now) {
    this.status = 'upcoming';
  } else if (this.endDate < now) {
    this.status = 'ended';
  } else {
    this.status = 'active';
  }
  next();
});

export default mongoose.model<ICompetition>('Competition', CompetitionSchema);


