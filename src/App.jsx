import React, { useState, useEffect } from 'react';
import { fetchCoffeePrices } from './services/api';
import { Coffee, RefreshCw, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const [data, setData] = useState({ prices: [], lastUpdated: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchCoffeePrices();
      if (result.prices.length === 0) {
        throw new Error('No price data found. Website structure may have changed.');
      }
      setData(result);
    } catch (err) {
      setError(err.message || 'Failed to fetch prices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="min-h-screen mesh-bg relative flex flex-col items-center py-6 px-4 sm:px-6 lg:px-8">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-accent-amber/20 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-coffee-500/20 blur-[100px] rounded-full" />
      </div>

      <div className="w-full max-w-2xl relative z-10">
        {/* Header Glass Panel */}
        <header className="glass-panel p-8 mb-8 flex flex-col items-center text-center">
          <div className="mb-4 p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10 shadow-inner">
            <Coffee size={40} className="text-accent-amber drop-shadow-lg" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
            Coffee Pulse
          </h1>
          <p className="text-coffee-200 text-lg font-medium opacity-80 uppercase tracking-[0.2em]">
            Market Dashboard
          </p>

          <div className="mt-6 flex items-center gap-3 bg-black/20 px-6 py-2.5 rounded-full border border-white/5 backdrop-blur-sm">
            <Calendar size={16} className="text-accent-amber" />
            <span className="text-sm font-semibold tracking-wide text-white/90">
              {data.lastUpdated || 'Initialising...'}
            </span>
            <div className="h-4 w-[1px] bg-white/20 mx-1" />
            <button
              onClick={loadData}
              disabled={loading}
              className="group flex items-center gap-2 text-accent-amber hover:text-white transition-colors disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"} />
            </button>
          </div>
        </header>

        {/* Content */}
        <main>
          <AnimatePresence mode="wait">
            {error ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-panel p-8 text-center border-red-500/20"
              >
                <div className="bg-red-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20 text-red-400">
                  <AlertCircle size={32} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Sync Interrupted</h3>
                <p className="text-white/60 mb-6 text-sm leading-relaxed">{error}</p>
                <button
                  onClick={loadData}
                  className="w-full sm:w-auto px-10 py-3 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-bold shadow-xl shadow-red-900/20 transition-all active:scale-95"
                >
                  Retry Connection
                </button>
              </motion.div>
            ) : loading ? (
              <div className="grid gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="glass-panel h-36 animate-pulse bg-white/5 border-white/5" />
                ))}
              </div>
            ) : (
              <div className="grid gap-6">
                {data.prices.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    className="premium-card p-6 flex items-center justify-between group"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent-amber shadow-[0_0_10px_rgba(255,191,0,1)]" />
                        <h3 className="text-sm font-bold uppercase tracking-widest text-white/80 group-hover:text-white transition-colors">
                          {item.name}
                        </h3>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-white tracking-tight drop-shadow-sm">
                          {item.price}
                        </span>
                        <span className="text-white/40 font-bold text-xs italic tracking-tighter shrink-0">per 50kg</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center group-hover:bg-accent-amber/20 border border-white/20 transition-colors">
                        <TrendingUp size={24} className="text-green-400 group-hover:text-accent-amber" />
                      </div>
                      {item.price !== 'N/A' && (
                        <div className="mt-2 px-2 py-0.5 rounded-md bg-green-500/20 border border-green-500/30 flex items-center gap-1">
                          <div className="w-1 h-1 rounded-full bg-green-400 shadow-[0_0_5px_rgba(74,222,128,0.5)]" />
                          <span className="text-[10px] font-bold text-green-300">LIVE</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </main>

        <footer className="mt-12 text-center text-white/20">
          <div className="h-px w-24 bg-gradient-to-r from-transparent via-white/10 to-transparent mx-auto mb-6" />
          <p className="text-xs font-bold tracking-[0.3em] uppercase mb-1">Official Data Stream</p>
          <p className="text-[10px] font-medium opacity-50 tracking-wider">Coffee Board of India • Bangalore HQ</p>
          <p className="text-[9px] mt-4 opacity-30 px-12">Dashboard intended for market professionals. Cross-verify with official circulars.</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
