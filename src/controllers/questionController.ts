import { Request, Response } from 'express';
import * as XLSX from 'xlsx';
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

// Get all questions for a specific level
export const getAllQuestionsByLevel = async (req: any, res: Response) => {
  try {
    const { level } = req.query;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const questions = await Question.find({ level: Number(level) || user.level })
      .sort({ createdAt: 1 }); // Sort by creation date for consistent order

    res.json({ questions, level: Number(level) || user.level, total: questions.length });
  } catch (error) {
    console.error('getAllQuestionsByLevel error:', error);
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

    // Determine correctness based on question type
    let isCorrect = false;
    
    if (question.questionType === 'multiple-choice') {
      if (Array.isArray(question.correctAnswer)) {
        const a = Array.isArray(answer) ? [...answer].sort() : []
        const b = [...question.correctAnswer].sort()
        isCorrect = a.length === b.length && a.every((v, i) => v === b[i])
      } else {
        isCorrect = Number(answer) === Number(question.correctAnswer)
      }
    } else if (question.questionType === 'fill-blank') {
      const ca = typeof question.correctAnswer === 'string' ? question.correctAnswer : ''
      isCorrect = String(answer || '').trim().toLowerCase() === ca.trim().toLowerCase()
    } else if (question.questionType === 'sentence-order') {
      const a = Array.isArray(answer) ? answer : []
      const b = Array.isArray(question.correctOrder) ? question.correctOrder : []
      isCorrect = a.length === b.length && a.every((v, i) => v === b[i])
    } else if (question.questionType === 'reading-comprehension') {
      if (question.subQuestions && Array.isArray(answer)) {
        isCorrect = question.subQuestions.every((subQ, idx) => {
          const subQUserAns = answer[idx]
          return subQ.correctAnswer === subQUserAns
        })
      } else {
        isCorrect = false
      }
    } else {
      // Fallback to old logic for unknown types
      isCorrect = Array.isArray(question.correctAnswer)
        ? JSON.stringify(question.correctAnswer) === JSON.stringify(answer)
        : question.correctAnswer === answer;
    }

    const progress = await UserQuestionProgress.findOneAndUpdate(
      { userId: user._id, questionId },
      { 
        $set: { correct: isCorrect, lastAttemptAt: new Date() }, 
        $inc: { attempts: 1 }
      },
      { upsert: true, new: true }
    );

    // Reward XP and coins when correct
    if (isCorrect) {
      user.experience += 100;
      user.coins += 100;
      await user.save();
      try {
        const CoinTransaction = (await import('../models/CoinTransaction')).default;
        await CoinTransaction.create({
          userId: user._id,
          amount: 100,
          type: 'earn',
          category: 'question',
          description: `Trả lời đúng câu hỏi ${questionId}`,
          balanceAfter: user.coins,
          metadata: { questionId }
        });
      } catch (e) {
        console.error('Failed to record coin transaction (question):', e);
      }
      
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
        experience: updatedUser?.experience || user.experience,
        coins: updatedUser?.coins || user.coins
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

// Download Excel template for Questions
export const downloadQuestionTemplate = async (_req: Request, res: Response) => {
  const headers = [
    'level',
    'questionType',
    'question',
    'options (|| separated, for multiple-choice)',
    'correctAnswer (index or [indexes])',
    'explanation (optional)',
    'passage (for reading-comprehension)',
    'subQuestions (JSON array, for reading-comprehension)',
    'sentences (|| separated, for sentence-order)',
    'correctOrder (JSON array, for sentence-order)'
  ];
  const sample = [
    headers,
    // Câu hỏi 1 đáp án đúng 
    [1, 'multiple-choice', 'Từ "你好" có nghĩa là gì?', 'Xin chào||Tạm biệt||Cảm ơn||Xin lỗi', 0, '你好 nghĩa là "Xin chào" trong tiếng Trung', '', '', ''],
    // Câu hỏi nhiều đáp án đúng
    [1, 'multiple-choice', 'Những từ nào sau đây là từ chào hỏi?', '你好||再见||谢谢||早上好', '[0,3]', '你好 và 早上好 đều là từ chào hỏi', '', '', ''],
    // Câu hỏi điền từ
    [2, 'fill-blank', 'Tôi _____ học tiếng Trung', '', 'đang', 'Điền từ "đang" vào chỗ trống', '', '', ''],
    // Câu hỏi đọc hiểu
    [3, 'reading-comprehension', 'Đọc đoạn văn và trả lời câu hỏi', '', '', 'Câu hỏi đọc hiểu', '小明是一个学生。他每天去学校学习。他喜欢学习中文。', '[{"question":"小明是学生吗？","options":["是","不是","不知道","可能"],"correctAnswer":0},{"question":"小明每天做什么？","options":["去学校学习","在家休息","去工作","去玩"],"correctAnswer":0},{"question":"小明喜欢什么？","options":["学习中文","学习英文","学习数学","学习科学"],"correctAnswer":0}]', '', ''],
    // Câu hỏi sắp xếp câu
    [2, 'sentence-order', 'Sắp xếp các từ thành câu', '', '', 'Thứ tự đúng: 我每天学习中文', '', '我||学习||中文||每天', '[0,3,2,1]']
  ];
  const wb = (XLSX.utils as any).book_new();
  const ws = (XLSX.utils as any).aoa_to_sheet(sample);
  (XLSX.utils as any).book_append_sheet(wb, ws, 'Questions');
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Disposition', 'attachment; filename="questions_template.xlsx"');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  return res.send(buf);
};

// Import Questions from Excel
export const importQuestionsExcel = async (req: any, res: Response) => {
  try {
    if (!req.file || !req.file.buffer) return res.status(400).json({ message: 'Thiếu file' });
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows: any[] = (XLSX.utils as any).sheet_to_json(sheet);
    let created = 0;
    let updated = 0;
    const errors: Array<{ row: number; message: string }> = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        const level = Number(r.level || r.Level || 1);
        const questionType = String(r.questionType || r.QuestionType || 'multiple-choice').trim();
        const question = String(r.question || r.Question || '').trim();
        const optionsRaw = String(r['options (|| separated, for multiple-choice)'] || r.options || '').trim();
        // Handle correctAnswer - it could be 0 (first option) which is falsy
        let correctRaw = '';
        if (r['correctAnswer (index or [indexes])'] !== undefined && r['correctAnswer (index or [indexes])'] !== null) {
          correctRaw = String(r['correctAnswer (index or [indexes])']);
        } else if (r.correctAnswer !== undefined && r.correctAnswer !== null) {
          correctRaw = String(r.correctAnswer);
        } else if (r['correctAnswer'] !== undefined && r['correctAnswer'] !== null) {
          correctRaw = String(r['correctAnswer']);
        }
        correctRaw = correctRaw.trim();
        const explanation = String(r.explanation || r.Explanation || '').trim();
        
        // New fields for different question types - read by column names since index reading failed
        const passage = String(r['passage (for reading-comprehension)'] || r.passage || '').trim();
        const subQuestionsRaw = String(r['subQuestions (JSON array, for reading-comprehension)'] || r.subQuestions || '').trim();
        const sentencesRaw = String(r['sentences (|| separated, for sentence-order)'] || r.sentences || '').trim();
        const correctOrderRaw = String(r['correctOrder (JSON array, for sentence-order)'] || r.correctOrder || '').trim();
        
        // Fix: Handle case where sentences and correctOrder are swapped
        let finalSentencesRaw = sentencesRaw;
        let finalCorrectOrderRaw = correctOrderRaw;
        
        // If sentences contains JSON array and correctOrder is empty, swap them
        if (sentencesRaw && sentencesRaw.startsWith('[') && sentencesRaw.endsWith(']') && (!correctOrderRaw || correctOrderRaw === '')) {
          finalSentencesRaw = correctOrderRaw;
          finalCorrectOrderRaw = sentencesRaw;
          console.log(`Swapped sentences and correctOrder: sentences="${finalSentencesRaw}", correctOrder="${finalCorrectOrderRaw}"`);
        }
        
        // Additional fix: If sentences is still empty, try to get it from subQuestions column
        if (!finalSentencesRaw || finalSentencesRaw === '') {
          if (subQuestionsRaw && subQuestionsRaw.includes('||')) {
            finalSentencesRaw = subQuestionsRaw;
            console.log(`Found sentences in subQuestions column: "${finalSentencesRaw}"`);
          }
        }
        
        // Debug: log the actual data structure
        console.log(`Row ${i + 2} - Raw data structure:`, {
          'r[0]': r[0],
          'r[1]': r[1], 
          'r[2]': r[2],
          'r[3]': r[3],
          'r[4]': r[4],
          'r[5]': r[5],
          'r[6]': r[6],
          'r[7]': r[7],
          'r[8]': r[8],
          'r[9]': r[9],
          'r[10]': r[10]
        });
        
        // Additional fallback for correctOrder - check other possible columns
        let correctOrderFallback = '';
        for (let j = 0; j < 15; j++) {
          const val = String(r[j] || '').trim();
          if (val && val.startsWith('[') && val.endsWith(']')) {
            correctOrderFallback = val;
            console.log(`Found correctOrder in column ${j}: ${val}`);
            break;
          }
        }
        
        // Debug: log the correctAnswer value
        console.log(`Row ${i + 2} - correctAnswer raw:`, r['correctAnswer (index or [indexes])'], 'parsed:', correctRaw);
        console.log(`Row ${i + 2} - sentence-order fields:`, {
          questionType,
          sentencesRaw,
          correctOrderRaw,
          finalSentencesRaw,
          finalCorrectOrderRaw,
          correctOrderFallback,
          rawData: r
        });
        
        // Debug: log all column values for sentence-order
        if (questionType === 'sentence-order') {
          console.log(`Row ${i + 2} - All columns:`, {
            'r[0] (level)': r[0],
            'r[1] (questionType)': r[1],
            'r[2] (question)': r[2],
            'r[3] (options)': r[3],
            'r[4] (correctAnswer)': r[4],
            'r[5] (explanation)': r[5],
            'r[6] (passage)': r[6],
            'r[7] (subQuestions)': r[7],
            'r[8] (sentences)': r[8],
            'r[9] (correctOrder)': r[9],
            'r[10]': r[10],
            'r[11]': r[11]
          });
        }

        if (!question) throw new Error('Thiếu nội dung câu hỏi');

        let options: string[] | undefined = undefined;
        let correctAnswer: any = undefined;
        
        if (questionType === 'multiple-choice') {
          options = optionsRaw ? optionsRaw.split('||').map((t) => t.trim()).filter(Boolean) : [];
          if (!options || options.length < 2) throw new Error('Cần tối thiểu 2 đáp án');
          
          if (!correctRaw) throw new Error('Thiếu đáp án đúng cho câu hỏi trắc nghiệm');
          
          if (correctRaw.startsWith('[')) {
            try {
              const arr = JSON.parse(correctRaw);
              correctAnswer = Array.isArray(arr) ? arr : [];
              // Validate multiple answers
              const invalidIndexes = correctAnswer.filter((idx: any) => 
                !Number.isFinite(idx) || idx < 0 || idx >= (options?.length || 0)
              );
              if (invalidIndexes.length > 0) {
                throw new Error(`Đáp án đúng không hợp lệ: ${invalidIndexes.join(', ')}`);
              }
            } catch (e) {
              throw new Error('Định dạng correctAnswer không hợp lệ (JSON array)');
            }
          } else {
            const idx = Number(correctRaw);
            if (!Number.isFinite(idx)) throw new Error('Định dạng correctAnswer không hợp lệ');
              if (idx < 0 || idx >= (options?.length || 0)) {
              throw new Error(`Đáp án đúng không hợp lệ: ${idx}`);
            }
            correctAnswer = idx;
          }
        } else if (questionType === 'reading-comprehension') {
          // For reading comprehension, subQuestions are provided directly
          // No need to parse options and correctAnswer for main question
          correctAnswer = 0; // Default value, not used
        } else if (questionType === 'fill-blank') {
          if (!correctRaw) throw new Error('Thiếu đáp án đúng cho câu hỏi điền từ');
          correctAnswer = correctRaw;
        } else if (questionType === 'sentence-order') {
          // For sentence-order, correctAnswer will be set later from correctOrderRaw
          correctAnswer = []; // Default empty array
        }

        // Prepare question data based on type
        const questionData: any = {
          level,
          questionType,
          question,
          correctAnswer,
          explanation: explanation || undefined
        };

        // Add type-specific fields
        if (questionType === 'multiple-choice') {
          questionData.options = options;
        } else if (questionType === 'fill-blank') {
          // Fill-blank uses correctAnswer as string
          // No additional fields needed
        } else if (questionType === 'sentence-order') {
          // Parse sentences from finalSentencesRaw
          if (finalSentencesRaw) {
            const sentences = finalSentencesRaw.split('||').map(s => s.trim()).filter(Boolean);
            questionData.sentences = sentences;
          } else {
            throw new Error('Thiếu câu/từ để sắp xếp cho câu hỏi sắp xếp');
          }
          
          // Parse correctOrder from finalCorrectOrderRaw or fallback
          const finalCorrectOrder = finalCorrectOrderRaw || correctOrderFallback;
          console.log(`Debug sentence-order: finalCorrectOrderRaw = "${finalCorrectOrderRaw}", fallback = "${correctOrderFallback}", final = "${finalCorrectOrder}"`);
          if (!finalCorrectOrder || finalCorrectOrder === '') {
            throw new Error('Thiếu thứ tự đúng cho câu hỏi sắp xếp');
          }
          
          try {
            const correctOrder = JSON.parse(finalCorrectOrder);
            if (!Array.isArray(correctOrder)) {
              throw new Error('Thứ tự đúng phải là mảng số');
            }
            questionData.correctOrder = correctOrder;
            questionData.correctAnswer = correctOrder; // Also set correctAnswer for compatibility
          } catch (e) {
            throw new Error('Thứ tự đúng không hợp lệ (JSON array)');
          }
        } else if (questionType === 'reading-comprehension') {
          // Add passage
          if (passage) {
            questionData.passage = passage;
          }
          // Parse subQuestions from subQuestionsRaw
          if (subQuestionsRaw) {
            try {
              const subQuestions = JSON.parse(subQuestionsRaw);
              if (Array.isArray(subQuestions)) {
                // Validate each subQuestion
                for (let i = 0; i < subQuestions.length; i++) {
                  const subQ = subQuestions[i];
                  if (!subQ.question || !subQ.options || !Array.isArray(subQ.options) || subQ.options.length < 2) {
                    throw new Error(`Câu hỏi con ${i + 1} không hợp lệ: cần question và ít nhất 2 options`);
                  }
                  if (typeof subQ.correctAnswer !== 'number' || subQ.correctAnswer < 0 || subQ.correctAnswer >= subQ.options.length) {
                    throw new Error(`Câu hỏi con ${i + 1} có correctAnswer không hợp lệ`);
                  }
                }
                questionData.subQuestions = subQuestions;
              } else {
                throw new Error('subQuestions phải là mảng');
              }
            } catch (e: any) {
              throw new Error(`subQuestions không hợp lệ: ${e.message || 'JSON không hợp lệ'}`);
            }
          } else {
            throw new Error('Thiếu subQuestions cho câu hỏi đọc hiểu');
          }
          // Remove options and correctAnswer from main question for reading comprehension
          delete questionData.options;
          delete questionData.correctAnswer;
        }

        const exist = await Question.findOne({ question });
        if (exist) {
          Object.assign(exist, questionData);
          await exist.save();
          updated++;
        } else {
          await Question.create(questionData);
          created++;
        }
      } catch (e: any) {
        errors.push({ row: i + 2, message: e?.message || 'Lỗi không rõ' });
      }
    }

    return res.json({ message: 'Import hoàn tất', created, updated, errors });
  } catch (error) {
    console.error('importQuestionsExcel error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};


