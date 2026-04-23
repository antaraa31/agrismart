import React, { useState, useEffect } from 'react';

const Profile = () => {
  const [profile, setProfile] = useState({
    name: '',
    location: '',
    crop: '',
    size: '',
    bio: ''
  });

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedProfile = localStorage.getItem('agriProfile');
    if (savedProfile) {
      const p = JSON.parse(savedProfile);
      setProfile({
        name: p.name || '',
        location: p.city || '',
        crop: p.crop || '',
        size: p.size || '',
        bio: p.bio || ''
      });
    }
  }, []);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const saveObj = {
      name: profile.name,
      city: profile.location, // Mapping for other components
      crop: profile.crop,
      size: profile.size,
      bio: profile.bio
    };
    localStorage.setItem('agriProfile', JSON.stringify(saveObj));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <main className="max-w-4xl mx-auto px-6 py-xl">
      {/* Profile Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-end gap-lg mb-xl">
        <div className="relative group">
          <div className="w-32 h-32 rounded-xl overflow-hidden bg-surface-container shadow-sm border border-outline-variant">
            <img className="w-full h-full object-cover" alt="Farmer" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCzaEs7iYqyPAeOV53hnnxogG1UCAyPZnmHKJffdvMVvATv6XwcLCAg9bhEk8DOGvV52gruTsRSWi6pF34zdUNS46JnlBQnHudr1odvjxfB4BJQaR1SrSCJs8Xp0R0ZuHU7gGqhk9x_3jdr95-8o27o6mdz2R6oyM-2ZbeG3gHV9cKYC4Z_PdY28bx6Fo7AyrCEmxBRtBnMkGRFjKJa_TdrxpuS4q7oHlUMzjoARWKP2uI70nXISyiGUv4UNel5ie1A1K-v_NJioxta"/>
          </div>
          <button className="absolute -bottom-2 -right-2 bg-primary text-on-primary p-2 rounded-lg shadow-lg active:opacity-80 transition-all">
            <span className="material-symbols-outlined text-sm">edit</span>
          </button>
        </div>
        <div className="flex-1">
          <h1 className="font-h1 text-h2 text-on-surface mb-xs">Farmer Profile</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Manage your agricultural identity and farm specifications for personalized AI insights.</p>
        </div>
      </div>

      {/* Form Card */}
      <section className="bg-surface-container-lowest rounded-xl border border-surface-variant shadow-sm p-lg md:p-xl">
        <form className="space-y-lg" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
            <div className="space-y-sm">
              <label className="font-label-sm text-label-sm text-on-surface-variant block">Full Name</label>
              <div className="relative">
                <span className="absolute left-md top-1/2 -translate-y-1/2 material-symbols-outlined text-outline">person</span>
                <input name="name" value={profile.name} onChange={handleChange} className="w-full pl-[48px] pr-md py-md bg-white border border-outline-variant rounded-lg focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all font-body-md text-on-surface" placeholder="Enter your name" type="text"/>
              </div>
            </div>

            <div className="space-y-sm">
              <label className="font-label-sm text-label-sm text-on-surface-variant block">Location (City)</label>
              <div className="relative">
                <span className="absolute left-md top-1/2 -translate-y-1/2 material-symbols-outlined text-outline">location_on</span>
                <input name="location" value={profile.location} onChange={handleChange} required className="w-full pl-[48px] pr-md py-md bg-white border border-outline-variant rounded-lg focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all font-body-md text-on-surface" placeholder="Pune, Maharashtra" type="text"/>
              </div>
            </div>

            <div className="space-y-sm">
              <label className="font-label-sm text-label-sm text-on-surface-variant block">Primary Crop Type</label>
              <div className="relative">
                <span className="absolute left-md top-1/2 -translate-y-1/2 material-symbols-outlined text-outline">grass</span>
                <select name="crop" value={profile.crop} onChange={handleChange} required className="w-full pl-[48px] pr-md py-md bg-white border border-outline-variant rounded-lg focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all font-body-md text-on-surface appearance-none">
                  <option disabled value="">Select crop type</option>
                  <option value="Wheat">Wheat</option>
                  <option value="Corn">Corn</option>
                  <option value="Cotton">Cotton</option>
                  <option value="Soybeans">Soybeans</option>
                  <option value="Rice">Rice</option>
                </select>
                <span className="absolute right-md top-1/2 -translate-y-1/2 material-symbols-outlined text-outline pointer-events-none">expand_more</span>
              </div>
            </div>

            <div className="space-y-sm">
              <label className="font-label-sm text-label-sm text-on-surface-variant block">Total Farm Size (Acres)</label>
              <div className="relative">
                <span className="absolute left-md top-1/2 -translate-y-1/2 material-symbols-outlined text-outline">landscape</span>
                <input name="size" value={profile.size} onChange={handleChange} className="w-full pl-[48px] pr-md py-md bg-white border border-outline-variant rounded-lg focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all font-body-md text-on-surface" placeholder="0.00" type="number"/>
              </div>
            </div>
          </div>

          <div className="space-y-sm">
            <label className="font-label-sm text-label-sm text-on-surface-variant block">Farm Description & Notes</label>
            <textarea name="bio" value={profile.bio} onChange={handleChange} className="w-full px-md py-md bg-white border border-outline-variant rounded-lg focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all font-body-md text-on-surface" placeholder="Briefly describe your soil type or farming techniques..." rows="4"></textarea>
          </div>

          <div className="pt-lg border-t border-surface-variant flex flex-col md:flex-row md:items-center justify-between gap-md">
            <div className="flex items-center gap-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-primary">verified_user</span>
              <span className="font-label-xs text-label-xs uppercase">Identity Verified</span>
            </div>
            <div className="flex gap-md items-center">
              {saved && <span className="text-primary font-label-sm">Saved!</span>}
              <button className="px-xl py-md rounded-lg bg-primary text-on-primary font-label-sm text-label-sm shadow-md hover:brightness-110 transition-all active:scale-[0.98]" type="submit">Save Changes</button>
            </div>
          </div>
        </form>
      </section>

      {/* Asymmetric Information Section */}
      <div className="mt-xl grid grid-cols-1 md:grid-cols-3 gap-lg">
        <div className="md:col-span-2 bg-primary-container text-on-primary-container p-lg rounded-xl flex items-center gap-lg">
          <div className="p-md bg-white/10 rounded-full">
            <span className="material-symbols-outlined text-white">auto_awesome</span>
          </div>
          <div>
            <h3 className="font-h3 text-h3 text-white mb-xs">Smart Integration</h3>
            <p className="font-body-md text-body-md text-white/80">Updating your crop type and farm size helps our AI refine satellite moisture analysis for your specific terrain.</p>
          </div>
        </div>
        <div className="bg-surface-container p-lg rounded-xl border border-outline-variant">
          <div className="flex justify-between items-start mb-md">
            <span className="material-symbols-outlined text-secondary">cloud</span>
            <span className="bg-secondary-container text-on-secondary-container px-sm py-xs rounded-full font-label-xs text-label-xs">Active</span>
          </div>
          <h4 className="font-label-sm text-label-sm text-on-surface">Weather Station</h4>
          <p className="font-body-md text-label-sm text-on-surface-variant mt-xs">ID: AS-9942 Connected</p>
        </div>
      </div>
    </main>
  );
};

export default Profile;
