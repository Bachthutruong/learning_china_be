import { Request, Response } from 'express';
export declare const getVocabularies: (req: Request, res: Response) => Promise<void>;
export declare const getPersonalTopics: (req: Request, res: Response) => Promise<void>;
export declare const createPersonalTopic: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getUserVocabularies: (req: Request, res: Response) => Promise<void>;
export declare const addUserVocabulary: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getVocabularyQuiz: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const completeVocabularyLearning: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getVocabularySuggestions: (req: Request, res: Response) => Promise<void>;
export declare const personalTopicValidation: import("express-validator").ValidationChain[];
export declare const userVocabularyValidation: import("express-validator").ValidationChain[];
export declare const completeLearningValidation: import("express-validator").ValidationChain[];
//# sourceMappingURL=vocabularyLearningController.d.ts.map