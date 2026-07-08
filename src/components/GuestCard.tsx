/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Calendar, MapPin, Users, CheckCircle2, AlertCircle, Copy, Download } from 'lucide-react';
import { Guest } from '../types';

interface GuestCardProps {
  guest: Guest;
  onClick: () => void;
  onCopyInfo: (e: React.MouseEvent) => void;
}

export default function GuestCard({ guest, onClick, onCopyInfo }: GuestCardProps) {
  const isExpired = new Date(guest.stayTo) < new Date();
  
  return (
    <div
      onClick={onClick}
      className="p-4 bg-white border border-slate-100 hover:border-emerald-100 rounded-2xl shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col md:flex-row gap-4 items-start md:items-center justify-between group"
    >
      <div className="flex items-center gap-4 w-full md:w-auto">
        {/* Guest Photo thumbnail */}
        <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center">
          {guest.photo ? (
            <img
              src={guest.photo}
              alt={guest.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-50">
              <Users size={24} />
            </div>
          )}
          
          {/* Family members counter badge */}
          {guest.familyMembers && guest.familyMembers.length > 0 && (
            <div className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md border border-white">
              +{guest.familyMembers.length}
            </div>
          )}
        </div>

        {/* Guest Main Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-bold text-slate-800 text-base group-hover:text-emerald-900 transition-colors truncate">
              {guest.name}
            </h3>
            <span className="text-xs text-slate-400 font-medium">({guest.age} နှစ်)</span>
            
            {/* Status Badge */}
            {guest.isCurrent ? (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full">
                <CheckCircle2 size={10} />
                နေထိုင်ဆဲ
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200 rounded-full">
                <AlertCircle size={10} />
                ပြန်လည်ထွက်ခွာ
              </span>
            )}
          </div>

          {/* NRC */}
          <p className="text-xs font-mono text-slate-500 mb-2">{guest.nrc}</p>

          {/* Stay dates and Origin */}
          <div className="space-y-1 text-xs text-slate-500">
            <div className="flex items-center gap-1.5 truncate">
              <MapPin size={12} className="text-slate-400 flex-shrink-0" />
              <span>{guest.origin}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar size={12} className={`flex-shrink-0 ${isExpired && guest.isCurrent ? 'text-amber-500' : 'text-slate-400'}`} />
              <span className={isExpired && guest.isCurrent ? 'text-amber-600 font-medium' : ''}>
                {guest.stayFrom} မှ {guest.stayTo} ထိ
                {isExpired && guest.isCurrent && ' (ရက်လွန်နေပြီ)'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Buttons on Desktop / Right Side */}
      <div className="flex items-center gap-2 self-end md:self-center w-full md:w-auto justify-end border-t md:border-t-0 pt-2.5 md:pt-0 border-slate-100">
        <button
          onClick={onCopyInfo}
          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all text-xs flex items-center gap-1 font-medium"
          title="အချက်အလက် ကူးယူရန်"
        >
          <Copy size={14} />
          <span className="md:hidden lg:inline">ကူးယူရန်</span>
        </button>
        <div className="text-xs font-semibold px-2.5 py-1.5 bg-slate-50 group-hover:bg-emerald-50 group-hover:text-emerald-700 text-slate-700 rounded-xl transition-colors border border-slate-100 group-hover:border-emerald-100 flex items-center gap-1">
          အသေးစိတ်ကြည့်ရန်
        </div>
      </div>
    </div>
  );
}
