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
const CompetitionPrizeSchema = new mongoose_1.Schema({
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
}, { _id: false });
const CompetitionQuestionSchema = new mongoose_1.Schema({
    question: { type: String, required: true },
    options: { type: [String], required: true },
    correctAnswer: { type: mongoose_1.Schema.Types.Mixed, required: true }, // Can be number or array
    questionType: {
        type: String,
        required: true,
        enum: ['multiple', 'fill-blank', 'reading-comprehension', 'sentence-order']
    },
    explanation: { type: String }
}, { _id: false });
const CompetitionRewardSchema = new mongoose_1.Schema({
    xp: { type: Number, required: true, min: 0 },
    coins: { type: Number, required: true, min: 0 }
}, { _id: false });
const CompetitionSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    level: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    cost: { type: Number, required: true, min: 0 },
    reward: { type: CompetitionRewardSchema, required: true },
    prizes: { type: CompetitionPrizeSchema, required: true },
    questions: { type: [CompetitionQuestionSchema], required: true },
    participants: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'User' }],
    isActive: { type: Boolean, default: true },
    status: {
        type: String,
        enum: ['upcoming', 'active', 'ended'],
        default: 'upcoming'
    },
    maxParticipants: { type: Number, min: 1 }
}, { timestamps: true });
exports.default = mongoose_1.default.model('Competition', CompetitionSchema);
