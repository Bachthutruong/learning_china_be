import { z } from 'zod';
export declare const personalizedVocabularySuggestions: import("@genkit-ai/flow").Flow<z.ZodObject<{
    topic: z.ZodString;
    keywords: z.ZodString;
}, "strip", z.ZodTypeAny, {
    topic: string;
    keywords: string;
}, {
    topic: string;
    keywords: string;
}>, z.ZodObject<{
    suggestedVocabulary: z.ZodArray<z.ZodObject<{
        hanzi: z.ZodString;
        pinyin: z.ZodString;
        meaning: z.ZodString;
        partOfSpeech: z.ZodString;
        level: z.ZodString;
        examples: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        level: string;
        meaning: string;
        partOfSpeech: string;
        examples: string[];
        hanzi: string;
        pinyin: string;
    }, {
        level: string;
        meaning: string;
        partOfSpeech: string;
        examples: string[];
        hanzi: string;
        pinyin: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    suggestedVocabulary: {
        level: string;
        meaning: string;
        partOfSpeech: string;
        examples: string[];
        hanzi: string;
        pinyin: string;
    }[];
}, {
    suggestedVocabulary: {
        level: string;
        meaning: string;
        partOfSpeech: string;
        examples: string[];
        hanzi: string;
        pinyin: string;
    }[];
}>, z.ZodTypeAny>;
export declare function getPersonalizedVocabularySuggestions(input: {
    topic: string;
    keywords: string;
}): Promise<{
    suggestedVocabulary: any[];
}>;
//# sourceMappingURL=personalized-vocabulary-suggestions.d.ts.map