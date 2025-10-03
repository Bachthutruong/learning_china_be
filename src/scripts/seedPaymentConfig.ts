import mongoose from 'mongoose';
import PaymentConfig from '../models/PaymentConfig';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const seedPaymentConfig = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chinese-learning');
    console.log('Connected to MongoDB');

    // Clear existing payment configs
    await PaymentConfig.deleteMany({});
    console.log('Cleared existing payment configs');

    // Create default payment config (Taiwan and Vietnam)
    const defaultConfig = new PaymentConfig({
      tw: {
        qrCodeImage: 'https://via.placeholder.com/200x200/000000/FFFFFF?text=TW+QR',
        exchangeRate: 10, // 1 TWD = 10 coins
        bankAccount: '1234567890',
        bankName: 'Taiwan Bank',
        accountHolder: 'Learning China Admin'
      },
      vn: {
        qrCodeImage: 'https://via.placeholder.com/200x200/000000/FFFFFF?text=VN+QR',
        exchangeRate: 0.001, // 1 VND = 0.001 coins (example)
        bankAccount: '0987654321',
        bankName: 'Vietcombank',
        accountHolder: 'Learning China Admin'
      },
      isActive: true
    });

    await defaultConfig.save();
    console.log('Payment config seeded successfully:', defaultConfig);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding payment config:', error);
    process.exit(1);
  }
};

seedPaymentConfig();
