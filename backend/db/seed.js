/**
 * Seed script to populate database with demo users
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Report_user:Report123@community-reports.fp05sqq.mongodb.net/?appName=Community-Reports';

async function seedDatabase() {
  try {
    // Connect to MongoDB
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected');

    // Clear existing users (optional - comment out to keep existing users)
    // await User.deleteMany({});
    // console.log('🗑️  Cleared existing users');

    // Check if demo users already exist
    const userCount = await User.countDocuments({
      email: { $in: ['user@test.com', 'admin@test.com'] }
    });

    if (userCount > 0) {
      console.log('✅ Demo users already exist in database');
      await mongoose.disconnect();
      return;
    }

    // Demo users data
    const demoUsers = [
      {
        email: 'user@test.com',
        password: 'password123',
        name: 'John Doe',
        phone: '+234-800-000-0001',
        role: 'user',
        status: 'active'
      },
      {
        email: 'admin@test.com',
        password: 'admin123',
        name: 'Admin User',
        phone: '+234-800-000-0002',
        role: 'admin',
        agency: 'Emergency Services',
        jurisdiction: 'Lagos State',
        status: 'active'
      }
    ];

    // Create users
    console.log('📝 Creating demo users...');
    for (const userData of demoUsers) {
      try {
        // Check if user exists
        const existingUser = await User.findOne({ email: userData.email });
        if (existingUser) {
          console.log(`   ⏭️  User ${userData.email} already exists, skipping...`);
          continue;
        }

        const user = new User(userData);
        await user.save();
        console.log(`   ✅ Created ${userData.role}: ${userData.email}`);
      } catch (error) {
        console.error(`   ❌ Error creating user ${userData.email}:`, error.message);
      }
    }

    console.log('\n✅ Seed completed successfully!');
    console.log('\n📊 Demo Credentials:');
    console.log('   User:  user@test.com / password123');
    console.log('   Admin: admin@test.com / admin123');

  } catch (error) {
    console.error('❌ Seed error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

seedDatabase();
