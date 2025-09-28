import mongoose, { Document, Schema } from 'mongoose'

export interface IReport extends Document {
  userId: mongoose.Types.ObjectId
  type: 'vocabulary' | 'question' | 'test'
  targetId: string // ID của từ vựng, câu hỏi, hoặc test
  category: string // Loại lỗi: "Từ loại không đúng", "Phát âm sai", etc.
  description: string // Mô tả chi tiết lỗi
  status: 'pending' | 'reviewed' | 'resolved' | 'rejected'
  adminNotes?: string
  createdAt: Date
  updatedAt: Date
}

const ReportSchema = new Schema<IReport>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true, enum: ['vocabulary', 'question', 'test'] },
  targetId: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'reviewed', 'resolved', 'rejected'], 
    default: 'pending' 
  },
  adminNotes: { type: String, trim: true }
}, { timestamps: true })

const Report = mongoose.model<IReport>('Report', ReportSchema)
export default Report