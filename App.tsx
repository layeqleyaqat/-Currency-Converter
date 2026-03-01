import React, { useState, useEffect, useCallback } from 'react';
import { ArrowDownUp, RefreshCw, History, AlertCircle, Info, WifiOff, Wifi, Globe, X } from 'lucide-react';
import { CurrencySelector } from './components/CurrencySelector';
import { convertCurrency } from './services/geminiService';
import { ConversionResult, ConversionHistoryItem } from './types';
import { POPULAR_CURRENCIES } from './constants';

const App: React.FC = () => {
  const [amount, setAmount] = useState<number>(1);
  const [fromCurrency, setFromCurrency] = useState<string>('USD');
  const [toCurrency, setToCurrency] = useState<string>('EUR');
  
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [history, setHistory] = useState<ConversionHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [showCurrencies, setShowCurrencies] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setResult(null); // Clear result on swap to force re-convert intent
  };

  const handleConvert = useCallback(async () => {
    if (amount <= 0) return;
    
    setLoading(true);
    setResult(null);
    
    try {
      const data = await convertCurrency(amount, fromCurrency, toCurrency);
      setResult(data);
      
      if ('converted_amount' in data) {
        const historyItem: ConversionHistoryItem = {
          ...data,
          id: Date.now().toString(),
          timestamp: data.timestamp || Date.now(),
        };
        setHistory(prev => [historyItem, ...prev].slice(0, 10)); // Keep last 10
      }
    } catch (err) {
      console.error(err);
      setResult({ 
        error: { 
          code: "UNKNOWN", 
          message: "An unexpected error occurred." 
        } 
      });
    } finally {
      setLoading(false);
    }
  }, [amount, fromCurrency, toCurrency]);

  const formatTimestamp = (ts?: number) => {
    if (!ts) return '';
    return new Date(ts).toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-start justify-center p-0 sm:p-4">
      <div className="w-full max-w-lg bg-white sm:rounded-3xl shadow-xl min-h-screen sm:min-h-[auto] flex flex-col">
        
        {/* Mobile Header */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-6 rounded-b-[2.5rem] sm:rounded-t-3xl sm:rounded-b-none shadow-xl z-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-blue-400/20 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="flex justify-between items-start mb-6 relative z-10">
             <div>
               <h1 className="text-3xl font-extrabold tracking-tight">Converter</h1>
               <p className="text-blue-100/80 text-sm font-medium">Gemini AI Intelligence</p>
             </div>
             <div className={`backdrop-blur-md border p-2.5 rounded-2xl transition-all duration-500 ${
               !isOnline 
                 ? 'bg-amber-500/20 border-amber-300/30' 
                 : 'bg-white/10 border-white/20'
             }`}>
               {!isOnline ? (
                 <WifiOff className="w-5 h-5 text-amber-200 animate-pulse" />
               ) : (
                 <Wifi className="w-5 h-5 text-blue-100" />
               )}
             </div>
          </div>
          
          <div className="flex gap-2 relative z-10">
            <button 
              onClick={() => setShowCurrencies(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-full text-xs font-bold transition-all border border-white/10 backdrop-blur-sm"
            >
              <Globe className="w-4 h-4" />
              Supported Currencies
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
          {/* Input Section */}
          <div className="space-y-4 relative mt-2">
            <CurrencySelector
              label="You send"
              value={fromCurrency}
              onChange={setFromCurrency}
              amount={amount}
              onAmountChange={setAmount}
            />

            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <button
                onClick={handleSwap}
                className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg border-4 border-white transition-transform hover:rotate-180 hover:scale-105 active:scale-95"
                aria-label="Swap currencies"
              >
                <ArrowDownUp className="w-5 h-5" />
              </button>
            </div>

            <CurrencySelector
              label="They get"
              value={toCurrency}
              onChange={setToCurrency}
              amount={result && 'converted_amount' in result ? result.converted_amount : 0}
              onAmountChange={() => {}} 
              readOnlyAmount
              isLoading={loading}
            />
          </div>

          {/* Action Button */}
          <button
            onClick={handleConvert}
            disabled={loading || amount <= 0}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold py-4.5 rounded-2xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-3 text-lg active:scale-[0.97]"
          >
            {loading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Updating Rates...</span>
              </>
            ) : (
              'Convert Now'
            )}
          </button>

          {/* Error Message */}
          {result && 'error' in result && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">Error: {result.error.code}</h4>
                <p className="text-sm opacity-90">{result.error.message}</p>
              </div>
            </div>
          )}

          {/* Result Info */}
          {result && 'converted_amount' in result && !loading && (
            <div className={`rounded-xl p-5 border animate-in fade-in slide-in-from-bottom-2 ${result.isCached ? 'bg-amber-50 border-amber-100' : 'bg-green-50 border-green-100'}`}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-500 text-xs font-medium uppercase tracking-wider">Exchange Rate</span>
                {result.isCached ? (
                    <span className="text-amber-700 bg-amber-100 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                      OFFLINE
                    </span>
                ) : (
                  <span className="text-green-700 bg-green-100 px-2 py-0.5 rounded text-[10px] font-bold">
                    LIVE
                  </span>
                )}
              </div>
              <div className="text-xl text-slate-800 font-medium">
                1 {result.from_currency} = <span className="font-bold">{result.exchange_rate} {result.to_currency}</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                <Info className="w-3 h-3" />
                {result.isCached 
                  ? `Last updated: ${formatTimestamp(result.timestamp)}` 
                  : 'Sourced via Google Search'}
              </div>
            </div>
          )}

          {/* History Toggle */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 text-slate-800 font-bold">
                <History className="w-5 h-5 text-blue-600" />
                History
              </div>
              {history.length > 0 && (
                <button 
                  onClick={() => setHistory([])}
                  className="text-xs font-bold text-red-500 hover:text-red-600 active:scale-95 transition-all"
                >
                  Clear All
                </button>
              )}
            </div>
            
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center justify-between w-full p-4 bg-white border border-slate-200 rounded-2xl hover:border-blue-300 transition-all shadow-sm active:bg-slate-50"
            >
              <span className="text-slate-500 text-sm font-medium">
                {showHistory ? 'Hide recent conversions' : 'Show recent conversions'}
              </span>
              <span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg text-xs font-bold">
                {history.length}
              </span>
            </button>
          </div>

          {/* History List */}
          {showHistory && (
             <div className="space-y-3 animate-in slide-in-from-top-4 duration-300">
                {history.length === 0 ? (
                  <div className="text-center text-slate-400 text-sm py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    No conversion history yet.
                  </div>
                ) : (
                  history.map((item) => (
                    <div key={item.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center hover:border-blue-100 transition-colors">
                       <div className="flex flex-col">
                          <span className="text-slate-900 font-bold text-xl">
                            {item.converted_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm font-medium text-slate-400">{item.to_currency}</span>
                          </span>
                          <span className="text-slate-400 text-xs mt-1 font-medium">
                            {item.from_currency} → {item.to_currency}
                          </span>
                       </div>
                       <div className="text-right">
                         <div className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                           Rate: {item.exchange_rate.toFixed(4)}
                         </div>
                         <div className="text-[9px] text-slate-300 mt-1 uppercase tracking-tighter">
                           {formatTimestamp(item.timestamp)}
                         </div>
                       </div>
                    </div>
                  ))
                )}
             </div>
          )}
        </div>
      </div>

      {/* Supported Currencies Modal */}
      {showCurrencies && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-300">
          <div 
            className="fixed inset-0 z-0" 
            onClick={() => setShowCurrencies(false)}
          ></div>
          <div className="bg-white w-full sm:max-w-md max-h-[85vh] rounded-t-[2.5rem] sm:rounded-3xl flex flex-col shadow-2xl animate-in slide-in-from-bottom-full duration-300 relative z-10">
            {/* Handle for bottom sheet feel */}
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-3 mb-1 sm:hidden"></div>
            
            <div className="p-6 border-b border-slate-50 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-extrabold text-slate-800">Currencies</h2>
                <p className="text-xs text-slate-400 font-medium">Supported exchange rates</p>
              </div>
              <button 
                onClick={() => setShowCurrencies(false)}
                className="p-2.5 bg-slate-50 hover:bg-slate-100 active:scale-90 rounded-full transition-all"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="overflow-y-auto p-4 pb-12 sm:pb-4">
              <div className="grid grid-cols-1 gap-1.5">
                {POPULAR_CURRENCIES.map(curr => (
                  <div key={curr.code} className="flex items-center justify-between p-4 hover:bg-blue-50/50 active:bg-blue-50 rounded-2xl transition-all group border border-transparent hover:border-blue-100">
                    <div className="flex items-center gap-4">
                      <span className="text-3xl grayscale-[0.2] group-hover:grayscale-0 transition-all">{curr.flag}</span>
                      <div>
                        <div className="font-bold text-slate-800 leading-tight">{curr.code}</div>
                        <div className="text-[11px] text-slate-400 font-medium">{curr.name}</div>
                      </div>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-slate-100 group-hover:bg-blue-400 transition-all"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;