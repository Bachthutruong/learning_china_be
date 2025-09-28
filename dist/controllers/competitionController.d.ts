import { Request, Response } from 'express';
export declare const getCompetitions: (req: Request, res: Response) => Promise<void>;
export declare const getCompetitionById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const joinCompetition: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getCompetitionQuestions: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const submitCompetition: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getCompetitionLeaderboard: (req: Request, res: Response) => Promise<void>;
export declare const getGlobalLeaderboard: (_req: Request, res: Response) => Promise<void>;
export declare const getCompetitionStats: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=competitionController.d.ts.map