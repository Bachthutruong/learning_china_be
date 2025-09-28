import { Request, Response } from 'express';
import Question from '../models/Question';
import User from '../models/User';
import UserQuestionProgress from '../models/UserQuestionProgress';
import { checkAndUpdateUserLevel } from '../utils/levelUtils';
import { validationResult } from 'express-validator';

// Get next questions for user based on level and progress
export const getNextQuestions = async (req: any, res: Response) => {
  try {
    const { limit = 10 } = req.query;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // First fetch incorrect or unseen questions at user's level
    const progressed = await UserQuestionProgress.find({ userId: user._id }).select('questionId correct');
    const incorrectIds = new Set(progressed.filter(p => !p.correct).map(p => String(p.questionId)));
    const seenIds = new Set(progressed.map(p => String(p.questionId)));

    const incorrectQuestions = await Question.find({ _id: { $in: Array.from(incorrectIds) }, level: user.level })
      .limit(Number(limit));

    let remaining = Number(limit) - incorrectQuestions.length;

    const unseenQuestions = remaining > 0
      ? await Question.find({ level: user.level, _id: { $nin: Array.from(seenIds) } }).limit(remaining)
      : [];

    remaining = Number(limit) - incorrectQuestions.length - unseenQuestions.length;

    // If none left, show other level questions starting from 1..6 as fallback
    const fallbackQuestions = remaining > 0
      ? await Question.find({ _id: { $nin: Array.from(seenIds) } }).sort({ level: 1 }).limit(remaining)
      : [];

    const questions = [...incorrectQuestions, ...unseenQuestions, ...fallbackQuestions];
    res.json({ questions, level: user.level });
  } catch (error) {
    console.error('getNextQuestions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Submit answer for a question and update progress + rewards
export const submitAnswer = async (req: any, res: Response) => {
  try {
    const { questionId, answer } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const question = await Question.findById(questionId);
    if (!question) return res.status(404).json({ message: 'Question not found' });

    const isCorrect = Array.isArray(question.correctAnswer)
      ? JSON.stringify(question.correctAnswer) === JSON.stringify(answer)
      : question.correctAnswer === answer;

    const progress = await UserQuestionProgress.findOneAndUpdate(
      { userId: user._id, questionId },
      { 
        $set: { correct: isCorrect, lastAttemptAt: new Date() }, 
        $inc: { attempts: 1 }
      },
      { upsert: true, new: true }
    );

    // Reward simple XP when correct
    if (isCorrect) {
      user.experience += 5;
      await user.save();
      
      // Check for level up using dynamic level requirements
      const levelResult = await checkAndUpdateUserLevel((user._id as any).toString());
    }

    // Get updated user data
    const updatedUser = await User.findById(user._id);
    res.json({ 
      correct: isCorrect, 
      explanation: question.explanation || null, 
      user: { 
        level: updatedUser?.level || user.level, 
        experience: updatedUser?.experience || user.experience 
      } 
    });
  } catch (error) {
    console.error('submitAnswer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getProgressSummary = async (req: any, res: Response) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const totalAtLevel = await Question.countDocuments({ level: user.level });
    const correctAtLevel = await UserQuestionProgress.countDocuments({ userId: user._id, correct: true });

    res.json({ level: user.level, totalAtLevel, correctAtLevel });
  } catch (error) {
    console.error('getProgressSummary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: CRUD Question Bank
export const listQuestions = async (req: any, res: Response) => {
  try {
    const { level, q = '', page = 1, limit = 20 } = req.query;
    const query: any = {};
    if (level) query.level = Number(level);
    if (q) query.question = { $regex: q as string, $options: 'i' };
    const items = await Question.find(query)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));
    const total = await Question.countDocuments(query);
    res.json({ items, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    console.error('listQuestions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createQuestion = async (req: any, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const q = new Question(req.body);
    await q.save();
    res.status(201).json({ message: 'Question created', question: q });
  } catch (error) {
    console.error('createQuestion error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateQuestion = async (req: any, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { id } = req.params;
    const q = await Question.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!q) return res.status(404).json({ message: 'Question not found' });
    res.json({ message: 'Question updated', question: q });
  } catch (error) {
    console.error('updateQuestion error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteQuestion = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const q = await Question.findByIdAndDelete(id);
    if (!q) return res.status(404).json({ message: 'Question not found' });
    res.json({ message: 'Question deleted' });
  } catch (error) {
    console.error('deleteQuestion error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


