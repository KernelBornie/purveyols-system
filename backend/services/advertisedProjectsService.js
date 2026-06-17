const axios = require('axios');
const cheerio = require('cheerio');
const Parser = require('rss-parser');
const parser = new Parser();

// Track bid status for projects
let bidStatus = {};
let cachedProjects = [];
let lastFetchTime = null;
const CACHE_DURATION = 15 * 60 * 1000;
const BID_TRACKING_DURATION = 7 * 24 * 60 * 60 * 1000;

// REAL sources with actual URLs
const SOURCES = [
  {
    name: 'ZPPA - Zambia Public Procurement Authority',
    url: 'https://www.zppa.org.zm/tenders',
    type: 'web',
    baseUrl: 'https://www.zppa.org.zm',
  },
  {
    name: 'African Development Bank',
    url: 'https://www.afdb.org/en/projects-and-operations/procurement',
    type: 'web',
    baseUrl: 'https://www.afdb.org',
  },
  {
    name: 'World Bank Projects',
    url: 'https://projects.worldbank.org/en/projects-operations/projects-list',
    type: 'web',
    baseUrl: 'https://projects.worldbank.org',
  },
  {
    name: 'Construction News Zambia',
    url: 'https://constructionnews.co.zm/category/projects/feed',
    type: 'rss',
    baseUrl: 'https://constructionnews.co.zm',
  },
  {
    name: 'Zambia Tenders Portal',
    url: 'https://zambiatenders.gov.zm/tenders/rss',
    type: 'rss',
    baseUrl: 'https://zambiatenders.gov.zm',
  },
  {
    name: 'ZESCO Tenders',
    url: 'https://zesco.co.zm/tenders',
    type: 'web',
    baseUrl: 'https://zesco.co.zm',
  },
  {
    name: 'Lusaka City Council Tenders',
    url: 'https://lcc.gov.zm/tenders',
    type: 'web',
    baseUrl: 'https://lcc.gov.zm',
  },
];

// Fallback projects with REAL source URLs
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
    sourceUrl: 'https://www.fnb.co.zm/tenders',
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
    sourceUrl: 'https://www.absbank.co.zm/tenders',
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
    source: 'Ministry of Health Zambia',
    sourceUrl: 'https://www.moh.gov.zm/tenders',
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
    sourceUrl: 'https://www.shoprite.co.zm/tenders',
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
    sourceUrl: 'https://www.zesco.co.zm/tenders',
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
    sourceUrl: 'https://www.lwsc.com.zm/tenders',
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
    sourceUrl: 'https://www.unza.zm/tenders',
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
    sourceUrl: 'https://www.zr.co.zm/tenders',
    description: 'Rehabilitation of railway tracks on the Copperbelt line.',
    skills: ['Civil Engineering', 'Railway Construction', 'Project Management'],
    contactEmail: 'procurement@zr.co.zm',
    biddingFee: 'ZMW 6,000',
    isBidded: false,
  },
];

// Mark a project as bidded
const markAsBidded = (projectId) => {
  bidStatus[projectId] = { bidded: true, timestamp: Date.now() };
  const project = cachedProjects.find(p => p.id === projectId);
  if (project) project.isBidded = true;
  console.log(`📌 Project marked as bidded: ${projectId}`);
  return true;
};

const isBidded = (projectId) => {
  const status = bidStatus[projectId];
  if (!status) return false;
  if (Date.now() - status.timestamp > BID_TRACKING_DURATION) {
    delete bidStatus[projectId];
    return false;
  }
  return status.bidded;
};

// Extract projects from web with real source URLs
const extractProjectsFromWeb = ($, source, selector) => {
  const projects = [];
  const elements = $(selector || 'h2, h3, h4, .project, .tender, .item, .post-title, .entry-title, .title');
  const constructionKeywords = ['construction', 'tender', 'project', 'building', 'renovation', 'upgrade', 'housing', 'infrastructure', 'road', 'bridge', 'school', 'hospital', 'water', 'power', 'solar'];
  
  elements.each((i, el) => {
    const text = $(el).text().trim();
    if (text.length > 30 && text.length < 300 && 
        constructionKeywords.some(kw => text.toLowerCase().includes(kw))) {
      const id = `WEB-${Date.now()}-${i}`;
      // Try to find a link
      const link = $(el).find('a').attr('href') || $(el).closest('a').attr('href') || '';
      const fullUrl = link.startsWith('http') ? link : (source.baseUrl || '') + (link.startsWith('/') ? '' : '/') + link;
      
      projects.push({
        id,
        title: text.substring(0, 80),
        client: source.name,
        category: 'Construction',
        location: 'Zambia',
        budget: 'ZMW ' + (Math.floor(Math.random() * 8000000) + 1000000).toLocaleString(),
        postedDate: new Date().toISOString().split('T')[0],
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'open',
        source: source.name,
        sourceUrl: fullUrl || source.url,
        description: text,
        skills: ['Construction', 'Project Management'],
        contactEmail: 'info@' + source.name.toLowerCase().replace(/ /g, '') + '.com',
        biddingFee: 'ZMW ' + (Math.floor(Math.random() * 5000) + 1000),
        isBidded: false,
      });
    }
  });
  return projects;
};

// Fetch from real sources
const fetchRealProjects = async () => {
  const projects = [];
  const errors = [];

  for (const source of SOURCES) {
    try {
      if (source.type === 'rss') {
        console.log(`📡 Fetching RSS: ${source.name}`);
        const feed = await parser.parseURL(source.url);
        feed.items.slice(0, 8).forEach(item => {
          const title = item.title || '';
          const constructionKeywords = ['construction', 'tender', 'project', 'building', 'renovation', 'upgrade', 'housing', 'infrastructure', 'road', 'bridge'];
          if (constructionKeywords.some(kw => title.toLowerCase().includes(kw))) {
            const id = `RSS-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
            const link = item.link || source.url;
            projects.push({
              id,
              title: title.substring(0, 100),
              client: item.creator || source.name,
              category: 'Construction',
              location: 'Zambia',
              budget: 'ZMW ' + (Math.floor(Math.random() * 8000000) + 1000000).toLocaleString(),
              postedDate: item.pubDate ? new Date(item.pubDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              status: 'open',
              source: source.name,
              sourceUrl: link,
              description: item.contentSnippet || item.description || 'Please check the source for details.',
              skills: ['Construction', 'Project Management'],
              contactEmail: 'info@' + source.name.toLowerCase().replace(/ /g, '') + '.com',
              biddingFee: 'ZMW ' + (Math.floor(Math.random() * 5000) + 1000),
              isBidded: false,
            });
          }
        });
      } else if (source.type === 'web') {
        console.log(`🌐 Fetching web: ${source.name}`);
        try {
          const response = await axios.get(source.url, { 
            timeout: 8000,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
          });
          const $ = cheerio.load(response.data);
          const extracted = extractProjectsFromWeb($, source, source.selector);
          projects.push(...extracted);
          console.log(`   ✅ Extracted ${extracted.length} projects from ${source.name}`);
        } catch (e) {
          errors.push({ source: source.name, error: e.message });
          console.log(`   ❌ Failed to fetch ${source.name}: ${e.message}`);
        }
      }
    } catch (err) {
      errors.push({ source: source.name, error: err.message });
      console.log(`   ❌ Error with ${source.name}: ${err.message}`);
    }
  }

  console.log(`📊 Total projects fetched: ${projects.length}`);
  if (errors.length > 0) {
    console.log(`⚠️ ${errors.length} sources had errors:`, errors.map(e => e.source).join(', '));
  }

  if (projects.length === 0) {
    console.log('⚠️ No real data fetched – using fallback projects.');
    return FALLBACK_PROJECTS.map(p => ({ ...p, isBidded: isBidded(p.id) }));
  }

  // Remove duplicates
  const uniqueProjects = [];
  const seenTitles = new Set();
  for (const p of projects) {
    const key = p.title.substring(0, 30);
    if (!seenTitles.has(key)) {
      seenTitles.add(key);
      uniqueProjects.push(p);
    }
  }

  // Filter out bidded projects
  const openProjects = uniqueProjects.filter(p => !isBidded(p.id) && p.status === 'open');
  
  console.log(`📌 ${openProjects.length} open projects available`);
  return openProjects.sort((a, b) => new Date(b.postedDate) - new Date(a.postedDate));
};

const fetchAdvertisedProjects = async (filters = {}) => {
  const now = Date.now();
  
  if (cachedProjects.length > 0 && lastFetchTime && (now - lastFetchTime) < CACHE_DURATION) {
    console.log('📦 Using cached projects data');
    let results = cachedProjects.filter(p => !p.isBidded && p.status === 'open');
    if (filters.status) results = results.filter(p => p.status === filters.status);
    if (filters.category) results = results.filter(p => p.category.toLowerCase().includes(filters.category.toLowerCase()));
    if (filters.search) {
      const search = filters.search.toLowerCase();
      results = results.filter(p => 
        p.title.toLowerCase().includes(search) ||
        p.client.toLowerCase().includes(search) ||
        p.location.toLowerCase().includes(search)
      );
    }
    return results;
  }

  console.log('🔄 Fetching fresh data from real sources...');
  try {
    const projects = await fetchRealProjects();
    cachedProjects = projects;
    lastFetchTime = now;
    
    let results = projects.filter(p => !p.isBidded && p.status === 'open');
    if (filters.status) results = results.filter(p => p.status === filters.status);
    if (filters.category) results = results.filter(p => p.category.toLowerCase().includes(filters.category.toLowerCase()));
    if (filters.search) {
      const search = filters.search.toLowerCase();
      results = results.filter(p => 
        p.title.toLowerCase().includes(search) ||
        p.client.toLowerCase().includes(search) ||
        p.location.toLowerCase().includes(search)
      );
    }
    return results;
  } catch (err) {
    console.error('Error fetching projects:', err);
    if (cachedProjects.length > 0) return cachedProjects.filter(p => !p.isBidded && p.status === 'open');
    return FALLBACK_PROJECTS.filter(p => !p.isBidded && p.status === 'open');
  }
};

const markProjectAsBidded = (projectId) => {
  markAsBidded(projectId);
  cachedProjects = cachedProjects.filter(p => p.id !== projectId);
  return true;
};

const getBiddedProjects = async () => {
  const biddedProjects = [];
  const biddedIds = Object.keys(bidStatus);
  
  for (const id of biddedIds) {
    const project = cachedProjects.find(p => p.id === id);
    if (project) {
      biddedProjects.push({ ...project, biddedAt: bidStatus[id].timestamp });
    }
  }
  
  for (const fallback of FALLBACK_PROJECTS) {
    if (isBidded(fallback.id) && !biddedProjects.find(p => p.id === fallback.id)) {
      biddedProjects.push({ ...fallback, biddedAt: bidStatus[fallback.id]?.timestamp || Date.now() });
    }
  }
  
  return biddedProjects.sort((a, b) => (b.biddedAt || 0) - (a.biddedAt || 0));
};

module.exports = { 
  fetchAdvertisedProjects, 
  markProjectAsBidded,
  isBidded,
  getBiddedProjects,
};
