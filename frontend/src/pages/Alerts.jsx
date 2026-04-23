import { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Siren, ShieldAlert, ThermometerSun, Bug, Search } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../components/Card';
import { Badge } from '../components/Badge';
import { Input } from '../components/Input';
import { Button } from '../components/Button';

export default function Alerts() {
  const [loading, setLoading] = useState(false);
  const [alertData, setAlertData] = useState(null);
  const [error, setError] = useState('');
  
  const [temp, setTemp] = useState('');
  const [humidity, setHumidity] = useState('');
  const [crop, setCrop] = useState('');

  const handleScan = async (e) => {
    e.preventDefault();
    if (!temp || !humidity || !crop) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');
    setAlertData(null);

    try {
      const response = await axios.post('http://localhost:5000/api/pest-alert', {
        temperature: Number(temp),
        humidity: Number(humidity),
        crop
      });
      
      if (response.data.status === 'success') {
        setAlertData(response.data.data);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch pest risk data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full pb-12"
    >
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Pest & Outbreak Alerts</h1>
        <p className="text-slate-400">Real-time risk assessment based on local weather and agriculture news.</p>
      </header>

      <Card className="mb-8 border-amber-500/20">
        <CardContent className="pt-6">
          <form className="flex flex-col md:flex-row gap-4 items-center" onSubmit={handleScan}>
            <Input 
              icon={ThermometerSun} 
              placeholder="Current Temp (°C)" 
              type="number" 
              value={temp} 
              onChange={(e) => setTemp(e.target.value)} 
            />
            <Input 
              icon={Siren} 
              placeholder="Humidity (%)" 
              type="number" 
              value={humidity} 
              onChange={(e) => setHumidity(e.target.value)} 
            />
            <Input 
              icon={Bug} 
              placeholder="Target Crop" 
              value={crop} 
              onChange={(e) => setCrop(e.target.value)} 
            />
            <Button type="submit" loading={loading} className="w-full md:w-auto min-w-[140px] !bg-gradient-to-r !from-amber-500 !to-orange-600 hover:!shadow-amber-500/20">
              <Search size={18} /> Scan Area
            </Button>
          </form>
          {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
        </CardContent>
      </Card>

      {!alertData && !loading && (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-slate-900/30 rounded-2xl border border-white/5 border-dashed">
          <ShieldAlert size={48} className="text-slate-600 mb-4" />
          <h3 className="text-xl font-semibold text-slate-300 mb-2">No Active Scans</h3>
          <p className="text-slate-500 max-w-md">Enter your local parameters above to run a comprehensive AI risk assessment against active pest threats.</p>
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          <div className="h-48 bg-slate-800/50 rounded-2xl"></div>
        </div>
      )}

      {alertData && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <Card className={alertData.riskLevel.toLowerCase() === 'high' ? 'border-red-500/30 shadow-red-500/10' : alertData.riskLevel.toLowerCase() === 'medium' ? 'border-amber-500/30 shadow-amber-500/10' : 'border-emerald-500/30'}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-4">
                <Badge variant={alertData.riskLevel.toLowerCase() === 'high' ? 'danger' : alertData.riskLevel.toLowerCase() === 'medium' ? 'warning' : 'success'}>
                  {alertData.riskLevel} Risk
                </Badge>
                <span className="text-sm text-slate-500">Live AI Scan</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                <Bug className={alertData.riskLevel.toLowerCase() === 'high' ? 'text-red-400' : 'text-amber-400'} size={24} />
                {alertData.likelyPest}
              </h3>
              
              <div className="text-slate-400 bg-slate-900/50 p-4 rounded-xl border border-white/5 mb-4">
                <span className="text-slate-300 font-semibold mb-1 block">News Intelligence:</span>
                {alertData.newsInsights}
              </div>

              <div>
                <span className="text-slate-300 font-semibold mb-2 block">Preventive Measures:</span>
                <ul className="space-y-2">
                  {alertData.preventiveMeasures?.map((measure, idx) => (
                    <li key={idx} className="text-sm text-slate-400 flex items-start gap-2">
                      <span className="text-emerald-400 mt-1">•</span> {measure}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

    </motion.div>
  );
}
