import React, { useState, useEffect } from 'react';
import Loader from '../components/Loader';

const PestAlerts = () => {
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [locationStr, setLocationStr] = useState('');

  useEffect(() => {
    const savedProfile = localStorage.getItem('agriProfile');
    const profile = savedProfile ? JSON.parse(savedProfile) : { city: 'Pune', crop: 'Cotton' };
    setLocationStr(profile.city);

    const fetchPestAlerts = async () => {
      try {
        setLoading(true);
        // First get weather for temp/humidity
        const weatherRes = await fetch(`http://localhost:5000/api/weather?city=${encodeURIComponent(profile.city)}`);
        const weatherData = await weatherRes.json();
        
        if (weatherRes.ok && weatherData.data) {
          // Then get pest alert
          const pestRes = await fetch('http://localhost:5000/api/pest-alert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              temperature: weatherData.data.temperature,
              humidity: weatherData.data.humidity,
              crop: profile.crop
            })
          });
          
          if (pestRes.ok) {
            const pData = await pestRes.json();
            setAlert(pData.data);
          }
        }
      } catch (error) {
        console.error("Pest Alerts API Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPestAlerts();
  }, []);

  const getRiskColor = (level) => {
    if (level === 'HIGH') return 'bg-error text-white';
    if (level === 'MEDIUM') return 'bg-secondary-container text-on-secondary-container';
    return 'bg-primary-container text-on-primary-container';
  };

  const getPestImage = (level) => {
    if (level === 'HIGH') return 'https://lh3.googleusercontent.com/aida-public/AB6AXuA15lrZidNsD2xY21566EOczFsI1QMkV3cPWX_q9oBLAOayrzNjA79xRXmSgUVuZkAcxjPmz7TXz7TOY0b2-eX18YA2UR6_fFtDIZNf9VfSc-fFgu_0rX1CoGcSZL0WRPeo7QsGGeWSDjjBG_Ik-cfuM-VETno-uTkS-ecNhLlIlmnNLgY9XYcFHhEUC3WnOnuu6JgGyhMLFzc6_NZnv9OyV5xhkRMmHcQsa2OCrQvfVWehoSe8fxvYOV9N1nUW80hQfplNSSTHFBlA';
    if (level === 'MEDIUM') return 'https://lh3.googleusercontent.com/aida-public/AB6AXuDifDeNjjW9c5BaYhZ32d1vbLGxEqGCgwohKGraIYWlFfGihIbqJEXSd8Wue2e4Po4P7wBN-tcnhZONZn21u17ti7qoooGnbJ30XeUN_gTrdCRbAvz8pHkC_KwgSC5dYdoVAJ3BMFvIzfd9362FzSEMk59A6KhWGsTRJr3eKjHVIaLUoY1QvmAERc_-5EbVnWcwFSgBWRezNcgiEGB4FP135FMRNuYV5sDF4JuZdKoumRIpDcB7ZPWvtuhnKSIpw5CETx7rCaQ4Ocgv';
    return 'https://lh3.googleusercontent.com/aida-public/AB6AXuDVUGn-td2xdxEBsswN2hgDqqTiQtm-sxn7ipTaMbH8pL_pyuRU6uoBBuOFOaCmnUSXNqRwXWChU700_JTT_pI57GPs0eKqUolNDKPGAEWk3gSI0_dzWgpB_TEg6s-geUUCRlE7t1sHpRvo3sypLhVf7YMHYzeG3dva-YAtmTU8k09Z0F8UzgfYsyQf4RkTiC68v3WqccvbfwLKkxLJyZ11kv0v_J8118mdBWjMXOhbiaT0OyjZ-zguwn0gQ-ctfYdv5cmkmjyt2Bst';
  };

  return (
    <main className="max-w-7xl mx-auto px-8 py-xl">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-lg mb-xl">
        <div>
          <h1 className="font-h1 text-h1 text-primary mb-xs">Pest Alerts</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">Real-time intelligence on pest migration and regional outbreaks powered by satellite imagery and field sensors.</p>
        </div>
        <div className="flex flex-wrap gap-sm">
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-label-sm text-label-sm hover:opacity-90 transition-all shadow-sm">
            <span className="material-symbols-outlined text-[18px]">export_notes</span>
            Export Report
          </button>
        </div>
      </div>

      {loading ? (
        <Loader />
      ) : alert ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
          <div className="bg-surface-container-lowest border border-gray-100 rounded-xl overflow-hidden shadow-sm flex flex-col hover:shadow-md transition-shadow">
            <div className="h-48 relative">
              <img alt="Pest visual" className="w-full h-full object-cover" src={getPestImage(alert.riskLevel)} />
              <div className={`absolute top-4 right-4 px-3 py-1 rounded-full font-label-xs text-label-xs shadow-sm ${getRiskColor(alert.riskLevel)}`}>
                {alert.riskLevel} RISK
              </div>
            </div>
            <div className="p-lg flex flex-col flex-grow">
              <div className="flex items-center gap-2 text-primary mb-2">
                <span className="material-symbols-outlined text-[18px]">location_on</span>
                <span className="font-label-sm text-label-sm">{locationStr} Region</span>
              </div>
              <h3 className="font-h3 text-h3 text-on-surface mb-2">{alert.likelyPest}</h3>
              <p className="font-body-md text-body-md text-on-surface-variant mb-lg line-clamp-3">
                Calculated Risk Score: {alert.score}/100.
                {alert.newsAlertActive ? ' Confirmed by active local news reports.' : ' Based on environmental data.'}
              </p>
              <div className="mt-auto flex items-center justify-between pt-lg border-t border-surface-variant">
                <span className="font-label-xs text-label-xs text-outline">Detected Just Now</span>
                <button className="text-primary font-label-sm text-label-sm flex items-center gap-1 hover:underline">
                  View Actions
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>

          {/* Risk Map Summary */}
          <div className="bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden shadow-sm flex flex-col lg:col-span-1">
            <div className="p-lg flex flex-col h-full justify-between">
              <div>
                <h3 className="font-h3 text-h3 text-primary mb-2">Risk Coverage</h3>
                <p className="font-body-md text-body-md text-on-surface-variant">Active monitoring in {locationStr}. Real-time environmental sync active.</p>
              </div>
              <div className="mt-lg flex-grow flex items-center justify-center">
                <div className="w-full aspect-square bg-white rounded-lg border border-outline-variant p-2">
                  <img alt="Region map" className="w-full h-full object-cover rounded-md" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA_aR7BBJzCnAcPAaReZK34wReGkJa6JL6KfTtHHxRHutIx_kKcUAFpgNgCpWWGjXhPV6i8q-HsSzxLAOQemnavtZMkYGw01P8IAJ70a5JiNn-oRL5QeMwcHg_sNwInOI9TRZJqU_5YzxZq0eyAOu0mjtu-cY4iEhlvM3lV_YlzlVal6qQIsImUUflrhtFU3G-NMRlwKHRXXmcEbMZPN5rgWMpC4FEyzBXAKjPzmkGMe99x2ZKvSjSZ54of4mpu9FKnxAuYaFs4i7Yd"/>
                </div>
              </div>
              <div className="mt-lg">
                <button className="w-full py-2 bg-white border border-outline-variant rounded-lg font-label-sm text-label-sm text-primary hover:bg-surface-container transition-colors">Open Interactive Map</button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 text-on-surface-variant">
          <span className="material-symbols-outlined text-4xl mb-4">check_circle</span>
          <p>No pest alerts detected for your region at this time.</p>
        </div>
      )}
    </main>
  );
};

export default PestAlerts;
