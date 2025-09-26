# 🚀 Quick Start - Database Seeding

Hướng dẫn nhanh để seed dữ liệu cho hệ thống học tiếng Trung.

## ⚡ Cách nhanh nhất

```bash
# Chạy script hoàn chỉnh (Khuyến nghị)
npm run seed:complete
```

**Kết quả:** Hệ thống sẽ có đầy đủ dữ liệu để test tất cả tính năng!

## 📋 Các lựa chọn khác

### 1. Seed từng phần
```bash
# Dữ liệu cơ bản
npm run seed:data

# Dữ liệu nâng cao
npm run seed:advanced

# Admin user
npm run seed:admin
```

### 2. Seed tất cả cùng lúc
```bash
# Chạy tất cả script
npm run seed:all

# Hoặc sử dụng master script
npm run seed:master
```

## 🎯 Sau khi seed xong

### Admin Dashboard
- **Login:** admin@example.com / Admin@123456
- **Features:** Thống kê đầy đủ, quản lý users, vocabularies, tests

### Test Users
- **20+ users** với các cấp độ khác nhau (1-6)
- **Experience & Coins** khác nhau
- **Streak** khác nhau

### Content
- **10 topics** với màu sắc đẹp
- **6 levels** với yêu cầu experience
- **25+ vocabularies** từ cơ bản đến nâng cao
- **6 tests** với độ khó khác nhau
- **3 proficiency tests** (A, B, C)
- **3 competitions** với phần thưởng hấp dẫn

### Analytics
- **Real data** cho dashboard
- **Competition results** với rankings
- **Payment history** 
- **Reports** với trạng thái khác nhau

## 🔧 Troubleshooting

### Lỗi kết nối database
```bash
# Kiểm tra MONGODB_URI trong .env
echo $MONGODB_URI
```

### Lỗi dependencies
```bash
# Cài đặt lại dependencies
npm install
```

### Lỗi TypeScript
```bash
# Build project
npm run build
```

## 📊 Kết quả mong đợi

Sau khi chạy `npm run seed:complete`:

```
✅ Complete database seeded successfully!
📊 Complete Summary:
   - Topics: 10
   - Levels: 6
   - Users: 21 (including admin)
   - Vocabularies: 25
   - Tests: 6
   - Proficiency Tests: 3
   - Competitions: 3
   - Competition Results: 30
   - Reports: 6
   - Payments: 10

🎯 System is now fully populated with realistic data!
🔗 Admin Login: admin@example.com / Admin@123456
👥 Test Users: Various levels from 1-6 with different progress
📚 Content: Comprehensive vocabulary, tests, and competitions
🏆 Analytics: Real data for dashboard and reporting
```

## 🎉 Bắt đầu sử dụng!

1. **Start backend:** `npm run dev`
2. **Start frontend:** `cd ../frontend && npm run dev`
3. **Login as admin:** admin@example.com / Admin@123456
4. **Explore features:** Dashboard, Users, Vocabulary, Tests, Competitions

---

**Chúc bạn có trải nghiệm tuyệt vời với hệ thống! 🎊**

