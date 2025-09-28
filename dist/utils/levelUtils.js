"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNextLevelRequirements = exports.checkAndUpdateUserLevel = void 0;
const User_1 = __importDefault(require("../models/User"));
const Level_1 = __importDefault(require("../models/Level"));
/**
 * Check and update user level based on their experience
 * This function should be called whenever user experience changes
 */
const checkAndUpdateUserLevel = async (userId) => {
    try {
        const user = await User_1.default.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        // Get all levels sorted by number
        const levels = await Level_1.default.find({}).sort({ number: 1 });
        if (levels.length === 0) {
            // Fallback to hardcoded levels if no levels in database
            const fallbackLevels = [
                { number: 1, requiredExperience: 0 },
                { number: 2, requiredExperience: 100 },
                { number: 3, requiredExperience: 300 },
                { number: 4, requiredExperience: 600 },
                { number: 5, requiredExperience: 1000 },
                { number: 6, requiredExperience: 1500 }
            ];
            const currentLevel = fallbackLevels.find(level => user.experience >= level.requiredExperience &&
                (fallbackLevels.find(next => next.number === level.number + 1)?.requiredExperience || Infinity) > user.experience);
            if (currentLevel && currentLevel.number > user.level) {
                user.level = currentLevel.number;
                await user.save();
                return { level: user.level, leveledUp: true, newLevel: currentLevel.number };
            }
            return { level: user.level, leveledUp: false };
        }
        // Find the highest level the user qualifies for based on experience
        let newLevel = 1; // Start from level 1
        for (const level of levels) {
            if (user.experience >= level.requiredExperience) {
                newLevel = level.number;
            }
        }
        // Update user level if it changed (can be up or down)
        if (newLevel !== user.level) {
            const leveledUp = newLevel > user.level;
            user.level = newLevel;
            await user.save();
            return { level: user.level, leveledUp, newLevel: leveledUp ? newLevel : undefined };
        }
        return { level: user.level, leveledUp: false };
    }
    catch (error) {
        console.error('Error checking user level:', error);
        throw error;
    }
};
exports.checkAndUpdateUserLevel = checkAndUpdateUserLevel;
/**
 * Get the next level requirements for a user
 */
const getNextLevelRequirements = async (userId) => {
    try {
        const user = await User_1.default.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        const levels = await Level_1.default.find({}).sort({ number: 1 });
        if (levels.length === 0) {
            // Fallback logic
            const fallbackLevels = [0, 100, 300, 600, 1000, 1500];
            const nextLevelIndex = user.level;
            const nextRequiredXP = fallbackLevels[nextLevelIndex] || null;
            const progress = nextRequiredXP ? (user.experience / nextRequiredXP) * 100 : 100;
            return {
                currentLevel: user.level,
                nextLevel: nextLevelIndex < fallbackLevels.length ? nextLevelIndex + 1 : undefined,
                requiredXP: nextRequiredXP || undefined,
                progress: Math.min(progress, 100)
            };
        }
        const currentLevelData = levels.find(l => l.number === user.level);
        const nextLevelData = levels.find(l => l.number === user.level + 1);
        if (!nextLevelData) {
            return {
                currentLevel: user.level,
                nextLevel: undefined,
                requiredXP: undefined,
                progress: 100
            };
        }
        const progress = (user.experience / nextLevelData.requiredExperience) * 100;
        return {
            currentLevel: user.level,
            nextLevel: nextLevelData.number,
            requiredXP: nextLevelData.requiredExperience,
            progress: Math.min(progress, 100)
        };
    }
    catch (error) {
        console.error('Error getting next level requirements:', error);
        throw error;
    }
};
exports.getNextLevelRequirements = getNextLevelRequirements;
