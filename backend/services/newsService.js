require('dotenv').config();
const axios = require('axios');

/**
 * STEP 3: Rule-based News Service
 * NO AI INVOLVED. Uses pure string matching for lightning-fast execution.
 */

// Simple keyword dictionaries
const PEST_KEYWORDS = ['locust', 'pest', 'disease', 'outbreak', 'infestation', 'armyworm', 'rust', 'blight'];
const SCHEME_KEYWORDS = [
  'scheme',
  'subsidy',
  'yojana',
  'pm-kisan',
  'kisan',
  'grant',
  'funding',
  'government',
  'loan',
  'irrigation',
  'fertilizer',
  'support',
  'policy'
];
const WEATHER_KEYWORDS = ['rain', 'monsoon', 'drought', 'cyclone', 'flood', 'imd', 'weather', 'temperature'];

// Helper function to check if text contains any of the keywords
const containsKeyword = (text, keywords) => {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  return keywords.some(kw => lowerText.includes(kw));
};

// Fetch and filter agriculture news related to pests
const fetchPestNews = async (crop, location = "") => {
  try {
    const apiKey = process.env.NEWS_API_KEY;
    if (!apiKey || apiKey === 'your_news_api_key_here') {
      return mockPestNews(crop);
    }

    const locationQuery = location ? `(${location}) AND ` : '';
    const query = `${locationQuery}${crop} AND (pest OR locust OR disease OR outbreak OR armyworm OR rust)`;
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&pageSize=5&apiKey=${apiKey}`;

    const response = await axios.get(url);
    const articles = response.data.articles;

    if (articles.length === 0) return [];

    // Rule-based extraction instead of AI
    return articles.map(a => {
      let severity = "Medium";
      const fullText = (a.title + " " + a.description).toLowerCase();
      if (containsKeyword(fullText, ['severe', 'massive', 'destroy', 'warning', 'high alert'])) severity = "High";
      
      // Attempt to dynamically extract pest name from text
      let detectedPest = "General Pest/Disease";
      for (const pest of PEST_KEYWORDS) {
        if (fullText.includes(pest)) {
          detectedPest = pest.charAt(0).toUpperCase() + pest.slice(1); // Capitalize
          break;
        }
      }

      return {
        pestType: detectedPest,
        affectedRegion: location || "Global/National",
        severity: severity,
        sourceHeadline: a.title
      };
    });

  } catch (error) {
    console.error('NewsService (Pest) Error:', error.message);
    return mockPestNews(crop);
  }
};

// Fetch Government Schemes and General Agri News dynamically
const fetchAgriNews = async (location = "India") => {
  try {
    const apiKey = process.env.NEWS_API_KEY;
    if (!apiKey || apiKey === 'your_news_api_key_here') {
      return mockAgriNews();
    }

    // Inject the dynamic location into the query
    const query = `(agriculture OR farming OR farmers) AND (scheme OR subsidy OR yojana OR PM-KISAN OR irrigation OR government) AND ${location}`;
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&language=en&apiKey=${apiKey}`;

    const response = await axios.get(url);
    const articles = response.data.articles.slice(0, 10);

    if (articles.length === 0) return mockAgriNews();

    // Rule-based categorization instead of AI
    const categorizedNews = articles.map(a => {
      const fullText = (a.title + " " + a.description);

      let category = "general";
      if (containsKeyword(fullText, SCHEME_KEYWORDS)) category = "scheme";
      else if (containsKeyword(fullText, PEST_KEYWORDS)) category = "pest";
      else if (containsKeyword(fullText, WEATHER_KEYWORDS)) category = "weather";

      // Simple heuristic for relevance: if title has keywords, it's highly relevant
      let relevanceScore = 60;
      if (containsKeyword(a.title, [location.toLowerCase(), 'farmer', 'agriculture'])) relevanceScore += 15;
      if (category !== 'general') relevanceScore += 20;

      return {
        title: a.title,
        summary: a.description ? a.description.substring(0, 150) + "..." : "Read article for details.",
        description: a.description,
        url: a.url,
        urlToImage: a.urlToImage,
        publishedAt: a.publishedAt,
        source: a.source,
        category: category,
        relevanceScore: Math.min(relevanceScore, 99)
      };
    });

    // Filter out generic news to keep the dashboard focused
    return categorizedNews
      .filter(n => n.category === 'scheme' || n.category === 'weather' || n.category === 'pest')
      .slice(0, 10);

  } catch (error) {
    console.error('AgriNews API Error:', error.message);
    return mockAgriNews();
  }
};

const mockPestNews = (crop) => {
  const fallbackPests = { "Corn": "Fall Armyworm", "Wheat": "Wheat Rust", "Rice": "Brown Plant Hopper", "Potato": "Late Blight", "Cotton": "Bollworm" };
  const likelyPest = fallbackPests[crop] || "Aphids";
  return [{ pestType: likelyPest, affectedRegion: "Local Region", severity: "Medium", sourceHeadline: `Environmental conditions favor ${likelyPest} in ${crop} crops.` }];
};

const mockAgriNews = () => {
  return [
    { 
      title: "PM-KISAN: Financial Assistance Released for Indian Farmers", 
      summary: "The Indian government has released the latest installment of the Pradhan Mantri Kisan Samman Nidhi...", 
      description: "The Indian government has released the latest installment of the Pradhan Mantri Kisan Samman Nidhi. Millions of farmers will receive direct bank transfers.",
      category: "scheme", 
      relevanceScore: 98,
      url: "https://pmkisan.gov.in/",
      urlToImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuB2Qd_iE9A5B8N75M_7Pq4z8KIfM8q5_k6i0L4P9q5_8D015P88_oO1XQ44_q7j0M_2D9_j_QZl8p5P_2D_4j8_q8j8A1_41M12_N4N_n2m8_l2O698Q_o6O2L2L5O_2_m4M2_L2P6D4O62Q5_2N_8l8N6Q8_01M16N5_L1O1N6M6_p8j9P_4P5O8N2l892n",
      source: { name: "Govt of India" },
      publishedAt: new Date().toISOString()
    },
    { 
      title: "New Subsidies Announced for Drip Irrigation Systems", 
      summary: "State governments announce up to 80% subsidy for farmers adopting sustainable micro-irrigation systems...", 
      description: "State governments announce up to 80% subsidy for farmers adopting sustainable micro-irrigation systems to combat water scarcity in agriculture.",
      category: "scheme", 
      relevanceScore: 92,
      url: "#",
      urlToImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuB2Qd_iE9A5B8N75M_7Pq4z8KIfM8q5_k6i0L4P9q5_8D015P88_oO1XQ44_q7j0M_2D9_j_QZl8p5P_2D_4j8_q8j8A1_41M12_N4N_n2m8_l2O698Q_o6O2L2L5O_2_m4M2_L2P6D4O62Q5_2N_8l8N6Q8_01M16N5_L1O1N6M6_p8j9P_4P5O8N2l892n",
      source: { name: "Agri Dept" },
      publishedAt: new Date().toISOString()
    },
    { 
      title: "IMD Weather Alert: Deficient Rainfall in Central India", 
      summary: "The Indian Meteorological Department warns of potentially lower than average rainfall...", 
      description: "The Indian Meteorological Department warns of potentially lower than average rainfall which could severely impact Kharif crop sowing.",
      category: "weather", 
      relevanceScore: 85,
      url: "#",
      urlToImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuB2Qd_iE9A5B8N75M_7Pq4z8KIfM8q5_k6i0L4P9q5_8D015P88_oO1XQ44_q7j0M_2D9_j_QZl8p5P_2D_4j8_q8j8A1_41M12_N4N_n2m8_l2O698Q_o6O2L2L5O_2_m4M2_L2P6D4O62Q5_2N_8l8N6Q8_01M16N5_L1O1N6M6_p8j9P_4P5O8N2l892n",
      source: { name: "IMD" },
      publishedAt: new Date().toISOString()
    }
  ];
};

module.exports = {
  fetchPestNews,
  fetchAgriNews
};
