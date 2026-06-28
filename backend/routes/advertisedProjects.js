const express = require('express');
const router = express.Router();
const axios = require('axios');
const cheerio = require('cheerio');
const Parser = require('rss-parser');
const parser = new Parser();
const cron = require('node-cron'); // npm install node-cron
const AdvertisedProject = require('../models/AdvertisedProject');
const Bid = require('../models/Bid');
const auth = require('../middleware/auth');

// ─── Configure sources ──────────────────────────────────────────────
const SOURCES = [
  {
    name: 'NewsAPI - Construction Tenders Zambia',
    type: 'newsapi',
    query: 'construction tender Zambia',
    apiKey: process.env.NEWS_API_KEY,
  },
  {
    name: 'NewsAPI - Infrastructure Projects Zambia',
    type: 'newsapi',
    query: 'infrastructure project Zambia',
    apiKey: process.env.NEWS_API_KEY,
  },
  {
    name: 'NewsAPI - Tenders Zambia',
    type: 'newsapi',
    query: 'tenders Zambia',
    apiKey: process.env.NEWS_API_KEY,
  },
  {
    name: 'Zambia Public Procurement Authority (ZPPA)',
    type: 'web',
    url: 'https://www.zppa.org.zm/tenders',
    baseUrl: 'https://www.zppa.org.zm',
  },
  {
    name: 'African Tenders - Zambia',
    type: 'web',
    url: 'https://www.africatenders.com/tenders/zambia',
    baseUrl: 'https://www.africatenders.com',
  },
  {
    name: 'Construction Review - Zambia',
    type: 'rss',
    url: 'https://constructionreviewonline.com/category/africa/zambia/feed',
    baseUrl: 'https://constructionreviewonline.com',
  },
  {
    name: 'Lusaka Times - Infrastructure',
    type: 'rss',
    url: 'https://www.lusakatimes.com/category/infrastructure/feed/',
    baseUrl: 'https://www.lusakatimes.com',
  },
  {
    name: 'Zambia Daily Mail - Construction',
    type: 'rss',
    url: 'https://www.daily-mail.co.zm/?feed=rss2&category_name=construction',
    baseUrl: 'https://www.daily-mail.co.zm',
  },
];

// ─── Helper: fetch from News API ─────────────────────────────────
async function fetchFromNewsAPI(query) {
  if (!process.env.NEWS_API_KEY) {
    console.log('⚠️ NEWS_API_KEY not set – skipping NewsAPI fetch.');
    return [];
  }
  try {
    const response = await axios.get('https://newsapi.org/v2/everything', {
      params: {
        q: query,
        apiKey: process.env.NEWS_API_KEY,
        pageSize: 10,
        language: 'en',
        sortBy: 'publishedAt',
      },
      timeout: 10000,
    });
    return response.data.articles.map(article => ({
      title: article.title || 'Untitled',
      description: article.description || article.content || '',
      source: article.source.name || 'Unknown',
      sourceUrl: article.url || '#',
      publishedAt: article.publishedAt,
    }));
  } catch (err) {
    console.error(`NewsAPI fetch error for "${query}":`, err.message);
    return [];
  }
}

// ─── Helper: fetch from RSS ──────────────────────────────────────
async function fetchFromRSS(source) {
  try {
    console.log(`📡 Fetching RSS: ${source.name}`);
    const feed = await parser.parseURL(source.url);
    return feed.items.map(item => ({
      title: item.title || 'Untitled',
      description: item.contentSnippet || item.description || '',
      source: source.name,
      sourceUrl: item.link || source.url,
      publishedAt: item.pubDate || new Date().toISOString(),
    }));
  } catch (err) {
    console.log(`   ❌ RSS failed: ${source.name} - ${err.message}`);
    return [];
  }
}

// ─── Helper: fetch from Web (scrape) ────────────────────────────
async function fetchFromWeb(source) {
  try {
    console.log(`🌐 Fetching web: ${source.name}`);
    const response = await axios.get(source.url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
    const $ = cheerio.load(response.data);
    const items = [];
    // Common selectors for tender listings – adjust per site
    const selectors = [
      'h2', 'h3', 'h4', '.title', '.post-title', '.entry-title',
      '.tender-item', '.project-item', '.listing-item'
    ];
    $(selectors.join(', ')).each((i, el) => {
      const text = $(el).text().trim();
      if (text.length > 20 && text.length < 300) {
        let link = $(el).find('a').attr('href') || $(el).closest('a').attr('href') || '';
        if (link && !link.startsWith('http')) {
          if (link.startsWith('/')) link = (source.baseUrl || '') + link;
          else link = (source.baseUrl || '') + '/' + link;
        }
        items.push({
          title: text,
          description: text,
          source: source.name,
          sourceUrl: link || source.url,
          publishedAt: new Date().toISOString(),
        });
      }
    });
    return items;
  } catch (err) {
    console.log(`   ❌ Web failed: ${source.name} - ${err.message}`);
    return [];
  }
}

// ─── Helper: convert raw articles to AdvertisedProject format ──
function normalizeProject(article) {
  // Try to extract budget from title/description
  const budgetMatch = (article.description || article.title).match(/ZMW\s*([\d,]+)/) ||
                      (article.description || article.title).match(/K\s*([\d,]+)/);
  const budget = budgetMatch ? `ZMW ${budgetMatch[1]}` : 'ZMW 0';

  // Try to extract client
  const clientMatch = (article.description || article.title).match(/(?:by|for|from)\s+([A-Z][A-Za-z\s]+)(?:\s|$)/);
  const client = clientMatch ? clientMatch[1].trim() : 'Various';

  // Location – default to Zambia
  const location = 'Zambia';

  // Deadline – parse if mentioned
  let deadline = new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0];
  const deadlineMatch = (article.description || article.title).match(/(\d{1,2}\s+[A-Za-z]+\s+\d{4})/);
  if (deadlineMatch) {
    const d = new Date(deadlineMatch[1]);
    if (!isNaN(d)) deadline = d.toISOString().split('T')[0];
  }

  const uniqueKey = `${article.title}-${article.sourceUrl}`.replace(/\s/g, '_').toLowerCase();

  return {
    id: uniqueKey,
    title: article.title.substring(0, 200),
    client: client,
    location: location,
    budget: budget,
    deadline: deadline,
    status: 'open',
    source: article.source || 'Unknown',
    sourceUrl: article.sourceUrl || '#',
    description: article.description || article.title,
    skills: ['Construction', 'Project Management'],
    contactEmail: 'procurement@example.com',
    biddingFee: 'Free',
    uniqueKey,
  };
}

// ─── Master fetch – collects from all sources ──────────────────
async function fetchAllSources() {
  console.log('🔄 Fetching real projects from all sources...');
  let rawArticles = [];

  for (const source of SOURCES) {
    try {
      let articles = [];
      if (source.type === 'newsapi') {
        articles = await fetchFromNewsAPI(source.query);
      } else if (source.type === 'rss') {
        articles = await fetchFromRSS(source);
      } else if (source.type === 'web') {
        articles = await fetchFromWeb(source);
      }
      // Add source name to each article if not already present
      articles = articles.map(a => ({ ...a, source: a.source || source.name }));
      rawArticles = rawArticles.concat(articles);
    } catch (err) {
      console.log(`   ❌ Source ${source.name} failed:`, err.message);
    }
  }

  // Deduplicate by sourceUrl
  const seen = new Set();
  const uniqueArticles = rawArticles.filter(a => {
    const key = a.sourceUrl || a.title;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Convert to AdvertisedProject format
  const projects = uniqueArticles.map(normalizeProject);

  // Filter out projects with very short titles (likely noise)
  const filtered = projects.filter(p => p.title.length > 15);

  console.log(`✅ Found ${filtered.length} real projects.`);
  return filtered;
}

// ─── POST /fetch – fetch and store real projects ──────────────
router.post('/fetch', async (req, res) => {
  try {
    const projects = await fetchAllSources();

    if (projects.length === 0) {
      return res.json({
        message: 'No live projects found. Please try again later.',
        results: { added: 0, skipped: 0 }
      });
    }

    let added = 0, skipped = 0;
    for (const proj of projects) {
      const existing = await AdvertisedProject.findOne({ uniqueKey: proj.uniqueKey });
      if (!existing) {
        await AdvertisedProject.create(proj);
        added++;
      } else {
        // Optionally update fields like budget, deadline
        await AdvertisedProject.updateOne(
          { uniqueKey: proj.uniqueKey },
          { budget: proj.budget, deadline: proj.deadline, updatedAt: new Date() }
        );
        skipped++;
      }
    }

    res.json({
      message: `Fetched ${projects.length} real projects. Added ${added}, updated ${skipped}.`,
      results: { added, skipped }
    });
  } catch (err) {
    console.error('Fetch error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// ─── GET / – list open projects (only real, no mocks) ──────────
router.get('/', async (req, res) => {
  try {
    const { search, status } = req.query;
    const query = { status: 'open' };
    if (status && status !== 'all') query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { client: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }
    const projects = await AdvertisedProject.find(query).sort({ createdAt: -1 }).limit(50);
    res.json({ projects });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /:projectId/bid – mark as bidded and create Bid ──
router.post('/:projectId/bid', auth, async (req, res) => {
  try {
    const project = await AdvertisedProject.findOne({ id: req.params.projectId });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (project.status === 'bidded') return res.status(400).json({ error: 'Already bidded' });

    project.status = 'bidded';
    project.updatedAt = new Date();
    await project.save();

    const bidData = {
      projectId: project.id,
      projectTitle: project.title,
      client: project.client,
      location: project.location,
      budget: project.budget,
      deadline: project.deadline,
      source: project.source,
      sourceUrl: project.sourceUrl,
      description: project.description,
      skills: project.skills || [],
      contactEmail: project.contactEmail,
      biddingFee: project.biddingFee,
      status: 'bidded',
      bidDate: new Date(),
      user: req.user.id,
      notes: `Bidded from advertised project ${project.id}`,
    };
    const bid = new Bid(bidData);
    await bid.save();

    res.status(201).json({
      message: 'Project marked as bidded and Bid created!',
      project,
      bid
    });
  } catch (err) {
    console.error('Bid creation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Schedule automatic fetch every 6 hours ────────────────────
if (process.env.NODE_ENV !== 'test') {
  cron.schedule('0 */6 * * *', async () => {
    console.log('⏰ Scheduled fetch: fetching real projects...');
    try {
      await fetchAllSources();
      console.log('✅ Scheduled fetch completed.');
    } catch (err) {
      console.error('❌ Scheduled fetch failed:', err);
    }
  });
}

module.exports = router;