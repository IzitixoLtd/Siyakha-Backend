/**
 * Seed Data Script
 */

require('dotenv').config();

const { connectDB, disconnectDB } = require('../src/config/database');
const { User, Institution, Quiz, University } = require('../src/models');

async function seedData() {
  console.log('🌱 Seeding database...\n');

  try {
    await connectDB();

    // Check if already seeded
    if (await Institution.findOne({ code: 'JHS-2024-TEST' })) {
      console.log('⚠️  Data already exists. Skipping...');
      await disconnectDB();
      return;
    }

    // Create institution
    console.log('🏫 Creating institution...');
    const institution = await Institution.create({
      name: 'Johannesburg High School',
      shortName: 'JHS',
      code: 'JHS-2024-TEST',
      type: 'public_school',
      address: { city: 'Johannesburg', province: 'Gauteng' },
      settings: { allowStudentSelfRegistration: true, gradesOffered: [10, 11, 12] }
    });

    // Create users
    console.log('👥 Creating users...');
    const users = [
      { email: 'student@test.com', passwordHash: 'password123', firstName: 'Thabo', lastName: 'Mokoena', role: 'student', studentProfile: { grade: 12, subjects: ['mathematics', 'physics'] } },
      { email: 'teacher@test.com', passwordHash: 'password123', firstName: 'John', lastName: 'Smith', role: 'teacher', teacherProfile: { assignments: [{ subjectKey: 'mathematics', subjectLabel: 'Mathematics', grades: [10, 11, 12] }] } },
      { email: 'principal@test.com', passwordHash: 'password123', firstName: 'Sarah', lastName: 'Ndlovu', role: 'principal', adminProfile: { permissions: ['manage_teachers', 'manage_students'] } }
    ];

    for (const userData of users) {
      await User.create({ ...userData, institutionId: institution._id, joinedVia: 'institution_code' });
      console.log(`   ✓ ${userData.email}`);
    }

    // Create quizzes
    console.log('📝 Creating quizzes...');
    const quizzes = [
      {
        quizKey: 'math_algebra_practice_g12', title: 'Algebra Practice Quiz', subject: 'mathematics', subjectLabel: 'Mathematics',
        topic: 'algebra', topicLabel: 'Algebra', grade: 12, mode: 'practice', passingScore: 50, difficulty: 'medium',
        questions: [
          { id: 'q1', type: 'multiple_choice', question: 'Solve for x: 2x + 5 = 15', options: ['x = 5', 'x = 10', 'x = 7.5', 'x = 20'], answer: 'x = 5', points: 1, explanation: '2x = 10, so x = 5' },
          { id: 'q2', type: 'true_false', question: '(a + b)² = a² + b²', options: ['True', 'False'], answer: 'False', points: 1, explanation: '(a + b)² = a² + 2ab + b²' },
          { id: 'q3', type: 'multiple_choice', question: 'Factor: x² - 9', options: ['(x-3)(x+3)', '(x-9)(x+1)', '(x-3)²', '(x+3)²'], answer: '(x-3)(x+3)', points: 1 }
        ]
      },
      {
        quizKey: 'physics_mechanics_practice_g12', title: 'Mechanics Practice', subject: 'physics', subjectLabel: 'Physics',
        topic: 'mechanics', topicLabel: 'Mechanics', grade: 12, mode: 'practice', passingScore: 50,
        questions: [
          { id: 'q1', type: 'multiple_choice', question: 'F = ma is known as:', options: ["Newton's 1st Law", "Newton's 2nd Law", "Newton's 3rd Law", "Law of Gravity"], answer: "Newton's 2nd Law", points: 1 },
          { id: 'q2', type: 'multiple_choice', question: 'A 10kg object with 20N force has acceleration:', options: ['0.5 m/s²', '2 m/s²', '200 m/s²', '10 m/s²'], answer: '2 m/s²', points: 1 }
        ]
      }
    ];

    for (const quiz of quizzes) {
      await Quiz.create(quiz);
      console.log(`   ✓ ${quiz.title}`);
    }

    // Create universities
    console.log('🎓 Creating universities...');
    const universities = [
      {
        key: 'uct', name: 'University of Cape Town', shortName: 'UCT',
        location: { province: 'Western Cape', city: 'Cape Town' },
        faculties: [{
          key: 'engineering', name: 'Engineering',
          courses: [{ name: 'BSc Computer Science', apsScore: 38, duration: '3 years', careerPaths: ['Software Developer', 'Data Scientist'] }]
        }],
        financialAid: { nsfasAccredited: true, bursariesAvailable: true }
      },
      {
        key: 'wits', name: 'University of the Witwatersrand', shortName: 'Wits',
        location: { province: 'Gauteng', city: 'Johannesburg' },
        faculties: [{
          key: 'commerce', name: 'Commerce',
          courses: [{ name: 'BCom Accounting', apsScore: 36, duration: '3 years', careerPaths: ['Chartered Accountant', 'Financial Manager'] }]
        }],
        financialAid: { nsfasAccredited: true, bursariesAvailable: true }
      }
    ];

    for (const uni of universities) {
      await University.create(uni);
      console.log(`   ✓ ${uni.name}`);
    }

    await institution.updateStats();

    console.log('\n✅ Seed complete!\n');
    console.log('📧 Test Accounts:');
    console.log('   Student:   student@test.com / password123');
    console.log('   Teacher:   teacher@test.com / password123');
    console.log('   Principal: principal@test.com / password123');
    console.log(`\n🔑 Institution Code: ${institution.code}`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
}

seedData();
