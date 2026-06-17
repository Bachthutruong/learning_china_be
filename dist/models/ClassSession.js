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
const ClassExerciseSchema = new mongoose_1.Schema({
    questionId: { type: String, required: true },
    sourceTestId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Test' },
    testTitle: { type: String, default: '' },
    level: { type: Number },
    questionType: { type: String, required: true },
    question: { type: String, required: true },
    options: [{ type: String }],
    correctAnswer: mongoose_1.Schema.Types.Mixed,
    explanation: { type: String, default: '' },
    passage: { type: String, default: '' },
    sentences: [{ type: String }],
    correctOrder: [{ type: Number }],
    subQuestions: [{
            question: String,
            options: [String],
            correctAnswer: Number
        }]
}, { _id: false });
const ClassSessionSchema = new mongoose_1.Schema({
    classId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'LearningClass',
        required: true,
        index: true
    },
    title: {
        type: String,
        required: [true, 'Session title is required'],
        trim: true
    },
    startAt: {
        type: Date,
        required: true
    },
    endAt: {
        type: Date,
        required: true
    },
    durationMinutes: {
        type: Number,
        min: 15,
        default: 90
    },
    googleMeetLink: {
        type: String,
        trim: true,
        default: ''
    },
    content: {
        type: String,
        trim: true,
        default: ''
    },
    vocabularyIds: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Vocabulary'
        }],
    exercises: [ClassExerciseSchema],
    vocabularyDeadline: {
        type: Date,
        required: true
    },
    exerciseDeadline: {
        type: Date,
        required: true
    },
    feedbackDeadline: {
        type: Date,
        required: true
    },
    recurringDays: [{
            type: Number,
            min: 1,
            max: 7
        }],
    scheduleLabel: {
        type: String,
        trim: true,
        default: ''
    },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});
ClassSessionSchema.index({ classId: 1, startAt: 1 });
exports.default = mongoose_1.default.model('ClassSession', ClassSessionSchema);
