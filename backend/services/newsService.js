require('dotenv').config();
const axios = require('axios');

/**
 * News service — pure rule-based keyword filtering over NewsAPI.
 * No mock/seed data: if the API key is missing or the call fails, returns [].
 */

const PEST_KEYWORDS = ['locust', 'pest', 'disease', 'outbreak', 'infestation', 'armyworm', 'rust', 'blight'];
const SCHEME_KEYWORDS = ['scheme', 'subsidy', 'yojana', 'pm-kisan', 'kisan', 'grant', 'funding', 'government', 'loan', 'irrigation', 'fertilizer', 'support', 'policy'];
const WEATHER_KEYWORDS = ['rain', 'monsoon', 'drought', 'cyclone', 'flood', 'imd', 'weather', 'temperature'];

const containsKeyword = (text, keywords) => {
  if (!text) return false;
  const lower = text.toLowerCase();
  return keywords.some((kw) => lower.includes(kw));
};

const hasApiKey = () => {
  const k = process.env.NEWS_API_KEY;
  return k && k !== 'your_news_api_key_here';
};

const fetchPestNews = async (crop, location = '') => {
  if (!hasApiKey()) return [];
  try {
    const apiKey = process.env.NEWS_API_KEY;
    const locationQuery = location ? `(${location}) AND ` : '';
    const query = `${locationQuery}${crop} AND (pest OR locust OR disease OR outbreak OR armyworm OR rust)`;
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&pageSize=5&apiKey=${apiKey}`;

    const response = await axios.get(url);
    const articles = response.data?.articles || [];
    if (articles.length === 0) return [];

    return articles.map((a) => {
      const fullText = ((a.title || '') + ' ' + (a.description || '')).toLowerCase();
      let severity = 'Medium';
      if (containsKeyword(fullText, ['severe', 'massive', 'destroy', 'warning', 'high alert'])) severity = 'High';

      let detectedPest = 'General Pest/Disease';
      for (const pest of PEST_KEYWORDS) {
        if (fullText.includes(pest)) {
          detectedPest = pest.charAt(0).toUpperCase() + pest.slice(1);
          break;
        }
      }

      return {
        pestType: detectedPest,
        affectedRegion: location || 'Unknown',
        severity,
        sourceHeadline: a.title,
      };
    });
  } catch (err) {
    console.error('NewsService (Pest) Error:', err.message);
    return [];
  }
};

const fetchAgriNews = async (location = '') => {
  if (!hasApiKey()) return [];
  try {
    const apiKey = process.env.NEWS_API_KEY;
    const locationPart = location ? ` AND ${location}` : '';
    const query = `(agriculture OR farming OR farmers) AND (scheme OR subsidy OR yojana OR PM-KISAN OR irrigation OR government)${locationPart}`;
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&language=en&apiKey=${apiKey}`;

    const response = await axios.get(url);
    const articles = (response.data?.articles || []).slice(0, 10);
    if (articles.length === 0) return [];

    const categorized = articles.map((a) => {
      const fullText = (a.title || '') + ' ' + (a.description || '');
      let category = 'general';
      if (containsKeyword(fullText, SCHEME_KEYWORDS)) category = 'scheme';
      else if (containsKeyword(fullText, PEST_KEYWORDS)) category = 'pest';
      else if (containsKeyword(fullText, WEATHER_KEYWORDS)) category = 'weather';

      let relevanceScore = 60;
      if (containsKeyword(a.title, [location.toLowerCase(), 'farmer', 'agriculture'])) relevanceScore += 15;
      if (category !== 'general') relevanceScore += 20;

      return {
        title: a.title,
        summary: a.description ? a.description.substring(0, 150) + '...' : 'Read article for details.',
        description: a.description,
        url: a.url,
        urlToImage: a.urlToImage,
        publishedAt: a.publishedAt,
        source: a.source,
        category,
        relevanceScore: Math.min(relevanceScore, 99),
      };
    });

    return categorized
      .filter((n) => n.category === 'scheme' || n.category === 'weather' || n.category === 'pest')
      .slice(0, 10);
  } catch (err) {
    console.error('AgriNews API Error:', err.message);
    return [];
  }
};

module.exports = {
  fetchPestNews,
  fetchAgriNews,
};
