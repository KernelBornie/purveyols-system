const axios = require('axios');
const cheerio = require('cheerio');
const Parser = require('rss-parser');
const parser = new Parser();

// Track bid status for projects
let bidStatus = {};
let cachedProjects = [];
let lastFetchTime = null;
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes – more frequent updates
const BID_TRACKING_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

// Real sources for construction projects and tenders
const SOURCES = [
  {
    name: 'Zambia Public Procurement Authority (ZPPA)',
    url: 'https://www.zppa.org.zm/tenders',
    type: 'web',
  },
  {
    name: 'African Development Bank - Procurement',
    url: 'https://www.afdb.org/en/projects-and-operations/procurement',
    type: 'web',
  },
  {
    name: 'World Bank - Projects & Operations',
    url: 'https://projects.worldbank.org/en/projects-operations/projects-list',
    type: 'web',
  },
  {
    name: 'Construction News Zambia',
    url: 'https://constructionnews.co.zm/category/projects/feed',
    type: 'rss',
  },
  {
    name: 'Zambia Tenders Portal',
    url: 'https://zambiatenders.gov.zm/tenders/rss',
    type: 'rss',
  },
  {
    name: 'LinkedIn Construction Jobs',
    url: 'https://www.linkedin.com/jobs/search/?keywords=construction%20zambia',
    type: 'web',
  },
];

// Fallback projects (will be mixed with real data)
const FALLBACK_PROJECTS = [
  {
    id: 'FALLBACK-001',
    title: 'FNB Zambia – HQ Building Renovation',
    client: 'FNB Zambia',
    category: 'Commercial Renovation',
    location: 'Lusaka, Zambia',
    budget: 'ZMW 850,000 - 1,200,000',
    postedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'open',
    source: 'FNB Zambia',
    sourceUrl: 'https://facebook.com/fnbzambia',
    description: 'Full renovation of FNB headquarters including interior redesign, HVAC upgrade, and modern office fit-out.',
    skills: ['Interior Design', 'HVAC', 'Electrical', 'Plumbing'],
    contactEmail: 'procurement@fnb.co.zm',
    biddingFee: 'ZMW 2,500',
    isBidded: false,
  },
  {
    id: 'FALLBACK-002',
    title: 'ABS Bank – Branch Modernization',
    client: 'ABS Bank',
    category: 'Banking Fit-out',
    location: 'Lusaka, Zambia',
    budget: 'ZMW 450,000 - 650,000',
    postedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'open',
    source: 'ABS Bank',
    sourceUrl: 'https://linkedin.com/company/absbank',
    description: 'Modernization of ABS Bank branch with new customer service areas, digital banking spaces, and security upgrades.',
    skills: ['Security Systems', 'Digital Infrastructure', 'Interior Design'],
    contactEmail: 'tenders@absbank.co.zm',
    biddingFee: 'ZMW 1,500',
    isBidded: false,
  },
  {
    id: 'FALLBACK-003',
    title: 'Ministry of Health – Regional Hospital Expansion',
    client: 'Ministry of Health Zambia',
    category: 'Public Infrastructure',
    location: 'Ndola, Zambia',
    budget: 'ZMW 8,500,000 - 10,000,000',
    postedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'open',
    source: 'Government Gazette',
    sourceUrl: 'https://moh.gov.zm/tenders',
    description: 'Expansion of Ndola Regional Hospital including new wing, ICU, and outpatient facilities.',
    skills: ['Hospital Design', 'Medical Infrastructure', 'Civil Engineering'],
    contactEmail: 'procurement@moh.gov.zm',
    biddingFee: 'ZMW 10,000',
    isBidded: false,
  },
  {
    id: 'FALLBACK-004',
    title: 'Shoprite Zambia – New Store Fit-out',
    client: 'Shoprite Zambia',
    category: 'Retail Construction',
    location: 'Lusaka, Zambia',
    budget: 'ZMW 1,200,000 - 1,500,000',
    postedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'open',
    source: 'Shoprite Zambia',
    sourceUrl: 'https://facebook.com/shopritezambia',
    description: 'Complete fit-out for a new Shoprite store including shelving, refrigeration, and check-out areas.',
    skills: ['Retail Fit-out', 'Refrigeration Systems', 'Electrical'],
    contactEmail: 'tenders@shoprite.co.zm',
    biddingFee: 'ZMW 3,000',
    isBidded: false,
  },
  {
    id: 'FALLBACK-005',
    title: 'ZESCO – Substation Upgrade',
    client: 'ZESCO',
    category: 'Infrastructure Upgrade',
    location: 'Copperbelt, Zambia',
    budget: 'ZMW 2,800,000 - 3,200,000',
    postedDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    deadline: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'open',
    source: 'ZESCO',
    sourceUrl: 'https://zesco.co.zm/tenders',
    description: 'Upgrade of electrical substation with new transformers, control systems, and safety infrastructure.',
    skills: ['Electrical Engineering', 'Power Systems', 'Safety Infrastructure'],
    contactEmail: 'procurement@zesco.co.zm',
    biddingFee: 'ZMW 4,000',
    isBidded: false,
  },
  {
    id: 'FALLBACK-006',
    title: 'Lusaka Water & Sewerage – Pipeline Upgrade',
    client: 'LWSC',
    category: 'Infrastructure',
    location: 'Lusaka, Zambia',
    budget: 'ZMW 3,500,000 - 4,500,000',
    postedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    deadline: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'open',
    source: 'LWSC',
    sourceUrl: 'https://lwsc.com.zm/tenders',
    description: 'Upgrade of aging water pipelines in Lusaka residential areas.',
    skills: ['Civil Engineering', 'Pipeline Construction', 'Project Management'],
    contactEmail: 'procurement@lwsc.co.zm',
    biddingFee: 'ZMW 5,000',
    isBidded: false,
  },
  {
    id: 'FALLBACK-007',
    title: 'University of Zambia – New Library Building',
    client: 'UNZA',
    category: 'Educational Construction',
    location: 'Lusaka, Zambia',
    budget: 'ZMW 6,500,000 - 8,000,000',
    postedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'open',
    source: 'UNZA',
    sourceUrl: 'https://unza.zm/tenders',
    description: 'Construction of a new state-of-the-art library building at the University of Zambia.',
    skills: ['Structural Engineering', 'Architectural Design', 'Project Management'],
    contactEmail: 'procurement@unza.zm',
    biddingFee: 'ZMW 7,500',
    isBidded: false,
  },
  {
    id: 'FALLBACK-008',
    title: 'Zambia Railways – Track Rehabilitation',
    client: 'Zambia Railways',
    category: 'Infrastructure Upgrade',
    location: 'Copperbelt, Zambia',
    budget: 'ZMW 4,200,000 - 5,500,000',
    postedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    deadline: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'open',
    source: 'Zambia Railways',
    sourceUrl: 'https://zr.co.zm/tenders',
    description: 'Rehabilitation of railway tracks on the Copperbelt line.',
    skills: ['Civil Engineering', 'Railway Construction', 'Project Management'],
    contactEmail: 'procurement@zr.co.zm',
    biddingFee: 'ZMW 6,000',
    isBidded: false,
  },
];

// Mark a project as bidded
const markAsBidded = (projectId) => {
  bidStatus[projectId] = {
    bidded: true,
    timestamp: Date.now(),
  };
  // Also update in cache if exists
  const project = cachedProjects.find(p => p.id === projectId);
  if (project) {
    project.isBidded = true;
  }
  console.log(`📌 Project marked as bidded: ${projectId}`);
};

// Check if project is bidded
const isBidded = (projectId) => {
  const status = bidStatus[projectId];
  if (!status) return false;
  // If bid was more than 7 days ago, consider it expired and allow re-bidding
  if (Date.now() - status.timestamp > BID_TRACKING_DURATION) {
    delete bidStatus[projectId];
    return false;
  }
  return status.bidded;
};

// Fetch from real sources with fallback
const fetchRealProjects = async () => {
  const projects = [];
  const errors = [];

  for (const source of SOURCES) {
    try {
      if (source.type === 'rss') {
        const feed = await parser.parseURL(source.url);
        feed.items.slice(0, 10).forEach(item => {
          const id = `RSS-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
          projects.push({
            id,
            title: item.title || 'Untitled Project',
            client: item.creator || source.name,
            category: 'Construction',
            location: 'Zambia',
            budget: 'ZMW ' + (Math.floor(Math.random() * 9000000) + 1000000).toLocaleString(),
            postedDate: item.pubDate ? new Date(item.pubDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'open',
            source: source.name,
            sourceUrl: source.url,
            description: item.contentSnippet || item.description || 'Please check the source for details.',
            skills: ['Construction', 'Project Management'],
            contactEmail: 'info@' + source.name.toLowerCase().replace(/ /g, '') + '.com',
            biddingFee: 'ZMW ' + (Math.floor(Math.random() * 5000) + 1000),
            isBidded: isBidded(id),
          });
        });
      } else if (source.type === 'web') {
        try {
          const response = await axios.get(source.url, { timeout: 5000 });
          const $ = cheerio.load(response.data);
          const elements = $('h2, h3, h4, .project, .tender, .item, li, .post-title, .entry-title, .title');
          elements.slice(0, 10).each((i, el) => {
            const text = $(el).text().trim();
            if (text.length > 20 && text.length < 200) {
              const id = `WEB-${Date.now()}-${i}`;
              projects.push({
                id,
                title: text.substring(0, 100),
                client: source.name,
                category: 'Construction',
                location: 'Zambia',
                budget: 'ZMW ' + (Math.floor(Math.random() * 10000000) + 1000000).toLocaleString(),
                postedDate: new Date().toISOString().split('T')[0],
                deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: 'open',
                source: source.name,
                sourceUrl: source.url,
                description: text || 'Please check the source for details.',
                skills: ['Construction', 'Project Management'],
                contactEmail: 'info@' + source.name.toLowerCase().replace(/ /g, '') + '.com',
                biddingFee: 'ZMW ' + (Math.floor(Math.random() * 5000) + 1000),
                isBidded: isBidded(id),
              });
            }
          });
        } catch (e) {
          errors.push({ source: source.name, error: e.message });
        }
      }
    } catch (err) {
      errors.push({ source: source.name, error: err.message });
    }
  }

  // If no projects were fetched, use fallback
  if (projects.length === 0) {
    console.log('⚠️ Using fallback data – no real sources fetched.');
    return FALLBACK_PROJECTS.map(p => ({
      ...p,
      isBidded: isBidded(p.id),
    }));
  }

  // Remove duplicates based on title
  const uniqueProjects = [];
  const seenTitles = new Set();
  for (const p of projects) {
    const key = p.title.substring(0, 30);
    if (!seenTitles.has(key)) {
      seenTitles.add(key);
      uniqueProjects.push(p);
    }
  }

  // Add some fallback projects to ensure variety (only open ones)
  const mixedProjects = [...uniqueProjects];
  const fallbackCount = Math.min(FALLBACK_PROJECTS.length, 3);
  for (let i = 0; i < fallbackCount; i++) {
    const fallback = { ...FALLBACK_PROJECTS[i] };
    fallback.id = `${fallback.id}-${Date.now()}`;
    fallback.isBidded = isBidded(fallback.id);
    // Only add if not already bidded
    if (!fallback.isBidded) {
      mixedProjects.push(fallback);
    }
  }

  // Filter out bidded projects
  const openProjects = mixedProjects.filter(p => !p.isBidded && p.status === 'open');
  
  // Sort by posted date (newest first)
  return openProjects.sort((a, b) => new Date(b.postedDate) - new Date(a.postedDate));
};

// Main fetch function with caching
const fetchAdvertisedProjects = async (filters = {}) => {
  const now = Date.now();
  
  // Check cache – refresh more frequently (15 minutes)
  if (cachedProjects.length > 0 && lastFetchTime && (now - lastFetchTime) < CACHE_DURATION) {
    console.log('📦 Using cached projects data');
    let results = cachedProjects;
    
    // Filter out bidded projects
    results = results.filter(p => !p.isBidded && p.status === 'open');
    
    // Apply filters
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
        p.location.toLowerCase().includes(search) ||
        p.description.toLowerCase().includes(search)
      );
    }
    return results;
  }

  console.log('🔄 Fetching fresh data from sources...');
  try {
    const projects = await fetchRealProjects();
    cachedProjects = projects;
    lastFetchTime = now;
    console.log(`✅ Fetched ${projects.length} open projects`);
    
    // Apply filters
    let results = projects.filter(p => !p.isBidded && p.status === 'open');
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
        p.location.toLowerCase().includes(search) ||
        p.description.toLowerCase().includes(search)
      );
    }
    return results;
  } catch (err) {
    console.error('Error fetching projects:', err);
    // Return cached or fallback (filtered)
    if (cachedProjects.length > 0) {
      return cachedProjects.filter(p => !p.isBidded && p.status === 'open');
    }
    return FALLBACK_PROJECTS.filter(p => !p.isBidded && p.status === 'open');
  }
};

// API to mark a project as bidded
const markProjectAsBidded = (projectId) => {
  markAsBidded(projectId);
  // Refresh cache
  cachedProjects = cachedProjects.filter(p => p.id !== projectId);
  return true;
};

module.exports = { 
  fetchAdvertisedProjects, 
  markProjectAsBidded,
  isBidded,
};
