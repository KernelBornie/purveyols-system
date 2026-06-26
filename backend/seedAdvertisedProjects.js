const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load .env from the backend folder
dotenv.config({ path: path.join(__dirname, '.env') });

// Fallback: try current working directory if still missing
if (!process.env.MONGO_URI) {
  dotenv.config();
}

const AdvertisedProject = require('./models/AdvertisedProject');

const sampleProjects = [
  {
    id: 'SAMPLE-001',
    title: 'Construction of 50 km Road in Lusaka',
    client: 'Zambia Road Agency',
    location: 'Lusaka, Zambia',
    budget: 'ZMW 48,000,000',
    deadline: '2026-09-30',
    source: 'Sample Data',
    sourceUrl: 'https://example.com/tender-001',
    description: 'Construction of a 50 km dual carriageway connecting Lusaka to the airport. Includes drainage, lighting, and pedestrian walkways.',
    skills: ['Road Construction', 'Civil Engineering', 'Project Management'],
    contactEmail: 'info@example.com',
    biddingFee: 'ZMW 500',
    status: 'open',
  },
  {
    id: 'SAMPLE-002',
    title: 'Solar Power Plant 20 MW',
    client: 'Zambia Energy Corporation',
    location: 'Ndola, Zambia',
    budget: 'ZMW 35,000,000',
    deadline: '2026-08-15',
    source: 'Sample Data',
    sourceUrl: 'https://example.com/tender-002',
    description: 'Design and construction of a 20 MW solar photovoltaic plant. Includes grid connection and substation.',
    skills: ['Solar Energy', 'Electrical Engineering', 'Construction'],
    contactEmail: 'info@example.com',
    biddingFee: 'ZMW 300',
    status: 'open',
  },
  {
    id: 'SAMPLE-003',
    title: 'Water Treatment Plant Upgrade',
    client: 'Lusaka Water & Sewerage Company',
    location: 'Lusaka, Zambia',
    budget: 'ZMW 22,000,000',
    deadline: '2026-10-01',
    source: 'Sample Data',
    sourceUrl: 'https://example.com/tender-003',
    description: 'Upgrade existing water treatment plant with new filtration systems and a 5 km pipeline.',
    skills: ['Water Engineering', 'Civil Engineering', 'Project Management'],
    contactEmail: 'info@example.com',
    biddingFee: 'ZMW 200',
    status: 'open',
  },
  {
    id: 'SAMPLE-004',
    title: 'Commercial Building Construction',
    client: 'Zanaco Bank',
    location: 'Mkushi, Zambia',
    budget: 'ZMW 15,000,000',
    deadline: '2026-12-15',
    source: 'Sample Data',
    sourceUrl: 'https://example.com/tender-004',
    description: 'Construction of a two‑story commercial building with basement parking. Includes all finishes and services.',
    skills: ['Building Construction', 'Architecture', 'Project Management'],
    contactEmail: 'info@example.com',
    biddingFee: 'ZMW 250',
    status: 'open',
  },
  {
    id: 'SAMPLE-005',
    title: 'Bridge Construction over Kafue River',
    client: 'National Roads Authority',
    location: 'Kafue, Zambia',
    budget: 'ZMW 65,000,000',
    deadline: '2026-11-30',
    source: 'Sample Data',
    sourceUrl: 'https://example.com/tender-005',
    description: 'Construction of a 200 m steel bridge over the Kafue River. Includes approach roads and embankments.',
    skills: ['Bridge Engineering', 'Steel Structures', 'Civil Engineering'],
    contactEmail: 'info@example.com',
    biddingFee: 'ZMW 600',
    status: 'open',
  },
];

async function seed() {
  try {
    if (!process.env.MONGO_URI) {
      console.error('❌ MONGO_URI is not defined in .env');
      console.error('Please ensure you have a .env file in the backend folder with MONGO_URI=your-connection-string');
      process.exit(1);
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await AdvertisedProject.deleteMany({});
    console.log('🧹 Cleared existing AdvertisedProject collection');

    await AdvertisedProject.insertMany(sampleProjects);
    console.log(`✅ Inserted ${sampleProjects.length} sample projects`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding error:', err);
    process.exit(1);
  }
}

seed();