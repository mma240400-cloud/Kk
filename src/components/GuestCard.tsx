/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Calendar, MapPin, Users, CheckCircle2, AlertCircle, Copy, Download, X, ZoomIn } from 'lucide-react';
import { Guest } from '../types';

interface GuestCardProps {
  guest: Guest;
  onClick: () => void;
  onCopyInfo: (e: React.MouseEvent) => void;
  isSelected?: boolean;
  onSelectToggle?: () => void;
  labelCurrent?: string;
  labelDeparted?: string;
}

export default function GuestCard({ guest, onClick, onCopyInfo, isSelected = false, onSelectToggle, labelCurrent = 'နေထိုင်ဆဲ', labelDeparted = 'ထွက်ခွာပြီး' }: GuestCardProps) {
  const [showPhotoPreview, setShowPhotoPreview] = useState(false);
  const isExpired = new Date(guest.stayTo) < new Date();
  
  const statusBorderClass = guest.isCurrent 
    ? 'border-l-emerald-500' 
    : 'border-l-amber-500';

  const cardBorderClass = isSelected 
    ? 'border-emerald-300 bg-emerald-50/15' 
    : 'border-slate-100 hover:border-emerald-100';

  const progressPercent = React.useMemo(() => {
    if (!guest.stayFrom || !guest.stayTo) return null;
    const start = new Date(guest.stayFrom);
    start.setHours(0, 0, 0, 0);
    const end = new Date(guest.stayTo);
    end.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const startMs = start.getTime();
    const endMs = end.getTime();
    const nowMs = now.getTime();

    if (endMs <= startMs) return 100;
    if (nowMs < startMs) return 0;
    if (nowMs > endMs) return 100;

    const total = endMs - startMs;
    const elapsed = nowMs - startMs;
    return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
  }, [guest.stayFrom, guest.stayTo]);
  
  return (
    <>
      <div
        onClick={onClick}
        className={`p-4 bg-white border border-y border-r border-l-4 ${statusBorderClass} ${cardBorderClass} rounded-2xl shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col md:flex-row gap-4 items-start md:items-center justify-between group`}
      >
        <div className="flex items-center gap-4 w-full md:w-auto">
          {/* Bulk action selection checkbox */}
          {onSelectToggle && (
            <div 
              onClick={(e) => e.stopPropagation()} 
              className="flex items-center justify-center shrink-0 pr-1"
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onSelectToggle()}
                className="w-5 h-5 text-emerald-600 border-slate-300 rounded-lg focus:ring-emerald-500 cursor-pointer accent-emerald-600"
              />
            </div>
          )}

          {/* Guest Photo thumbnail */}
          <div 
            onClick={guest.photo ? (e) => {
              e.stopPropagation();
              setShowPhotoPreview(true);
            } : undefined}
            className={`relative w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center group/photo ${
              guest.photo ? 'cursor-zoom-in hover:ring-2 hover:ring-emerald-500/40' : ''
            }`}
            title={guest.photo ? 'ပုံကြီးချဲ့ကြည့်ရန်' : undefined}
          >
            {guest.photo ? (
              <>
                <img
                  src={guest.photo}
                  alt={guest.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center">
                  <ZoomIn size={14} className="text-white drop-shadow-md" />
                </div>
              </>
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
            
            {/* Dynamic Status Badge */}
            {guest.isCurrent ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-full shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{labelCurrent}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80 rounded-full shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>{labelDeparted}</span>
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
            {guest.isCurrent && progressPercent !== null && (
              <div className="pt-1.5 space-y-1 w-full max-w-xs">
                <div className="flex items-center justify-between text-[10px] font-semibold">
                  <span className={progressPercent >= 80 ? 'text-rose-600 font-bold' : 'text-slate-500'}>
                    တည်းခိုခွင့် ကုန်ဆုံးမှု: {progressPercent}%
                  </span>
                  {progressPercent >= 80 && (
                    <span className="text-rose-600 font-bold animate-pulse flex items-center gap-0.5 text-[9px]">
                      ⚠️ {progressPercent === 100 ? 'သက်တမ်းကုန်ဆုံးပြီ' : 'ထွက်ခွာရန် နီးကပ်နေပြီ'}
                    </span>
                  )}
                </div>
                <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      progressPercent >= 80 ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}
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

      {/* Photo Preview Modal Overlay */}
      {showPhotoPreview && guest.photo && (
        <div 
          onClick={(e) => {
            e.stopPropagation();
            setShowPhotoPreview(false);
          }}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-100 max-w-sm w-full animate-in zoom-in-95 duration-150 flex flex-col"
          >
            {/* Header */}
            <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm">{guest.name} ၏ ဓာတ်ပုံ</h4>
                <p className="text-[10px] text-slate-300 font-mono">{guest.nrc}</p>
              </div>
              <button
                onClick={() => setShowPhotoPreview(false)}
                className="p-1 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            {/* Image */}
            <div className="aspect-square bg-slate-950 relative overflow-hidden flex items-center justify-center">
              <img 
                src={guest.photo} 
                alt={guest.name} 
                referrerPolicy="no-referrer"
                className="max-h-full max-w-full object-contain"
              />
            </div>
            {/* Action Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowPhotoPreview(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                ပိတ်မည်
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
