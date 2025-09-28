/**
 * Check and update user level based on their experience
 * This function should be called whenever user experience changes
 */
export declare const checkAndUpdateUserLevel: (userId: string) => Promise<{
    level: number;
    leveledUp: boolean;
    newLevel?: number;
}>;
/**
 * Get the next level requirements for a user
 */
export declare const getNextLevelRequirements: (userId: string) => Promise<{
    currentLevel: number;
    nextLevel?: number;
    requiredXP?: number;
    progress?: number;
}>;
//# sourceMappingURL=levelUtils.d.ts.map