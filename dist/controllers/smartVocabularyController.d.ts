import { Response } from 'express';
export declare const getUserVocabularyProgress: (req: any, res: Response) => Promise<void>;
export declare const getVocabularySuggestions: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const addVocabularyToLearning: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getNextVocabularyToLearn: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateVocabularyStatus: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getVocabularyQuiz: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const completeVocabularyLearning: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const searchVocabularyByKeywords: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=smartVocabularyController.d.ts.map