import mongoose, { Document, Schema } from 'mongoose';

export interface IProficiencyConfig extends Document {
  name: string;
  description: string;
  cost: number; // Cost in coins (default 50000)
  initialQuestions: {
    level: number;
    count: number;
  }[];
  branches: {
    name: string;
    condition: {
      correctRange: [number, number]; // [min, max] correct answers
      fromPhase: 'initial' | 'followup';
    };
    nextQuestions: {
      level: number;
      count: number;
    }[];
    resultLevel?: number; // If this branch leads to final result
    nextPhase?: 'followup' | 'final';
  }[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProficiencyConfigSchema = new Schema<IProficiencyConfig>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  cost: {
    type: Number,
    required: true,
    default: 50000
  },
  initialQuestions: [{
    level: {
      type: Number,
      required: true
    },
    count: {
      type: Number,
      required: true,
      min: 1
    }
  }],
  branches: [{
    name: {
      type: String,
      required: true
    },
    condition: {
      correctRange: {
        type: [Number],
        required: true,
        validate: {
          validator: function(v: number[]) {
            return v.length === 2 && v[0] <= v[1];
          },
          message: 'correctRange must be [min, max] where min <= max'
        }
      },
      fromPhase: {
        type: String,
        enum: ['initial', 'followup', 'final'],
        required: true
      }
    },
    nextQuestions: [{
      level: {
        type: Number,
        required: true
      },
      count: {
        type: Number,
        required: true,
        min: 1
      }
    }],
    resultLevel: {
      type: Number,
      required: false
    },
    nextPhase: {
      type: String,
      enum: ['followup', 'final'],
      required: false
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for active configs
ProficiencyConfigSchema.index({ isActive: 1 });

export default mongoose.model<IProficiencyConfig>('ProficiencyConfig', ProficiencyConfigSchema);
