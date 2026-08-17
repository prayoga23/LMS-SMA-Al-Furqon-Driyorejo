'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  gradient?: string;
  iconBg?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtext,
  icon: Icon,
  gradient = 'from-emerald-50 to-teal-50/40',
  iconBg = 'bg-emerald-700 text-white shadow-md shadow-emerald-700/20',
}) => {
  return (
    <div
      className={`relative overflow-hidden bg-white rounded-2xl p-3.5 sm:p-5 border border-emerald-200/80 bg-gradient-to-br ${gradient} shadow-md shadow-slate-200/80 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 flex flex-col justify-between w-full min-w-0`}
    >
      <div className="flex items-start justify-between gap-1.5 min-w-0">
        <p className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-emerald-900 truncate">
          {title}
        </p>
        <div className={`p-2 sm:p-2.5 rounded-xl shrink-0 ${iconBg}`}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      </div>

      <div className="mt-2 min-w-0">
        <h4 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">
          {value}
        </h4>
        {subtext && (
          <p className="mt-0.5 text-[10px] sm:text-xs font-medium text-slate-500 truncate">
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
};
