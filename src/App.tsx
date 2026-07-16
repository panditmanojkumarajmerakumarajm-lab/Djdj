import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sun, Moon, Search, Volume2, Zap, HeartHandshake, TrendingUp, Play, Check, 
  Copy, MessageCircle, Instagram, Youtube, Facebook, Twitter, Send, ArrowRight, 
  ChevronDown, ChevronUp, Shield, FileText, Phone, Mail, MapPin, Sparkles, 
  Clock, Music, Menu, X, ArrowUpRight, HelpCircle, AlertCircle, Info, Lock, CheckSquare
} from 'lucide-react';
import { AppState, ServiceItem, PortfolioVideo } from './types';
import AdminPanel from './components/AdminPanel';
import YouTubePlayer from './components/YouTubePlayer';

export default function App() {
  const [state, setState] = useState<AppState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Theme & Menu states
  const [darkMode, setDarkMode] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Authentication persistence (Bypassed so anyone can open/access directly)
  const [adminToken, setAdminToken] = useState<string | null>('DEVELOPMENT_TOKEN_BACKDOOR');
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Public interaction states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeFaq, setActiveFaq] = useState<string | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [activeVideo, setActiveVideo] = useState<PortfolioVideo | null>(null);

  // Legal Modal states
  const [policyType, setPolicyType] = useState<'privacy' | 'terms' | null>(null);

  // Load app state from server-side JSON store
  useEffect(() => {
    const fetchState = async () => {
      try {
        const hasVisited = sessionStorage.getItem('dj_beat_house_visited');
        let url = '/api/state';
        if (!hasVisited) {
          url += '?visitor=true';
          sessionStorage.setItem('dj_beat_house_visited', 'true');
        }
        
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to load website configuration.');
        const data = await res.json();
        setState(data);
      } catch (err: any) {
        setError(err?.message || 'Error connecting to database.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchState();
  }, []);

  // Save new website state triggered from Admin Panel
  const handleSaveState = async (newState: AppState): Promise<boolean> => {
    if (!adminToken) return false;
    try {
      const res = await fetch('/api/state', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify(newState)
      });
      if (res.ok) {
        setState(newState);
        return true;
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save settings.');
        return false;
      }
    } catch (err) {
      alert('Network error saving website configuration.');
      return false;
    }
  };

  // Login handler
  const handleLogin = (token: string, adminInfo: { email: string; name: string }) => {
    setAdminToken(token);
    localStorage.setItem('dj_admin_token', token);
  };

  const handleLogout = () => {
    setAdminToken('DEVELOPMENT_TOKEN_BACKDOOR');
  };

  // Copy UPI ID helper
  const handleCopyUpi = (upiId: string) => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-white">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
          className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full mb-4"
        ></motion.div>
        <span className="font-mono text-xs uppercase tracking-widest text-neutral-400">LOADING DJ BEAT HOUSE...</span>
      </div>
    );
  }

  if (error || !state) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-white p-4">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h1 className="font-display font-bold text-xl mb-1">SYSTEM OUTAGE</h1>
        <p className="text-xs text-neutral-400 mb-6 text-center max-w-sm">{error || 'Database configurations are missing.'}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-5 py-2 bg-red-600 hover:bg-red-500 text-xs font-mono font-bold tracking-wider uppercase rounded-lg transition-colors cursor-pointer"
        >
          RETRY CONNECTION
        </button>
      </div>
    );
  }

  // Filter and search services lists
  const filteredServices = state.services.filter(svc => {
    if (!svc.isPublished) return false;
    const matchesCategory = selectedCategory === 'all' || svc.categoryId === selectedCategory;
    const matchesSearch = svc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          svc.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredServices = state.services.filter(svc => svc.isPublished && svc.isFeatured);

  // Dynamic Icon selector for Why Choose Us
  const renderWcuIcon = (iconName: string) => {
    switch (iconName) {
      case 'Volume2': return <Volume2 className="w-6 h-6 text-red-500" />;
      case 'Zap': return <Zap className="w-6 h-6 text-red-500" />;
      case 'HeartHandshake': return <HeartHandshake className="w-6 h-6 text-red-500" />;
      case 'TrendingUp': return <TrendingUp className="w-6 h-6 text-red-500" />;
      default: return <Volume2 className="w-6 h-6 text-red-500" />;
    }
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${darkMode ? 'bg-neutral-950 text-neutral-100' : 'bg-stone-50 text-neutral-900'}`}>
      
      {/* 1. EDITABLE TICKER ANNOUNCEMENT BAR */}
      {state.announcement.isActive && (
        <div className="bg-red-600 text-white h-9 text-xs font-mono font-bold uppercase overflow-hidden flex items-center relative z-40 shadow-md">
          <div className="animate-marquee whitespace-nowrap flex gap-12">
            <span>{state.announcement.text}</span>
            <span>{state.announcement.text}</span>
            <span>{state.announcement.text}</span>
          </div>
        </div>
      )}

      {/* 2. STICKY NAVBAR HEADER */}
      <header className={`sticky top-0 z-30 h-16 backdrop-blur-md border-b transition-colors ${darkMode ? 'bg-neutral-950/80 border-neutral-900' : 'bg-white/80 border-stone-200'}`}>
        <div className="max-w-7xl mx-auto h-full px-4 md:px-6 flex items-center justify-between">
          
          {/* Logo Brand */}
          <a href="#home" className="flex items-center gap-2.5">
            <img 
              src={state.config.logoUrl || 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&q=80&w=150'} 
              alt="DJ Beat House Logo" 
              className="w-8 h-8 rounded-lg object-cover border border-red-500/20"
            />
            <div>
              <span className="font-display font-bold text-sm tracking-widest text-white block">
                DJ BEAT HOUSE
              </span>
              <span className="text-[9px] font-mono text-red-500 uppercase tracking-widest block -mt-1 font-bold">
                Heavy Bass Node
              </span>
            </div>
          </a>

          {/* Desktop Navigation Link Cluster */}
          <nav className="hidden lg:flex items-center gap-6 text-[11px] font-mono uppercase tracking-wider">
            <a href="#services" className="hover:text-red-500 transition-colors">Services</a>
            <a href="#combos" className="hover:text-red-500 transition-colors">Combo Packages</a>
            <a href="#portfolio" className="hover:text-red-500 transition-colors">Portfolio</a>
            <a href="#youtube-tips" className="hover:text-red-500 transition-colors">YouTube Growth</a>
            <a href="#faq" className="hover:text-red-500 transition-colors">FAQs</a>
            <a href="#contact" className="hover:text-red-500 transition-colors">Contact</a>
          </nav>

          {/* Actions: Theme Toggle, Mobile Menu Trigger */}
          <div className="flex items-center gap-3">
            
            {/* Theme Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg border transition-colors cursor-pointer ${darkMode ? 'border-neutral-800 hover:bg-neutral-950 text-yellow-400' : 'border-stone-200 hover:bg-stone-100 text-stone-600'}`}
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Mobile menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 bg-neutral-900/60 hover:bg-neutral-950 border border-neutral-800 text-white rounded-lg transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`lg:hidden fixed top-16 inset-x-0 z-20 border-b p-6 shadow-2xl space-y-4 font-mono text-xs uppercase ${darkMode ? 'bg-neutral-950 border-neutral-900 text-white' : 'bg-white border-stone-200 text-stone-900'}`}
          >
            <a href="#services" onClick={() => setMobileMenuOpen(false)} className="block hover:text-red-500 py-1 transition-colors">Services</a>
            <a href="#combos" onClick={() => setMobileMenuOpen(false)} className="block hover:text-red-500 py-1 transition-colors">Combo Packages</a>
            <a href="#portfolio" onClick={() => setMobileMenuOpen(false)} className="block hover:text-red-500 py-1 transition-colors">Portfolio</a>
            <a href="#youtube-tips" onClick={() => setMobileMenuOpen(false)} className="block hover:text-red-500 py-1 transition-colors">YouTube Growth</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="block hover:text-red-500 py-1 transition-colors">FAQs</a>
            <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="block hover:text-red-500 py-1 transition-colors">Contact</a>

          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. HOME - SLIM COMPACT BANNER */}
      <section id="home" className="max-w-7xl mx-auto px-4 md:px-6 pt-6">
        <div className="relative h-44 sm:h-56 md:h-64 rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-850 shadow-2xl flex items-center group">
          {/* Banner image backing with deep overlays */}
          <div className="absolute inset-0 z-0">
            <img 
              src={state.home.bannerUrl} 
              alt="DJ Beat House Banner" 
              className="w-full h-full object-cover opacity-60 group-hover:opacity-70 transition-opacity duration-500"
            />
            <div className="absolute inset-0 bg-radial-gradient from-transparent via-neutral-950/80 to-neutral-950 z-0"></div>
            {/* Dynamic red glow ball */}
            <div className="absolute right-10 top-1/2 -translate-y-1/2 w-64 h-64 bg-red-600/10 rounded-full blur-3xl animate-pulse-slow"></div>
          </div>

          <div className="relative z-10 p-6 sm:p-10 md:p-12 w-full flex flex-col justify-end h-full">
            <div className="space-y-2 max-w-2xl">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-red-600/90 text-white text-[9px] font-mono uppercase tracking-widest rounded-full font-bold">
                <Sparkles className="w-3 h-3" />
                OFFICIAL DJ NODE
              </span>
              <h1 className="font-display font-black text-2xl sm:text-3xl md:text-4xl tracking-tight leading-tight text-white uppercase drop-shadow-md">
                {state.home.title || 'DJ BEAT HOUSE'}
              </h1>
              {state.home.subtitle && (
                <p className="text-xs text-neutral-300 font-sans max-w-xl line-clamp-2">
                  {state.home.subtitle}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 4. DYNAMIC SERVICES DIRECTORY WITH CATEGORY FILTER (PLACED AT THE TOP) */}
      <section id="services" className="py-12 max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div className="space-y-2">
            <span className="text-[10px] font-mono font-bold text-red-500 uppercase tracking-widest block">OFFICIAL STORE</span>
            <h2 className="font-display font-black text-2xl text-white tracking-tight uppercase">PRODUCTION & GRAPHICS SERVICES</h2>
            <p className="text-xs text-neutral-400">Order customized vocal files, remixes, beat stems, or high-CTR artworks.</p>
          </div>

          {/* Search bar helper */}
          <div className="relative w-full md:max-w-xs">
            <span className="absolute inset-y-0 left-3 flex items-center text-neutral-500">
              <Search className="w-4 h-4" />
            </span>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search DJ tags, mixes, etc..."
              className="w-full h-11 pl-9 pr-4 bg-neutral-900 border border-neutral-800 text-xs text-white rounded-xl placeholder-neutral-500 focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>
        </div>

        {/* Categories Pills Filters */}
        <div className="flex flex-wrap gap-2 mb-8 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 h-9 rounded-full text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer ${
              selectedCategory === 'all' 
                ? 'bg-red-600 text-white' 
                : 'bg-neutral-900/60 text-neutral-400 hover:text-white border border-neutral-850'
            }`}
          >
            All Services
          </button>
          {state.categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 h-9 rounded-full text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                selectedCategory === cat.id 
                  ? 'bg-red-600 text-white' 
                  : 'bg-neutral-900/60 text-neutral-400 hover:text-white border border-neutral-850'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Services Showcase Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredServices.length === 0 ? (
            <div className="col-span-full py-16 text-center">
              <Info className="w-8 h-8 text-neutral-600 mx-auto mb-3" />
              <p className="text-xs text-neutral-500 font-mono uppercase">No services match your active search terms or category.</p>
            </div>
          ) : (
            filteredServices.map(svc => {
              const categoryName = state.categories.find(c => c.id === svc.categoryId)?.name || 'Audio Assets';
              return (
                <div 
                  key={svc.id}
                  className="bg-neutral-900/40 border border-neutral-850 rounded-2xl overflow-hidden shadow-lg hover:border-red-500/20 red-glow-hover flex flex-col h-full group"
                >
                  <div className="aspect-[16/10] w-full bg-neutral-950 overflow-hidden relative">
                    <img 
                      src={svc.imageUrl} 
                      alt={svc.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    {/* Category overlay label */}
                    <span className="absolute top-3 left-3 px-2 py-0.5 bg-neutral-950/80 backdrop-blur-md text-[9px] font-mono font-bold text-red-400 uppercase tracking-widest rounded-full border border-red-500/20">
                      {categoryName}
                    </span>
                    {/* Featured badge */}
                    {svc.isFeatured && (
                      <span className="absolute top-3 right-3 px-2 py-0.5 bg-red-600 text-[9px] font-mono font-bold text-white uppercase tracking-widest rounded-full flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        FEATURED
                      </span>
                    )}
                  </div>

                  <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h3 className="font-display font-black text-sm text-white tracking-wide uppercase leading-snug group-hover:text-red-500 transition-colors">
                        {svc.title}
                      </h3>
                      <p className="text-xs text-neutral-400 leading-relaxed line-clamp-3">
                        {svc.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-neutral-850/50 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] font-mono text-neutral-500 uppercase block">INVESTMENT</span>
                        <span className="text-lg font-mono font-bold text-red-500">{svc.price}</span>
                      </div>

                      <a
                        href="#contact"
                        className="px-4 h-9 bg-neutral-950 hover:bg-red-600 border border-neutral-800 hover:border-red-500 text-neutral-300 hover:text-white font-bold text-[10px] uppercase tracking-wider rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <span>BOOK SERVICE</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* AUTO-SCROLL HORIZONTAL TICKER BANNER */}
      <div className="bg-neutral-950 border-y border-neutral-900 py-3 overflow-hidden">
        <div className="animate-marquee whitespace-nowrap flex gap-12 text-[10px] font-mono tracking-widest text-neutral-500 uppercase">
          {['DJ Voice Tags', 'Vocal Drops', 'Stereo Mixing', 'Club Bootlegs', 'Sample Loops', 'High-CTR Thumbnails', 'YouTube Growth Resources', 'HQ WAV & MP3 Master'].map((tag, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
              <span>{tag}</span>
            </div>
          ))}
          {['DJ Voice Tags', 'Vocal Drops', 'Stereo Mixing', 'Club Bootlegs', 'Sample Loops', 'High-CTR Thumbnails', 'YouTube Growth Resources', 'HQ WAV & MP3 Master'].map((tag, idx) => (
            <div key={idx + 10} className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
              <span>{tag}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 5. ABOUT US SECTION */}
      <section className="py-20 max-w-7xl mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* About graphic with red accent glow */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-tr from-red-600/20 to-transparent rounded-2xl blur-2xl group-hover:blur-3xl transition-all duration-500"></div>
            <img 
              src={state.about.imageUrl} 
              alt="DJ Decks Legacy" 
              className="w-full aspect-[4/3] object-cover rounded-2xl border border-neutral-800/80 shadow-2xl relative z-10"
              loading="lazy"
            />
            {/* Visual aesthetic element */}
            <div className="absolute bottom-4 left-4 bg-neutral-950/90 backdrop-blur-md border border-red-500/30 px-4 py-2.5 rounded-xl z-20 font-mono text-[10px] tracking-widest text-red-500 font-bold">
              EST. 2019 • STUDIO MASTER
            </div>
          </div>

          {/* About bios */}
          <div className="space-y-6">
            <span className="text-[10px] font-mono font-bold text-red-500 uppercase tracking-widest block">ABOUT THE DJ BEAT HOUSE</span>
            <h2 className="font-display font-black text-3xl md:text-4xl text-white tracking-tight">
              {state.about.title}
            </h2>
            <p className="text-neutral-300 text-sm md:text-base leading-relaxed">
              {state.about.description}
            </p>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-900">
              <div>
                <span className="text-xl font-display font-bold text-white block">24-HOUR</span>
                <span className="text-[10px] font-mono text-neutral-500 uppercase">Express Audio Turnaround</span>
              </div>
              <div>
                <span className="text-xl font-display font-bold text-white block">1,000+</span>
                <span className="text-[10px] font-mono text-neutral-500 uppercase">Producers Supported</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. WHY CHOOSE US SECTION */}
      <section className={`py-20 border-t ${darkMode ? 'bg-neutral-950/50 border-neutral-900' : 'bg-neutral-100/50 border-stone-200'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-[10px] font-mono font-bold text-red-500 uppercase tracking-widest block">CREATOR ADVANTAGE</span>
            <h2 className="font-display font-black text-3xl text-white tracking-tight uppercase">WHY PRODUCERS CHOOSE US</h2>
            <p className="text-xs text-neutral-400">We engineered the ultimate high-speed studio model optimized for digital music creators.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {state.whyChooseUs.map((point) => (
              <div 
                key={point.id}
                className="p-6 bg-neutral-900/40 backdrop-blur-md border border-neutral-850 rounded-2xl space-y-4 hover:border-red-500/20 hover:shadow-xl hover:shadow-red-950/10 transition-all duration-300 group"
              >
                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 w-fit group-hover:border-red-500/30 group-hover:scale-110 transition-all duration-300">
                  {renderWcuIcon(point.iconName)}
                </div>
                <h3 className="font-display font-bold text-sm text-white uppercase tracking-wide">
                  {point.title}
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  {point.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. STANDALONE PRICE SHEET */}
      <section className={`py-20 border-y ${darkMode ? 'bg-neutral-950/50 border-neutral-900' : 'bg-neutral-100/50 border-stone-200'}`}>
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <span className="text-[10px] font-mono font-bold text-red-500 uppercase tracking-widest block">FULL PRICE SHEET</span>
            <h2 className="font-display font-black text-3xl text-white tracking-tight uppercase">ADDITIONAL PRICE DIRECTORY</h2>
            <p className="text-xs text-neutral-400">Quick-view directory of stand-alone mastering and short recording jobs.</p>
          </div>

          <div className="bg-neutral-900/60 backdrop-blur-md border border-neutral-850 rounded-2xl overflow-hidden">
            <div className="divide-y divide-neutral-850">
              {state.priceList.map((item) => (
                <div key={item.id} className="p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-neutral-950/40 transition-colors">
                  <div>
                    <h3 className="font-display font-bold text-xs text-white uppercase tracking-wide">{item.title}</h3>
                    <p className="text-[10px] text-neutral-400 font-mono">{item.subtitle}</p>
                  </div>
                  <div className="text-sm font-mono font-bold text-red-500 sm:text-right shrink-0">
                    {item.price}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 8. COMBO PACKAGES */}
      <section id="combos" className="py-20 max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-[10px] font-mono font-bold text-red-500 uppercase tracking-widest block">BUNDLE SAVINGS</span>
          <h2 className="font-display font-black text-3xl text-white tracking-tight uppercase">STUDIO COMBO PACKAGES</h2>
          <p className="text-xs text-neutral-400">High-value bundles combining custom vocals, graphic banners, and stereo masters for ultimate cost savings.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {state.comboPackages.map((pkg) => (
            <div 
              key={pkg.id}
              className="bg-neutral-900/40 border border-neutral-850 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row gap-6 hover:border-red-500/20 transition-all duration-300 relative group"
            >
              {/* Corner badge */}
              <span className="absolute top-4 right-4 bg-red-600 text-white font-mono text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                Value Deal
              </span>

              {/* Package visuals */}
              <div className="w-full md:w-1/3 aspect-square bg-neutral-950 rounded-2xl overflow-hidden border border-neutral-800 shrink-0">
                <img src={pkg.imageUrl} alt={pkg.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>

              {/* Package list */}
              <div className="flex-grow flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-display font-black text-base text-white uppercase tracking-wider">
                      {pkg.title}
                    </h3>
                    <span className="text-2xl font-mono font-bold text-red-500 block mt-1">{pkg.price}</span>
                  </div>

                  <ul className="space-y-2 text-xs text-neutral-300 font-sans">
                    {pkg.inclusions.map((inc, index) => (
                      <li key={index} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        <span>{inc}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <a
                  href="#contact"
                  className="w-full h-11 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-red-950/20"
                >
                  <span>ORDER BUNDLE</span>
                  <ArrowUpRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 9. PORTFOLIO SHOWREEL (AUTOMATED INTERACTIVE) */}
      <section id="portfolio" className={`py-20 border-t ${darkMode ? 'bg-neutral-950/50 border-neutral-900' : 'bg-neutral-100/50 border-stone-200'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-[10px] font-mono font-bold text-red-500 uppercase tracking-widest block">LISTEN THE DRIFT</span>
            <h2 className="font-display font-black text-3xl text-white tracking-tight uppercase">YOUTUBE VIDEO PORTFOLIO</h2>
            <p className="text-xs text-neutral-400">Past custom remixes and brand tags. Watch direct inside the website with our sandboxed non-downloadable node.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {state.portfolio.map((vid) => (
              <div 
                key={vid.id}
                onClick={() => setActiveVideo(vid)}
                className="bg-neutral-900/60 border border-neutral-850 rounded-2xl overflow-hidden group cursor-pointer hover:border-red-500/20 transition-all duration-300"
              >
                {/* Thumbnail backing */}
                <div className="aspect-video w-full bg-neutral-950 relative overflow-hidden">
                  <img src={vid.thumbnailUrl} alt={vid.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  
                  {/* Play trigger overlay */}
                  <div className="absolute inset-0 bg-neutral-950/40 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                    <div className="w-12 h-12 bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-red-950/40 group-hover:scale-110 transition-transform">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>
                  </div>

                  {/* Timestamp overlay */}
                  <span className="absolute bottom-2.5 right-2.5 px-1.5 py-0.5 bg-neutral-950/80 text-[10px] font-mono font-bold text-white rounded">
                    {vid.duration}
                  </span>
                </div>

                <div className="p-5 space-y-2.5">
                  <span className="text-[10px] font-mono text-red-500 uppercase">{vid.channelName}</span>
                  <h3 className="font-display font-bold text-xs text-white uppercase tracking-wider line-clamp-2 leading-relaxed">
                    {vid.title}
                  </h3>
                  <p className="text-[11px] text-neutral-400 line-clamp-1">{vid.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10. YOUTUBE GROWTH TIPS SECTION */}
      <section id="youtube-tips" className="py-20 max-w-5xl mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-[10px] font-mono font-bold text-red-500 uppercase tracking-widest block">CREATOR EDUCATION</span>
          <h2 className="font-display font-black text-3xl text-white tracking-tight uppercase">YOUTUBE GROWTH PLAYBOOK</h2>
          <p className="text-xs text-neutral-400">Proven high-CTR strategies and audio structures to skyrocket your DJ remix channel.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            {
              num: '01',
              title: 'Mastering the First 15 Seconds Hook',
              desc: 'YouTube rewards retention. Start your mixes immediately with a high-impact custom DJ Voice Tag coupled with a snare roll. Never use silent intros or slow builds.'
            },
            {
              num: '02',
              title: 'Designing High-CTR Visual Themes',
              desc: 'Use deep contrasting colors—specifically neon red on charcoal dark background. Human eyes instinctively lock onto high-saturation neon elements in feed grids.'
            },
            {
              num: '03',
              title: 'Optimized Audio Loudness (LUFS)',
              desc: 'Upload at -14 LUFS to match YouTubes native normalization algorithms. This keeps your tracks sounding loud and clear without triggering digital limiting distortion.'
            },
            {
              num: '04',
              title: 'Dynamic Branding Watermarking',
              desc: 'Place custom audio tags every 3 to 4 minutes. It establishes a recognizable auditory brand watermarking and stops third-party audio rippers from hijacking your stems.'
            }
          ].map((tip, index) => (
            <div key={index} className="p-6 bg-neutral-900/40 border border-neutral-850 rounded-2xl flex gap-4">
              <span className="font-display font-black text-3xl text-red-500/30 shrink-0">{tip.num}</span>
              <div className="space-y-2">
                <h3 className="font-display font-bold text-sm text-white uppercase tracking-wide">{tip.title}</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">{tip.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 11. VISUAL GALLERY */}
      <section className={`py-20 border-t ${darkMode ? 'bg-neutral-950/50 border-neutral-900' : 'bg-neutral-100/50 border-stone-200'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-[10px] font-mono font-bold text-red-500 uppercase tracking-widest block">SNAP JOURNAL</span>
            <h2 className="font-display font-black text-3xl text-white tracking-tight uppercase">STUDIO LIFE GALLERY</h2>
            <p className="text-xs text-neutral-400">A visual pass showing active equipment setups, design outputs, and custom visuals.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {state.gallery.map((item) => (
              <div 
                key={item.id}
                className="group relative rounded-2xl overflow-hidden aspect-video border border-neutral-800 bg-neutral-950"
              >
                <img 
                  src={item.url} 
                  alt="Gallery life" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <span className="text-[9px] font-mono font-bold text-red-400 uppercase tracking-widest">DJ Beat House • Live</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 12. FREQUENTLY ASKED QUESTIONS (FAQ) */}
      <section id="faq" className="py-20 max-w-4xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-[10px] font-mono font-bold text-red-500 uppercase tracking-widest block">KNOWLEDGE DESK</span>
          <h2 className="font-display font-black text-3xl text-white tracking-tight uppercase">FAQ / DISCUSSIONS</h2>
          <p className="text-xs text-neutral-400">Everything you need to know about processing custom voice tags, revisions, and royalty licenses.</p>
        </div>

        <div className="space-y-4">
          {state.faq.map((item) => {
            const isOpen = activeFaq === item.id;
            return (
              <div 
                key={item.id}
                className="bg-neutral-900/40 border border-neutral-850 rounded-2xl overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => setActiveFaq(isOpen ? null : item.id)}
                  className="w-full px-6 py-5 flex items-center justify-between gap-4 text-left cursor-pointer"
                >
                  <h3 className="font-display font-bold text-xs md:text-sm text-white uppercase tracking-wide">
                    {item.question}
                  </h3>
                  <ChevronDown className={`w-4 h-4 text-red-500 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className="px-6 pb-6 text-xs text-neutral-400 leading-relaxed border-t border-neutral-850/40 pt-4 font-sans">
                        {item.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* 13. SECURE MERCHANT QR CODES & PAYMENT METHODS */}
      <section className={`py-20 border-t ${darkMode ? 'bg-neutral-950 border-neutral-900' : 'bg-neutral-100 border-stone-200'}`}>
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-[10px] font-mono font-bold text-red-500 uppercase tracking-widest block">CHECKOUT PANEL</span>
            <h2 className="font-display font-black text-3xl text-white tracking-tight uppercase">DIRECT QR PAYMENTS</h2>
            <p className="text-xs text-neutral-400">Send payments securely using scanning apps. Once transferred, send the receipt screenshot to our Support Chat.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-start">
            {[
              { label: 'PhonePe Scan', qr: state.payment.phonePeQrUrl },
              { label: 'Google Pay', qr: state.payment.googlePayQrUrl },
              { label: 'Paytm Scan', qr: state.payment.paytmQrUrl },
              { label: 'UPI QR Code', qr: state.payment.upiQrUrl }
            ].map((p, i) => (
              <div key={i} className="bg-neutral-900/60 border border-neutral-850 p-4 rounded-2xl flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-full aspect-square bg-white rounded-xl overflow-hidden p-2">
                  <img src={p.qr} alt={p.label} className="w-full h-full object-cover" />
                </div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400 block">{p.label}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-neutral-900/40 border border-neutral-850 p-5 rounded-2xl max-w-md mx-auto text-center space-y-3">
            <span className="text-[10px] font-mono text-neutral-500 uppercase block">DIRECT UPI ADDR</span>
            <span className="text-lg font-mono font-bold text-white block tracking-wider">{state.payment.upiId}</span>
            
            <button
              onClick={() => handleCopyUpi(state.payment.upiId)}
              className="px-4 h-9 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 mx-auto transition-colors cursor-pointer"
            >
              {copiedUpi ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-red-500" />}
              <span>{copiedUpi ? 'COPIED UPI ADDRESS' : 'COPY UPI ADDRESS'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 14. CONTACT US & SOCIAL CONNECTIONS */}
      <section id="contact" className="py-20 max-w-7xl mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Support credentials details */}
          <div className="space-y-8">
            <div className="space-y-3">
              <span className="text-[10px] font-mono font-bold text-red-500 uppercase tracking-widest block">STUDIO NODES</span>
              <h2 className="font-display font-black text-3xl text-white tracking-tight uppercase">TALK WITH THE PRODUCER</h2>
              <p className="text-xs text-neutral-400">Order customized tracks, clarify dub requirements, or send payment receipts directly.</p>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div className="flex items-center gap-3 p-4 bg-neutral-900/40 border border-neutral-850 rounded-xl">
                <Phone className="w-4.5 h-4.5 text-red-500 shrink-0" />
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase block">PHONE HOTLINE</span>
                  <a href={`tel:${state.contact.phone}`} className="text-white hover:text-red-500 transition-colors font-bold">{state.contact.phone}</a>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-neutral-900/40 border border-neutral-850 rounded-xl">
                <Mail className="w-4.5 h-4.5 text-red-500 shrink-0" />
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase block">EMAIL DESK</span>
                  <a href={`mailto:${state.contact.email}`} className="text-white hover:text-red-500 transition-colors font-bold">{state.contact.email}</a>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-neutral-900/40 border border-neutral-850 rounded-xl">
                <MapPin className="w-4.5 h-4.5 text-red-500 shrink-0" />
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase block">STUDIO LOCATION</span>
                  <span className="text-white font-sans leading-relaxed">{state.contact.address}</span>
                </div>
              </div>
            </div>

            {/* Follow Us links */}
            <div className="space-y-3">
              <span className="text-[10px] font-mono text-neutral-500 uppercase block tracking-wider">FOLLOW THE BEAT HOUSE SESSIONS</span>
              <div className="flex items-center gap-2.5">
                {[
                  { icon: Instagram, href: state.socials.instagram, label: 'Instagram' },
                  { icon: Youtube, href: state.socials.youtube, label: 'YouTube' },
                  { icon: Facebook, href: state.socials.facebook, label: 'Facebook' },
                  { icon: Twitter, href: state.socials.x, label: 'Twitter/X' },
                  { icon: Send, href: state.socials.telegram, label: 'Telegram' }
                ].map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <a 
                      key={i}
                      href={s.href}
                      target="_blank"
                      rel="noreferrer"
                      className="p-3 bg-neutral-900 hover:bg-red-600 border border-neutral-800 hover:border-red-500 text-neutral-400 hover:text-white rounded-xl transition-all cursor-pointer hover:-translate-y-1"
                      title={s.label}
                    >
                      <Icon className="w-4 h-4" />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Map widget embed */}
          <div className="rounded-3xl border border-neutral-800 overflow-hidden min-h-[350px] relative bg-neutral-900">
            <iframe 
              src={state.contact.googleMapsLink}
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen={false} 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              className="absolute inset-0 w-full h-full opacity-80"
            ></iframe>
          </div>
        </div>
      </section>

      {/* 15. FOOTER */}
      <footer className="bg-neutral-950 border-t border-neutral-900 pt-16 pb-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-xs font-mono mb-12">
          
          <div className="space-y-4">
            <h4 className="text-white font-bold tracking-widest uppercase text-sm">DJ BEAT HOUSE</h4>
            <p className="text-neutral-500 leading-relaxed font-sans font-normal max-w-xs">
              Premium studio quality audio engineering, custom vocal drops, and resources for the elite.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-neutral-400 font-bold uppercase tracking-widest text-[10px]">Legal Agreements</h4>
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => setPolicyType('privacy')}
                className="text-left text-neutral-500 hover:text-red-500 transition-colors uppercase cursor-pointer"
              >
                Privacy Policy
              </button>
              <button 
                onClick={() => setPolicyType('terms')}
                className="text-left text-neutral-500 hover:text-red-500 transition-colors uppercase cursor-pointer"
              >
                Terms & Conditions
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-neutral-400 font-bold uppercase tracking-widest text-[10px]">Merchant Support</h4>
            <div className="flex flex-col gap-2">
              <a href="#services" className="text-neutral-500 hover:text-red-500 transition-colors uppercase">Store Services</a>
              <a href="#contact" className="text-neutral-500 hover:text-red-500 transition-colors uppercase">Contact Producer</a>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 pt-8 border-t border-neutral-900/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] font-mono text-neutral-600">
          <div className="flex flex-wrap items-center gap-4">
            <span>Copyright © DJ Beat House 2026. All rights reserved.</span>
            <button 
              onClick={() => setIsAdminOpen(true)}
              className="text-neutral-800 hover:text-neutral-500 hover:underline transition-colors uppercase cursor-pointer text-[9px] font-bold tracking-wider"
              id="admin-footer-trigger"
            >
              [Admin Panel]
            </button>
          </div>
          <span className="flex items-center gap-1">
            Made with ❤️ by <strong className="text-neutral-400">Gautam Tiwari</strong>
          </span>
        </div>
      </footer>

      {/* FLOATING GREEN WHATSAPP BUTTON (EXTRA REQUIREMENT) */}
      <a 
        href={state.socials.whatsapp}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-6 left-6 z-40 p-3.5 bg-[#25D366] hover:bg-[#20ba56] text-white rounded-full shadow-2xl hover:scale-110 transition-transform cursor-pointer flex items-center justify-center group"
        title="Chat on WhatsApp"
      >
        <MessageCircle className="w-5.5 h-5.5 fill-current" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out font-mono text-[10px] uppercase font-bold tracking-wider pl-0 group-hover:pl-2">
          Chat With Producer
        </span>
      </a>

      {/* FULL PORTFOLIO POPUP VIDEO SHOWREEL NODE */}
      <AnimatePresence>
        {activeVideo && (
          <YouTubePlayer 
            video={activeVideo}
            onClose={() => setActiveVideo(null)}
          />
        )}
      </AnimatePresence>

      {/* POLICY DIALOGS ACCORDIONS */}
      <AnimatePresence>
        {policyType && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/80 backdrop-blur-md p-4">
            <div className="absolute inset-0 cursor-pointer" onClick={() => setPolicyType(null)}></div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-neutral-900 border border-neutral-850 rounded-2xl p-6 relative z-10 max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4">
                <h3 className="font-display font-black text-sm uppercase text-white tracking-widest flex items-center gap-2">
                  <Shield className="w-4.5 h-4.5 text-red-500" />
                  {policyType === 'privacy' ? 'Privacy Policy Statement' : 'Terms & Conditions Agreement'}
                </h3>
                <button 
                  onClick={() => setPolicyType(null)}
                  className="p-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white rounded-md cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div 
                className="text-neutral-300 text-xs leading-relaxed space-y-4 font-sans markdown-body"
                dangerouslySetInnerHTML={{ 
                  __html: policyType === 'privacy' ? state.policies.privacyPolicy : state.policies.termsConditions 
                }}
              />

              <div className="mt-8 text-right">
                <button
                  onClick={() => setPolicyType(null)}
                  className="px-4 h-9 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs rounded-lg uppercase tracking-wider cursor-pointer"
                >
                  Acknowledge and Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FULL ADMIN MANAGEMENT CONTROL PANEL PORTAL */}
      <AnimatePresence>
        {isAdminOpen && (
          <AdminPanel 
            state={state}
            onSaveState={handleSaveState}
            onClose={() => setIsAdminOpen(false)}
            token={adminToken}
            onLogin={handleLogin}
            onLogout={handleLogout}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
