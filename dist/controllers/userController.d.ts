import { Request, Response } from 'express';
export declare const checkIn: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getUserStats: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const purchaseCoins: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getPaymentHistory: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getLeaderboard: (req: Request, res: Response) => Promise<void>;
export declare const getAllUsers: (req: Request, res: Response) => Promise<void>;
export declare const getUserAchievements: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getUserLearningStats: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getProfile: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const forceRecalculateAllLevels: (req: any, res: Response) => Promise<void>;
export declare const recalculateLevel: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=userController.d.ts.map