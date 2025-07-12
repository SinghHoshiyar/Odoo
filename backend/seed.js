const mongoose = require('mongoose');
const User = require('./models/User');
const Swap = require('./models/Swap');
require('dotenv').config();

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/skillswap');
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({ email: { $in: ['john.doe@example.com', 'jane.smith@example.com', 'alice.brown@example.com'] } });
    await Swap.deleteMany({});
    console.log('Cleared existing sample data');

    // Create sample users with skills
    const user1 = new User({
      name: 'John Doe',
      email: 'john.doe@example.com',
      password: 'password123',
      location: 'New York, NY',
      skillsOffered: [
        { name: 'JavaScript', description: 'Expert in React, Node.js, and modern JS frameworks', level: 'Expert' },
        { name: 'Web Design', description: 'UI/UX design and frontend development', level: 'Advanced' }
      ],
      skillsWanted: [
        { name: 'Graphic Design', description: 'Looking to learn Adobe Creative Suite', priority: 'High' },
        { name: 'Photography', description: 'Want to improve portrait photography skills', priority: 'Medium' }
      ],
      availability: {
        weekdays: true,
        evenings: true,
        weekends: false
      }
    });

    const user2 = new User({
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      password: 'password123',
      location: 'Los Angeles, CA',
      skillsOffered: [
        { name: 'Graphic Design', description: 'Professional designer with 5+ years experience', level: 'Expert' },
        { name: 'Photography', description: 'Portrait and landscape photography', level: 'Advanced' }
      ],
      skillsWanted: [
        { name: 'JavaScript', description: 'Want to learn web development', priority: 'High' },
        { name: 'Digital Marketing', description: 'Social media and SEO skills', priority: 'Medium' }
      ],
      availability: {
        weekends: true,
        evenings: true,
        weekdays: false
      }
    });

    const user3 = new User({
      name: 'Alice Brown',
      email: 'alice.brown@example.com',
      password: 'password123',
      location: 'Chicago, IL',
      skillsOffered: [
        { name: 'Digital Marketing', description: 'SEO, social media, and content marketing', level: 'Advanced' },
        { name: 'Writing', description: 'Technical writing and copywriting', level: 'Expert' }
      ],
      skillsWanted: [
        { name: 'Web Design', description: 'Want to create better landing pages', priority: 'High' },
        { name: 'Data Analysis', description: 'Learn to analyze marketing metrics', priority: 'Medium' }
      ],
      availability: {
        weekdays: true,
        mornings: true,
        afternoons: true
      }
    });

    await user1.save();
    await user2.save();
    await user3.save();
    console.log('Created sample users with skills');

    // Create sample swaps
    const swap1 = new Swap({
      requester: user1._id,
      provider: user2._id,
      skillRequested: {
        name: 'Graphic Design',
        description: 'Need help with logo design'
      },
      skillOffered: {
        name: 'JavaScript',
        description: 'Can teach React and Node.js fundamentals'
      },
      message: 'Hi Jane! I saw your graphic design portfolio and I\'m really impressed. I\'d love to learn from you in exchange for JavaScript tutoring.',
      status: 'pending'
    });

    const swap2 = new Swap({
      requester: user3._id,
      provider: user1._id,
      skillRequested: {
        name: 'Web Design',
        description: 'Need help with responsive design'
      },
      skillOffered: {
        name: 'Digital Marketing',
        description: 'Can teach SEO and content strategy'
      },
      message: 'Hello John! I need help creating a responsive website. In return, I can teach you digital marketing strategies.',
      status: 'accepted',
      acceptedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
    });

    const swap3 = new Swap({
      requester: user2._id,
      provider: user3._id,
      skillRequested: {
        name: 'Digital Marketing',
        description: 'Want to promote my photography business'
      },
      skillOffered: {
        name: 'Photography',
        description: 'Professional photography lessons'
      },
      message: 'Hi Alice! I\'m starting a photography business and need marketing help.',
      status: 'completed',
      acceptedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      feedback: {
        requesterFeedback: {
          rating: 5,
          comment: 'Excellent marketing strategies! Really helped grow my business.',
          submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        },
        providerFeedback: {
          rating: 4,
          comment: 'Great photography skills! Very professional approach.',
          submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        }
      }
    });

    await swap1.save();
    await swap2.save();
    await swap3.save();
    console.log('Created sample swaps');

    // Update user ratings based on feedback
    await user2.updateRating(4); // From swap3 feedback
    await user3.updateRating(5); // From swap3 feedback
    console.log('Updated user ratings');

    console.log('\n=== Sample data seeded successfully! ===');
    console.log('\nSample Users:');
    console.log('1. john.doe@example.com (password: password123)');
    console.log('2. jane.smith@example.com (password: password123)');
    console.log('3. alice.brown@example.com (password: password123)');
    console.log('\nAdmin User:');
    console.log('- admin@skillswap.com (password: admin123456)');
    console.log('\nYou can now log in and test the swap functionality!');
    
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    mongoose.connection.close();
  }
}

seedDatabase();

