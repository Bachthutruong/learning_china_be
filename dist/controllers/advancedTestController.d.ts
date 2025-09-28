import { Request, Response } from 'express';
export declare const getQuestionTypes: (req: Request, res: Response) => Promise<void>;
export declare const createAdvancedTest: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const submitAdvancedTest: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const generateQuestionsByType: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=advancedTestController.d.ts.map