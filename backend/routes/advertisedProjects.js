const express = require('express');
const router = express.Router();
const axios = require('axios');
const cheerio = require('cheerio');
const Parser = require('rss-parser');
const parser = new Parser();
const cron = require('node-cron');
const AdvertisedProject = require('../models/AdvertisedProject');
const Bid = require('../models/Bid');
const auth = require('../middleware/auth');

// ─── Configuration ──────────────────────────────────────────────
// Keywords to identify construction/infrastructure projects in Zambia
const CONSTRUCTION_KEYWORDS = [
  'construction', 'tender', 'infrastructure', 'building', 'road', 'bridge',
  'school', 'hospital', 'water', 'solar', 'power', 'energy', 'housing',
  'renovation', 'upgrade', 'maintenance', 'works', 'project', 'development',
  'contract', 'procurement', 'bid', 'rfp', 'rfq', 'tenders', 'contractor'
];

const ZAMBIA_KEYWORDS = ['zambia', 'lusaka', 'copperbelt', 'ndola', 'kitwe', 'livingstone'];

// Sources – we keep NewsAPI as primary, but add stricter filtering
const SOURCES = [
  {
    name: 'NewsAPI - Construction Zambia',
    type: 'newsapi',
    query: 'construction Zambia OR infrastructure Zambia OR building Zambia OR tender Zambia',
    apiKey: process.env.NEWS_API_KEY,
    pageSize: 100,
  },
  {
    name: 'NewsAPI - Tenders Zambia',
    type: 'newsapi',
    query: 'tenders Zambia OR procurement Zambia',
    apiKey: process.env.NEWS_API_KEY,
    pageSize: 100,
  },
  {
    name: 'NewsAPI - Infrastructure',
    type: 'newsapi',
    query: 'infrastructure Zambia OR road Zambia OR bridge Zambia OR solar Zambia',
    apiKey: process.env.NEWS_API_KEY,
    pageSize: 100,
  },
  // RSS and Web sources (fallback)
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
];

// ─── Helper: check if an article is construction-related and mentions Zambia ──
function isRelevant(article) {
  const text = (article.title + ' ' + (article.description || '')).toLowerCase();
  // Must contain at least one construction keyword and a Zambia keyword
  const hasConstruction = CONSTRUCTION_KEYWORDS.some(kw => text.includes(kw));
  const hasZambia = ZAMBIA_KEYWORDS.some(kw => text.includes(kw));
  return hasConstruction && hasZambia;
}

// ─── Fetch from News API ──────────────────────────────────────
async function fetchFromNewsAPI(source) {
  if (!process.env.NEWS_API_KEY) {
    console.log('⚠️ NEWS_API_KEY not set – skipping NewsAPI fetch.');
    return [];
  }
  try {
    const { query, pageSize } = source;
    const response = await axios.get('https://newsapi.org/v2/everything', {
      params: {
        q: query,
        apiKey: process.env.NEWS_API_KEY,
        pageSize: pageSize || 100,
        language: 'en',
        sortBy: 'publishedAt',
      },
      timeout: 15000,
    });
    const articles = response.data.articles || [];
    // Filter for relevance
    const relevant = articles.filter(a => isRelevant(a));
    return relevant.map(a => ({
      title: a.title || 'Untitled',
      description: a.description || a.content || '',
      source: a.source?.name || 'Unknown',
      sourceUrl: a.url || '#',
      publishedAt: a.publishedAt,
    }));
  } catch (err) {
    console.error(`NewsAPI fetch error for "${source.query}":`, err.message);
    return [];
  }
}

// ─── Fetch from RSS ─────────────────────────────────────────────
async function fetchFromRSS(source) {
  try {
    console.log(`📡 Fetching RSS: ${source.name}`);
    const feed = await parser.parseURL(source.url);
    const articles = feed.items || [];
    const relevant = articles.filter(a => isRelevant(a));
    return relevant.map(item => ({
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

// ─── Fetch from Web (scrape) ──────────────────────────────────
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
    const selectors = ['h2', 'h3', 'h4', '.title', '.post-title', '.entry-title', '.tender-item', '.project-item'];
    $(selectors.join(', ')).each((i, el) => {
      const text = $(el).text().trim();
      if (text.length > 20 && text.length < 300) {
        let link = $(el).find('a').attr('href') || $(el).closest('a').attr('href') || '';
        if (link && !link.startsWith('http')) {
          if (link.startsWith('/')) link = (source.baseUrl || '') + link;
          else link = (source.baseUrl || '') + '/' + link;
        }
        const article = { title: text, description: text, source: source.name, sourceUrl: link || source.url };
        if (isRelevant(article)) {
          items.push({ ...article, publishedAt: new Date().toISOString() });
        }
      }
    });
    return items;
  } catch (err) {
    console.log(`   ❌ Web failed: ${source.name} - ${err.message}`);
    return [];
  }
}

// ─── Normalize to AdvertisedProject format ────────────────────
function normalizeProject(article) {
  const budgetMatch = (article.description || article.title).match(/(?:ZMW|K)\s*([\d,]+)/);
  const budget = budgetMatch ? `ZMW ${budgetMatch[1]}` : 'ZMW 0';

  const clientMatch = (article.description || article.title).match(/(?:by|for|from)\s+([A-Z][A-Za-z\s]+)(?:\s|$)/);
  const client = clientMatch ? clientMatch[1].trim() : 'Various';

  const location = 'Zambia';

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
    client,
    location,
    budget,
    deadline,
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

// ─── Master fetch ──────────────────────────────────────────────
async function fetchAllSources() {
  console.log('🔄 Fetching real construction projects from all sources...');
  let rawArticles = [];

  for (const source of SOURCES) {
    try {
      let articles = [];
      if (source.type === 'newsapi') {
        articles = await fetchFromNewsAPI(source);
      } else if (source.type === 'rss') {
        articles = await fetchFromRSS(source);
      } else if (source.type === 'web') {
        articles = await fetchFromWeb(source);
      }
      articles = articles.map(a => ({ ...a, source: a.source || source.name }));
      rawArticles = rawArticles.concat(articles);
      console.log(`   ✅ ${source.name} returned ${articles.length} articles`);
    } catch (err) {
      console.log(`   ❌ Source ${source.name} failed:`, err.message);
    }
  }

  // Deduplicate by sourceUrl
  const seen = new Set();
  const uniqueArticles = rawArticles.filter(a => {
    const key = a.sourceUrl && a.sourceUrl !== '#' ? a.sourceUrl : a.title;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const projects = uniqueArticles.map(normalizeProject);
  const filtered = projects.filter(p => p.title.length > 15);

  console.log(`✅ Total unique relevant projects: ${filtered.length}`);
  return filtered;
}

// ─── POST /fetch – fetch and store ────────────────────────────
router.post('/fetch', async (req, res) => {
  try {
    const projects = await fetchAllSources();

    if (projects.length === 0) {
      return res.json({
        message: 'No new construction projects found. Try again later.',
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
        // Update fields that may change
        await AdvertisedProject.updateOne(
          { uniqueKey: proj.uniqueKey },
          { budget: proj.budget, deadline: proj.deadline, updatedAt: new Date() }
        );
        skipped++;
      }
    }

    res.json({
      message: `Fetched ${projects.length} projects. Added ${added}, updated ${skipped}.`,
      results: { added, skipped }
    });
  } catch (err) {
    console.error('Fetch error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// ─── GET / – list open projects (construction-related only) ──
router.get('/', async (req, res) => {
  try {
    const { search, status } = req.query;
    const query = {
      status: 'open',
      // Ensure we only show construction-related projects (they should already be filtered)
      // but we can add extra safety:
      $or: [
        { title: { $regex: /construction|infrastructure|building|road|bridge|school|hospital|water|solar|tender|project|development/i } },
        { description: { $regex: /construction|infrastructure|building|road|bridge|school|hospital|water|solar|tender|project|development/i } }
      ],
      location: { $regex: /zambia/i },
    };
    if (status && status !== 'all') query.status = status;
    if (search) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { client: { $regex: search, $options: 'i' } },
          { location: { $regex: search, $options: 'i' } },
        ]
      });
    }
    const projects = await AdvertisedProject.find(query)
      .sort({ createdAt: -1 })
      .limit(200);
    res.json({ projects });
  } catch (err) {
    console.error('List error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /:projectId/bid – mark as bidded ────────────────────
router.post('/:projectId/bid', auth, async (req, res) => {
  try {
    const project = await AdvertisedProject.findOne({ id: req.params.projectId });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (project.status === 'bidded') return res.status(400).json({ error: 'Already bidded' });

    project.status = 'bidded';
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
    console.error('Bid error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Scheduled fetch every 6 hours ────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  cron.schedule('0 */6 * * *', async () => {
    console.log('⏰ Scheduled fetch: fetching construction projects...');
    try {
      await fetchAllSources();
      console.log('✅ Scheduled fetch completed.');
    } catch (err) {
      console.error('❌ Scheduled fetch failed:', err);
    }
  });
}

module.exports = router;