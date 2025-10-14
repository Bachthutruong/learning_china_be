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
const UserCompetitionQuestionSchema = new mongoose_1.Schema({
    question: { type: String, required: true },
    options: { type: [String], required: true },
    correctAnswer: { type: mongoose_1.Schema.Types.Mixed, required: true },
    questionType: {
        type: String,
        required: true,
        enum: ['multiple-choice', 'fill-blank', 'reading-comprehension', 'sentence-order']
    },
    explanation: { type: String }
}, { _id: false });
const UserCompetitionSchema = new mongoose_1.Schema({
    creator: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Creator is required']
    },
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true
    },
    numberOfQuestions: {
        type: Number,
        required: [true, 'Number of questions is required'],
        min: 1,
        max: 20
    },
    timePerQuestion: {
        type: Number,
        required: [true, 'Time per question is required'],
        min: 0.5,
        max: 3
    },
    totalTime: {
        type: Number,
        required: [true, 'Total time is required']
    },
    startTime: {
        type: Date,
        required: [true, 'Start time is required']
    },
    endTime: {
        type: Date,
        required: [true, 'End time is required']
    },
    cost: {
        type: Number,
        default: 10000,
        required: true
    },
    level: {
        type: Number,
        required: [true, 'Level is required'],
        min: 1,
        max: 6
    },
    questions: [UserCompetitionQuestionSchema],
    participants: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User'
        }],
    pendingRequests: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User'
        }],
    status: {
        type: String,
        enum: ['pending', 'active', 'completed'],
        default: 'pending'
    },
    isStarted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});
// Update status based on time
UserCompetitionSchema.pre('save', function (next) {
    const now = new Date();
    if (now >= this.endTime) {
        this.status = 'completed';
    }
    else if (now >= this.startTime && this.isStarted) {
        this.status = 'active';
    }
    else {
        this.status = 'pending';
    }
    next();
});
// Calculate end time based on start time and total time
UserCompetitionSchema.pre('save', function (next) {
    if (this.isModified('startTime') || this.isModified('totalTime')) {
        this.endTime = new Date(this.startTime.getTime() + this.totalTime * 60 * 1000);
    }
    next();
});
// Index for efficient queries
UserCompetitionSchema.index({ creator: 1, status: 1 });
UserCompetitionSchema.index({ startTime: 1, status: 1 });
UserCompetitionSchema.index({ participants: 1 });
exports.default = mongoose_1.default.model('UserCompetition', UserCompetitionSchema);
