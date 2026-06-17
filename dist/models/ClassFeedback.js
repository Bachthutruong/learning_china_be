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
const ClassFeedbackSchema = new mongoose_1.Schema({
    classId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'LearningClass',
        required: true,
        index: true
    },
    sessionId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'ClassSession',
        required: true,
        index: true
    },
    studentId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    attendanceChoice: {
        type: String,
        enum: ['full', 'partial', 'absent'],
        default: 'full'
    },
    attendanceReason: {
        type: String,
        trim: true,
        default: ''
    },
    understandingPercent: {
        type: Number,
        enum: [100, 80, 60, 40, 20],
        default: 60
    },
    lessonDifficulty: {
        type: String,
        enum: ['too_easy', 'just_right', 'a_bit_hard', 'very_hard'],
        default: 'just_right'
    },
    vocabularyMemory: {
        type: String,
        enum: ['good', 'partial', 'weak', 'need_review'],
        default: 'partial'
    },
    grammarUnderstanding: {
        type: String,
        enum: ['clear', 'partial', 'unclear', 'need_reteach'],
        default: 'partial'
    },
    teacherRating: {
        type: Number,
        min: 1,
        max: 5,
        default: 3
    },
    unansweredQuestions: {
        type: String,
        trim: true,
        default: ''
    },
    satisfactionRating: {
        type: Number,
        min: 1,
        max: 5,
        default: 3
    },
    additionalComment: {
        type: String,
        trim: true,
        default: ''
    },
    status: {
        type: String,
        enum: ['submitted', 'teacher_seen', 'needs_action', 'resolved'],
        default: 'submitted'
    },
    submittedByStudent: {
        type: Boolean,
        default: true
    },
    submittedAt: {
        type: Date,
        default: Date.now
    },
    teacherConfirmationStatus: {
        type: String,
        enum: ['pending', 'present', 'absent', 'excused'],
        default: 'pending'
    },
    teacherConfirmationReason: {
        type: String,
        trim: true,
        default: ''
    },
    teacherNote: {
        type: String,
        trim: true,
        default: ''
    },
    teacherUpdatedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User'
    },
    teacherUpdatedAt: Date
}, {
    timestamps: true
});
ClassFeedbackSchema.index({ sessionId: 1, studentId: 1 }, { unique: true });
exports.default = mongoose_1.default.model('ClassFeedback', ClassFeedbackSchema);
