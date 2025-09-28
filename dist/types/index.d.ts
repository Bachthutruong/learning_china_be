export interface User {
    _id: string;
    email: string;
    password: string;
    name: string;
    level: number;
    experience: number;
    coins: number;
    streak: number;
    lastCheckIn: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface Vocabulary {
    _id: string;
    word: string;
    pronunciation: string;
    meaning: string;
    audioUrl?: string;
    level: number;
    topics: string[];
    partOfSpeech: string;
    synonyms: string[];
    antonyms: string[];
    examples: string[];
    questions: Question[];
    createdAt: Date;
    updatedAt: Date;
}
export interface Question {
    question: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
}
export interface Topic {
    _id: string;
    name: string;
    description: string;
    color: string;
    createdAt: Date;
}
export interface Level {
    _id: string;
    name: string;
    number: number;
    description: string;
    requiredExperience: number;
    color: string;
}
export interface Test {
    _id: string;
    title: string;
    description: string;
    level: number;
    questions: Question[];
    timeLimit: number;
    requiredCoins: number;
    rewardExperience: number;
    rewardCoins: number;
    createdAt: Date;
}
export interface ProficiencyTest {
    _id: string;
    level: 'A' | 'B' | 'C';
    questions: Question[];
    timeLimit: number;
    requiredCoins: number;
    rewardExperience: number;
    rewardCoins: number;
}
export interface Competition {
    _id: string;
    title: string;
    description: string;
    startDate: Date;
    endDate: Date;
    level: number;
    questions: Question[];
    timeLimit: number;
    requiredCoins: number;
    rewardExperience: number;
    rewardCoins: number;
    participants: string[];
    leaderboard: CompetitionResult[];
}
export interface CompetitionResult {
    userId: string;
    score: number;
    timeSpent: number;
    rank: number;
}
export interface UserProgress {
    _id: string;
    userId: string;
    vocabularyId: string;
    isCompleted: boolean;
    completedAt?: Date;
    attempts: number;
}
export interface TestResult {
    _id: string;
    userId: string;
    testId: string;
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    timeSpent: number;
    completedAt: Date;
}
export interface ProficiencyTestResult {
    _id: string;
    userId: string;
    level: 'A' | 'B' | 'C';
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    timeSpent: number;
    completedAt: Date;
    proficiencyLevel: string;
}
export interface CompetitionResult {
    _id: string;
    userId: string;
    competitionId: string;
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    timeSpent: number;
    completedAt: Date;
    rank: number;
}
export interface Report {
    _id: string;
    userId: string;
    type: 'vocabulary' | 'test' | 'proficiency';
    targetId: string;
    category: string;
    description: string;
    status: 'pending' | 'approved' | 'rejected';
    rewardExperience?: number;
    rewardCoins?: number;
    adminNotes?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface CheckIn {
    _id: string;
    userId: string;
    date: Date;
    streak: number;
    rewardExperience: number;
    rewardCoins: number;
}
export interface Purchase {
    _id: string;
    userId: string;
    amount: number;
    coins: number;
    paymentMethod: string;
    status: 'pending' | 'completed' | 'failed';
    createdAt: Date;
}
//# sourceMappingURL=index.d.ts.map