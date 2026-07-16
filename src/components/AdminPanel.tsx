import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings, LogOut, Plus, Trash2, Edit2, Save, Layout, Info, HelpCircle, 
  CheckCircle, XCircle, DollarSign, Globe, Activity, Eye, Share2, 
  ExternalLink, Lock, RefreshCw, FileText, Check, Image, Search, 
  Video, Phone, Mail, MapPin, CreditCard, Link2, AlertTriangle, AlertCircle
} from 'lucide-react';
import { AppState, WhyChooseUsItem, Category, ServiceItem, PriceListItem, ComboPackage, PortfolioVideo, GalleryItem, ActivityLog, FaqItem } from '../types';

interface AdminPanelProps {
  state: AppState;
  onSaveState: (newState: AppState) => Promise<boolean>;
  onClose: () => void;
  token: string | null;
  onLogin: (token: string, adminInfo: { email: string; name: string; picture?: string }) => void;
  onLogout: () => void;
}

export default function AdminPanel({ state, onSaveState, onClose, token, onLogin, onLogout }: AdminPanelProps) {
  // Authentication states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passcode, setPasscode] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [adminInfo, setAdminInfo] = useState<{ email: string; name: string; picture?: string } | null>(null);

  // Dashboard state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'logo-seo' | 'home-about' | 'why-choose' | 'services' | 'pricing' | 'portfolio' | 'contacts-payments' | 'faq-policies'>('dashboard');
  const [localState, setLocalState] = useState<AppState>({ ...state });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Helper lists & logs
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Form states for items creation
  const [newWcu, setNewWcu] = useState<Partial<WhyChooseUsItem>>({ iconName: 'Volume2', title: '', description: '' });
  const [newCategory, setNewCategory] = useState({ name: '' });
  const [newService, setNewService] = useState<Partial<ServiceItem>>({
    categoryId: '',
    imageUrl: 'https://images.unsplash.com/photo-1516873240891-4bf014598ab4?auto=format&fit=crop&q=80&w=600',
    title: '',
    description: '',
    price: '',
    isFeatured: false,
    isPublished: true
  });
  const [newPrice, setNewPrice] = useState<Partial<PriceListItem>>({ title: '', subtitle: '', price: '' });
  const [newCombo, setNewCombo] = useState<Partial<ComboPackage>>({ title: '', price: '', inclusions: [''], imageUrl: '', buttonLink: '' });
  const [newYoutubeUrl, setNewYoutubeUrl] = useState('');
  const [isFetchingYoutube, setIsFetchingYoutube] = useState(false);
  const [newGallery, setNewGallery] = useState<Partial<GalleryItem>>({ type: 'image', url: '' });
  const [newFaq, setNewFaq] = useState({ question: '', answer: '' });

  // Link validation indicators
  const [validatingLinks, setValidatingLinks] = useState<{ [key: string]: 'validating' | 'valid' | 'invalid' }>({});

  // Restore session details if token exists
  useEffect(() => {
    if (token) {
      const storedAdmin = localStorage.getItem('dj_admin_info');
      if (storedAdmin) {
        setAdminInfo(JSON.parse(storedAdmin));
      } else {
        setAdminInfo({ email: 'rk89experiment@gmail.com', name: 'Beat House Admin' });
      }
      fetchLogs();
    }
  }, [token]);

  // Sync state if external changes occur
  useEffect(() => {
    setLocalState({ ...state });
  }, [state]);

  const fetchLogs = async () => {
    if (!token) return;
    setIsLoadingLogs(true);
    try {
      const res = await fetch('/api/activity-logs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setActivityLogs(data);
      }
    } catch (err) {
      console.error('Failed to load logs:', err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  // Google Single Sign-In Popup handler
  const handleGoogleLogin = () => {
    setLoginError('');
    setIsLoggingIn(true);
    
    // Setup clean Google Implicit Flow OAuth redirect or modal mock-trigger
    // Since Google OAuth requires an active Client ID registered, we configure a fully standard oauth popup
    const googleClientId = localState.config.googleAnalyticsId || 'dj-beat-house'; // placeholder if empty
    
    // We open a popup to authenticate
    const width = 500;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    
    const popup = window.open(
      `https://accounts.google.com/o/oauth2/v2/auth?client_id=YOUR_CLIENT_ID&redirect_uri=${encodeURIComponent(window.location.origin + '/admin/callback')}&response_type=token&scope=email%20profile`,
      'Google Login',
      `width=${width},height=${height},left=${left},top=${top}`
    );

    // Because this is a sandboxed environment, Google API might not be fully configured yet.
    // So we provide a simulation flow: if Google login fails or has no Client ID, we fall back to automatic local login for rk89experiment@gmail.com
    // Let's explain to user clearly and let them simulate or proceed with passcode easily.
    
    const interval = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(interval);
        setIsLoggingIn(false);
        // Fallback or info trigger
        setLoginError('Google Client ID not configured. Please use the secure Local Passcode login below.');
      }
    }, 1000);
  };

  // Credentials and Passcode login handler
  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    try {
      const payload = email && password 
        ? { email, password }
        : { passcode };

      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onLogin(data.token, { email: data.email, name: data.name, picture: data.picture });
        setAdminInfo({ email: data.email, name: data.name, picture: data.picture });
        localStorage.setItem('dj_admin_info', JSON.stringify({ email: data.email, name: data.name, picture: data.picture }));
        fetchLogs();
      } else {
        setLoginError(data.error || 'Incorrect Admin credentials or passcode.');
      }
    } catch (err) {
      setLoginError('Server unreachable. Make sure the development server is running.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // State save trigger
  const handleSaveChanges = async () => {
    setIsSaving(true);
    setSaveSuccess(null);
    try {
      const success = await onSaveState(localState);
      if (success) {
        setSaveSuccess('All changes saved and synchronized with server successfully!');
        fetchLogs();
        setTimeout(() => setSaveSuccess(null), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // Link Validator helper
  const handleValidateLink = async (fieldId: string, url: string) => {
    if (!url) return;
    setValidatingLinks(prev => ({ ...prev, [fieldId]: 'validating' }));
    try {
      const res = await fetch('/api/validate-link', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      setValidatingLinks(prev => ({ 
        ...prev, 
        [fieldId]: data.isValid ? 'valid' : 'invalid' 
      }));
    } catch (err) {
      setValidatingLinks(prev => ({ ...prev, [fieldId]: 'invalid' }));
    }
  };

  // YouTube Link metadata auto-fetcher
  const handleFetchYoutube = async () => {
    if (!newYoutubeUrl) return;
    setIsFetchingYoutube(true);
    try {
      const res = await fetch('/api/fetch-youtube-metadata', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ youtubeUrl: newYoutubeUrl })
      });
      const data = await res.json();
      if (res.ok && data.videoId) {
        const video: PortfolioVideo = data;
        setLocalState(prev => ({
          ...prev,
          portfolio: [video, ...prev.portfolio]
        }));
        setNewYoutubeUrl('');
        setSaveSuccess('Successfully fetched YouTube video metadata and added to portfolio!');
        setTimeout(() => setSaveSuccess(null), 3000);
      } else {
        alert(data.error || 'Failed to extract video details.');
      }
    } catch (err) {
      alert('Error querying YouTube metadata fetcher.');
    } finally {
      setIsFetchingYoutube(false);
    }
  };

  if (!token) {
    // Admin login UI (Black & Red theme, secure glassmorphism)
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/90 backdrop-blur-md p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-neutral-900 border border-red-950/50 rounded-2xl p-6 md:p-8 shadow-2xl shadow-red-950/20"
        >
          <div className="text-center mb-8">
            <span className="inline-block px-3 py-1 bg-red-950/60 border border-red-500/30 text-red-500 text-xs font-mono uppercase tracking-widest rounded-full mb-3">
              Admin Portal
            </span>
            <h1 className="font-display text-2xl font-bold tracking-tight text-white mb-2">DJ BEAT HOUSE</h1>
            <p className="text-xs text-neutral-400">Authenticated access for modifying logo, tracks, packages, and pricing.</p>
          </div>

          {loginError && (
            <div className="mb-5 p-3 bg-red-950/40 border border-red-800/40 rounded-xl flex items-start gap-2.5 text-xs text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{loginError}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Google Authentication (Strict Requirement) */}
            <button 
              onClick={handleGoogleLogin}
              disabled={isLoggingIn}
              className="w-full h-11 flex items-center justify-center gap-3 bg-white hover:bg-neutral-100 text-neutral-900 font-medium text-xs rounded-xl cursor-pointer transition-all disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Single Gmail Login Only</span>
            </button>

            <div className="flex items-center my-4">
              <div className="flex-grow border-t border-neutral-800"></div>
              <span className="px-3 text-[10px] font-mono text-neutral-500 uppercase">Or Admin Credentials</span>
              <div className="flex-grow border-t border-neutral-800"></div>
            </div>

            {/* Credentials Login Form */}
            <form onSubmit={handleCredentialsLogin} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider mb-1.5">Gmail Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-neutral-500">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. rk89experiment@gmail.com"
                    className="w-full h-11 pl-9 pr-4 bg-neutral-950 border border-neutral-800 text-xs text-white rounded-xl placeholder-neutral-600 focus:outline-none focus:border-red-500 transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider mb-1.5">Password / Passcode</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-neutral-500">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setPasscode(e.target.value); // Sync with fallback passcode state
                    }}
                    placeholder="Enter password (e.g. admin123)"
                    className="w-full h-11 pl-9 pr-4 bg-neutral-950 border border-neutral-800 text-xs text-white rounded-xl placeholder-neutral-600 focus:outline-none focus:border-red-500 transition-colors"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isLoggingIn}
                className="w-full h-11 bg-red-600 hover:bg-red-500 text-white font-semibold text-xs rounded-xl tracking-wider uppercase transition-colors cursor-pointer disabled:opacity-50"
              >
                {isLoggingIn ? 'Verifying...' : 'Authenticate'}
              </button>
            </form>
          </div>

          <div className="mt-8 text-center">
            <button 
              onClick={onClose}
              className="text-xs text-neutral-500 hover:text-white transition-colors cursor-pointer"
            >
              ← Return to DJ Beat House Website
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950 flex flex-col overflow-hidden text-neutral-100">
      {/* Top Banner Control Panel */}
      <header className="bg-neutral-900 border-b border-neutral-800 h-16 shrink-0 flex items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          <Settings className="w-5 h-5 text-red-500 animate-spin-slow" />
          <div>
            <h2 className="font-display font-bold text-sm tracking-wide text-white uppercase">DJ BEAT HOUSE ADMIN</h2>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] text-neutral-400 font-mono">{adminInfo?.email}</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {saveSuccess && (
            <div className="hidden lg:flex items-center gap-2 text-xs text-green-400 font-medium">
              <CheckCircle className="w-4 h-4" />
              <span>{saveSuccess}</span>
            </div>
          )}

          <button
            onClick={handleSaveChanges}
            disabled={isSaving}
            className="px-4 h-9 bg-red-600 hover:bg-red-500 disabled:bg-neutral-800 text-white font-bold text-xs rounded-lg tracking-wider uppercase flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-red-950/20"
          >
            {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {isSaving ? 'SAVING...' : 'SAVE CHANGES'}
          </button>



          <button
            onClick={onClose}
            className="px-3 h-9 bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Exit Control Panel
          </button>
        </div>
      </header>

      <div className="flex-grow flex overflow-hidden">
        {/* Left Sidebar Menu */}
        <aside className="w-64 bg-neutral-900 border-r border-neutral-800 shrink-0 hidden md:flex flex-col overflow-y-auto py-4">
          <nav className="space-y-1 px-2 flex-grow">
            {[
              { id: 'dashboard', label: 'Dashboard Logs', icon: Activity },
              { id: 'logo-seo', label: 'Logo & SEO Settings', icon: Globe },
              { id: 'home-about', label: 'Hero & About Us', icon: Layout },
              { id: 'why-choose', label: 'Why Choose Us', icon: Info },
              { id: 'services', label: 'Services & Cats', icon: Search },
              { id: 'pricing', label: 'Pricing & Combos', icon: DollarSign },
              { id: 'portfolio', label: 'Portfolio & Gallery', icon: Video },
              { id: 'contacts-payments', label: 'Contacts & QR Payments', icon: CreditCard },
              { id: 'faq-policies', label: 'FAQ & Policies', icon: HelpCircle },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center gap-3 px-3 h-10 rounded-lg text-xs font-medium tracking-wide transition-colors cursor-pointer ${
                    activeTab === tab.id 
                      ? 'bg-red-950/40 text-red-400 border border-red-900/30 font-bold' 
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
          
          <div className="mt-auto px-4 pt-4 border-t border-neutral-800">
            <div className="bg-neutral-950/60 p-3 rounded-lg border border-neutral-800/80 text-center">
              <span className="text-[10px] text-neutral-500 font-mono block">VISITOR METER</span>
              <span className="text-xl font-bold font-mono text-red-500 block">{localState.visitorCount}</span>
            </div>
          </div>
        </aside>

        {/* Mobile Tab Select Dropdown */}
        <div className="md:hidden fixed bottom-4 right-4 z-40">
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as any)}
            className="bg-neutral-900 border border-neutral-700 text-white rounded-lg p-3 text-xs focus:outline-none focus:border-red-500 shadow-2xl"
          >
            <option value="dashboard">Dashboard Logs</option>
            <option value="logo-seo">Logo & SEO Settings</option>
            <option value="home-about">Hero & About Us</option>
            <option value="why-choose">Why Choose Us</option>
            <option value="services">Services & Cats</option>
            <option value="pricing">Pricing & Combos</option>
            <option value="portfolio">Portfolio & Gallery</option>
            <option value="contacts-payments">Contacts & QR Payments</option>
            <option value="faq-policies">FAQ & Policies</option>
          </select>
        </div>

        {/* Right Content Stream */}
        <main className="flex-grow overflow-y-auto p-4 md:p-6 bg-neutral-950">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6 max-w-4xl"
            >
              {/* SAVE CONSOLE BANNER FOR CONVENIENCE */}
              {saveSuccess && (
                <div className="p-4 bg-green-950/40 border border-green-800/40 text-green-400 text-xs font-semibold rounded-xl flex items-center gap-2.5">
                  <CheckCircle className="w-5 h-5 shrink-0" />
                  <span>{saveSuccess}</span>
                </div>
              )}

              {/* TAB 1: DASHBOARD & ACTIVITY LOGS */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold font-display uppercase tracking-wide text-white">SYSTEM SUMMARY</h3>
                    <p className="text-xs text-neutral-400">Real-time stats monitor and administrative audit trail.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-xl">
                      <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block mb-1">Total Visitors</span>
                      <span className="text-3xl font-display font-bold text-white block">{localState.visitorCount}</span>
                      <p className="text-[10px] text-neutral-500 mt-2">Active counters since initial database sync.</p>
                    </div>
                    <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-xl">
                      <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block mb-1">Active Services</span>
                      <span className="text-3xl font-display font-bold text-red-500 block">{localState.services.length}</span>
                      <p className="text-[10px] text-neutral-500 mt-2">Across {localState.categories.length} custom categories.</p>
                    </div>
                    <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-xl">
                      <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block mb-1">Portfolio Items</span>
                      <span className="text-3xl font-display font-bold text-white block">{localState.portfolio.length}</span>
                      <p className="text-[10px] text-neutral-500 mt-2">Professional YouTube sound references.</p>
                    </div>
                  </div>

                  {/* Announcement Bar Settings */}
                  <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-xl space-y-4">
                    <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                      <div>
                        <h4 className="font-display font-bold text-xs uppercase tracking-wide text-white">GLOBAL ANNOUNCEMENT BAR</h4>
                        <p className="text-[10px] text-neutral-400">Scroll ticker displayed at the absolute top of the public website.</p>
                      </div>
                      <input 
                        type="checkbox"
                        checked={localState.announcement.isActive}
                        onChange={(e) => setLocalState(prev => ({
                          ...prev,
                          announcement: { ...prev.announcement, isActive: e.target.checked }
                        }))}
                        className="w-4 h-4 text-red-600 border-neutral-800 rounded focus:ring-red-500 focus:ring-offset-neutral-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider mb-1.5">Announcement Ticker Text</label>
                      <input 
                        type="text"
                        value={localState.announcement.text}
                        onChange={(e) => setLocalState(prev => ({
                          ...prev,
                          announcement: { ...prev.announcement, text: e.target.value }
                        }))}
                        className="w-full h-11 px-3 bg-neutral-950 border border-neutral-800 text-xs text-white rounded-lg focus:outline-none focus:border-red-500 transition-colors"
                        placeholder="E.g. SUMMER SALE: 20% OFF ALL SERVICES!"
                      />
                    </div>
                  </div>

                  {/* Activity Logs */}
                  <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-xl space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-display font-bold text-xs uppercase tracking-wide text-white flex items-center gap-2">
                        <Activity className="w-4 h-4 text-red-500" />
                        ADMIN ACTIVITY LOG
                      </h4>
                      <button
                        onClick={fetchLogs}
                        disabled={isLoadingLogs}
                        className="p-1.5 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded text-neutral-400 hover:text-white text-xs flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLogs ? 'animate-spin' : ''}`} />
                        <span>Refresh</span>
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[11px] font-mono">
                        <thead>
                          <tr className="border-b border-neutral-800 text-neutral-500">
                            <th className="py-2">TIMESTAMP</th>
                            <th className="py-2">OPERATION</th>
                            <th className="py-2">DETAILS</th>
                            <th className="py-2">IP ADDRESS</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800/50 text-neutral-300">
                          {activityLogs.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="py-4 text-center text-neutral-500">No recent login or audit events tracked.</td>
                            </tr>
                          ) : (
                            activityLogs.map((log) => (
                              <tr key={log.id} className="hover:bg-neutral-950/30">
                                <td className="py-2.5 text-neutral-500">{new Date(log.timestamp).toLocaleString()}</td>
                                <td className="py-2.5 font-bold text-red-400">{log.action}</td>
                                <td className="py-2.5 max-w-xs truncate" title={log.details}>{log.details}</td>
                                <td className="py-2.5 text-neutral-400">{log.ip || 'unknown'}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: LOGO & SEO */}
              {activeTab === 'logo-seo' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold font-display uppercase tracking-wide text-white">LOGO & SEO CONFIGURATIONS</h3>
                    <p className="text-xs text-neutral-400">Change application branding assets, SEO search fields, and analytics integrations.</p>
                  </div>

                  {/* Logo Management */}
                  <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-xl space-y-4">
                    <h4 className="font-display font-bold text-xs uppercase tracking-wide text-white border-b border-neutral-800 pb-3">Branding Assets</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Logo Link */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Website Logo URL</label>
                          <button
                            onClick={() => handleValidateLink('logoUrl', localState.config.logoUrl)}
                            className="text-[9px] font-mono text-red-400 hover:text-red-300 uppercase cursor-pointer"
                          >
                            Check Link
                          </button>
                        </div>
                        <div className="relative">
                          <input 
                            type="text"
                            value={localState.config.logoUrl}
                            onChange={(e) => setLocalState(prev => ({
                              ...prev,
                              config: { ...prev.config, logoUrl: e.target.value }
                            }))}
                            className="w-full h-11 px-3 bg-neutral-950 border border-neutral-800 text-xs text-white rounded-lg focus:outline-none focus:border-red-500 pr-9"
                          />
                          <div className="absolute right-3 top-3">
                            {validatingLinks['logoUrl'] === 'valid' && <Check className="w-4 h-4 text-green-400" />}
                            {validatingLinks['logoUrl'] === 'invalid' && <XCircle className="w-4 h-4 text-red-400" />}
                            {validatingLinks['logoUrl'] === 'validating' && <RefreshCw className="w-4 h-4 text-neutral-500 animate-spin" />}
                          </div>
                        </div>
                      </div>

                      {/* Favicon Link */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Favicon URL</label>
                          <button
                            onClick={() => handleValidateLink('faviconUrl', localState.config.faviconUrl)}
                            className="text-[9px] font-mono text-red-400 hover:text-red-300 uppercase cursor-pointer"
                          >
                            Check Link
                          </button>
                        </div>
                        <div className="relative">
                          <input 
                            type="text"
                            value={localState.config.faviconUrl}
                            onChange={(e) => setLocalState(prev => ({
                              ...prev,
                              config: { ...prev.config, faviconUrl: e.target.value }
                            }))}
                            className="w-full h-11 px-3 bg-neutral-950 border border-neutral-800 text-xs text-white rounded-lg focus:outline-none focus:border-red-500 pr-9"
                          />
                          <div className="absolute right-3 top-3">
                            {validatingLinks['faviconUrl'] === 'valid' && <Check className="w-4 h-4 text-green-400" />}
                            {validatingLinks['faviconUrl'] === 'invalid' && <XCircle className="w-4 h-4 text-red-400" />}
                            {validatingLinks['faviconUrl'] === 'validating' && <RefreshCw className="w-4 h-4 text-neutral-500 animate-spin" />}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SEO Configuration */}
                  <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-xl space-y-4">
                    <h4 className="font-display font-bold text-xs uppercase tracking-wide text-white border-b border-neutral-800 pb-3">Search Engine Optimization (SEO)</h4>
                    
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Meta Title</label>
                        <input 
                          type="text"
                          value={localState.config.seoTitle}
                          onChange={(e) => setLocalState(prev => ({
                            ...prev,
                            config: { ...prev.config, seoTitle: e.target.value }
                          }))}
                          className="w-full h-11 px-3 bg-neutral-950 border border-neutral-800 text-xs text-white rounded-lg focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Meta Description</label>
                        <textarea 
                          rows={3}
                          value={localState.config.seoDescription}
                          onChange={(e) => setLocalState(prev => ({
                            ...prev,
                            config: { ...prev.config, seoDescription: e.target.value }
                          }))}
                          className="w-full p-3 bg-neutral-950 border border-neutral-800 text-xs text-white rounded-lg focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Meta Keywords</label>
                        <input 
                          type="text"
                          value={localState.config.seoKeywords}
                          onChange={(e) => setLocalState(prev => ({
                            ...prev,
                            config: { ...prev.config, seoKeywords: e.target.value }
                          }))}
                          className="w-full h-11 px-3 bg-neutral-950 border border-neutral-800 text-xs text-white rounded-lg focus:outline-none"
                          placeholder="Comma-separated keywords"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Open Graph Share Image Link</label>
                        <input 
                          type="text"
                          value={localState.config.openGraphImage}
                          onChange={(e) => setLocalState(prev => ({
                            ...prev,
                            config: { ...prev.config, openGraphImage: e.target.value }
                          }))}
                          className="w-full h-11 px-3 bg-neutral-950 border border-neutral-800 text-xs text-white rounded-lg focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Crawlers & Indexing */}
                  <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-xl space-y-4">
                    <h4 className="font-display font-bold text-xs uppercase tracking-wide text-white border-b border-neutral-800 pb-3">Crawlers, Verification & Sitemaps</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Google Analytics Tracker ID</label>
                        <input 
                          type="text"
                          value={localState.config.googleAnalyticsId}
                          onChange={(e) => setLocalState(prev => ({
                            ...prev,
                            config: { ...prev.config, googleAnalyticsId: e.target.value }
                          }))}
                          className="w-full h-11 px-3 bg-neutral-950 border border-neutral-800 text-xs text-white rounded-lg"
                          placeholder="E.g. G-XXXXXXXXXX"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Google Search Console Verification ID</label>
                        <input 
                          type="text"
                          value={localState.config.googleSearchConsoleId}
                          onChange={(e) => setLocalState(prev => ({
                            ...prev,
                            config: { ...prev.config, googleSearchConsoleId: e.target.value }
                          }))}
                          className="w-full h-11 px-3 bg-neutral-950 border border-neutral-800 text-xs text-white rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Robots.txt Content</label>
                        <textarea 
                          rows={3}
                          value={localState.config.robotsTxt}
                          onChange={(e) => setLocalState(prev => ({
                            ...prev,
                            config: { ...prev.config, robotsTxt: e.target.value }
                          }))}
                          className="w-full p-3 bg-neutral-950 border border-neutral-800 text-xs text-white font-mono rounded-lg focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Sitemap.xml Content</label>
                        <textarea 
                          rows={3}
                          value={localState.config.sitemapXml}
                          onChange={(e) => setLocalState(prev => ({
                            ...prev,
                            config: { ...prev.config, sitemapXml: e.target.value }
                          }))}
                          className="w-full p-3 bg-neutral-950 border border-neutral-800 text-xs text-white font-mono rounded-lg focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: HOME & ABOUT */}
              {activeTab === 'home-about' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold font-display uppercase tracking-wide text-white">HOME BANNER & ABOUT US</h3>
                    <p className="text-xs text-neutral-400">Configure hero text titles, background image links, and long about bios.</p>
                  </div>

                  {/* Home Section */}
                  <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-xl space-y-4">
                    <h4 className="font-display font-bold text-xs uppercase tracking-wide text-white border-b border-neutral-800 pb-3">Home Section Banner</h4>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Banner background image URL</label>
                          <input 
                            type="text"
                            value={localState.home.bannerUrl}
                            onChange={(e) => setLocalState(prev => ({
                              ...prev,
                              home: { ...prev.home, bannerUrl: e.target.value }
                            }))}
                            className="w-full h-11 px-3 bg-neutral-950 border border-neutral-800 text-xs text-white rounded-lg"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Main Heading Title</label>
                          <input 
                            type="text"
                            value={localState.home.title}
                            onChange={(e) => setLocalState(prev => ({
                              ...prev,
                              home: { ...prev.home, title: e.target.value }
                            }))}
                            className="w-full h-11 px-3 bg-neutral-950 border border-neutral-800 text-xs text-white rounded-lg font-bold uppercase tracking-widest"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Hero Subtitle</label>
                        <input 
                          type="text"
                          value={localState.home.subtitle}
                          onChange={(e) => setLocalState(prev => ({
                            ...prev,
                            home: { ...prev.home, subtitle: e.target.value }
                          }))}
                          className="w-full h-11 px-3 bg-neutral-950 border border-neutral-800 text-xs text-white rounded-lg"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Hero CTA Button Label</label>
                          <input 
                            type="text"
                            value={localState.home.buttonText}
                            onChange={(e) => setLocalState(prev => ({
                              ...prev,
                              home: { ...prev.home, buttonText: e.target.value }
                            }))}
                            className="w-full h-11 px-3 bg-neutral-950 border border-neutral-800 text-xs text-white rounded-lg"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Hero CTA Button Link</label>
                          <input 
                            type="text"
                            value={localState.home.buttonLink}
                            onChange={(e) => setLocalState(prev => ({
                              ...prev,
                              home: { ...prev.home, buttonLink: e.target.value }
                            }))}
                            className="w-full h-11 px-3 bg-neutral-950 border border-neutral-800 text-xs text-white rounded-lg"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* About Us */}
                  <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-xl space-y-4">
                    <h4 className="font-display font-bold text-xs uppercase tracking-wide text-white border-b border-neutral-800 pb-3">About Us Section</h4>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider">About Title</label>
                          <input 
                            type="text"
                            value={localState.about.title}
                            onChange={(e) => setLocalState(prev => ({
                              ...prev,
                              about: { ...prev.about, title: e.target.value }
                            }))}
                            className="w-full h-11 px-3 bg-neutral-950 border border-neutral-800 text-xs text-white rounded-lg uppercase tracking-wide"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider">About Image URL</label>
                          <input 
                            type="text"
                            value={localState.about.imageUrl}
                            onChange={(e) => setLocalState(prev => ({
                              ...prev,
                              about: { ...prev.about, imageUrl: e.target.value }
                            }))}
                            className="w-full h-11 px-3 bg-neutral-950 border border-neutral-800 text-xs text-white rounded-lg"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider">About Long Description Bio</label>
                        <textarea 
                          rows={5}
                          value={localState.about.description}
                          onChange={(e) => setLocalState(prev => ({
                            ...prev,
                            about: { ...prev.about, description: e.target.value }
                          }))}
                          className="w-full p-3 bg-neutral-950 border border-neutral-800 text-xs text-white rounded-lg focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: WHY CHOOSE US */}
              {activeTab === 'why-choose' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold font-display uppercase tracking-wide text-white">WHY CHOOSE US</h3>
                    <p className="text-xs text-neutral-400">Add, edit, or delete unlimited high-value arguments and selling points.</p>
                  </div>

                  {/* List Current Points */}
                  <div className="space-y-3">
                    {localState.whyChooseUs.map((item, idx) => (
                      <div key={item.id} className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl flex items-start gap-4 justify-between">
                        <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-mono text-neutral-500 uppercase">Icon Class (lucide)</label>
                            <select 
                              value={item.iconName}
                              onChange={(e) => {
                                const list = [...localState.whyChooseUs];
                                list[idx].iconName = e.target.value;
                                setLocalState(prev => ({ ...prev, whyChooseUs: list }));
                              }}
                              className="w-full h-9 bg-neutral-950 border border-neutral-800 text-xs text-white rounded-lg px-2"
                            >
                              <option value="Volume2">Volume2 (Audio Output)</option>
                              <option value="Zap">Zap (Instant speed)</option>
                              <option value="HeartHandshake">HeartHandshake (Trust)</option>
                              <option value="TrendingUp">TrendingUp (Growth)</option>
                              <option value="ShieldCheck">ShieldCheck (Security)</option>
                              <option value="Mic">Mic (Microphone Recording)</option>
                              <option value="Music">Music (Notes)</option>
                              <option value="Sparkles">Sparkles (Quality)</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-mono text-neutral-500 uppercase">Point Title</label>
                            <input 
                              type="text"
                              value={item.title}
                              onChange={(e) => {
                                const list = [...localState.whyChooseUs];
                                list[idx].title = e.target.value;
                                setLocalState(prev => ({ ...prev, whyChooseUs: list }));
                              }}
                              className="w-full h-9 bg-neutral-950 border border-neutral-800 text-xs text-white rounded-lg px-2"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-mono text-neutral-500 uppercase">Long description</label>
                            <input 
                              type="text"
                              value={item.description}
                              onChange={(e) => {
                                const list = [...localState.whyChooseUs];
                                list[idx].description = e.target.value;
                                setLocalState(prev => ({ ...prev, whyChooseUs: list }));
                              }}
                              className="w-full h-9 bg-neutral-950 border border-neutral-800 text-xs text-white rounded-lg px-2"
                            />
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setLocalState(prev => ({
                              ...prev,
                              whyChooseUs: prev.whyChooseUs.filter(w => w.id !== item.id)
                            }));
                          }}
                          className="p-1.5 bg-neutral-950 hover:bg-red-950/40 text-neutral-500 hover:text-red-500 border border-neutral-800 hover:border-red-900 rounded-lg shrink-0 mt-4 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add New Point Form */}
                  <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-xl space-y-4">
                    <h4 className="font-display font-bold text-xs uppercase tracking-wide text-white border-b border-neutral-800 pb-3">ADD NEW POINT</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-mono text-neutral-400 uppercase">Select Icon</label>
                        <select 
                          value={newWcu.iconName}
                          onChange={(e) => setNewWcu(prev => ({ ...prev, iconName: e.target.value }))}
                          className="w-full h-11 bg-neutral-950 border border-neutral-800 text-xs text-white rounded-lg px-2"
                        >
                          <option value="Volume2">Volume2 (Audio Output)</option>
                          <option value="Zap">Zap (Instant speed)</option>
                          <option value="HeartHandshake">HeartHandshake (Trust)</option>
                          <option value="TrendingUp">TrendingUp (Growth)</option>
                          <option value="ShieldCheck">ShieldCheck (Security)</option>
                          <option value="Mic">Mic (Microphone Recording)</option>
                          <option value="Music">Music (Notes)</option>
                          <option value="Sparkles">Sparkles (Quality)</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-mono text-neutral-400 uppercase">Point Title</label>
                        <input 
                          type="text"
                          value={newWcu.title}
                          onChange={(e) => setNewWcu(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full h-11 px-3 bg-neutral-950 border border-neutral-800 text-xs text-white rounded-lg"
                          placeholder="E.g. Full commercial rights"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-mono text-neutral-400 uppercase">Description text</label>
                        <input 
                          type="text"
                          value={newWcu.description}
                          onChange={(e) => setNewWcu(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full h-11 px-3 bg-neutral-950 border border-neutral-800 text-xs text-white rounded-lg"
                          placeholder="Keep it brief and convincing."
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (!newWcu.title || !newWcu.description) return;
                        const point: WhyChooseUsItem = {
                          id: `wcu-${Date.now()}`,
                          iconName: newWcu.iconName || 'Volume2',
                          title: newWcu.title,
                          description: newWcu.description,
                        };
                        setLocalState(prev => ({ ...prev, whyChooseUs: [...prev.whyChooseUs, point] }));
                        setNewWcu({ iconName: 'Volume2', title: '', description: '' });
                      }}
                      className="px-4 h-10 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs rounded-lg uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Argument
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 5: SERVICES & CATEGORIES */}
              {activeTab === 'services' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold font-display uppercase tracking-wide text-white">SERVICES & CATEGORIES</h3>
                      <p className="text-xs text-neutral-400">Establish custom DJ service categories and add, edit, publish/hide individual services.</p>
                    </div>
                  </div>

                  {/* Categories Section */}
                  <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-xl space-y-4">
                    <h4 className="font-display font-bold text-xs uppercase tracking-wide text-white border-b border-neutral-800 pb-3">1. Manage Categories</h4>
                    
                    {/* List categories */}
                    <div className="flex flex-wrap gap-2">
                      {localState.categories.map(cat => (
                        <div key={cat.id} className="px-3 h-8 bg-neutral-950 border border-neutral-800 rounded-full flex items-center gap-2 text-xs">
                          <span className="text-white">{cat.name}</span>
                          <button
                            onClick={() => {
                              setLocalState(prev => ({
                                ...prev,
                                categories: prev.categories.filter(c => c.id !== cat.id),
                                services: prev.services.filter(s => s.categoryId !== cat.id) // delete child services or keep unlinked
                              }));
                            }}
                            className="text-neutral-500 hover:text-red-500 font-bold transition-colors cursor-pointer"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add Category Form */}
                    <div className="flex items-center gap-3">
                      <input 
                        type="text"
                        value={newCategory.name}
                        onChange={(e) => setNewCategory({ name: e.target.value })}
                        placeholder="Add New Category name (e.g. Mixing)"
                        className="flex-grow h-10 px-3 bg-neutral-950 border border-neutral-800 text-xs text-white rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!newCategory.name) return;
                          const slug = `cat-${newCategory.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
                          const cat: Category = {
                            id: slug,
                            name: newCategory.name
                          };
                          setLocalState(prev => ({ ...prev, categories: [...prev.categories, cat] }));
                          setNewCategory({ name: '' });
                        }}
                        className="h-10 px-4 bg-red-600 hover:bg-red-500 text-white font-semibold text-xs rounded-lg uppercase tracking-wider cursor-pointer shrink-0"
                      >
                        Add Category
                      </button>
                    </div>
                  </div>

                  {/* List Services */}
                  <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-xl space-y-4">
                    <h4 className="font-display font-bold text-xs uppercase tracking-wide text-white border-b border-neutral-800 pb-3">2. Current Services Checklist</h4>
                    
                    <div className="space-y-4">
                      {localState.services.map((svc, idx) => {
                        const categoryName = localState.categories.find(c => c.id === svc.categoryId)?.name || 'Uncategorized';
                        return (
                          <div key={svc.id} className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl flex flex-col md:flex-row gap-4 justify-between">
                            <div className="flex items-center gap-3">
                              <img src={svc.imageUrl} alt={svc.title} className="w-12 h-12 object-cover rounded-lg shrink-0 border border-neutral-800" />
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-white">{svc.title}</span>
                                  <span className="text-[9px] px-2 h-4 bg-red-950/40 border border-red-900/30 text-red-400 font-mono rounded-full uppercase">{categoryName}</span>
                                </div>
                                <p className="text-[10px] text-neutral-400 max-w-md line-clamp-1">{svc.description}</p>
                                <span className="text-xs font-mono font-bold text-red-500">{svc.price}</span>
                              </div>
                            </div>

                            {/* Service Controls inline */}
                            <div className="flex items-center gap-3 self-end md:self-center shrink-0">
                              <label className="flex items-center gap-1.5 text-[10px] text-neutral-400 font-mono cursor-pointer">
                                <input 
                                  type="checkbox"
                                  checked={svc.isFeatured}
                                  onChange={(e) => {
                                    const list = [...localState.services];
                                    list[idx].isFeatured = e.target.checked;
                                    setLocalState(prev => ({ ...prev, services: list }));
                                  }}
                                  className="w-3.5 h-3.5 text-red-600 border-neutral-800 rounded"
                                />
                                <span>Featured</span>
                              </label>

                              <label className="flex items-center gap-1.5 text-[10px] text-neutral-400 font-mono cursor-pointer">
                                <input 
                                  type="checkbox"
                                  checked={svc.isPublished}
                                  onChange={(e) => {
                                    const list = [...localState.services];
                                    list[idx].isPublished = e.target.checked;
                                    setLocalState(prev => ({ ...prev, services: list }));
                                  }}
                                  className="w-3.5 h-3.5 text-red-600 border-neutral-800 rounded"
                                />
                                <span>Published</span>
                              </label>

                              <button
                                onClick={() => {
                                  setLocalState(prev => ({
                                    ...prev,
                                    services: prev.services.filter(s => s.id !== svc.id)
                                  }));
                                }}
                                className="p-1.5 bg-neutral-900 hover:bg-red-950/30 text-neutral-500 hover:text-red-500 rounded-lg cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Add Service Form */}
                  <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-xl space-y-4">
                    <h4 className="font-display font-bold text-xs uppercase tracking-wide text-white border-b border-neutral-800 pb-3">3. CREATE NEW SERVICE</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-mono text-neutral-400 uppercase">Service Title</label>
                        <input 
                          type="text"
                          value={newService.title}
                          onChange={(e) => setNewService(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full h-11 px-3 bg-neutral-950 border border-neutral-800 text-xs text-white rounded-lg"
                          placeholder="E.g. Vocal Tuning FX"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-mono text-neutral-400 uppercase">Category Allocation</label>
                        <select 
                          value={newService.categoryId}
                          onChange={(e) => setNewService(prev => ({ ...prev, categoryId: e.target.value }))}
                          className="w-full h-11 bg-neutral-950 border border-neutral-800 text-xs text-white rounded-lg px-2"
                        >
                          <option value="">-- Choose Category --</option>
                          {localState.categories.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-mono text-neutral-400 uppercase">Image URL (Link Only)</label>
                          <button
                            onClick={() => handleValidateLink('newSvcImg', newService.imageUrl || '')}
                            className="text-[9px] font-mono text-red-400 hover:text-red-300 uppercase cursor-pointer"
                          >
                            Validate Image Link
                          </button>
                        </div>
                        <div className="relative">
                          <input 
                            type="text"
                            value={newService.imageUrl}
                            onChange={(e) => setNewService(prev => ({ ...prev, imageUrl: e.target.value }))}
                            className="w-full h-11 px-3 bg-neutral-950 border border-neutral-800 text-xs text-white rounded-lg pr-9"
                          />
                          <div className="absolute right-3 top-3">
                            {validatingLinks['newSvcImg'] === 'valid' && <Check className="w-4 h-4 text-green-400" />}
                            {validatingLinks['newSvcImg'] === 'invalid' && <XCircle className="w-4 h-4 text-red-400" />}
                            {validatingLinks['newSvcImg'] === 'validating' && <RefreshCw className="w-4 h-4 text-neutral-500 animate-spin" />}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-mono text-neutral-400 uppercase">Price Tag ($ or Rs)</label>
                        <input 
                          type="text"
                          value={newService.price}
                          onChange={(e) => setNewService(prev => ({ ...prev, price: e.target.value }))}
                          className="w-full h-11 px-3 bg-neutral-950 border border-neutral-800 text-xs text-white rounded-lg font-bold"
                          placeholder="E.g. $15"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-mono text-neutral-400 uppercase">Service Description Details</label>
                      <textarea 
                        rows={3}
                        value={newService.description}
                        onChange={(e) => setNewService(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full p-3 bg-neutral-950 border border-neutral-800 text-xs text-white rounded-lg"
                        placeholder="Detailed sales bio of this service."
                      />
                    </div>

                    <div className="flex gap-4">
                      <label className="flex items-center gap-1.5 text-xs text-neutral-300 cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={newService.isFeatured}
                          onChange={(e) => setNewService(prev => ({ ...prev, isFeatured: e.target.checked }))}
                          className="w-4 h-4 text-red-600 border-neutral-800 rounded focus:ring-red-500 focus:ring-offset-neutral-900"
                        />
                        <span>Featured Home Placement</span>
                      </label>

                      <label className="flex items-center gap-1.5 text-xs text-neutral-300 cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={newService.isPublished}
                          onChange={(e) => setNewService(prev => ({ ...prev, isPublished: e.target.checked }))}
                          className="w-4 h-4 text-red-600 border-neutral-800 rounded focus:ring-red-500 focus:ring-offset-neutral-900"
                        />
                        <span>Publish Live Instantly</span>
                      </label>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (!newService.title || !newService.categoryId) return;
                        const item: ServiceItem = {
                          id: `svc-${Date.now()}`,
                          categoryId: newService.categoryId,
                          imageUrl: newService.imageUrl || 'https://images.unsplash.com/photo-1516873240891-4bf014598ab4?auto=format&fit=crop&q=80&w=600',
                          title: newService.title,
                          description: newService.description || '',
                          price: newService.price || 'Free',
                          isFeatured: !!newService.isFeatured,
                          isPublished: newService.isPublished !== false,
                        };
                        setLocalState(prev => ({ ...prev, services: [...prev.services, item] }));
                        setNewService({
                          categoryId: '',
                          imageUrl: 'https://images.unsplash.com/photo-1516873240891-4bf014598ab4?auto=format&fit=crop&q=80&w=600',
                          title: '',
                          description: '',
                          price: '',
                          isFeatured: false,
                          isPublished: true
                        });
                      }}
                      className="px-4 h-10 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-lg uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      Create Service Item
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 6: PRICING & COMBOS */}
              {activeTab === 'pricing' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold font-display uppercase tracking-wide text-white">PRICE LIST & COMBO PACKAGES</h3>
                    <p className="text-xs text-neutral-400">Establish the official price sheet and set custom multi-item bundled combo offers.</p>
                  </div>

                  {/* Price List Items */}
                  <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-xl space-y-4">
                    <h4 className="font-display font-bold text-xs uppercase tracking-wide text-white border-b border-neutral-800 pb-3">1. Fast Price List (Standalone Items)</h4>
                    
                    <div className="space-y-2">
                      {localState.priceList.map((item, idx) => (
                        <div key={item.id} className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg flex items-center justify-between gap-4">
                          <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-3">
                            <input 
                              type="text"
                              value={item.title}
                              onChange={(e) => {
                                const list = [...localState.priceList];
                                list[idx].title = e.target.value;
                                setLocalState(prev => ({ ...prev, priceList: list }));
                              }}
                              className="bg-neutral-900 text-xs text-white rounded p-2 border border-neutral-800"
                              placeholder="Title"
                            />
                            <input 
                              type="text"
                              value={item.subtitle}
                              onChange={(e) => {
                                const list = [...localState.priceList];
                                list[idx].subtitle = e.target.value;
                                setLocalState(prev => ({ ...prev, priceList: list }));
                              }}
                              className="bg-neutral-900 text-xs text-white rounded p-2 border border-neutral-800"
                              placeholder="Subtitle Description"
                            />
                            <input 
                              type="text"
                              value={item.price}
                              onChange={(e) => {
                                const list = [...localState.priceList];
                                list[idx].price = e.target.value;
                                setLocalState(prev => ({ ...prev, priceList: list }));
                              }}
                              className="bg-neutral-900 text-xs text-white rounded p-2 border border-neutral-800 font-bold"
                              placeholder="Price"
                            />
                          </div>
                          <button
                            onClick={() => {
                              setLocalState(prev => ({
                                ...prev,
                                priceList: prev.priceList.filter(p => p.id !== item.id)
                              }));
                            }}
                            className="p-1.5 hover:bg-red-950/30 text-neutral-500 hover:text-red-400 rounded cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add Price form */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input 
                        type="text"
                        value={newPrice.title}
                        onChange={(e) => setNewPrice(prev => ({ ...prev, title: e.target.value }))}
                        className="bg-neutral-950 border border-neutral-800 rounded p-2.5 text-xs text-white"
                        placeholder="New Item Name"
                      />
                      <input 
                        type="text"
                        value={newPrice.subtitle}
                        onChange={(e) => setNewPrice(prev => ({ ...prev, subtitle: e.target.value }))}
                        className="bg-neutral-950 border border-neutral-800 rounded p-2.5 text-xs text-white"
                        placeholder="Inclusions / Info"
                      />
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          value={newPrice.price}
                          onChange={(e) => setNewPrice(prev => ({ ...prev, price: e.target.value }))}
                          className="bg-neutral-950 border border-neutral-800 rounded p-2.5 text-xs text-white font-bold flex-grow"
                          placeholder="$30"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!newPrice.title) return;
                            const pr: PriceListItem = {
                              id: `pr-${Date.now()}`,
                              title: newPrice.title,
                              subtitle: newPrice.subtitle || '',
                              price: newPrice.price || '$0'
                            };
                            setLocalState(prev => ({ ...prev, priceList: [...prev.priceList, pr] }));
                            setNewPrice({ title: '', subtitle: '', price: '' });
                          }}
                          className="px-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-xs uppercase tracking-wider font-semibold cursor-pointer shrink-0"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Combo Packages */}
                  <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-xl space-y-4">
                    <h4 className="font-display font-bold text-xs uppercase tracking-wide text-white border-b border-neutral-800 pb-3">2. Structured Combo Packages</h4>
                    
                    {/* List Combo Packages */}
                    <div className="space-y-3">
                      {localState.comboPackages.map((combo, idx) => (
                        <div key={combo.id} className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3">
                          <div className="flex items-start justify-between border-b border-neutral-850 pb-2">
                            <div>
                              <span className="text-xs font-bold text-white">{combo.title}</span>
                              <span className="text-xs font-mono text-red-500 ml-2 font-bold">{combo.price}</span>
                            </div>
                            <button
                              onClick={() => {
                                setLocalState(prev => ({
                                  ...prev,
                                  comboPackages: prev.comboPackages.filter(c => c.id !== combo.id)
                                }));
                              }}
                              className="text-neutral-500 hover:text-red-500 text-xs flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Remove</span>
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                            <div className="space-y-1">
                              <label className="text-[9px] font-mono text-neutral-500 uppercase">Combo Title</label>
                              <input 
                                type="text"
                                value={combo.title}
                                onChange={(e) => {
                                  const list = [...localState.comboPackages];
                                  list[idx].title = e.target.value;
                                  setLocalState(prev => ({ ...prev, comboPackages: list }));
                                }}
                                className="w-full bg-neutral-900 p-2 rounded border border-neutral-800 text-white"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-mono text-neutral-500 uppercase">Bundle Price</label>
                              <input 
                                type="text"
                                value={combo.price}
                                onChange={(e) => {
                                  const list = [...localState.comboPackages];
                                  list[idx].price = e.target.value;
                                  setLocalState(prev => ({ ...prev, comboPackages: list }));
                                }}
                                className="w-full bg-neutral-900 p-2 rounded border border-neutral-800 text-white font-bold"
                              />
                            </div>
                          </div>

                          <div className="space-y-1 text-xs">
                            <label className="text-[9px] font-mono text-neutral-500 uppercase block">Combo Inclusions (one line per inclusion item)</label>
                            <textarea 
                              rows={3}
                              value={combo.inclusions.join('\n')}
                              onChange={(e) => {
                                const list = [...localState.comboPackages];
                                list[idx].inclusions = e.target.value.split('\n');
                                setLocalState(prev => ({ ...prev, comboPackages: list }));
                              }}
                              className="w-full bg-neutral-900 p-2 rounded border border-neutral-800 text-white font-mono"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add Combo package form */}
                    <div className="p-4 bg-neutral-950 border border-neutral-850 rounded-xl space-y-4">
                      <h5 className="font-display font-semibold text-[11px] uppercase text-neutral-400">CREATE NEW BUNDLED COMBO</h5>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-mono text-neutral-400 uppercase">Combo Package Title</label>
                          <input 
                            type="text"
                            value={newCombo.title}
                            onChange={(e) => setNewCombo(prev => ({ ...prev, title: e.target.value }))}
                            className="w-full h-10 px-3 bg-neutral-900 border border-neutral-800 text-xs text-white rounded-lg"
                            placeholder="E.g. GOLD DROP COMBO"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-mono text-neutral-400 uppercase">Bundle Price</label>
                          <input 
                            type="text"
                            value={newCombo.price}
                            onChange={(e) => setNewCombo(prev => ({ ...prev, price: e.target.value }))}
                            className="w-full h-10 px-3 bg-neutral-900 border border-neutral-800 text-xs text-white rounded-lg"
                            placeholder="E.g. $99"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-mono text-neutral-400 uppercase">Package Cover Image URL</label>
                          <input 
                            type="text"
                            value={newCombo.imageUrl}
                            onChange={(e) => setNewCombo(prev => ({ ...prev, imageUrl: e.target.value }))}
                            className="w-full h-10 px-3 bg-neutral-900 border border-neutral-800 text-xs text-white rounded-lg"
                            placeholder="https://images.unsplash..."
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-mono text-neutral-400 uppercase">Inclusions (Paste multiple lines)</label>
                        <textarea 
                          rows={3}
                          placeholder="Line 1: 3 Custom voice tags&#10;Line 2: 2 Custom cover arts&#10;Line 3: Priority delivery"
                          onChange={(e) => setNewCombo(prev => ({ ...prev, inclusions: e.target.value.split('\n') }))}
                          className="w-full p-3 bg-neutral-900 border border-neutral-800 text-xs text-white rounded-lg font-mono"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (!newCombo.title || !newCombo.price) return;
                          const combo: ComboPackage = {
                            id: `pkg-${Date.now()}`,
                            title: newCombo.title,
                            price: newCombo.price,
                            inclusions: newCombo.inclusions || [],
                            imageUrl: newCombo.imageUrl || 'https://images.unsplash.com/photo-1516873240891-4bf014598ab4?auto=format&fit=crop&q=80&w=600',
                            buttonLink: '#contact'
                          };
                          setLocalState(prev => ({ ...prev, comboPackages: [...prev.comboPackages, combo] }));
                          setNewCombo({ title: '', price: '', inclusions: [''], imageUrl: '', buttonLink: '' });
                        }}
                        className="px-4 h-10 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-lg uppercase tracking-wider cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        Create Bundle Package
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 7: PORTFOLIO & GALLERY */}
              {activeTab === 'portfolio' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold font-display uppercase tracking-wide text-white">PORTFOLIO VIDEOS & GALLERY</h3>
                    <p className="text-xs text-neutral-400">Automatically retrieve YouTube video metrics, play within the site without download options, and handle custom images.</p>
                  </div>

                  {/* YouTube Auto-Fetch Portfolio */}
                  <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-xl space-y-4">
                    <h4 className="font-display font-bold text-xs uppercase tracking-wide text-white border-b border-neutral-800 pb-3">1. YouTube Portfolio (Oembed Auto-Fetch)</h4>
                    
                    <div className="bg-neutral-950 p-4 border border-neutral-850 rounded-xl space-y-3">
                      <label className="block text-[10px] font-mono text-neutral-400 uppercase">Paste Any YouTube Watch Video Link</label>
                      <div className="flex gap-3">
                        <div className="relative flex-grow">
                          <input 
                            type="text"
                            value={newYoutubeUrl}
                            onChange={(e) => setNewYoutubeUrl(e.target.value)}
                            className="w-full h-11 px-3 bg-neutral-900 border border-neutral-800 text-xs text-white rounded-lg focus:outline-none focus:border-red-500"
                            placeholder="E.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleFetchYoutube}
                          disabled={isFetchingYoutube || !newYoutubeUrl}
                          className="h-11 px-5 bg-red-600 hover:bg-red-500 disabled:bg-neutral-800 text-white font-bold text-xs rounded-lg uppercase tracking-wider cursor-pointer shrink-0 flex items-center gap-1.5"
                        >
                          {isFetchingYoutube ? <RefreshCw className="w-4.5 h-4.5 animate-spin" /> : <Plus className="w-4.5 h-4.5" />}
                          {isFetchingYoutube ? 'Fetching...' : 'FETCH & ADD'}
                        </button>
                      </div>
                      <p className="text-[10px] text-neutral-500 font-mono">Server will query YouTube APIs directly to grab HD Thumbnails, Channel names, Duration, and video Title instantly!</p>
                    </div>

                    {/* Show portfolio checklist */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {localState.portfolio.map((vid) => (
                        <div key={vid.id} className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg flex gap-3 relative group">
                          <img src={vid.thumbnailUrl} alt="Thumbnail" className="w-20 h-14 object-cover rounded border border-neutral-800 shrink-0" />
                          <div className="min-w-0 flex-grow text-xs">
                            <span className="font-bold text-white block truncate">{vid.title}</span>
                            <span className="text-[10px] text-neutral-400 block truncate">{vid.channelName} • {vid.duration}</span>
                            <span className="text-[9px] text-neutral-500 font-mono block">{vid.publishDate}</span>
                          </div>
                          <button
                            onClick={() => {
                              setLocalState(prev => ({
                                ...prev,
                                portfolio: prev.portfolio.filter(p => p.id !== vid.id)
                              }));
                            }}
                            className="absolute top-2 right-2 p-1 bg-red-950/60 text-red-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Gallery Items */}
                  <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-xl space-y-4">
                    <h4 className="font-display font-bold text-xs uppercase tracking-wide text-white border-b border-neutral-800 pb-3">2. Showcase Gallery Assets</h4>
                    
                    {/* List gallery */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {localState.gallery.map(item => (
                        <div key={item.id} className="relative group rounded-lg overflow-hidden border border-neutral-800 aspect-video bg-neutral-950">
                          {item.type === 'image' ? (
                            <img src={item.url} alt="Gallery" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs font-mono text-neutral-400 bg-red-950/10">
                              <span>YouTube/Video</span>
                            </div>
                          )}
                          <button
                            onClick={() => {
                              setLocalState(prev => ({
                                ...prev,
                                gallery: prev.gallery.filter(g => g.id !== item.id)
                              }));
                            }}
                            className="absolute top-2 right-2 p-1.5 bg-neutral-950/80 hover:bg-red-600 hover:text-white text-neutral-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add Gallery Form */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                      <select
                        value={newGallery.type}
                        onChange={(e) => setNewGallery(prev => ({ ...prev, type: e.target.value as any }))}
                        className="bg-neutral-950 border border-neutral-800 rounded p-2 text-xs text-white"
                      >
                        <option value="image">Static Image URL</option>
                        <option value="youtube">Embedded YouTube Video URL</option>
                      </select>
                      <input 
                        type="text"
                        value={newGallery.url}
                        onChange={(e) => setNewGallery(prev => ({ ...prev, url: e.target.value }))}
                        className="bg-neutral-950 border border-neutral-800 rounded p-2 text-xs text-white flex-grow"
                        placeholder="Image URL or YouTube Video Link"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!newGallery.url) return;
                          const item: GalleryItem = {
                            id: `gal-${Date.now()}`,
                            type: newGallery.type || 'image',
                            url: newGallery.url,
                          };
                          setLocalState(prev => ({ ...prev, gallery: [...prev.gallery, item] }));
                          setNewGallery({ type: 'image', url: '' });
                        }}
                        className="h-10 px-4 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg cursor-pointer"
                      >
                        Add to Gallery
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 8: CONTACTS & PAYMENTS */}
              {activeTab === 'contacts-payments' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold font-display uppercase tracking-wide text-white">CONTACTS, SOCIALS & QR PAYMENTS</h3>
                    <p className="text-xs text-neutral-400">Configure phone lines, location, UPI links, PhonePe/GPay QR codes, and active social profiles.</p>
                  </div>

                  {/* Contact section */}
                  <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-xl space-y-4">
                    <h4 className="font-display font-bold text-xs uppercase tracking-wide text-white border-b border-neutral-800 pb-3">Contact Information Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-mono text-neutral-400 uppercase">Support Phone line</label>
                        <input 
                          type="text"
                          value={localState.contact.phone}
                          onChange={(e) => setLocalState(prev => ({
                            ...prev,
                            contact: { ...prev.contact, phone: e.target.value }
                          }))}
                          className="w-full h-11 px-3 bg-neutral-950 border border-neutral-800 text-xs text-white rounded-lg"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-mono text-neutral-400 uppercase">Support Email address</label>
                        <input 
                          type="email"
                          value={localState.contact.email}
                          onChange={(e) => setLocalState(prev => ({
                            ...prev,
                            contact: { ...prev.contact, email: e.target.value }
                          }))}
                          className="w-full h-11 px-3 bg-neutral-950 border border-neutral-800 text-xs text-white rounded-lg"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-mono text-neutral-400 uppercase">Physical Studio Location Address</label>
                        <input 
                          type="text"
                          value={localState.contact.address}
                          onChange={(e) => setLocalState(prev => ({
                            ...prev,
                            contact: { ...prev.contact, address: e.target.value }
                          }))}
                          className="w-full h-11 px-3 bg-neutral-950 border border-neutral-800 text-xs text-white rounded-lg"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-mono text-neutral-400 uppercase">Google Maps Embed Embed Link</label>
                        <input 
                          type="text"
                          value={localState.contact.googleMapsLink}
                          onChange={(e) => setLocalState(prev => ({
                            ...prev,
                            contact: { ...prev.contact, googleMapsLink: e.target.value }
                          }))}
                          className="w-full h-11 px-3 bg-neutral-950 border border-neutral-800 text-xs text-white rounded-lg"
                        />
                      </div>
                    </div>
                  </div>

                  {/* QR Payments section */}
                  <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-xl space-y-4">
                    <h4 className="font-display font-bold text-xs uppercase tracking-wide text-white border-b border-neutral-800 pb-3">Secure QR Payments & UPI IDs</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-mono text-neutral-400 uppercase">PhonePe QR Code image URL</label>
                        <input 
                          type="text"
                          value={localState.payment.phonePeQrUrl}
                          onChange={(e) => setLocalState(prev => ({
                            ...prev,
                            payment: { ...prev.payment, phonePeQrUrl: e.target.value }
                          }))}
                          className="w-full h-11 px-3 bg-neutral-950 border border-neutral-800 text-xs text-white rounded-lg"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-mono text-neutral-400 uppercase">Google Pay QR Code image URL</label>
                        <input 
                          type="text"
                          value={localState.payment.googlePayQrUrl}
                          onChange={(e) => setLocalState(prev => ({
                            ...prev,
                            payment: { ...prev.payment, googlePayQrUrl: e.target.value }
                          }))}
                          className="w-full h-11 px-3 bg-neutral-950 border border-neutral-800 text-xs text-white rounded-lg"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-mono text-neutral-400 uppercase">Paytm QR Code image URL</label>
                        <input 
                          type="text"
                          value={localState.payment.paytmQrUrl}
                          onChange={(e) => setLocalState(prev => ({
                            ...prev,
                            payment: { ...prev.payment, paytmQrUrl: e.target.value }
                          }))}
                          className="w-full h-11 px-3 bg-neutral-950 border border-neutral-800 text-xs text-white rounded-lg"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-mono text-neutral-400 uppercase">UPI QR Code image URL</label>
                        <input 
                          type="text"
                          value={localState.payment.upiQrUrl}
                          onChange={(e) => setLocalState(prev => ({
                            ...prev,
                            payment: { ...prev.payment, upiQrUrl: e.target.value }
                          }))}
                          className="w-full h-11 px-3 bg-neutral-950 border border-neutral-800 text-xs text-white rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 mt-4">
                      <label className="block text-[10px] font-mono text-neutral-400 uppercase">Direct Merchant UPI ID</label>
                      <input 
                        type="text"
                        value={localState.payment.upiId}
                        onChange={(e) => setLocalState(prev => ({
                          ...prev,
                          payment: { ...prev.payment, upiId: e.target.value }
                        }))}
                        className="w-full h-11 px-3 bg-neutral-950 border border-neutral-800 text-xs text-white rounded-lg font-bold"
                      />
                    </div>
                  </div>

                  {/* Social Profiles */}
                  <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-xl space-y-4">
                    <h4 className="font-display font-bold text-xs uppercase tracking-wide text-white border-b border-neutral-800 pb-3">Follow Us Social Profiles</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-mono text-neutral-400 uppercase">Instagram Profile link</label>
                        <input 
                          type="text"
                          value={localState.socials.instagram}
                          onChange={(e) => setLocalState(prev => ({
                            ...prev,
                            socials: { ...prev.socials, instagram: e.target.value }
                          }))}
                          className="w-full h-11 px-3 bg-neutral-950 border border-neutral-800 text-xs text-white rounded-lg"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-mono text-neutral-400 uppercase">YouTube Channel link</label>
                        <input 
                          type="text"
                          value={localState.socials.youtube}
                          onChange={(e) => setLocalState(prev => ({
                            ...prev,
                            socials: { ...prev.socials, youtube: e.target.value }
                          }))}
                          className="w-full h-11 px-3 bg-neutral-950 border border-neutral-800 text-xs text-white rounded-lg"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-mono text-neutral-400 uppercase">Facebook Page link</label>
                        <input 
                          type="text"
                          value={localState.socials.facebook}
                          onChange={(e) => setLocalState(prev => ({
                            ...prev,
                            socials: { ...prev.socials, facebook: e.target.value }
                          }))}
                          className="w-full h-11 px-3 bg-neutral-950 border border-neutral-800 text-xs text-white rounded-lg"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-mono text-neutral-400 uppercase">X (Twitter) profile link</label>
                        <input 
                          type="text"
                          value={localState.socials.x}
                          onChange={(e) => setLocalState(prev => ({
                            ...prev,
                            socials: { ...prev.socials, x: e.target.value }
                          }))}
                          className="w-full h-11 px-3 bg-neutral-950 border border-neutral-800 text-xs text-white rounded-lg"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-mono text-neutral-400 uppercase">WhatsApp Chat Link</label>
                        <input 
                          type="text"
                          value={localState.socials.whatsapp}
                          onChange={(e) => setLocalState(prev => ({
                            ...prev,
                            socials: { ...prev.socials, whatsapp: e.target.value }
                          }))}
                          className="w-full h-11 px-3 bg-neutral-950 border border-neutral-800 text-xs text-white rounded-lg"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-mono text-neutral-400 uppercase">Telegram Channel Link</label>
                        <input 
                          type="text"
                          value={localState.socials.telegram}
                          onChange={(e) => setLocalState(prev => ({
                            ...prev,
                            socials: { ...prev.socials, telegram: e.target.value }
                          }))}
                          className="w-full h-11 px-3 bg-neutral-950 border border-neutral-800 text-xs text-white rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 9: FAQ & POLICIES */}
              {activeTab === 'faq-policies' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold font-display uppercase tracking-wide text-white">FAQS & POLICIES</h3>
                    <p className="text-xs text-neutral-400">Manage client question FAQs and edit Privacy Policy and Terms and Conditions HTML panels directly.</p>
                  </div>

                  {/* FAQ Items */}
                  <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-xl space-y-4">
                    <h4 className="font-display font-bold text-xs uppercase tracking-wide text-white border-b border-neutral-800 pb-3">1. Frequently Asked Questions (FAQ)</h4>
                    
                    <div className="space-y-3">
                      {localState.faq.map((item, idx) => (
                        <div key={item.id} className="p-4 bg-neutral-950 border border-neutral-800 rounded-lg space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white">Question #{idx + 1}</span>
                            <button
                              onClick={() => {
                                setLocalState(prev => ({
                                  ...prev,
                                  faq: prev.faq.filter(f => f.id !== item.id)
                                }));
                              }}
                              className="text-neutral-500 hover:text-red-500 text-xs flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Remove</span>
                            </button>
                          </div>
                          
                          <input 
                            type="text"
                            value={item.question}
                            onChange={(e) => {
                              const list = [...localState.faq];
                              list[idx].question = e.target.value;
                              setLocalState(prev => ({ ...prev, faq: list }));
                            }}
                            className="w-full bg-neutral-900 p-2 text-xs rounded text-white border border-neutral-800"
                            placeholder="Question"
                          />
                          <textarea 
                            rows={2}
                            value={item.answer}
                            onChange={(e) => {
                              const list = [...localState.faq];
                              list[idx].answer = e.target.value;
                              setLocalState(prev => ({ ...prev, faq: list }));
                            }}
                            className="w-full bg-neutral-900 p-2 text-xs rounded text-white border border-neutral-800"
                            placeholder="Answer"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Add FAQ form */}
                    <div className="p-4 bg-neutral-950 border border-neutral-850 rounded-xl space-y-3">
                      <h5 className="text-[10px] font-mono text-neutral-400 uppercase">CREATE NEW FAQ</h5>
                      <input 
                        type="text"
                        value={newFaq.question}
                        onChange={(e) => setNewFaq(prev => ({ ...prev, question: e.target.value }))}
                        className="w-full bg-neutral-900 border border-neutral-800 text-xs text-white rounded p-2.5"
                        placeholder="Type Question..."
                      />
                      <textarea 
                        rows={2}
                        value={newFaq.answer}
                        onChange={(e) => setNewFaq(prev => ({ ...prev, answer: e.target.value }))}
                        className="w-full bg-neutral-900 border border-neutral-800 text-xs text-white rounded p-2.5"
                        placeholder="Type Answer details..."
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!newFaq.question || !newFaq.answer) return;
                          const item: FaqItem = {
                            id: `faq-${Date.now()}`,
                            question: newFaq.question,
                            answer: newFaq.answer,
                          };
                          setLocalState(prev => ({ ...prev, faq: [...prev.faq, item] }));
                          setNewFaq({ question: '', answer: '' });
                        }}
                        className="px-4 h-9 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-xs uppercase tracking-wider font-semibold cursor-pointer"
                      >
                        Add FAQ
                      </button>
                    </div>
                  </div>

                  {/* Policies Section */}
                  <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-xl space-y-4">
                    <h4 className="font-display font-bold text-xs uppercase tracking-wide text-white border-b border-neutral-800 pb-3">2. Legal Policies & Statements</h4>
                    
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-mono text-neutral-400 uppercase">Privacy Policy (HTML/Text allowed)</label>
                        <textarea 
                          rows={6}
                          value={localState.policies.privacyPolicy}
                          onChange={(e) => setLocalState(prev => ({
                            ...prev,
                            policies: { ...prev.policies, privacyPolicy: e.target.value }
                          }))}
                          className="w-full p-3 bg-neutral-950 border border-neutral-800 text-xs text-white font-mono rounded-lg focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-mono text-neutral-400 uppercase">Terms & Conditions (HTML/Text allowed)</label>
                        <textarea 
                          rows={6}
                          value={localState.policies.termsConditions}
                          onChange={(e) => setLocalState(prev => ({
                            ...prev,
                            policies: { ...prev.policies, termsConditions: e.target.value }
                          }))}
                          className="w-full p-3 bg-neutral-950 border border-neutral-800 text-xs text-white font-mono rounded-lg focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
