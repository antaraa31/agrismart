import React, { useState } from 'react';
import Loader from '../components/Loader';

const Disease = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setResult(null);
      setError(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setResult(null);
      setError(null);
    }
  };

  const analyzeImage = async () => {
    if (!file) return;
    
    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('http://localhost:5000/api/disease-detect', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      if (response.ok) {
        setResult(data.data);
      } else {
        setError(data.message || 'Failed to analyze image.');
      }
    } catch (err) {
      setError('Network error. Please make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-8 py-xl">
      <div className="text-center max-w-2xl mx-auto mb-xl">
        <h1 className="font-h1 text-h1 text-primary mb-xs">Crop Disease AI</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">Upload a clear photo of the affected plant leaf for instant AI diagnostics and treatment protocols.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-xl">
        {/* Upload Section */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-lg">
          <div 
            className="border-2 border-dashed border-primary rounded-xl p-xl text-center bg-surface hover:bg-surface-container transition-colors cursor-pointer group"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => document.getElementById('fileUpload').click()}
          >
            {preview ? (
              <div className="relative h-64 w-full rounded-lg overflow-hidden">
                <img src={preview} alt="Upload preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white font-label-sm">Change Image</span>
                </div>
              </div>
            ) : (
              <div className="py-12">
                <div className="w-16 h-16 bg-primary-container rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-3xl text-on-primary-container">cloud_upload</span>
                </div>
                <h3 className="font-h3 text-h3 text-on-surface mb-2">Drag & Drop Image</h3>
                <p className="font-body-md text-on-surface-variant mb-6">or click to browse from your device</p>
                <span className="px-6 py-2 bg-white border border-outline-variant rounded-full text-primary font-label-sm shadow-sm">Select File</span>
              </div>
            )}
            <input type="file" id="fileUpload" className="hidden" accept="image/*" onChange={handleFileChange} />
          </div>

          <div className="mt-lg">
            <button 
              className={`w-full py-4 rounded-xl font-label-sm text-[16px] shadow-sm transition-all flex justify-center items-center gap-2 ${file && !loading ? 'bg-primary text-white hover:brightness-110 active:scale-[0.98]' : 'bg-surface-variant text-outline-variant cursor-not-allowed'}`}
              onClick={analyzeImage}
              disabled={!file || loading}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                  Analyzing Crop...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">biotech</span>
                  Analyze Crop
                </>
              )}
            </button>
            {error && <p className="text-error text-center mt-4 font-label-sm">{error}</p>}
          </div>
        </div>

        {/* Results Section */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden flex flex-col">
          <div className="p-lg border-b border-outline-variant bg-surface-bright flex justify-between items-center">
            <h3 className="font-h3 text-h3 text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">analytics</span>
              Diagnostic Results
            </h3>
            {result && (
              <span className="px-3 py-1 bg-primary-container text-on-primary-container rounded-full text-label-xs font-bold uppercase">
                Analysis Complete
              </span>
            )}
          </div>
          
          <div className="p-lg flex-grow flex flex-col justify-center">
            {loading ? (
              <Loader />
            ) : result ? (
              <div className="space-y-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-label-xs text-outline mb-1 uppercase tracking-wider">Detected Condition</p>
                    <h2 className="font-h2 text-h2 text-error mb-2">{result.disease || result.likelyDisease || 'Unknown Condition'}</h2>
                  </div>
                  <div className="text-right">
                    <p className="font-label-xs text-outline mb-1 uppercase tracking-wider">Confidence</p>
                    <span className="font-h2 text-h2 text-primary">{result.confidence || 'N/A'}%</span>
                  </div>
                </div>

                <div className="bg-surface-container p-md rounded-lg border border-outline-variant">
                  <h4 className="font-label-sm font-bold text-on-surface mb-2">Analysis Summary</h4>
                  <p className="font-body-md text-on-surface-variant">{result.description || result.symptoms || 'Visual indicators point to early-stage onset of the detected pathogen.'}</p>
                </div>

                <div>
                  <h4 className="font-label-sm font-bold text-on-surface mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary">healing</span>
                    Recommended Treatment Plan
                  </h4>
                  <ul className="space-y-3">
                    {result.treatment && Array.isArray(result.treatment) ? result.treatment.map((t, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-primary mt-0.5 text-[20px]">check_circle</span>
                        <span className="font-body-md text-on-surface">{t}</span>
                      </li>
                    )) : (
                      <li className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-primary mt-0.5 text-[20px]">check_circle</span>
                        <span className="font-body-md text-on-surface">{result.treatment || 'Consult local agricultural extension for specific fungicides.'}</span>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center text-outline">
                <div className="w-20 h-20 bg-surface-variant rounded-full flex items-center justify-center mx-auto mb-4 opacity-50">
                  <span className="material-symbols-outlined text-4xl">energy_savings_leaf</span>
                </div>
                <p className="font-body-md">Awaiting image upload for analysis...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default Disease;
