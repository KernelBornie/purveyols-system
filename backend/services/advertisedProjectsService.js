// Simulated external data source
// In production, replace with real API calls to social media, government tender portals, etc.

const advertisedProjects = [
  {
    id: 'PRJ-2025-001',
    title: 'FNB Zambia – HQ Building Renovation',
    client: 'FNB Zambia',
    category: 'Commercial Renovation',
    location: 'Lusaka, Zambia',
    budget: 'ZMW 850,000 - 1,200,000',
    postedDate: '2025-03-15',
    deadline: '2025-04-15',
    status: 'open',
    source: 'Facebook',
    sourceUrl: 'https://facebook.com/fnbzambia',
    description: 'Full renovation of FNB headquarters including interior redesign, HVAC upgrade, and modern office fit-out.',
    skills: ['Interior Design', 'HVAC', 'Electrical', 'Plumbing'],
    contactEmail: 'procurement@fnb.co.zm',
    biddingFee: 'ZMW 2,500',
  },
  {
    id: 'PRJ-2025-002',
    title: 'ABS Bank – Branch Modernization',
    client: 'ABS Bank',
    category: 'Banking Fit-out',
    location: 'Lusaka, Zambia',
    budget: 'ZMW 450,000 - 650,000',
    postedDate: '2025-03-12',
    deadline: '2025-04-10',
    status: 'open',
    source: 'LinkedIn',
    sourceUrl: 'https://linkedin.com/company/absbank',
    description: 'Modernization of ABS Bank branch with new customer service areas, digital banking spaces, and security upgrades.',
    skills: ['Security Systems', 'Digital Infrastructure', 'Interior Design'],
    contactEmail: 'tenders@absbank.co.zm',
    biddingFee: 'ZMW 1,500',
  },
  {
    id: 'PRJ-2025-003',
    title: 'Nshima Homes – 50 Unit Housing Project',
    client: 'Nshima Homes Developers',
    category: 'Residential Construction',
    location: 'Lusaka East, Zambia',
    budget: 'ZMW 3,500,000 - 4,200,000',
    postedDate: '2025-03-10',
    deadline: '2025-05-01',
    status: 'open',
    source: 'Zambia Tenders Portal',
    sourceUrl: 'https://zambiatenders.gov.zm',
    description: 'Construction of 50 affordable housing units including roads, drainage, and community facilities.',
    skills: ['Structural Engineering', 'Civil Works', 'Project Management'],
    contactEmail: 'procurement@nshimahomes.co.zm',
    biddingFee: 'ZMW 5,000',
  },
  {
    id: 'PRJ-2025-004',
    title: 'Ministry of Health – Regional Hospital Expansion',
    client: 'Ministry of Health Zambia',
    category: 'Public Infrastructure',
    location: 'Ndola, Zambia',
    budget: 'ZMW 8,500,000 - 10,000,000',
    postedDate: '2025-03-08',
    deadline: '2025-05-15',
    status: 'open',
    source: 'Government Gazette',
    sourceUrl: 'https://moh.gov.zm/tenders',
    description: 'Expansion of Ndola Regional Hospital including new wing, ICU, and outpatient facilities.',
    skills: ['Hospital Design', 'Medical Infrastructure', 'Civil Engineering'],
    contactEmail: 'procurement@moh.gov.zm',
    biddingFee: 'ZMW 10,000',
  },
  {
    id: 'PRJ-2025-005',
    title: 'Shoprite Zambia – New Store Fit-out',
    client: 'Shoprite Zambia',
    category: 'Retail Construction',
    location: 'Lusaka, Zambia',
    budget: 'ZMW 1,200,000 - 1,500,000',
    postedDate: '2025-03-05',
    deadline: '2025-04-20',
    status: 'open',
    source: 'Facebook',
    sourceUrl: 'https://facebook.com/shopritezambia',
    description: 'Complete fit-out for a new Shoprite store including shelving, refrigeration, and check-out areas.',
    skills: ['Retail Fit-out', 'Refrigeration Systems', 'Electrical'],
    contactEmail: 'tenders@shoprite.co.zm',
    biddingFee: 'ZMW 3,000',
  },
  {
    id: 'PRJ-2025-006',
    title: 'ZESCO – Substation Upgrade',
    client: 'ZESCO',
    category: 'Infrastructure Upgrade',
    location: 'Copperbelt, Zambia',
    budget: 'ZMW 2,800,000 - 3,200,000',
    postedDate: '2025-03-01',
    deadline: '2025-04-25',
    status: 'open',
    source: 'ZESCO Website',
    sourceUrl: 'https://zesco.co.zm/tenders',
    description: 'Upgrade of electrical substation with new transformers, control systems, and safety infrastructure.',
    skills: ['Electrical Engineering', 'Power Systems', 'Safety Infrastructure'],
    contactEmail: 'procurement@zesco.co.zm',
    biddingFee: 'ZMW 4,000',
  },
];

// In production, replace with real API calls
const fetchAdvertisedProjects = async (filters = {}) => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  let results = [...advertisedProjects];
  
  if (filters.status) {
    results = results.filter(p => p.status === filters.status);
  }
  if (filters.category) {
    results = results.filter(p => p.category.toLowerCase().includes(filters.category.toLowerCase()));
  }
  if (filters.search) {
    const search = filters.search.toLowerCase();
    results = results.filter(p => 
      p.title.toLowerCase().includes(search) ||
      p.client.toLowerCase().includes(search) ||
      p.location.toLowerCase().includes(search)
    );
  }
  
  return results;
};

module.exports = { fetchAdvertisedProjects };
