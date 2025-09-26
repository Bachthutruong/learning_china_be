# 🧠 Hệ thống học từ vựng thông minh

Tài liệu hướng dẫn sử dụng hệ thống học từ vựng thông minh và các loại câu hỏi đa dạng.

## 🎯 Tính năng chính

### 1. Hệ thống gợi ý từ vựng thông minh
- **Gợi ý theo chủ đề**: Hệ thống sẽ gợi ý 10 từ vựng theo chủ đề người dùng chọn
- **Tìm kiếm từ khóa**: Người dùng có thể tìm kiếm từ vựng bằng từ khóa
- **Thêm từ tùy chỉnh**: Người dùng có thể thêm từ vựng vào danh sách học tập của mình

### 2. Quy trình học từ vựng
1. **Hiển thị từ vựng**: Người dùng nhìn thấy từ vựng trước
2. **Click để xem thông tin**: Hiển thị nghĩa, phát âm, ví dụ
3. **Chọn trạng thái**: Đã thuộc, Cần học thêm, Bỏ qua
4. **Kiểm tra kiến thức**: Nếu chọn "Đã thuộc", sẽ có bài kiểm tra 3 câu hỏi
5. **Cập nhật tiến độ**: Hệ thống tự động cập nhật trạng thái học tập

### 3. Các loại câu hỏi đa dạng
- **Trắc nghiệm**: Chọn một đáp án đúng từ các lựa chọn
- **Điền từ**: Điền từ vào chỗ trống
- **Đọc hiểu**: Đọc đoạn văn và trả lời câu hỏi
- **Sắp xếp câu**: Sắp xếp các từ thành câu hoàn chỉnh
- **Ghép cặp**: Ghép các từ/cụm từ với nghĩa tương ứng
- **Đúng/Sai**: Chọn đúng hoặc sai cho câu phát biểu

## 🚀 Cách sử dụng

### Backend API Endpoints

#### Smart Vocabulary
```bash
# Lấy tiến độ học tập
GET /api/smart-vocabulary/progress

# Lấy gợi ý từ vựng
GET /api/smart-vocabulary/suggestions?topic=Gia đình&limit=10

# Tìm kiếm từ vựng
GET /api/smart-vocabulary/search?keywords=你好

# Lấy từ vựng tiếp theo cần học
GET /api/smart-vocabulary/next

# Thêm từ vựng vào danh sách học
POST /api/smart-vocabulary/add
{
  "vocabularyIds": ["vocab1", "vocab2"],
  "customTopic": "Tùy chỉnh"
}

# Cập nhật trạng thái từ vựng
PUT /api/smart-vocabulary/status
{
  "userVocabularyId": "userVocabId",
  "status": "known"
}

# Lấy câu hỏi kiểm tra
GET /api/smart-vocabulary/quiz/:userVocabularyId

# Hoàn thành học từ vựng
POST /api/smart-vocabulary/complete
{
  "userVocabularyId": "userVocabId",
  "quizAnswers": [0, 1, 2]
}
```

#### Advanced Tests
```bash
# Lấy các loại câu hỏi
GET /api/advanced-tests/question-types

# Tạo test nâng cao
POST /api/advanced-tests/create
{
  "title": "Test nâng cao",
  "description": "Mô tả test",
  "level": 3,
  "questions": [...],
  "timeLimit": 30,
  "requiredCoins": 10,
  "rewardExperience": 50,
  "rewardCoins": 25
}

# Nộp bài test
POST /api/advanced-tests/submit
{
  "testId": "testId",
  "answers": [...]
}

# Tạo câu hỏi theo loại
GET /api/advanced-tests/generate?type=multiple-choice&level=2&count=10
```

### Frontend Routes

```bash
# Trang học từ vựng thông minh
/smart-vocabulary

# Trang từ vựng truyền thống
/vocabulary

# Trang bài test
/tests
```

## 📊 Database Schema

### UserVocabulary Model
```typescript
interface IUserVocabulary {
  userId: ObjectId;
  vocabularyId: ObjectId;
  status: 'learning' | 'known' | 'needs-study' | 'skipped';
  addedAt: Date;
  learnedAt?: Date;
  studyCount: number;
  lastStudied?: Date;
  customTopic?: string;
  isCustom: boolean;
}
```

### QuestionType Model
```typescript
interface IQuestionType {
  type: 'multiple-choice' | 'fill-blank' | 'reading-comprehension' | 'sentence-order' | 'matching' | 'true-false';
  name: string;
  description: string;
  icon: string;
  isActive: boolean;
}
```

### Enhanced Test Model
```typescript
interface IQuestion {
  question: string;
  questionType: string;
  options?: string[];
  correctAnswer: number | string | number[];
  explanation?: string;
  // For reading comprehension
  passage?: string;
  // For fill-blank questions
  blanks?: { position: number; correctAnswer: string }[];
  // For sentence ordering
  sentences?: string[];
  correctOrder?: number[];
  // For matching questions
  leftItems?: string[];
  rightItems?: string[];
  correctMatches?: { left: number; right: number }[];
  // For true-false questions
  isTrue?: boolean;
}
```

## 🎮 Quy trình học tập

### 1. Người dùng mới
1. Hệ thống gợi ý chọn chủ đề hoặc tìm kiếm từ khóa
2. Chọn từ vựng muốn học
3. Bắt đầu quá trình học

### 2. Quá trình học
1. **Hiển thị từ vựng**: Chỉ hiển thị từ, không hiển thị nghĩa
2. **Người dùng suy nghĩ**: Cố gắng nhớ nghĩa của từ
3. **Click xem thông tin**: Hiển thị nghĩa, phát âm, ví dụ
4. **Đánh giá bản thân**: Chọn trạng thái phù hợp
5. **Kiểm tra kiến thức**: Nếu chọn "Đã thuộc", làm bài kiểm tra
6. **Cập nhật tiến độ**: Hệ thống ghi nhận kết quả

### 3. Hệ thống gợi ý
- **Gợi ý 10 từ**: Mỗi lần học xong 1 từ, hệ thống gợi ý từ mới
- **Theo chủ đề**: Ưu tiên từ vựng cùng chủ đề
- **Theo trình độ**: Chỉ gợi ý từ vựng phù hợp với level người dùng
- **Tìm kiếm**: Người dùng có thể tìm kiếm từ vựng cụ thể

## 🔧 Cấu hình

### Environment Variables
```env
MONGODB_URI=mongodb://localhost:27017/chinese-learning
JWT_SECRET=your_jwt_secret
```

### Dependencies
```json
{
  "mongoose": "^8.0.3",
  "express": "^4.18.2",
  "express-validator": "^7.0.1"
}
```

## 📈 Analytics

### Thống kê học tập
- **Tổng số từ**: Tổng số từ vựng trong danh sách
- **Đã thuộc**: Số từ đã học thuộc
- **Đang học**: Số từ đang trong quá trình học
- **Cần học thêm**: Số từ cần ôn tập
- **Bỏ qua**: Số từ đã bỏ qua

### Tiến độ học tập
- **Tỷ lệ hoàn thành**: (Đã thuộc / Tổng số) * 100
- **Số lần học**: Thống kê số lần học của mỗi từ
- **Thời gian học**: Thời gian học tập trung bình

## 🎯 Lợi ích

### Cho người dùng
- **Học tập cá nhân hóa**: Hệ thống gợi ý phù hợp với trình độ
- **Quy trình học khoa học**: Từ nhìn → suy nghĩ → kiểm tra → đánh giá
- **Đa dạng câu hỏi**: Nhiều loại câu hỏi giúp học tập hiệu quả
- **Theo dõi tiến độ**: Biết rõ mình đã học được gì

### Cho hệ thống
- **Dữ liệu học tập**: Thu thập dữ liệu về quá trình học của người dùng
- **Cải thiện gợi ý**: Học từ hành vi người dùng để gợi ý tốt hơn
- **Phân tích hiệu quả**: Đánh giá hiệu quả của các phương pháp học

## 🚀 Tương lai

### Tính năng sắp tới
- **AI gợi ý**: Sử dụng AI để gợi ý từ vựng thông minh hơn
- **Học theo ngữ cảnh**: Học từ vựng trong câu, đoạn văn
- **Gamification**: Thêm yếu tố game để tăng hứng thú học tập
- **Social Learning**: Học cùng bạn bè, thi đua

### Cải thiện
- **Thuật toán gợi ý**: Cải thiện thuật toán gợi ý từ vựng
- **Phân tích dữ liệu**: Phân tích sâu hơn về hành vi học tập
- **Tối ưu UX**: Cải thiện trải nghiệm người dùng

---

**Hệ thống học từ vựng thông minh giúp người dùng học tiếng Trung hiệu quả hơn thông qua quy trình học khoa học và gợi ý cá nhân hóa! 🎉**

