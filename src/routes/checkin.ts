import express from 'express'
import { authenticate } from '../middleware/auth'
import { getCheckinStatus, performCheckin } from '../controllers/checkinController'

const router = express.Router()

router.get('/status', authenticate as any, getCheckinStatus as any)
router.post('/', authenticate as any, performCheckin as any)

export default router


