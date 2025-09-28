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
const LevelSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, 'Level name is required'],
        unique: true,
        trim: true
    },
    number: {
        type: Number,
        required: [true, 'Level number is required'],
        unique: true
    },
    description: {
        type: String,
        required: false,
        trim: true,
        default: ''
    },
    requiredExperience: {
        type: Number,
        required: [true, 'Required experience is required'],
        min: 0
    },
    color: {
        type: String,
        required: [true, 'Level color is required'],
        trim: true
    },
    icon: {
        type: String,
        required: false,
        trim: true,
        default: 'star'
    }
}, {
    timestamps: true
});
exports.default = mongoose_1.default.model('Level', LevelSchema);
//# sourceMappingURL=Level.js.map