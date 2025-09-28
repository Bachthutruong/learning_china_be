"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const ProficiencyConfigSchema = new mongoose_1.Schema({
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
                        validator: function (v) {
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
                                validator: function (v) {
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
const SubBranchSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true
    },
    condition: {
        correctRange: {
            type: [Number],
            required: true,
            validate: {
                validator: function (v) {
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
const branchesSchema = ProficiencyConfigSchema.path('branches');
if (branchesSchema && branchesSchema.schema) {
    branchesSchema.schema.add({
        subBranches: [SubBranchSchema]
    });
}
exports.default = mongoose_1.default.model('ProficiencyConfig', ProficiencyConfigSchema);
