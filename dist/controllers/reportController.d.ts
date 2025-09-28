import { Request, Response } from 'express';
export declare const createReport: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getReports: (req: any, res: Response) => Promise<void>;
export declare const getReportById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getAdminReports: (req: any, res: Response) => Promise<void>;
export declare const updateReportStatus: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=reportController.d.ts.map