const Parser = require('rss-parser');
const parser = new Parser();
const AdvertisedProject = require('../models/AdvertisedProject');

const RSS_FEEDS = [
  {
    name: 'Google News - Zambia Tenders',
    url: 'https://news.google.com/rss/search?q=zambia+tender&hl=en-ZM&gl=ZM&ceid=ZM:en',
  },
  {
    name: 'Google News - Zambia Construction',
    url: 'https://news.google.com/rss/search?q=zambia+construction&hl=en-ZM&gl=ZM&ceid=ZM:en',
  },
  {
    name: 'Google News - Zambia Infrastructure',
    url: 'https://news.google.com/rss/search?q=zambia+infrastructure&hl=en-ZM&gl=ZM&ceid=ZM:en',
  },
];

// ─── Extract project data from a news item ──────────────────────────
function extractProjectData(item, feedName) {
  // Clean title
  let title = item.title || '';
  // Remove trailing " - Source" if present
  title = title.replace(/\s*[-–]\s*[^\-]+$/, '').trim();

  // Extract a potential client name from description or title
  const description = item.contentSnippet || item.description || '';
  const source = feedName || 'Google News';
  const sourceUrl = item.link || '';

  // Generate a unique ID from the link
  const id = `REAL-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

  // Guess budget – just a placeholder
  const budget = 'ZMW ' + (Math.floor(Math.random() * 50) + 1) + ',000,000';

  // Guess deadline – 1-3 months from now
  const deadline = new Date();
  deadline.setMonth(deadline.getMonth() + Math.floor(Math.random() * 3) + 1);
  const deadlineStr = deadline.toISOString().split('T')[0];

  // Skills – infer from title/description
  const skills = [];
  const lower = (title + ' ' + description).toLowerCase();
  if (lower.includes('road') || lower.includes('highway')) skills.push('Road Construction');
  if (lower.includes('bridge')) skills.push('Bridge Engineering');
  if (lower.includes('solar') || lower.includes('energy')) skills.push('Solar Energy');
  if (lower.includes('building') || lower.includes('construction')) skills.push('Building Construction');
  if (lower.includes('water') || lower.includes('pipeline')) skills.push('Water Engineering');
  if (lower.includes('electrical') || lower.includes('power')) skills.push('Electrical Engineering');
  if (skills.length === 0) skills.push('Civil Engineering');

  return {
    id,
    title: title || 'Untitled Project',
    client: extractClient(title, description) || 'Various',
    location: 'Zambia',
    budget,
    deadline: deadlineStr,
    source,
    sourceUrl,
    description: description.substring(0, 500),
    skills: skills.slice(0, 4),
    contactEmail: 'info@example.com',
    biddingFee: 'ZMW ' + (Math.floor(Math.random() * 500) + 200),
    status: 'open',
  };
}

function extractClient(title, description) {
  const patterns = [
    /by\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/,
    /for\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/,
    /–\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/,
  ];
  for (const pattern of patterns) {
    const match = (title + ' ' + description).match(pattern);
    if (match) return match[1].trim();
  }
  return null;
}

// ─── Main fetch function ────────────────────────────────────────────
async function fetchFreshProjects() {
  const results = { added: 0, skipped: 0, errors: 0 };

  for (const feed of RSS_FEEDS) {
    try {
      console.log(`📡 Fetching: ${feed.name}...`);
      const feedData = await parser.parseURL(feed.url);
      if (!feedData.items || feedData.items.length === 0) {
        console.log(`⚠️ No items from ${feed.name}`);
        continue;
      }

      for (const item of feedData.items) {
        try {
          const projectData = extractProjectData(item, feed.name);

          // Check if this project already exists (by sourceUrl)
          const existing = await AdvertisedProject.findOne({ sourceUrl: projectData.sourceUrl });
          if (existing) {
            results.skipped++;
            continue;
          }

          const project = new AdvertisedProject(projectData);
          await project.save();
          results.added++;
        } catch (err) {
          console.error(`❌ Error saving item:`, err.message);
          results.errors++;
        }
      }
    } catch (err) {
      console.error(`❌ Feed error (${feed.name}):`, err.message);
      results.errors++;
    }
  }

  return results;
}

module.exports = { fetchFreshProjects };