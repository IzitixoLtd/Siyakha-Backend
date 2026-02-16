/**
 * Database Setup Script
 */

require('dotenv').config();

const { connectDB, disconnectDB } = require('../src/config/database');
const { User, Institution, Quiz, QuizResult, Resource, Announcement, University, AgentConversation } = require('../src/models');

async function setupDatabase() {
  console.log('🔧 Setting up database...\n');

  try {
    await connectDB();

    console.log('📇 Creating indexes...');
    await User.createIndexes();
    await Institution.createIndexes();
    await Quiz.createIndexes();
    await QuizResult.createIndexes();
    await Resource.createIndexes();
    await Announcement.createIndexes();
    await University.createIndexes();
    await AgentConversation.createIndexes();

    console.log('✅ All indexes created!\n');

    const collections = [
      { name: 'users', model: User },
      { name: 'institutions', model: Institution },
      { name: 'quizzes', model: Quiz },
      { name: 'universities', model: University }
    ];

    console.log('📊 Collection counts:');
    for (const col of collections) {
      const count = await col.model.countDocuments();
      console.log(`   ${col.name}: ${count}`);
    }

    console.log('\n🎉 Database setup complete!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
}

setupDatabase();
