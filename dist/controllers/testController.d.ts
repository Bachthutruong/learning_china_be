import { Request, Response } from 'express';
export declare const getTests: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getTestById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createTest: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateTest: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteTest: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const startTest: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getRandomQuestions: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const submitTest: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getTestByLevel: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getTestStats: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=testController.d.ts.map