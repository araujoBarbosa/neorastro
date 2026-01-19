import React from 'react';
import { StatMetric } from '../types';

export const StatCard: React.FC<StatMetric> = ({ label, value, trend, trendUp }) => {
  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-slate-600 transition-colors shadow-lg shadow-black/20">
      <h3 className="text-slate-400 text-sm font-medium mb-1">{label}</h3>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-bold text-white">{value}</span>
        {trend && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            trendUp ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
          }`}>
            {trend}
          </span>
        )}
      </div>
    </div>
  );
};