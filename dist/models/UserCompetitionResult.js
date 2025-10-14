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
const UserCompetitionResultSchema = new mongoose_1.Schema({
    competition: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'UserCompetition',
        required: [true, 'Competition is required']
    },
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User is required']
    },
    score: {
        type: Number,
        required: [true, 'Score is required'],
        min: 0,
        max: 100
    },
    correctAnswers: {
        type: Number,
        required: [true, 'Correct answers count is required'],
        min: 0
    },
    totalQuestions: {
        type: Number,
        required: [true, 'Total questions count is required'],
        min: 1
    },
    timeSpent: {
        type: Number,
        required: [true, 'Time spent is required'],
        min: 0
    },
    startedAt: {
        type: Date,
        required: [true, 'Start time is required']
    },
    completedAt: {
        type: Date,
        required: [true, 'Completion time is required']
    },
    answers: [{
            questionIndex: {
                type: Number,
                required: true
            },
            userAnswer: {
                type: mongoose_1.Schema.Types.Mixed,
                default: null
            },
            isCorrect: {
                type: Boolean,
                required: true
            },
            timeSpent: {
                type: Number,
                required: true,
                min: 0
            }
        }],
    rank: {
        type: Number,
        min: 1
    }
}, {
    timestamps: true
});
// Ensure one result per user per competition
UserCompetitionResultSchema.index({ competition: 1, user: 1 }, { unique: true });
// For efficient leaderboard queries
UserCompetitionResultSchema.index({ competition: 1, score: -1, timeSpent: 1 });
exports.default = mongoose_1.default.model('UserCompetitionResult', UserCompetitionResultSchema);
