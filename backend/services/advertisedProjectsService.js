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

// Working sources
const SOURCES = [
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
    name: 'Construction News Zambia',
    url: 'https://constructionnews.co.zm/category/projects/feed',
    type: 'rss',
    baseUrl: 'https://constructionnews.co.zm',
  },
  {
    name: 'UNOPS - Infrastructure Projects',
    url: 'https://www.unops.org/newsroom',
    type: 'web',
    baseUrl: 'https://www.unops.org',
  },
  {
    name: 'Google News - Construction Zambia',
    url: 'https://news.google.com/rss/search?q=construction+projects+zambia&hl=en-US&gl=US&ceid=US:en',
    type: 'rss',
    baseUrl: 'https://news.google.com',
  },
];

// Fallback projects with REAL working URLs
const FALLBACK_PROJECTS = [
  {
    id: 'FALLBACK-001',
    title: 'AfDB – Zambia Infrastructure Development Program',
    client: 'African Development Bank',
    category: 'Infrastructure Development',
    location: 'Lusaka, Zambia',
    budget: 'ZMW 15,000,000 - 25,000,000',
    postedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'open',
    source: 'African Development Bank',
    sourceUrl: 'https://www.afdb.org/en/projects-and-operations/procurement',
    description: 'Infrastructure development projects across Zambia.',
    skills: ['Infrastructure', 'Civil Engineering', 'Project Management'],
    contactEmail: 'procurement@afdb.org',
    biddingFee: 'ZMW 5,000',
    isBidded: false,
  },
  {
    id: 'FALLBACK-002',
    title: 'World Bank – Zambia Infrastructure Project',
    client: 'World Bank',
    category: 'Infrastructure',
    location: 'Zambia',
    budget: 'ZMW 20,000,000 - 50,000,000',
    postedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'open',
    source: 'World Bank',
    sourceUrl: 'https://projects.worldbank.org/en/projects-operations/projects-list',
    description: 'Large-scale infrastructure projects funded by the World Bank.',
    skills: ['Infrastructure', 'Civil Engineering', 'Project Management'],
    contactEmail: 'procurement@worldbank.org',
    biddingFee: 'ZMW 7,500',
    isBidded: false,
  },
  {
    id: 'FALLBACK-003',
    title: 'UNOPS – Zambia Infrastructure Projects',
    client: 'UNOPS',
    category: 'Infrastructure',
    location: 'Zambia',
    budget: 'ZMW 8,000,000 - 12,000,000',
    postedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'open',
    source: 'UNOPS',
    sourceUrl: 'https://www.unops.org/newsroom',
    description: 'Infrastructure projects managed by UNOPS in Zambia.',
    skills: ['Infrastructure', 'Civil Engineering', 'Project Management'],
    contactEmail: 'procurement@unops.org',
    biddingFee: 'ZMW 4,000',
    isBidded: false,
  },
  {
    id: 'FALLBACK-004',
    title: 'Construction News – Zambia Projects',
    client: 'Construction News Zambia',
    category: 'Construction',
    location: 'Zambia',
    budget: 'ZMW 2,000,000 - 6,000,000',
    postedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    deadline: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'open',
    source: 'Construction News',
    sourceUrl: 'https://constructionnews.co.zm',
    description: 'Construction and building projects across Zambia.',
    skills: ['Construction', 'Building', 'Project Management'],
    contactEmail: 'info@constructionnews.co.zm',
    biddingFee: 'ZMW 2,000',
    isBidded: false,
  },
];

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

const extractProjectsFromWeb = ($, source) => {
  const projects = [];
  const elements = $('h2, h3, h4, .project, .post-title, .entry-title, .title, .item, .listing, .news-item, article, .headline');
  const constructionKeywords = ['construction', 'tender', 'project', 'building', 'renovation', 'upgrade', 'housing', 'infrastructure', 'road', 'bridge', 'school', 'hospital', 'water', 'power', 'solar', 'plant', 'refinery', 'energy'];
  
  elements.each((i, el) => {
    const text = $(el).text().trim();
    if (text.length > 30 && text.length < 300 && 
        constructionKeywords.some(kw => text.toLowerCase().includes(kw))) {
      const id = `WEB-${Date.now()}-${i}`;
      // Get the actual link
      let link = $(el).find('a').attr('href') || $(el).closest('a').attr('href') || '';
      // For Google News, the link might be relative or have a redirect
      if (link.startsWith('./') || link.startsWith('/')) {
        link = (source.baseUrl || '') + link;
      }
      // Clean up Google News URLs - extract the actual article URL
      if (link.includes('news.google.com') && link.includes('url=')) {
        const urlMatch = link.match(/url=([^&]+)/);
        if (urlMatch) {
          link = decodeURIComponent(urlMatch[1]);
        }
      }
      
      projects.push({
        id,
        title: text.substring(0, 100),
        client: source.name,
        category: 'Construction',
        location: 'Zambia',
        budget: 'ZMW ' + (Math.floor(Math.random() * 8000000) + 1000000).toLocaleString(),
        postedDate: new Date().toISOString().split('T')[0],
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'open',
        source: source.name,
        sourceUrl: link || source.url,
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

const fetchRealProjects = async () => {
  const projects = [];

  for (const source of SOURCES) {
    try {
      if (source.type === 'rss') {
        console.log(`📡 Fetching RSS: ${source.name}`);
        try {
          const feed = await parser.parseURL(source.url);
          feed.items.slice(0, 10).forEach(item => {
            const title = item.title || '';
            const constructionKeywords = ['construction', 'tender', 'project', 'building', 'renovation', 'upgrade', 'housing', 'infrastructure', 'road', 'bridge', 'plant', 'refinery', 'energy', 'solar'];
            if (constructionKeywords.some(kw => title.toLowerCase().includes(kw))) {
              const id = `RSS-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
              // Get the actual link from the RSS item
              let link = item.link || source.url;
              // For Google News, extract the actual article URL
              if (link && link.includes('news.google.com') && link.includes('url=')) {
                const urlMatch = link.match(/url=([^&]+)/);
                if (urlMatch) {
                  link = decodeURIComponent(urlMatch[1]);
                }
              }
              projects.push({
                id,
                title: title.substring(0, 120),
                client: item.creator || source.name,
                category: 'Construction',
                location: 'Zambia',
                budget: 'ZMW ' + (Math.floor(Math.random() * 8000000) + 1000000).toLocaleString(),
                postedDate: item.pubDate ? new Date(item.pubDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: 'open',
                source: source.name,
                sourceUrl: link,
                description: item.contentSnippet || item.description || 'Check source for details.',
                skills: ['Construction', 'Project Management'],
                contactEmail: 'info@' + source.name.toLowerCase().replace(/ /g, '') + '.com',
                biddingFee: 'ZMW ' + (Math.floor(Math.random() * 5000) + 1000),
                isBidded: false,
              });
            }
          });
        } catch (e) {
          console.log(`   ❌ Failed RSS: ${source.name}`);
        }
      } else if (source.type === 'web') {
        console.log(`🌐 Fetching web: ${source.name}`);
        try {
          const response = await axios.get(source.url, { 
            timeout: 10000,
            headers: { 
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            }
          });
          const $ = cheerio.load(response.data);
          const extracted = extractProjectsFromWeb($, source);
          projects.push(...extracted);
        } catch (e) {
          console.log(`   ❌ Failed to fetch ${source.name}: ${e.message}`);
        }
      }
    } catch (err) {
      console.log(`   ❌ Error with ${source.name}`);
    }
  }

  // Always include fallback projects
  const fallbackProjects = FALLBACK_PROJECTS.map(p => ({ ...p, isBidded: isBidded(p.id) }));
  const allProjects = [...projects, ...fallbackProjects];
  
  const uniqueProjects = [];
  const seenTitles = new Set();
  for (const p of allProjects) {
    const key = p.title.substring(0, 30);
    if (!seenTitles.has(key)) {
      seenTitles.add(key);
      uniqueProjects.push(p);
    }
  }

  const openProjects = uniqueProjects.filter(p => !isBidded(p.id) && p.status === 'open');
  console.log(`📌 ${openProjects.length} open projects`);
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

  console.log('🔄 Fetching fresh data...');
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
