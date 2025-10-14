import { Request, Response } from 'express';
import UserCompetition from '../models/UserCompetition';
import UserCompetitionRequest from '../models/UserCompetitionRequest';
import UserCompetitionResult from '../models/UserCompetitionResult';
import User from '../models/User';
import Question from '../models/Question';
import { validationResult } from 'express-validator';

// Create a new user competition
export const createUserCompetition = async (req: any, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, numberOfQuestions, timePerQuestion, startTime } = req.body;
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if user has enough coins
    const cost = 10000;
    if (user.coins < cost) {
      return res.status(400).json({ 
        message: 'Không đủ Xu để tạo cuộc thi. Cần 10.000 Xu.', 
        currentCoins: user.coins,
        requiredCoins: cost 
      });
    }
    
    // Validate inputs
    if (numberOfQuestions < 1 || numberOfQuestions > 20) {
      return res.status(400).json({ message: 'Số lượng câu hỏi phải từ 1 đến 20' });
    }
    
    if (timePerQuestion < 0.5 || timePerQuestion > 3) {
      return res.status(400).json({ message: 'Thời gian mỗi câu phải từ 0.5 đến 3 phút' });
    }
    
    // Fetch random questions based on creator's level
    const questions = await Question.aggregate([
      { $match: { level: user.level } },
      { $sample: { size: numberOfQuestions } }
    ]);
    
    if (questions.length < numberOfQuestions) {
      return res.status(400).json({ 
        message: `Không đủ câu hỏi cho cấp độ ${user.level}. Chỉ có ${questions.length} câu.` 
      });
    }
    
    // Calculate total time
    const totalTime = numberOfQuestions * timePerQuestion;
    
    // Calculate end time
    const startTimeDate = new Date(startTime);
    const endTimeDate = new Date(startTimeDate.getTime() + totalTime * 60 * 1000);
    
    // Create competition
    const competition = new UserCompetition({
      creator: user._id,
      title,
      numberOfQuestions,
      timePerQuestion,
      totalTime,
      startTime: startTimeDate,
      endTime: endTimeDate,
      cost,
      level: user.level,
      questions: questions.map(q => ({
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        questionType: q.questionType,
        explanation: q.explanation
      })),
      participants: [user._id] // Creator is automatically a participant
    });
    
    await competition.save();
    
    // Deduct coins from user
    user.coins -= cost;
    await user.save();
    
    // Record coin transaction
    try {
      const CoinTransaction = (await import('../models/CoinTransaction')).default;
      await CoinTransaction.create({
        userId: user._id,
        amount: -cost,
        type: 'spend',
        category: 'competition_create',
        description: `Tạo cuộc thi "${title}"`,
        balanceAfter: user.coins,
        metadata: { competitionId: competition._id }
      });
    } catch (e) {
      console.error('Failed to record coin transaction:', e);
    }
    
    res.status(201).json({
      message: 'Tạo cuộc thi thành công',
      competition: {
        id: competition._id,
        title: competition.title,
        numberOfQuestions: competition.numberOfQuestions,
        totalTime: competition.totalTime,
        startTime: competition.startTime,
        endTime: competition.endTime,
        level: competition.level
      },
      remainingCoins: user.coins
    });
  } catch (error) {
    console.error('Create user competition error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all competitions (pending and active)
export const getUserCompetitions = async (req: Request, res: Response) => {
  try {
    const { status, myCompetitions } = req.query;
    const userId = (req as any).user?._id;
    
    let query: any = {};
    
    if (status) {
      query.status = status;
    }
    
    if (myCompetitions === 'true' && userId) {
      query.$or = [
        { creator: userId },
        { participants: userId }
      ];
    }
    
    const competitions = await UserCompetition.find(query)
      .populate('creator', 'name level')
      .populate('participants', 'name level')
      .sort({ startTime: -1 });
    
    res.json({ competitions });
  } catch (error) {
    console.error('Get user competitions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get competition details
export const getUserCompetitionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?._id;
    
    const competition = await UserCompetition.findById(id)
      .populate('creator', 'name level email')
      .populate('participants', 'name level')
      .populate('pendingRequests', 'name level');
    
    if (!competition) {
      return res.status(404).json({ message: 'Competition not found' });
    }
    
    // Check if user has access to see questions
    const isCreator = competition.creator._id.toString() === userId?.toString();
    const isParticipant = competition.participants.some(p => p._id.toString() === userId?.toString());
    const canSeeQuestions = isCreator || (isParticipant && competition.isStarted);
    
    // Remove questions if user doesn't have access
    const competitionData: any = competition.toObject();
    if (!canSeeQuestions) {
      delete competitionData.questions;
    }
    
    // Check if user has pending request
    const hasPendingRequest = await UserCompetitionRequest.findOne({
      competition: competition._id,
      requester: userId,
      status: 'pending'
    });
    
    console.log('Get competition detail:', {
      competitionId: id,
      userId,
      isCreator,
      isParticipant,
      hasPendingRequest: !!hasPendingRequest,
      competitionStatus: competition.status
    });
    
    // Check if competition is still active (not ended)
    const now = new Date();
    const endTime = new Date(competition.endTime);
    const isCompetitionActive = now < endTime;
    
    res.json({
      competition: competitionData,
      isCreator,
      isParticipant,
      hasPendingRequest: !!hasPendingRequest,
      canJoin: !isCreator && !isParticipant && !hasPendingRequest && isCompetitionActive
    });
  } catch (error) {
    console.error('Get user competition by id error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Request to join competition
export const requestJoinCompetition = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    const competition = await UserCompetition.findById(id);
    if (!competition) {
      return res.status(404).json({ message: 'Competition not found' });
    }
    
    // Check if competition is still active (pending or active)
    const now = new Date();
    const startTime = new Date(competition.startTime);
    const endTime = new Date(competition.endTime);
    
    if (now >= endTime) {
      return res.status(400).json({ message: 'Cuộc thi đã kết thúc' });
    }
    
    // Check if user is creator
    if (competition.creator.toString() === userId.toString()) {
      return res.status(400).json({ message: 'Bạn là người tạo cuộc thi' });
    }
    
    // Check if already participant
    if (competition.participants.includes(userId)) {
      return res.status(400).json({ message: 'Bạn đã tham gia cuộc thi này' });
    }
    
    // Check if already requested
    const existingRequest = await UserCompetitionRequest.findOne({
      competition: competition._id,
      requester: userId
    });
    
    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        return res.status(400).json({ message: 'Bạn đã gửi yêu cầu tham gia' });
      } else if (existingRequest.status === 'rejected') {
        return res.status(400).json({ message: 'Yêu cầu của bạn đã bị từ chối' });
      }
    }
    
    // Create request
    const request = new UserCompetitionRequest({
      competition: competition._id,
      requester: userId
    });
    
    await request.save();
    
    // Add to pending requests
    competition.pendingRequests.push(userId);
    await competition.save();
    
    console.log('Join request created:', {
      requestId: request._id,
      competitionId: competition._id,
      userId,
      status: request.status
    });
    
    res.json({ message: 'Gửi yêu cầu tham gia thành công' });
  } catch (error) {
    console.error('Request join competition error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get pending requests for a competition (creator only)
export const getPendingRequests = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    const competition = await UserCompetition.findById(id);
    if (!competition) {
      return res.status(404).json({ message: 'Competition not found' });
    }
    
    // Check if user is creator
    if (competition.creator.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Chỉ người tạo mới xem được yêu cầu' });
    }
    
    const requests = await UserCompetitionRequest.find({
      competition: competition._id,
      status: 'pending'
    }).populate('requester', 'name level email');
    
    res.json({ requests });
  } catch (error) {
    console.error('Get pending requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Process join request (approve/reject)
export const processJoinRequest = async (req: any, res: Response) => {
  try {
    const { requestId } = req.params;
    const { action } = req.body; // 'approve' or 'reject'
    const userId = req.user._id;
    
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }
    
    const request = await UserCompetitionRequest.findById(requestId)
      .populate('competition')
      .populate('requester', 'name');
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    
    const competition = await UserCompetition.findById(request.competition);
    if (!competition) {
      return res.status(404).json({ message: 'Competition not found' });
    }
    
    // Check if user is creator
    if (competition.creator.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Chỉ người tạo mới có thể duyệt yêu cầu' });
    }
    
    // Check if request is pending
    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Yêu cầu đã được xử lý' });
    }
    
    // Update request
    request.status = action === 'approve' ? 'approved' : 'rejected';
    request.processedAt = new Date();
    request.processedBy = userId;
    await request.save();
    
    // Update competition
    competition.pendingRequests = competition.pendingRequests.filter(
      id => id.toString() !== request.requester._id.toString()
    );
    
    if (action === 'approve') {
      competition.participants.push(request.requester._id);
    }
    
    await competition.save();
    
    res.json({ 
      message: action === 'approve' ? 
        `Đã chấp nhận ${(request.requester as any).name} tham gia cuộc thi` : 
        `Đã từ chối ${(request.requester as any).name}`,
      request
    });
  } catch (error) {
    console.error('Process join request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Approve join request
export const approveJoinRequest = async (req: any, res: Response) => {
  try {
    const { id, requestId } = req.params;
    const userId = req.user._id;
    
    const request = await UserCompetitionRequest.findById(requestId)
      .populate('competition')
      .populate('requester', 'name');
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    
    const competition = await UserCompetition.findById(id);
    if (!competition) {
      return res.status(404).json({ message: 'Competition not found' });
    }
    
    // Check if user is creator
    if (competition.creator.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Chỉ người tạo mới có thể duyệt yêu cầu' });
    }
    
    // Check if request is pending
    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Yêu cầu đã được xử lý' });
    }
    
    // Check if competition is still active
    const now = new Date();
    const endTime = new Date(competition.endTime);
    
    if (now >= endTime) {
      return res.status(400).json({ message: 'Cuộc thi đã kết thúc' });
    }
    
    // Update request
    request.status = 'approved';
    request.processedAt = new Date();
    request.processedBy = userId;
    await request.save();
    
    // Add user to participants
    if (!competition.participants.includes(request.requester._id)) {
      competition.participants.push(request.requester._id);
    }
    
    // Remove from pending requests
    competition.pendingRequests = competition.pendingRequests.filter(
      reqId => reqId.toString() !== requestId
    );
    
    await competition.save();
    
    res.json({ 
      message: `Đã chấp nhận yêu cầu của ${(request.requester as any).name}`,
      request: request
    });
  } catch (error) {
    console.error('Approve join request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reject join request
export const rejectJoinRequest = async (req: any, res: Response) => {
  try {
    const { id, requestId } = req.params;
    const userId = req.user._id;
    
    const request = await UserCompetitionRequest.findById(requestId)
      .populate('competition')
      .populate('requester', 'name');
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    
    const competition = await UserCompetition.findById(id);
    if (!competition) {
      return res.status(404).json({ message: 'Competition not found' });
    }
    
    // Check if user is creator
    if (competition.creator.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Chỉ người tạo mới có thể duyệt yêu cầu' });
    }
    
    // Check if request is pending
    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Yêu cầu đã được xử lý' });
    }
    
    // Update request
    request.status = 'rejected';
    request.processedAt = new Date();
    request.processedBy = userId;
    await request.save();
    
    // Remove from pending requests
    competition.pendingRequests = competition.pendingRequests.filter(
      reqId => reqId.toString() !== requestId
    );
    
    await competition.save();
    
    res.json({ 
      message: `Đã từ chối yêu cầu của ${(request.requester as any).name}`,
      request: request
    });
  } catch (error) {
    console.error('Reject join request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Start competition
export const startCompetition = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    const competition = await UserCompetition.findById(id);
    if (!competition) {
      return res.status(404).json({ message: 'Competition not found' });
    }
    
    // Check if user is participant
    const isParticipant = competition.participants.some(
      p => p.toString() === userId.toString()
    );
    
    if (!isParticipant) {
      return res.status(403).json({ message: 'Bạn không phải thành viên của cuộc thi này' });
    }
    
    // Check if competition can start
    const now = new Date();
    const startTime = new Date(competition.startTime);
    const endTime = new Date(competition.endTime);
    
    if (now < startTime) {
      return res.status(400).json({ message: 'Chưa đến giờ bắt đầu cuộc thi' });
    }
    
    if (now >= endTime) {
      return res.status(400).json({ message: 'Cuộc thi đã kết thúc' });
    }
    
    // Check if user already has result
    const existingResult = await UserCompetitionResult.findOne({
      competition: competition._id,
      user: userId
    });
    
    if (existingResult) {
      return res.status(400).json({ message: 'Bạn đã hoàn thành cuộc thi này' });
    }
    
    // Mark competition as started if not already
    if (!competition.isStarted) {
      competition.isStarted = true;
      competition.status = 'active';
      await competition.save();
    }
    
    // Calculate remaining time for late joiners
    const remainingTimeMs = endTime.getTime() - now.getTime();
    const remainingTimeMinutes = Math.floor(remainingTimeMs / (1000 * 60));
    
    res.json({
      message: 'Bắt đầu cuộc thi',
      competition: {
        id: competition._id,
        questions: competition.questions,
        totalTime: competition.totalTime,
        endTime: competition.endTime,
        remainingTime: remainingTimeMinutes, // Time left in minutes
        isLateJoiner: now > startTime // Whether user joined after start time
      }
    });
  } catch (error) {
    console.error('Start competition error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Submit competition answers
export const submitCompetitionAnswers = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { answers, startedAt } = req.body;
    const userId = req.user._id;
    
    const competition = await UserCompetition.findById(id);
    if (!competition) {
      return res.status(404).json({ message: 'Competition not found' });
    }
    
    // Check if user is participant
    const isParticipant = competition.participants.some(
      p => p.toString() === userId.toString()
    );
    
    if (!isParticipant) {
      return res.status(403).json({ message: 'Bạn không phải thành viên của cuộc thi này' });
    }
    
    // Check if already submitted
    const existingResult = await UserCompetitionResult.findOne({
      competition: competition._id,
      user: userId
    });
    
    if (existingResult) {
      return res.status(400).json({ message: 'Bạn đã nộp bài' });
    }
    
    // Validate answers array
    if (!answers || !Array.isArray(answers) || answers.length !== competition.questions.length) {
      return res.status(400).json({ 
        message: `Số lượng câu trả lời không đúng. Cần ${competition.questions.length} câu.` 
      });
    }
    
    // Calculate results
    const completedAt = new Date();
    const timeSpent = Math.floor((completedAt.getTime() - new Date(startedAt).getTime()) / 1000);
    
    console.log('Time calculation:', {
      startedAt,
      completedAt: completedAt.toISOString(),
      timeSpent,
      isValidTime: !isNaN(timeSpent) && timeSpent >= 0
    });
    
    // Validate timeSpent
    const validTimeSpent = !isNaN(timeSpent) && timeSpent >= 0 ? timeSpent : 0;
    
    console.log('Submit competition answers:', {
      competitionId: id,
      userId,
      answersCount: answers.length,
      questionsCount: competition.questions.length,
      answers: answers.map((a: any, i: number) => ({
        index: i,
        userAnswer: a.userAnswer,
        timeSpent: a.timeSpent
      }))
    });
    
    let correctCount = 0;
    const processedAnswers = answers.map((answer: any, index: number) => {
      const question = competition.questions[index];
      
      // Handle null/undefined userAnswer
      const userAnswer = answer.userAnswer !== null && answer.userAnswer !== undefined 
        ? answer.userAnswer 
        : null;
      
      let isCorrect = false;
      if (userAnswer !== null) {
        if (Array.isArray(question.correctAnswer)) {
          // For multiple choice questions
          isCorrect = JSON.stringify(question.correctAnswer.sort()) === JSON.stringify(userAnswer.sort());
        } else {
          // For single choice questions
          isCorrect = question.correctAnswer === userAnswer;
        }
      }
      
      if (isCorrect) correctCount++;
      
      return {
        questionIndex: index,
        userAnswer: userAnswer,
        isCorrect,
        timeSpent: answer.timeSpent || 0
      };
    });
    
    const score = Math.round((correctCount / competition.questions.length) * 100);
    
    // Create result
    const result = new UserCompetitionResult({
      competition: competition._id,
      user: userId,
      score,
      correctAnswers: correctCount,
      totalQuestions: competition.questions.length,
      timeSpent: validTimeSpent,
      startedAt: new Date(startedAt),
      completedAt,
      answers: processedAnswers
    });
    
    try {
      await result.save();
    } catch (saveError: any) {
      console.error('Save result error:', saveError);
      return res.status(500).json({ 
        message: 'Lỗi khi lưu kết quả thi',
        error: saveError.message 
      });
    }
    
    // Calculate rank
    const allResults = await UserCompetitionResult.find({ competition: competition._id })
      .sort({ score: -1, timeSpent: 1 });
    
    const rank = allResults.findIndex(r => (r._id as any).toString() === (result._id as any).toString()) + 1;
    result.rank = rank;
    
    try {
      await result.save();
    } catch (rankError: any) {
      console.error('Save rank error:', rankError);
      // Don't fail the request if rank saving fails
    }
    
    res.json({
      message: 'Nộp bài thành công',
      result: {
        score,
        correctAnswers: correctCount,
        totalQuestions: competition.questions.length,
        timeSpent: validTimeSpent,
        rank
      }
    });
  } catch (error) {
    console.error('Submit competition answers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get competition results
export const getCompetitionResults = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const competition = await UserCompetition.findById(id)
      .populate('creator', 'name')
      .populate('participants', 'name level');
    
    if (!competition) {
      return res.status(404).json({ message: 'Competition not found' });
    }
    
    const results = await UserCompetitionResult.find({ competition: competition._id })
      .populate('user', 'name level')
      .sort({ score: -1, timeSpent: 1 });
    
    // Update ranks
    results.forEach((result, index) => {
      result.rank = index + 1;
    });
    
    res.json({
      competition: {
        id: competition._id,
        title: competition.title,
        creator: competition.creator,
        status: competition.status,
        startTime: competition.startTime,
        endTime: competition.endTime,
        totalParticipants: competition.participants.length
      },
      results: results.map(r => ({
        rank: r.rank,
        user: r.user,
        score: r.score,
        correctAnswers: r.correctAnswers,
        totalQuestions: r.totalQuestions,
        timeSpent: r.timeSpent,
        completedAt: r.completedAt
      }))
    });
  } catch (error) {
    console.error('Get competition results error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user's competition history
export const getUserCompetitionHistory = async (req: any, res: Response) => {
  try {
    const userId = req.user._id;
    
    const results = await UserCompetitionResult.find({ user: userId })
      .populate({
        path: 'competition',
        populate: {
          path: 'creator',
          select: 'name'
        }
      })
      .sort({ completedAt: -1 });
    
    res.json({ results });
  } catch (error) {
    console.error('Get user competition history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update competition status (for cron job or manual trigger)
export const updateCompetitionStatuses = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    
    // Update completed competitions
    await UserCompetition.updateMany(
      { 
        status: { $ne: 'completed' },
        endTime: { $lte: now }
      },
      { status: 'completed' }
    );
    
    // Update active competitions
    await UserCompetition.updateMany(
      {
        status: 'pending',
        startTime: { $lte: now },
        endTime: { $gt: now },
        isStarted: true
      },
      { status: 'active' }
    );
    
    res.json({ message: 'Competition statuses updated' });
  } catch (error) {
    console.error('Update competition statuses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
