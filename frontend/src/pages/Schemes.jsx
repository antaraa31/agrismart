import React, { useState, useEffect } from 'react';
import Loader from '../components/Loader';

const Schemes = () => {
  const [loading, setLoading] = useState(true);
  const [schemes, setSchemes] = useState([]);

  useEffect(() => {
    const fetchSchemes = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/agri-news');
        const data = await response.json();
        
        if (response.ok && data.data) {
          setSchemes(data.data);
        }
      } catch (error) {
        console.error("Schemes API Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSchemes();
  }, []);

  return (
    <main className="max-w-7xl mx-auto px-8 py-xl">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-lg mb-xl">
        <div className="max-w-2xl">
          <h1 className="font-h1 text-h1 text-primary mb-xs">Govt Schemes & News</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">Stay updated with the latest agricultural subsidies, policies, and localized farming news tailored to your sector.</p>
        </div>
        <div className="flex gap-sm">
          <select className="px-4 py-2 bg-surface-container border border-outline-variant rounded-lg font-label-sm text-on-surface outline-none cursor-pointer">
            <option>All Categories</option>
            <option>Subsidies</option>
            <option>Market Rates</option>
            <option>Technology</option>
          </select>
        </div>
      </div>

      {loading ? (
        <Loader />
      ) : schemes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
          {schemes.map((scheme, index) => (
            <div key={index} className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden hover:shadow-md transition-all flex flex-col group">
              <div className="h-48 overflow-hidden">
                <img 
                  alt={scheme.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  src={scheme.urlToImage || 'https://lh3.googleusercontent.com/aida-public/AB6AXuB2Qd_iE9A5B8N75M_7Pq4z8KIfM8q5_k6i0L4P9q5_8D015P88_oO1XQ44_q7j0M_2D9_j_QZl8p5P_2D_4j8_q8j8A1_41M12_N4N_n2m8_l2O698Q_o6O2L2L5O_2_m4M2_L2P6D4O62Q5_2N_8l8N6Q8_01M16N5_L1O1N6M6_p8j9P_4P5O8N2l892n'} 
                  onError={(e) => { e.target.src = 'https://lh3.googleusercontent.com/aida-public/AB6AXuB2Qd_iE9A5B8N75M_7Pq4z8KIfM8q5_k6i0L4P9q5_8D015P88_oO1XQ44_q7j0M_2D9_j_QZl8p5P_2D_4j8_q8j8A1_41M12_N4N_n2m8_l2O698Q_o6O2L2L5O_2_m4M2_L2P6D4O62Q5_2N_8l8N6Q8_01M16N5_L1O1N6M6_p8j9P_4P5O8N2l892n' }}
                />
              </div>
              <div className="p-lg flex flex-col flex-grow">
                <div className="flex justify-between items-center mb-sm">
                  <span className="font-label-xs text-label-xs text-primary uppercase font-bold tracking-wider">{scheme.source?.name || 'Agri News'}</span>
                  <span className="font-label-xs text-label-xs text-outline">
                    {scheme.publishedAt ? new Date(scheme.publishedAt).toLocaleDateString() : 'Recent'}
                  </span>
                </div>
                <h3 className="font-h3 text-body-lg font-bold text-on-surface mb-xs line-clamp-2 leading-tight group-hover:text-primary transition-colors">{scheme.title}</h3>
                <p className="font-body-md text-on-surface-variant line-clamp-3 mb-lg flex-grow">
                  {scheme.description || 'No description available. Click below to read the full article.'}
                </p>
                <div className="pt-md border-t border-surface-variant flex items-center justify-between mt-auto">
                  <div className="flex gap-2">
                    <span className="px-2 py-1 bg-secondary-container/30 text-secondary rounded text-[10px] font-bold uppercase tracking-wider">News</span>
                  </div>
                  <a href={scheme.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary font-label-sm text-label-sm hover:underline">
                    Read More <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-on-surface-variant">
          <span className="material-symbols-outlined text-4xl mb-4">article</span>
          <p>No agricultural news or schemes found at this time.</p>
        </div>
      )}
    </main>
  );
};

export default Schemes;
