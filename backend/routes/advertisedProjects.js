const express = require('express');
const router = express.Router();
const axios = require('axios');
const AdvertisedProject = require('../models/AdvertisedProject');

// ─── Helper: fetch articles from News API ──────────────────────
async function fetchNews(query) {
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
    console.error(`Error fetching news for query "${query}":`, err.message);
    return [];
  }
}

// ─── Helper: generate mock project ─────────────────────────────
function generateMockProject() {
  const clients = ['ZANACO', 'ABSA Bank', 'FNB Zambia', 'Lusaka City Council', 'University of Zambia', 'UTH Hospital', 'ZESCO', 'ZRA', 'Road Development Agency', 'Ministry of Infrastructure'];
  const locations = ['Lusaka', 'Ndola', 'Kitwe', 'Livingstone', 'Chipata', 'Kabwe', 'Mongu', 'Solwezi'];
  const budgets = ['ZMW 500,000', 'ZMW 1,200,000', 'ZMW 2,500,000', 'ZMW 750,000', 'ZMW 3,000,000', 'ZMW 4,200,000', 'ZMW 6,800,000'];
  const titles = [
    'Construction of new office block',
    'Renovation of hospital wing',
    'Upgrade of university library',
    'Road resurfacing project',
    'Building of a new market',
    'Installation of solar panels',
    'Water treatment plant expansion',
    'Construction of staff housing',
    'Development of industrial park',
    'Flood drainage system upgrade'
  ];
  const client = clients[Math.floor(Math.random() * clients.length)];
  const title = `${client} – ${titles[Math.floor(Math.random() * titles.length)]}`;
  const uniqueKey = `mock-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  return {
    id: uniqueKey,
    title,
    client,
    location: locations[Math.floor(Math.random() * locations.length)],
    budget: budgets[Math.floor(Math.random() * budgets.length)],
    deadline: new Date(Date.now() + 30*24*60*60*1000 + Math.random()*30*24*60*60*1000).toISOString().split('T')[0],
    source: 'Mock Data (Zambia)',
    sourceUrl: '#',
    description: 'This is a mock project generated to ensure at least 20 advertised projects appear. It contains plausible details for a construction tender in Zambia.',
    skills: ['Construction', 'Project Management', 'Civil Engineering'],
    contactEmail: 'info@purveyols.com',
    biddingFee: 'Free',
    status: 'open',
    uniqueKey,
  };
}

// ─── POST /fetch – get new projects from multiple sources ──────
router.post('/fetch', async (req, res) => {
  try {
    const queries = [
      'construction tender bank Zambia',
      'council construction tender Zambia',
      'university construction project Zambia',
      'hospital construction tender Zambia',
      'Zambia infrastructure tender',
      'Zambia government construction tender',
      'Zambia road construction tender',
      'Zambia school construction project'
    ];

    let allArticles = [];
    for (const q of queries) {
      const articles = await fetchNews(q);
      allArticles = allArticles.concat(articles);
    }

    // Deduplicate by sourceUrl
    const seen = new Set();
    const uniqueArticles = allArticles.filter(a => {
      const key = a.sourceUrl || a.title;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Build advertised projects from articles
    const projectsFromNews = uniqueArticles.map(article => {
      // Attempt to extract budget from title/description (simplified)
      const budgetMatch = article.description?.match(/ZMW\s*([\d,]+)/) || article.title?.match(/ZMW\s*([\d,]+)/);
      const budget = budgetMatch ? `ZMW ${budgetMatch[1]}` : 'ZMW 0';
      // Try to extract client from source
      const client = article.source || 'Various';
      // Location: fallback to 'Zambia'
      const location = 'Zambia';
      const deadline = new Date(Date.now() + 30*24*60*60*1000 + Math.random()*30*24*60*60*1000).toISOString().split('T')[0];
      const uniqueKey = `${article.title}-${article.sourceUrl}`.replace(/\s/g, '_').toLowerCase();

      return {
        id: uniqueKey,
        title: article.title,
        client,
        location,
        budget,
        deadline,
        source: article.source,
        sourceUrl: article.sourceUrl,
        description: article.description || article.title,
        skills: ['Construction', 'Project Management'],
        contactEmail: 'info@purveyols.com',
        biddingFee: 'Free',
        status: 'open',
        uniqueKey,
      };
    });

    // Combine news + mocks to reach at least 20
    let finalProjects = [...projectsFromNews];
    while (finalProjects.length < 20) {
      const mock = generateMockProject();
      // Check if mock uniqueKey already exists
      if (!finalProjects.some(p => p.uniqueKey === mock.uniqueKey)) {
        finalProjects.push(mock);
      }
    }

    // Save to DB (skip duplicates)
    let added = 0, skipped = 0;
    for (const proj of finalProjects) {
      const existing = await AdvertisedProject.findOne({ uniqueKey: proj.uniqueKey });
      if (!existing) {
        await AdvertisedProject.create(proj);
        added++;
      } else {
        skipped++;
      }
    }

    res.json({
      message: `Fetched ${finalProjects.length} projects. Added ${added}, skipped ${skipped}.`,
      results: { added, skipped }
    });
  } catch (err) {
    console.error('Fetch error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

module.exports = router;