import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import PestAlerts from './pages/PestAlerts';
import Disease from './pages/Disease';
import Schemes from './pages/Schemes';

function App() {
  return (
    <BrowserRouter>
      <div className="bg-background text-on-background min-h-screen">
        <Navbar />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/alerts" element={<PestAlerts />} />
          <Route path="/disease" element={<Disease />} />
          <Route path="/schemes" element={<Schemes />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
