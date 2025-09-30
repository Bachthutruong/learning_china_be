import { Request, Response } from 'express'
import User from '../models/User'
import { UserVocabulary } from '../models/UserVocabulary'
import { checkAndUpdateUserLevel } from '../utils/levelUtils'

function getTodayBounds() {
  const now = new Date()
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0))
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999))
  return { start, end }
}

function isSameDay(d1: Date, d2: Date) {
  return d1.getUTCFullYear() === d2.getUTCFullYear() && d1.getUTCMonth() === d2.getUTCMonth() && d1.getUTCDate() === d2.getUTCDate()
}

export const getCheckinStatus = async (req: any, res: Response) => {
  try {
    const userId = req.user._id
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' })
    }

    const { start, end } = getTodayBounds()
    const learnedTodayCount = await UserVocabulary.countDocuments({
      userId: String(userId),
      status: 'learned',
      learnedAt: { $gte: start, $lte: end }
    })

    const checkedInToday = user.lastCheckIn ? isSameDay(new Date(user.lastCheckIn), new Date()) : false

    return res.json({
      learnedTodayCount,
      requiredToCheckin: 3,
      checkedInToday,
      streak: user.streak,
      daysToBonus: (user.streak % 7 === 0 ? 7 : 7 - (user.streak % 7)),
      eligible: !checkedInToday && learnedTodayCount >= 3
    })
  } catch (error) {
    console.error('getCheckinStatus error:', error)
    return res.status(500).json({ message: 'Server error' })
  }
}

export const performCheckin = async (req: any, res: Response) => {
  try {
    const userId = req.user._id
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' })
    }

    // Already checked in today?
    const alreadyToday = user.lastCheckIn ? isSameDay(new Date(user.lastCheckIn), new Date()) : false
    if (alreadyToday) {
      return res.status(400).json({ message: 'Hôm nay bạn đã điểm danh rồi' })
    }

    // Must have learned at least 3 vocabularies today
    const { start, end } = getTodayBounds()
    const learnedTodayCount = await UserVocabulary.countDocuments({
      userId: String(userId),
      status: 'learned',
      learnedAt: { $gte: start, $lte: end }
    })
    if (learnedTodayCount < 3) {
      return res.status(400).json({ message: 'Cần học thành công ít nhất 3 từ vựng hôm nay để điểm danh' })
    }

    // Base rewards
    let experienceGain = 30
    let coinGain = 30

    // Update streak logic: consecutive days only when difference is exactly yesterday; otherwise reset then add 1
    const yesterday = new Date()
    yesterday.setUTCDate(yesterday.getUTCDate() - 1)
    const hadCheckinYesterday = user.lastCheckIn ? isSameDay(new Date(user.lastCheckIn), yesterday) : false
    if (hadCheckinYesterday) {
      user.streak = (user.streak || 0) + 1
    } else {
      // If last check-in is not yesterday and not today, start new streak
      user.streak = 1
    }

    // Bonus on reaching 7 consecutive days
    let bonusGranted = false
    if (user.streak >= 7) {
      experienceGain += 50
      coinGain += 50
      bonusGranted = true
      // reset streak to start a new chain from next day
      user.streak = 0
    }

    user.experience += experienceGain
    user.coins += coinGain
    user.lastCheckIn = new Date()
    await user.save()

    // Level up check
    await checkAndUpdateUserLevel(String(user._id))

    return res.json({
      message: 'Điểm danh thành công',
      rewards: { experience: experienceGain, coins: coinGain, bonusGranted },
      streak: user.streak,
      checkedInToday: true
    })
  } catch (error) {
    console.error('performCheckin error:', error)
    return res.status(500).json({ message: 'Server error' })
  }
}


