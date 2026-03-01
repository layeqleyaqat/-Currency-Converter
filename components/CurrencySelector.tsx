import React from 'react';
import { POPULAR_CURRENCIES } from '../constants';
import { ChevronDown } from 'lucide-react';

interface CurrencySelectorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  amount: number;
  onAmountChange: (val: number) => void;
  readOnlyAmount?: boolean;
  isLoading?: boolean;
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  label,
  value,
  onChange,
  amount,
  onAmountChange,
  readOnlyAmount = false,
  isLoading = false,
}) => {
  const selectedCurrency = POPULAR_CURRENCIES.find((c) => c.code === value);

  return (
    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
      <div className="flex justify-between mb-2">
        <label className="text-sm font-medium text-slate-500">{label}</label>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <input
            type="number"
            inputMode="decimal"
            value={amount || ''}
            onChange={(e) => onAmountChange(parseFloat(e.target.value) || 0)}
            readOnly={readOnlyAmount}
            className={`w-full text-3xl font-bold bg-transparent outline-none placeholder-slate-300 transition-colors ${
              readOnlyAmount ? 'text-slate-700' : 'text-slate-900 focus:text-blue-600'
            } ${isLoading ? 'animate-pulse text-slate-400' : ''}`}
            placeholder="0.00"
          />
        </div>
        <div className="relative shrink-0">
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
            aria-label="Select currency"
          >
            {POPULAR_CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} - {c.name}
              </option>
            ))}
          </select>
          <button className="flex items-center gap-2 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 px-3 py-2.5 rounded-xl transition-all shadow-sm active:scale-95">
            <span className="text-2xl leading-none">{selectedCurrency?.flag || '🌐'}</span>
            <span className="font-bold text-slate-700">{value}</span>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>
    </div>
  );
};