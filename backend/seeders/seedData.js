const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const sampleUsers = [
  {
    name: 'John Developer',
    email: 'john@example.com',
    password: 'password123',
    location: 'New York, NY',
    skillsOffered: [
      { name: 'JavaScript', description: 'ES6+, React, Node.js', level: 'Advanced' },
      { name: 'Web Development', description: 'Full-stack web applications', level: 'Expert' },
      { name: 'Python', description: 'Data analysis and web development', level: 'Intermediate' }
    ],
    skillsWanted: [
      { name: 'Machine Learning', description: 'AI and ML algorithms', priority: 'High' },
      { name: 'DevOps', description: 'CI/CD and cloud deployment', priority: 'Medium' }
    ],
    availability: {
      weekdays: true,
      evenings: true
    }
  },
  {
    name: 'Sarah Designer',
    email: 'sarah@example.com',
    password: 'password123',
    location: 'San Francisco, CA',
    skillsOffered: [
      { name: 'UI/UX Design', description: 'User interface and experience design', level: 'Expert' },
      { name: 'Adobe Photoshop', description: 'Photo editing and digital art', level: 'Advanced' },
      { name: 'Figma', description: 'Design prototyping and collaboration', level: 'Expert' }
    ],
    skillsWanted: [
      { name: 'Frontend Development', description: 'React and Vue.js', priority: 'High' },
      { name: 'Animation', description: 'CSS and JavaScript animations', priority: 'Medium' }
    ],
    availability: {
      weekdays: true,
      afternoons: true
    }
  },
  {
    name: 'Mike Data Scientist',
    email: 'mike@example.com',
    password: 'password123',
    location: 'Austin, TX',
    skillsOffered: [
      { name: 'Machine Learning', description: 'TensorFlow, PyTorch, scikit-learn', level: 'Expert' },
      { name: 'Python', description: 'Data science and analysis', level: 'Expert' },
      { name: 'Data Analysis', description: 'Statistical analysis and visualization', level: 'Advanced' },
      { name: 'SQL', description: 'Database queries and optimization', level: 'Advanced' }
    ],
    skillsWanted: [
      { name: 'Cloud Computing', description: 'AWS and Azure services', priority: 'High' },
      { name: 'Docker', description: 'Containerization and deployment', priority: 'Medium' }
    ],
    availability: {
      weekends: true,
      evenings: true
    }
  },
  {
    name: 'Emily Marketing Expert',
    email: 'emily@example.com',
    password: 'password123',
    location: 'Chicago, IL',
    skillsOffered: [
      { name: 'Digital Marketing', description: 'SEO, SEM, social media marketing', level: 'Expert' },
      { name: 'Content Writing', description: 'Blog posts, marketing copy', level: 'Advanced' },
      { name: 'Social Media Management', description: 'Facebook, Instagram, LinkedIn', level: 'Expert' }
    ],
    skillsWanted: [
      { name: 'Web Analytics', description: 'Google Analytics, data interpretation', priority: 'High' },
      { name: 'Graphic Design', description: 'Creating marketing visuals', priority: 'Medium' }
    ],
    availability: {
      weekdays: true,
      mornings: true,
      afternoons: true
    }
  },
  {
    name: 'Alex Mobile Developer',
    email: 'alex@example.com',
    password: 'password123',
    location: 'Seattle, WA',
    skillsOffered: [
      { name: 'React Native', description: 'Cross-platform mobile development', level: 'Advanced' },
      { name: 'iOS Development', description: 'Swift and Objective-C', level: 'Expert' },
      { name: 'Android Development', description: 'Java and Kotlin', level: 'Advanced' }
    ],
    skillsWanted: [
      { name: 'Backend Development', description: 'API design and server architecture', priority: 'High' },
      { name: 'Database Design', description: 'NoSQL and relational databases', priority: 'Medium' }
    ],
    availability: {
      weekends: true,
      evenings: true
    }
  },
  {
    name: 'Lisa Language Teacher',
    email: 'lisa@example.com',
    password: 'password123',
    location: 'Miami, FL',
    skillsOffered: [
      { name: 'Spanish', description: 'Native speaker, business Spanish', level: 'Expert' },
      { name: 'English Teaching', description: 'ESL and business English', level: 'Expert' },
      { name: 'French', description: 'Conversational and business French', level: 'Advanced' }
    ],
    skillsWanted: [
      { name: 'German', description: 'Conversational German', priority: 'High' },
      { name: 'Online Teaching', description: 'Virtual classroom management', priority: 'Medium' }
    ],
    availability: {
      weekdays: true,
      weekends: true,
      mornings: true,
      afternoons: true,
      evenings: true
    }
  },
  {
    name: 'David DevOps Engineer',
    email: 'david@example.com',
    password: 'password123',
    location: 'Denver, CO',
    skillsOffered: [
      { name: 'DevOps', description: 'CI/CD, automation, monitoring', level: 'Expert' },
      { name: 'AWS', description: 'Cloud infrastructure and services', level: 'Advanced' },
      { name: 'Docker', description: 'Containerization and orchestration', level: 'Expert' },
      { name: 'Kubernetes', description: 'Container orchestration', level: 'Advanced' }
    ],
    skillsWanted: [
      { name: 'Security', description: 'Cybersecurity and penetration testing', priority: 'High' },
      { name: 'Terraform', description: 'Infrastructure as code', priority: 'Medium' }
    ],
    availability: {
      weekdays: true,
      evenings: true
    }
  }
];

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/skillswap');
    console.log('Connected to MongoDB');

    // Clear existing users (optional - uncomment if you want to reset)
    // await User.deleteMany({});
    // console.log('Cleared existing users');

    // Check if users already exist
    const existingUsersCount = await User.countDocuments();
    if (existingUsersCount > 0) {
      console.log(`Database already has ${existingUsersCount} users. Skipping seed.`);
      process.exit(0);
    }

    // Create sample users
    const createdUsers = [];
    for (const userData of sampleUsers) {
      try {
        const user = await User.create(userData);
        createdUsers.push(user);
        console.log(`Created user: ${user.name}`);
      } catch (error) {
        if (error.code === 11000) {
          console.log(`User ${userData.email} already exists, skipping...`);
        } else {
          console.error(`Error creating user ${userData.name}:`, error.message);
        }
      }
    }

    console.log(`Successfully seeded ${createdUsers.length} users`);
    
    // Display summary
    const skillsOfferedCount = createdUsers.reduce((total, user) => total + user.skillsOffered.length, 0);
    const skillsWantedCount = createdUsers.reduce((total, user) => total + user.skillsWanted.length, 0);
    
    console.log('\n=== Seed Summary ===');
    console.log(`Users created: ${createdUsers.length}`);
    console.log(`Skills offered: ${skillsOfferedCount}`);
    console.log(`Skills wanted: ${skillsWantedCount}`);
    console.log('====================\n');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

// Run the seeder if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase, sampleUsers };
