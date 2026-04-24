import React, { useState } from 'react';
import { Upload, Image as ImageIcon, Sparkles, Check, AlertCircle } from 'lucide-react';
import { Page, Hero, Section, Card, Tag, Button, Empty } from '../components/ui';
import Loader from '../components/Loader';

const severityTone = (s) => (s === 'high' ? 'danger' : s === 'medium' ? 'warn' : 'good');

const Disease = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFile = (selected) => {
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setResult(null);
    setError(null);
  };

  const onDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files?.[0]);
  };

  const analyze = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    const fd = new FormData();
    fd.append('image', file);
    try {
      const res = await fetch('http://localhost:5000/api/disease-detect', { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setResult(data.data);
      } else if (data.code === 'quota') {
        setError('AI is paused — your OpenAI quota is exhausted. Add billing at platform.openai.com, then retry.');
      } else if (data.code === 'no_key') {
        setError('OpenAI is not configured on the server. Add OPENAI_API_KEY to backend/.env.');
      } else if (data.code === 'rate_limit') {
        setError('Too many requests right now. Please try again in a moment.');
      } else if (data.code === 'bad_mime' || data.code === 'no_file') {
        setError(data.message);
      } else {
        setError(data.message || 'Could not analyze the image.');
      }
    } catch (err) {
      setError('Network error. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page>
      <Hero
        eyebrow="Disease detection"
        title="One photo. One diagnosis."
        subtitle="Upload a clear photo of the leaf. Our model identifies the pathology and suggests treatments in seconds."
      />

      <Section>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="!p-6">
            <label
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
              onClick={() => document.getElementById('fileUpload').click()}
              className="group block rounded-[var(--radius-md)] bg-[var(--color-surface-alt)] hover:bg-[var(--color-surface-sunken)] transition-colors cursor-pointer overflow-hidden"
            >
              {preview ? (
                <div className="relative aspect-[4/3]">
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 flex items-end p-5 transition-colors">
                    <span className="opacity-0 group-hover:opacity-100 text-white text-[13px] font-medium bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full transition-opacity">
                      Choose a different photo
                    </span>
                  </div>
                </div>
              ) : (
                <div className="aspect-[4/3] flex flex-col items-center justify-center p-10 text-center">
                  <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--color-surface)] text-[var(--color-ink-muted)] mb-5 group-hover:scale-105 transition-transform">
                    <Upload size={20} />
                  </span>
                  <div className="type-h3 mb-1.5">Drop a leaf photo</div>
                  <div className="type-small">or click to browse · JPG, PNG · up to 5 MB</div>
                </div>
              )}
              <input id="fileUpload" type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
            </label>

            <div className="mt-6 flex items-center justify-between">
              <span className="type-caption">
                {file ? file.name : 'No file selected'}
              </span>
              <Button onClick={analyze} disabled={!file || loading}>
                {loading ? 'Analyzing…' : 'Analyze'}
              </Button>
            </div>

            {error && (
              <div className="mt-5 flex items-start gap-2.5 p-4 rounded-[var(--radius-sm)] bg-[var(--color-danger-soft)] text-[var(--color-danger)]">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span className="text-[14px]">{error}</span>
              </div>
            )}
          </Card>

          <Card className="!p-10 min-h-[420px] flex flex-col">
            {loading ? (
              <Loader type="card" />
            ) : result ? (
              <div className="fade-in flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-5">
                  <Sparkles size={14} className="text-[var(--color-accent)]" />
                  <span className="type-eyebrow">Diagnosis</span>
                </div>

                <h2 className="type-h1 mb-3">{result.disease}</h2>

                <div className="flex items-center gap-3 mb-8">
                  {result.severity && <Tag tone={severityTone(result.severity)}>Severity · {result.severity}</Tag>}
                  {typeof result.confidence === 'number' && (
                    <span className="type-small tabular-nums">{result.confidence}% confidence</span>
                  )}
                </div>

                <div className="mt-auto">
                  <h3 className="type-h3 mb-4">Treatments</h3>
                  <ul className="space-y-3">
                    {(result.treatments || []).map((t, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="mt-[3px] inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)] shrink-0">
                          <Check size={12} strokeWidth={3} />
                        </span>
                        <span className="type-body leading-snug">{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <Empty
                icon={<ImageIcon size={18} />}
                title="Awaiting a photo"
                hint="Your diagnosis and treatment plan will appear here."
              />
            )}
          </Card>
        </div>
      </Section>
    </Page>
  );
};

export default Disease;
