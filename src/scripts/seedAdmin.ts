import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User';

dotenv.config();

async function run() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/chinese-learning';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@gmail.com';
  const adminPassword = process.env.ADMIN_PASSWORD || '123456789';
  const adminName = process.env.ADMIN_NAME || 'Administrator';

  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    const existing = await User.findOne({ email: adminEmail });
    if (existing) {
      if (existing.role !== 'admin') {
        existing.role = 'admin' as any;
        await existing.save();
        console.log(`Updated existing user to admin: ${adminEmail}`);
      } else {
        console.log(`Admin already exists: ${adminEmail}`);
      }
    } else {
      const admin = new (User as any)({
        email: adminEmail,
        password: adminPassword,
        name: adminName,
        role: 'admin'
      });
      await admin.save();
      console.log(`Created admin user: ${adminEmail}`);
    }
  } catch (err) {
    console.error('Seed admin error:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

run();


