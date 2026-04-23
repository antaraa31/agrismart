import React, { useState, useEffect } from 'react';
import Loader from '../components/Loader';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState(null);
  const [decision, setDecision] = useState(null);
  const [locationStr, setLocationStr] = useState('');

  useEffect(() => {
    // 1. Get profile from localStorage or use defaults
    const savedProfile = localStorage.getItem('agriProfile');
    const profile = savedProfile ? JSON.parse(savedProfile) : { city: 'Pune', crop: 'Cotton' };
    setLocationStr(profile.city);

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch Weather
        const weatherRes = await fetch(`http://localhost:5000/api/weather?city=${encodeURIComponent(profile.city)}`);
        if (weatherRes.ok) {
          const wData = await weatherRes.json();
          setWeather(wData.data);
        }

        // Fetch AI Decision from agent logs (which returns the highly-structured JSON from decisionEngine)
        const decisionRes = await fetch('http://localhost:5000/api/agent/logs');
        if (decisionRes.ok) {
          const dData = await decisionRes.json();
          // Get the most recent decision
          if (dData.data && dData.data.length > 0) {
            setDecision(dData.data[dData.data.length - 1]);
          } else {
            // If empty, manually trigger agent to run once and fetch again
            await fetch('http://localhost:5000/api/agent/run', { method: 'POST' });
            const retryRes = await fetch('http://localhost:5000/api/agent/logs');
            if (retryRes.ok) {
              const retryData = await retryRes.json();
              if (retryData.data && retryData.data.length > 0) {
                setDecision(retryData.data[retryData.data.length - 1]);
              }
            }
          }
        }
      } catch (error) {
        console.error("Dashboard API Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStatusColor = (status) => {
    if (status === 'CRITICAL') return 'bg-red-100 text-red-800 border-red-200';
    if (status === 'WARNING') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  return (
    <main className="max-w-7xl mx-auto px-8 py-12">
      {/* Hero Section */}
      <section className="mb-xl">
        <h1 className="font-h1 text-h1 text-primary mb-4">Smart Farming Dashboard</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
          Precision analytics powered by AI to optimize your harvest cycle and mitigate environmental risks in real-time.
        </p>
      </section>

      {/* Analysis Controls */}
      <div className="bg-surface-container-lowest p-lg rounded-xl border border-outline-variant shadow-sm mb-xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-lg items-end">
          <div className="space-y-2">
            <label className="font-label-sm text-label-sm text-on-surface-variant block">Location</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">location_on</span>
              <input 
                readOnly
                value={locationStr}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-outline-variant rounded-lg outline-none cursor-not-allowed text-on-surface-variant" 
                type="text"
              />
            </div>
            <p className="text-xs text-outline mt-1">Change location in Profile settings</p>
          </div>
          <div className="space-y-2">
            <label className="font-label-sm text-label-sm text-on-surface-variant block">Crop Type</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">agriculture</span>
              <select className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-outline-variant rounded-lg appearance-none outline-none cursor-not-allowed text-on-surface-variant" disabled>
                <option>{decision?.crop || 'Loading...'}</option>
              </select>
            </div>
          </div>
          <div>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-primary text-on-primary font-label-sm text-label-sm py-3 px-6 rounded-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">analytics</span>
              Refresh Analysis
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        {/* Main Feature: AI Decision Card */}
        <div className="lg:col-span-8 bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
          {loading ? (
            <Loader type="card" />
          ) : decision ? (
            <>
              <div className="p-lg border-b border-outline-variant flex justify-between items-center bg-surface-bright">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-on-primary-container">psychology</span>
                  </div>
                  <div>
                    <h3 className="font-h3 text-h3 text-on-surface">AI Recommendation</h3>
                    <p className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider">Updated Now</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-label-xs font-bold border ${getStatusColor(decision.status)}`}>
                  {decision.status}
                </span>
              </div>
              
              <div className="p-lg grid grid-cols-1 md:grid-cols-2 gap-xl">
                <div className="space-y-6">
                  <div>
                    <p className="font-label-sm text-label-sm text-on-surface-variant mb-1">Confidence Score</p>
                    <div className="flex items-end gap-2">
                      <span className="font-h2 text-h2 text-primary">{decision.confidence}</span>
                      <span className="material-symbols-outlined text-primary mb-1">trending_up</span>
                    </div>
                  </div>
                  
                  <div className="p-md bg-surface-container rounded-lg border border-outline-variant">
                    <p className="font-label-sm text-label-sm text-on-surface-variant mb-2">Detected Risk</p>
                    <div className="flex items-center gap-2 text-primary font-semibold">
                      <span className="material-symbols-outlined">info</span>
                      <span className="font-body-md text-body-md">{decision.detectedThreat}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-label-sm text-label-sm text-on-surface font-bold">Why this recommendation?</h4>
                    <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                      {decision.reasoning}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <h4 className="font-label-sm text-label-sm text-on-surface font-bold">Action Checklist</h4>
                  <div className="space-y-4">
                    {decision.actions?.map((action, i) => (
                      <label key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-surface-container transition-colors cursor-pointer group">
                        <input className="mt-1 w-5 h-5 rounded text-primary focus:ring-primary border-outline-variant" type="checkbox" />
                        <div>
                          <p className="font-body-md text-body-md text-on-surface group-hover:text-primary transition-colors">{action}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="p-lg text-center text-on-surface-variant py-20">
              <span className="material-symbols-outlined text-4xl mb-4 text-outline">error</span>
              <p>Unable to generate AI recommendations at this time.</p>
            </div>
          )}
        </div>

        {/* Side Bento Cards */}
        <div className="lg:col-span-4 space-y-gutter">
          {/* Environment Stats */}
          <div className="bg-surface-container-lowest p-lg rounded-xl border border-outline-variant shadow-sm">
            <h4 className="font-label-sm text-label-sm text-on-surface font-bold mb-4">Environment</h4>
            
            {loading ? (
              <div className="flex justify-center p-4"><div className="w-6 h-6 rounded-full border-2 border-outline-variant border-t-primary animate-spin"></div></div>
            ) : weather ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-md rounded-lg bg-surface-bright border border-outline-variant">
                  <p className="font-label-xs text-label-xs text-on-surface-variant mb-1">Temperature</p>
                  <p className="font-h3 text-h3 text-on-surface">{weather.temperature}°C</p>
                </div>
                <div className="p-md rounded-lg bg-surface-bright border border-outline-variant">
                  <p className="font-label-xs text-label-xs text-on-surface-variant mb-1">Humidity</p>
                  <p className="font-h3 text-h3 text-on-surface">{weather.humidity}%</p>
                </div>
                <div className="p-md rounded-lg bg-surface-bright border border-outline-variant">
                  <p className="font-label-xs text-label-xs text-on-surface-variant mb-1">Wind</p>
                  <p className="font-h3 text-h3 text-on-surface">{weather.windSpeed}m/s</p>
                </div>
                <div className="p-md rounded-lg bg-surface-bright border border-outline-variant text-center">
                  <p className="font-label-xs text-label-xs text-on-surface-variant mb-1 text-center">Conditions</p>
                  <p className="text-sm font-semibold capitalize text-primary text-center mt-2">{weather.description}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-error">Failed to load weather data.</p>
            )}
          </div>

          {/* Field Map Preview */}
          <div className="relative h-[280px] rounded-xl border border-outline-variant overflow-hidden shadow-sm">
            <img alt="Aerial Farm Map" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBUfZgX5bGSFhAGFR9Z5kXfgIKR-PtNZfvpa9MyR6S1CLCk6_0h1NakbBeJDIos1HRkXd6O2gZYV0XjqzNYoFmw2KZwYU2Mocwlf-UZ6HetYbaNqvHxva_7i6hUz7akFpAtwRWWiNGP8ajBRBtxRYXdeRH95ytOGFaJz11mUS8lRCuZEW5TPkoMUEi8c-ZG-z6lf-XZ2xEoARLUfk4ZtX7r7P30VNYUK3hYzR5AG6pQrzU3ecU2-p6EVIPe0jfvIV61arsdY_Wa3i_b" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex items-center justify-between text-white">
                <div>
                  <p className="font-label-xs text-white/80">Satellite View</p>
                  <p className="font-label-sm font-bold">{locationStr} Field</p>
                </div>
                <button className="bg-white/20 backdrop-blur-md p-2 rounded-lg hover:bg-white/30 transition-all">
                  <span className="material-symbols-outlined">fullscreen</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Dashboard;
