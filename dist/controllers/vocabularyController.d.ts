import { Request, Response } from 'express';
export declare const getVocabularies: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getVocabularyById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createVocabulary: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateVocabulary: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteVocabulary: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getTopics: (req: Request, res: Response) => Promise<void>;
export declare const createTopic: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getSuggestedVocabularies: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const completeVocabulary: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getVocabularyQuiz: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getAISuggestions: (req: any, res: Response) => Promise<void>;
//# sourceMappingURL=vocabularyController.d.ts.map