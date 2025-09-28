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
const CompetitionResultSchema = new mongoose_1.Schema({
    competitionId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Competition',
        required: [true, 'Competition ID is required']
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required']
    },
    score: {
        type: Number,
        required: [true, 'Score is required'],
        min: 0,
        max: 100
    },
    timeSpent: {
        type: Number,
        required: [true, 'Time spent is required'],
        min: 0
    },
    rank: {
        type: Number,
        min: 1
    },
    rewards: {
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
    answers: [{
            questionId: {
                type: String,
                required: true
            },
            userAnswer: {
                type: Number,
                required: true
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
        }]
}, {
    timestamps: true
});
// Index for efficient leaderboard queries
CompetitionResultSchema.index({ competitionId: 1, score: -1 });
CompetitionResultSchema.index({ competitionId: 1, userId: 1 }, { unique: true });
exports.default = mongoose_1.default.model('CompetitionResult', CompetitionResultSchema);
//# sourceMappingURL=CompetitionResult.js.map