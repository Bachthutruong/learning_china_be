import dotenv from 'dotenv';
import mongoose from 'mongoose';
import UserCompetition from '../models/UserCompetition';
import UserCompetitionRequest from '../models/UserCompetitionRequest';
import UserCompetitionResult from '../models/UserCompetitionResult';

dotenv.config();

async function deleteUserCompetitions() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/chinese-learning';
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    // Count before deletion
    const competitionCount = await UserCompetition.countDocuments();
    const requestCount = await UserCompetitionRequest.countDocuments();
    const resultCount = await UserCompetitionResult.countDocuments();

    console.log(`\nFound ${competitionCount} user competitions`);
    console.log(`Found ${requestCount} join requests`);
    console.log(`Found ${resultCount} competition results`);

    // Delete related data first
    console.log('\nDeleting competition results...');
    await UserCompetitionResult.deleteMany({});
    console.log(`Deleted ${resultCount} competition results`);

    console.log('Deleting join requests...');
    await UserCompetitionRequest.deleteMany({});
    console.log(`Deleted ${requestCount} join requests`);

    // Delete competitions
    console.log('Deleting user competitions...');
    await UserCompetition.deleteMany({});
    console.log(`Deleted ${competitionCount} user competitions`);

    console.log('\n✅ All user competitions and related data have been deleted successfully!');
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Error deleting user competitions:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run the script
deleteUserCompetitions();

