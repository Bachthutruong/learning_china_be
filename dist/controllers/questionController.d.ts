import { Response } from 'express';
export declare const getNextQuestions: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const submitAnswer: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getProgressSummary: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const listQuestions: (req: any, res: Response) => Promise<void>;
export declare const createQuestion: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateQuestion: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteQuestion: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=questionController.d.ts.map