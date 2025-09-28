import { Response } from 'express';
export declare const createCoinPurchase: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getUserCoinPurchases: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getCoinPurchaseById: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getPendingCoinPurchases: (req: any, res: Response) => Promise<void>;
export declare const approveCoinPurchase: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const rejectCoinPurchase: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getAllCoinPurchases: (req: any, res: Response) => Promise<void>;
//# sourceMappingURL=coinPurchaseController.d.ts.map