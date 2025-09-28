import mongoose, { Document, Schema } from 'mongoose';

export interface ISubBranch {
  name: string;
  condition: {
    correctRange: [number, number];
    fromPhase: 'initial' | 'followup' | 'final';
  };
  nextQuestions: {
    level: number;
    count: number;
  }[];
  resultLevel?: number;
  nextPhase?: 'followup' | 'final';
  subBranches?: ISubBranch[]; // Recursive: unlimited nested sub-branches
}

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
      fromPhase: 'initial' | 'followup' | 'final';
    };
    nextQuestions: {
      level: number;
      count: number;
    }[];
    resultLevel?: number; // If this branch leads to final result
    nextPhase?: 'followup' | 'final';
    subBranches?: ISubBranch[];
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
    },
    subBranches: [{
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
      },
      subBranches: [] // Recursive definition - will be populated after schema creation
    }]
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

// Add recursive subBranches after schema creation
const SubBranchSchema = new Schema({
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
  },
  subBranches: [] // Recursive definition
});

// Add recursive subBranches to SubBranchSchema
SubBranchSchema.add({ subBranches: [SubBranchSchema] });

// Update the main schema to use the recursive SubBranchSchema
const branchesSchema = ProficiencyConfigSchema.path('branches') as any;
if (branchesSchema && branchesSchema.schema) {
  branchesSchema.schema.add({
    subBranches: [SubBranchSchema]
  });
}

export default mongoose.model<IProficiencyConfig>('ProficiencyConfig', ProficiencyConfigSchema);
