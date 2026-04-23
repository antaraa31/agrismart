import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Newspaper, Filter, ArrowRight, Loader2 } from 'lucide-react';
import { Card, CardContent } from '../components/Card';
import { Badge } from '../components/Badge';

export default function News() {
  const [filter, setFilter] = useState('all');
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/agri-news');
        if (response.data.status === 'success') {
          setNewsList(response.data.data);
        } else {
          setError('Failed to fetch news.');
        }
      } catch (err) {
        setError('Server error while fetching news.');
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  const filteredNews = filter === 'all' ? newsList : newsList.filter(n => n.category === filter);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full pb-12"
    >
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Government Schemes & News</h1>
          <p className="text-slate-400">Stay updated with the latest subsidies, weather alerts, and agricultural news.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-slate-900/50 p-2 rounded-xl border border-white/10">
          <Filter size={18} className="text-slate-400 ml-2" />
          <select 
            className="bg-transparent text-slate-200 outline-none px-2 py-1"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all" className="bg-slate-800">All Categories</option>
            <option value="scheme" className="bg-slate-800">Govt Schemes</option>
            <option value="weather" className="bg-slate-800">Weather</option>
            <option value="pest" className="bg-slate-800">Pest Alerts</option>
          </select>
        </div>
      </header>

      {error && (
        <div className="text-red-400 p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-8">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-emerald-400">
          <Loader2 className="animate-spin mb-4" size={40} />
          <p className="animate-pulse font-semibold">AI is curating the latest agricultural intelligence...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNews.map((news, idx) => (
            <motion.div key={idx} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <Card className="h-full flex flex-col">
                <CardContent className="pt-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <Badge variant={news.category === 'scheme' ? 'primary' : news.category === 'pest' ? 'danger' : 'warning'} className="capitalize">
                      {news.category}
                    </Badge>
                    <span className="text-xs text-emerald-400 font-bold">{news.relevanceScore}% Match</span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-3 line-clamp-2">
                    {news.title}
                  </h3>
                  
                  <p className="text-slate-400 flex-1">
                    {news.summary}
                  </p>

                  <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-2 text-emerald-400 font-semibold hover:text-emerald-300 cursor-pointer transition-colors w-max">
                    Read Full Article <ArrowRight size={16} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
          
          {filteredNews.length === 0 && !loading && !error && (
            <div className="col-span-full py-12 text-center text-slate-500 bg-slate-900/30 rounded-2xl border border-white/5 border-dashed">
              No news articles found for this category.
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
