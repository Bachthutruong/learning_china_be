import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import ProficiencyQuestion from '../models/ProficiencyQuestion';

// Get all proficiency questions with pagination, search, and filtering
export const getAllProficiencyQuestions = async (req: Request, res: Response) => {
  try {
    const { 
      level, 
      questionType, 
      search = '', 
      limit = 10, 
      offset = 0 
    } = req.query;
    
    // Build filter object
    let filter: any = {};
    
    // Filter by level
    if (level && level !== '') {
      filter.level = parseInt(level as string);
    }
    
    // Filter by question type
    if (questionType) {
      filter.questionType = questionType;
    }
    
    // Search in question text
    if (search && search !== '') {
      filter.question = { $regex: search as string, $options: 'i' };
    }

    // Get total count for pagination
    const total = await ProficiencyQuestion.countDocuments(filter);

    // Get paginated results
    const questions = await ProficiencyQuestion.find(filter)
      .sort({ level: 1, createdAt: -1 })
      .skip(parseInt(offset as string))
      .limit(parseInt(limit as string));

    res.json({
      success: true,
      questions,
      total,
      page: Math.floor(parseInt(offset as string) / parseInt(limit as string)) + 1,
      totalPages: Math.ceil(total / parseInt(limit as string)),
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });
  } catch (error) {
    console.error('Get proficiency questions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get proficiency question by ID
export const getProficiencyQuestionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const question = await ProficiencyQuestion.findById(id);

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    res.json({
      success: true,
      question
    });
  } catch (error) {
    console.error('Get proficiency question error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create new proficiency question
export const createProficiencyQuestion = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { question, options, correctAnswer, explanation, level, questionType } = req.body;

    // Validate that we have at least 2 options
    const validOptions = options.filter((opt: string) => opt.trim());
    if (validOptions.length < 2) {
      return res.status(400).json({ message: 'Cần ít nhất 2 phương án' });
    }

    // Validate correct answers
    if (!correctAnswer || correctAnswer.length === 0) {
      return res.status(400).json({ message: 'Cần ít nhất một đáp án đúng' });
    }

    // Validate correct answer indices
    const maxIndex = validOptions.length - 1;
    const invalidAnswers = correctAnswer.filter((answer: number) => answer < 0 || answer > maxIndex);
    if (invalidAnswers.length > 0) {
      return res.status(400).json({ message: 'Đáp án đúng không hợp lệ' });
    }

    const proficiencyQuestion = new ProficiencyQuestion({
      question: question.trim(),
      options: validOptions,
      correctAnswer,
      explanation: explanation?.trim() || '',
      level: parseInt(level),
      questionType
    });

    await proficiencyQuestion.save();

    res.status(201).json({
      success: true,
      message: 'Tạo câu hỏi thành công',
      question: proficiencyQuestion
    });
  } catch (error) {
    console.error('Create proficiency question error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update proficiency question
export const updateProficiencyQuestion = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { question, options, correctAnswer, explanation, level, questionType } = req.body;

    // Validate that we have at least 2 options
    const validOptions = options.filter((opt: string) => opt.trim());
    if (validOptions.length < 2) {
      return res.status(400).json({ message: 'Cần ít nhất 2 phương án' });
    }

    // Validate correct answers
    if (!correctAnswer || correctAnswer.length === 0) {
      return res.status(400).json({ message: 'Cần ít nhất một đáp án đúng' });
    }

    // Validate correct answer indices
    const maxIndex = validOptions.length - 1;
    const invalidAnswers = correctAnswer.filter((answer: number) => answer < 0 || answer > maxIndex);
    if (invalidAnswers.length > 0) {
      return res.status(400).json({ message: 'Đáp án đúng không hợp lệ' });
    }

    const proficiencyQuestion = await ProficiencyQuestion.findByIdAndUpdate(
      id,
      {
        question: question.trim(),
        options: validOptions,
        correctAnswer,
        explanation: explanation?.trim() || '',
        level: parseInt(level),
        questionType
      },
      { new: true, runValidators: true }
    );

    if (!proficiencyQuestion) {
      return res.status(404).json({ message: 'Question not found' });
    }

    res.json({
      success: true,
      message: 'Cập nhật câu hỏi thành công',
      question: proficiencyQuestion
    });
  } catch (error) {
    console.error('Update proficiency question error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete proficiency question
export const deleteProficiencyQuestion = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const proficiencyQuestion = await ProficiencyQuestion.findByIdAndDelete(id);

    if (!proficiencyQuestion) {
      return res.status(404).json({ message: 'Question not found' });
    }

    res.json({
      success: true,
      message: 'Xóa câu hỏi thành công'
    });
  } catch (error) {
    console.error('Delete proficiency question error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get random proficiency questions by level
export const getRandomProficiencyQuestions = async (req: Request, res: Response) => {
  try {
    const { level, count = 10 } = req.query;
    
    if (!level) {
      return res.status(400).json({ message: 'Level is required' });
    }

    const questions = await ProficiencyQuestion.aggregate([
      { $match: { level: parseInt(level as string) } },
      { $sample: { size: parseInt(count as string) } }
    ]);

    res.json({
      success: true,
      questions
    });
  } catch (error) {
    console.error('Get random proficiency questions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
