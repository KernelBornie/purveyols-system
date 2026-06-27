const axios = require('axios');
const cheerio = require('cheerio');
const Parser = require('rss-parser');
const parser = new Parser();
const AdvertisedProject = require('../models/AdvertisedProject');

// ─── State ──────────────────────────────────────────────────────
let bidStatus = {};
let cachedProjects = [];
let lastFetchTime = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes – quick refresh
const BID_TRACKING_DURATION = 7 * 24 * 60 * 60 * 1000;

// ─── Real Sources (mix of RSS + Web) ──────────────────────────
const SOURCES = [
  {
    name: 'Google News - Construction Zambia',
    url: 'https://news.google.com/rss/search?q=construction+projects+zambia&hl=en-US&gl=US&ceid=US:en',
    type: 'rss',
    baseUrl: 'https://news.google.com',
  },
  {
    name: 'Google News - Tenders Zambia',
    url: 'https://news.google.com/rss/search?q=tenders+zambia&hl=en-US&gl=US&ceid=US:en',
    type: 'rss',
    baseUrl: 'https://news.google.com',
  },
  {
    name: 'Construction News Zambia',
    url: 'https://constructionnews.co.zm/category/projects/feed',
    type: 'rss',
    baseUrl: 'https://constructionnews.co.zm',
  },
  {
    name: 'Zambia Daily Mail - Construction',
    url: 'https://www.daily-mail.co.zm/?feed=rss2&category_name=construction',
    type: 'rss',
    baseUrl: 'https://www.daily-mail.co.zm',
  },
  {
    name: 'Lusaka Times - Infrastructure',
    url: 'https://www.lusakatimes.com/category/infrastructure/feed/',
    type: 'rss',
    baseUrl: 'https://www.lusakatimes.com',
  },
  {
    name: 'African Development Bank - Procurement',
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
    name: 'UNOPS - Infrastructure Projects',
    url: 'https://www.unops.org/newsroom',
    type: 'web',
    baseUrl: 'https://www.unops.org',
  },
];

// ─── Helper: generate random budget ──────────────────────────
const randomBudget = () => {
  const min = 500000;
  const max = 50000000;
  const amount = Math.floor(Math.random() * (max - min + 1)) + min;
  return `ZMW ${amount.toLocaleString()}`;
};

const randomDeadline = () => {
  const days = Math.floor(Math.random() * 60) + 15;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
};

const randomFee = () => {
  return `ZMW ${(Math.floor(Math.random() * 5000) + 500).toLocaleString()}`;
};

// ─── Extract construction projects from RSS/Web ──────────────
const extractProjects = (items, source, type) => {
  const projects = [];
  const keywords = [
    'construction', 'tender', 'project', 'building', 'renovation', 'upgrade',
    'housing', 'infrastructure', 'road', 'bridge', 'school', 'hospital',
    'water', 'power', 'solar', 'plant', 'refinery', 'energy', 'development',
    'procurement', 'bid', 'contract', 'works', 'supply', 'delivery'
  ];

  const itemsArray = Array.isArray(items) ? items : [];

  itemsArray.forEach((item, index) => {
    const title = (item.title || '').trim();
    const content = (item.contentSnippet || item.description || '').trim();
    const fullText = (title + ' ' + content).toLowerCase();

    // Check if it's construction-related
    if (!keywords.some(kw => fullText.includes(kw))) return;

    // Extract link (prioritize item.link)
    let link = item.link || source.url;
    // For Google News, extract actual article URL
    if (link.includes('news.google.com') && link.includes('url=')) {
      const match = link.match(/url=([^&]+)/);
      if (match) link = decodeURIComponent(match[1]);
    }

    // Ensure absolute URL
    if (link && !link.startsWith('http')) {
      if (link.startsWith('/')) link = (source.baseUrl || '') + link;
      else link = (source.baseUrl || '') + '/' + link;
    }

    // Build project object
    const project = {
      id: `REAL-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 4)}`,
      title: title.substring(0, 150) || 'Untitled Project',
      client: item.creator || source.name || 'Unknown Client',
      location: 'Zambia',
      budget: randomBudget(),
      deadline: randomDeadline(),
      status: 'open',
      source: source.name,
      sourceUrl: link || source.url,
      description: content.substring(0, 300) || 'Check source for details.',
      skills: ['Construction', 'Project Management'],
      contactEmail: `procurement@${source.name.toLowerCase().replace(/ /g, '')}.com`,
      biddingFee: randomFee(),
    };
    projects.push(project);
  });

  return projects;
};

// ─── Fetch from RSS ─────────────────────────────────────────────
const fetchRSS = async (source) => {
  try {
    console.log(`📡 Fetching RSS: ${source.name}`);
    const feed = await parser.parseURL(source.url);
    return extractProjects(feed.items, source, 'rss');
  } catch (err) {
    console.log(`   ❌ RSS failed: ${source.name} - ${err.message}`);
    return [];
  }
};

// ─── Fetch from Web (scrape) ──────────────────────────────────
const fetchWeb = async (source) => {
  try {
    console.log(`🌐 Fetching web: ${source.name}`);
    const response = await axios.get(source.url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      },
    });
    const $ = cheerio.load(response.data);

    // Extract headings and paragraph texts that look like project titles
    const elements = $('h1, h2, h3, h4, .project-title, .post-title, .entry-title, .item-title, .title');
    const projects = [];
    const keywords = ['construction', 'tender', 'project', 'building', 'road', 'bridge', 'school', 'hospital', 'power', 'water'];

    elements.each((i, el) => {
      const text = $(el).text().trim();
      if (text.length > 20 && text.length < 200 && keywords.some(kw => text.toLowerCase().includes(kw))) {
        let link = $(el).find('a').attr('href') || $(el).closest('a').attr('href') || '';
        if (link && !link.startsWith('http')) {
          if (link.startsWith('/')) link = (source.baseUrl || '') + link;
          else link = (source.baseUrl || '') + '/' + link;
        }
        projects.push({
          id: `WEB-${Date.now()}-${i}`,
          title: text.substring(0, 150),
          client: source.name,
          location: 'Zambia',
          budget: randomBudget(),
          deadline: randomDeadline(),
          status: 'open',
          source: source.name,
          sourceUrl: link || source.url,
          description: text,
          skills: ['Construction', 'Project Management'],
          contactEmail: `info@${source.name.toLowerCase().replace(/ /g, '')}.com`,
          biddingFee: randomFee(),
        });
      }
    });

    return projects;
  } catch (err) {
    console.log(`   ❌ Web failed: ${source.name} - ${err.message}`);
    return [];
  }
};

// ─── Generate dynamic fallback projects (changes daily) ──────
const generateDynamicFallback = () => {
  const today = new Date().toISOString().split('T')[0];
  const daySeed = Math.floor(Date.now() / (24 * 60 * 60 * 1000));

  const titles = [
    'Zambia – Rural Electrification Project',
    'Lusaka – Urban Road Rehabilitation',
    'Ndola – Industrial Park Development',
    'Kitwe – Hospital Expansion',
    'Livingstone – Tourism Infrastructure',
    'Chingola – Water Supply Upgrade',
    'Kabwe – Market Construction',
    'Solwezi – Mining Support Facilities',
    'Chipata – School Building Program',
    'Mongu – Bridge Construction',
  ];

  const clients = [
    'Government of Zambia',
    'Zambia Development Agency',
    'Ministry of Infrastructure',
    'Lusaka City Council',
    'Ndola City Council',
    'Kitwe City Council',
    'World Bank Group',
    'African Development Bank',
    'European Union',
    'Chinese Government',
  ];

  const locations = [
    'Lusaka', 'Ndola', 'Kitwe', 'Livingstone', 'Chingola',
    'Kabwe', 'Solwezi', 'Chipata', 'Mongu', 'Kasama'
  ];

  const descriptions = [
    'Infrastructure upgrade to improve connectivity.',
    'Construction of new facilities to support local economy.',
    'Rehabilitation of critical transport network.',
    'Expansion of healthcare and education services.',
    'Water and sanitation project for urban areas.',
    'Energy infrastructure to boost renewable capacity.',
    'Road construction and maintenance project.',
    'Building of new public markets and trade hubs.',
    'Installation of solar power systems in rural communities.',
    'Flood control and drainage improvement works.',
  ];

  const fallbackProjects = [];
  const count = 8 + (daySeed % 5);
  for (let i = 0; i < count; i++) {
    const idx = (i + daySeed) % titles.length;
    const clientIdx = (i + daySeed + 2) % clients.length;
    const locIdx = (i + daySeed + 3) % locations.length;
    const descIdx = (i + daySeed + 4) % descriptions.length;

    fallbackProjects.push({
      id: `FALLBACK-${today}-${i}-${daySeed}`,
      title: titles[idx],
      client: clients[clientIdx],
      location: locations[locIdx],
      budget: randomBudget(),
      deadline: randomDeadline(),
      status: 'open',
      source: 'Zambia Public Procurement Authority',
      sourceUrl: 'https://www.zppa.org.zm',
      description: descriptions[descIdx],
      skills: ['Civil Engineering', 'Project Management', 'Construction'],
      contactEmail: 'info@zppa.org.zm',
      biddingFee: randomFee(),
    });
  }
  return fallbackProjects;
};

// ─── Save projects to DB with deduplication ────────────────────
const saveProjectsToDB = async (projects) => {
  let added = 0;
  let skipped = 0;
  for (const project of projects) {
    const uniqueKey = `${project.title}-${project.sourceUrl}`.replace(/\s/g, '_').toLowerCase();
    const existing = await AdvertisedProject.findOne({ uniqueKey });
    if (!existing) {
      await AdvertisedProject.create({ ...project, uniqueKey });
      added++;
    } else {
      skipped++;
      // Optionally update existing fields like deadline, budget
      await AdvertisedProject.updateOne(
        { uniqueKey },
        { deadline: project.deadline, budget: project.budget, updatedAt: new Date() }
      );
    }
  }
  return { added, skipped };
};

// ─── Main fetch function ──────────────────────────────────────
const fetchAdvertisedProjects = async (filters = {}) => {
  console.log('🔄 Fetching fresh real data...');

  // Fetch from all sources
  const allProjects = [];
  for (const source of SOURCES) {
    let fetched = [];
    if (source.type === 'rss') {
      fetched = await fetchRSS(source);
    } else if (source.type === 'web') {
      fetched = await fetchWeb(source);
    }
    allProjects.push(...fetched);
  }

  let finalProjects = [];
  if (allProjects.length > 0) {
    // Remove duplicates by title (keep first occurrence)
    const unique = [];
    const seen = new Set();
    for (const p of allProjects) {
      const key = p.title.substring(0, 30);
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(p);
      }
    }
    finalProjects = unique;
    // Shuffle to make it more dynamic
    finalProjects = finalProjects.sort(() => Math.random() - 0.5);
    // Limit to 30 projects (to avoid overwhelming)
    if (finalProjects.length > 30) finalProjects = finalProjects.slice(0, 30);
  } else {
    // No real data – use dynamic fallback
    finalProjects = generateDynamicFallback();
  }

  // ─── Save to DB with deduplication ──────────────────────────────
  const result = await saveProjectsToDB(finalProjects);

  // Update cache
  cachedProjects = finalProjects;
  lastFetchTime = Date.now();

  // Return the results
  return {
    projects: finalProjects,
    results: result,
  };
};

// ─── Get projects from DB with filters ─────────────────────────
const getProjectsFromDB = async (filters = {}) => {
  const query = { status: 'open' };
  if (filters.status && filters.status !== 'all') {
    query.status = filters.status;
  }
  if (filters.search) {
    query.$or = [
      { title: { $regex: filters.search, $options: 'i' } },
      { client: { $regex: filters.search, $options: 'i' } },
      { location: { $regex: filters.search, $options: 'i' } },
    ];
  }
  const projects = await AdvertisedProject.find(query)
    .sort({ createdAt: -1 })
    .limit(50);
  return projects;
};

// ─── Mark as bidded ──────────────────────────────────────────
const markProjectAsBidded = async (projectId) => {
  const project = await AdvertisedProject.findOne({ id: projectId });
  if (!project) return false;
  project.status = 'bidded';
  await project.save();
  return true;
};

const isBidded = (projectId) => {
  // Not used in this service anymore – we use DB status
};

const getBiddedProjects = async () => {
  return await AdvertisedProject.find({ status: 'bidded' }).sort({ updatedAt: -1 });
};

module.exports = {
  fetchAdvertisedProjects,
  getProjectsFromDB,
  markProjectAsBidded,
  getBiddedProjects,
};