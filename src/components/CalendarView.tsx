/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Calendar, 
  Users, 
  TrendingUp, 
  Info, 
  CheckCircle2, 
  Clock, 
  Award,
  AlertTriangle
} from 'lucide-react';
import { Guest } from '../types';

interface CalendarViewProps {
  guests: Guest[];
  onClose: () => void;
  labelCurrent: string;
  labelDeparted: string;
}

const WEEKDAYS = [
  { my: 'တနင်္ဂနွေ', short: 'တနင်္ဂနွေ', color: 'text-rose-500' },
  { my: 'တနင်္လာ', short: 'တနင်္လာ', color: 'text-slate-600' },
  { my: 'အင်္ဂါ', short: 'အင်္ဂါ', color: 'text-slate-600' },
  { my: 'ဗုဒ္ဓဟူး', short: 'ဗုဒ္ဓဟူး', color: 'text-slate-600' },
  { my: 'ကြာသပတေး', short: 'ကြာသပတေး', color: 'text-slate-600' },
  { my: 'သောကြာ', short: 'သောကြာ', color: 'text-slate-600' },
  { my: 'စနေ', short: 'စနေ', color: 'text-indigo-500' }
];

const MYANMAR_MONTHS = [
  'ဇန်နဝါရီ', 'ဖေဖော်ဝါရီ', 'မတ်', 'ဧပြီ', 'မေ', 'ဇွန်', 
  'ဇူလိုင်', 'သြဂုတ်', 'စက်တင်ဘာ', 'အောက်တိုဘာ', 'နိုဝင်ဘာ', 'ဒီဇင်ဘာ'
];

export default function CalendarView({ guests, onClose, labelCurrent, labelDeparted }: CalendarViewProps) {
  // Current month displayed in calendar
  const [currentDate, setCurrentDate] = useState(() => new Date());
  
  // Selected day string (YYYY-MM-DD), defaults to today
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-11

  // Handle month navigation
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleGoToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    setSelectedDateStr(`${y}-${m}-${d}`);
  };

  // Days calculations
  const calendarCells = useMemo(() => {
    // First day of displayed month (0 = Sunday, 1 = Monday...)
    const firstDayIndex = new Date(year, month, 1).getDay();
    // Total days in displayed month
    const totalDays = new Date(year, month + 1, 0).getDate();
    // Total days in previous month
    const prevMonthDaysCount = new Date(year, month, 0).getDate();

    const cells: { day: number; isCurrentMonth: boolean; dateStr: string }[] = [];

    // 1. Fill previous month padding days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      cells.push({
        day: prevMonthDaysCount - i,
        isCurrentMonth: false,
        dateStr: '' // We don't analyze overlapping stay for padding days
      });
    }

    // 2. Fill current month days
    for (let d = 1; d <= totalDays; d++) {
      const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({
        day: d,
        isCurrentMonth: true,
        dateStr: dStr
      });
    }

    // 3. Fill next month padding days to round up to full grid row (multiple of 7)
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      cells.push({
        day: d,
        isCurrentMonth: false,
        dateStr: ''
      });
    }

    return cells;
  }, [year, month]);

  // Helper to get guests staying on a specific date YYYY-MM-DD
  const getGuestsForDate = (dateStr: string) => {
    if (!dateStr) return [];
    return guests.filter(guest => {
      if (!guest.stayFrom || !guest.stayTo) return false;
      return guest.stayFrom <= dateStr && guest.stayTo >= dateStr;
    });
  };

  // Active guests lists cache for current displayed month
  const monthData = useMemo(() => {
    let totalOverlapCount = 0;
    const overlappedSet = new Set<string>();
    const dailyCounts: { day: number; count: number; dateStr: string }[] = [];
    
    let peakCount = 0;
    let peakDates: string[] = [];
    let emptyDaysCount = 0;
    let totalSumOfDailyGuests = 0;
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayGuests = getGuestsForDate(dStr);
      const count = dayGuests.length;

      dailyCounts.push({ day: d, count, dateStr: dStr });
      totalSumOfDailyGuests += count;

      if (count > 0) {
        dayGuests.forEach(g => overlappedSet.add(g.id));
      } else {
        emptyDaysCount++;
      }

      if (count > peakCount) {
        peakCount = count;
        peakDates = [dStr];
      } else if (count === peakCount && count > 0) {
        peakDates.push(dStr);
      }
    }

    const averageDaily = totalDaysInMonth > 0 
      ? (totalSumOfDailyGuests / totalDaysInMonth).toFixed(1) 
      : '0';

    return {
      uniqueGuestsInMonthCount: overlappedSet.size,
      averageDaily,
      emptyDaysCount,
      peakCount,
      peakDates,
      dailyCounts
    };
  }, [year, month, guests]);

  // Guests list for selected day
  const selectedDayGuests = useMemo(() => {
    return getGuestsForDate(selectedDateStr);
  }, [selectedDateStr, guests]);

  // Busy color coding helper
  const getCellColorClass = (count: number, isSelected: boolean, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) {
      return 'bg-slate-50 text-slate-300 border-transparent';
    }
    
    let baseColor = 'bg-white border-slate-150 text-slate-800';
    if (count > 0) {
      if (count <= 2) {
        baseColor = 'bg-emerald-50/70 border-emerald-100 text-emerald-900 font-semibold';
      } else if (count <= 5) {
        baseColor = 'bg-amber-50 border-amber-200 text-amber-950 font-bold';
      } else {
        baseColor = 'bg-rose-50 border-rose-200 text-rose-950 font-black';
      }
    }

    if (isSelected) {
      return `${baseColor} ring-2 ring-emerald-500 ring-offset-1 z-10 scale-[1.02] shadow-sm`;
    }

    return `${baseColor} hover:bg-slate-50 transition-all cursor-pointer`;
  };

  const formattedSelectedDate = useMemo(() => {
    if (!selectedDateStr) return '';
    try {
      const d = new Date(selectedDateStr);
      return d.toLocaleDateString('my-MM', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      });
    } catch (e) {
      return selectedDateStr;
    }
  }, [selectedDateStr]);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="bg-white rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl border border-slate-100 my-4 flex flex-col md:flex-row h-[90vh] md:h-[80vh]"
      >
        {/* Left Side: Calendar Month Grid and Navigation */}
        <div className="flex-1 p-5 flex flex-col justify-between overflow-y-auto border-r border-slate-100">
          <div>
            {/* Header: Month Selector */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Calendar size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-1.5 leading-tight">
                    {MYANMAR_MONTHS[month]} - {year} 
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">ပြက္ခဒိန် မြင်ကွင်း (Stay Interval Grid)</p>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1.5 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 rounded-lg transition-all cursor-pointer"
                  title="ယခင်လ"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={handleGoToToday}
                  className="px-2.5 py-1.5 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 text-[11px] font-bold rounded-lg transition-all cursor-pointer"
                  title="ယနေ့သို့"
                >
                  ယနေ့
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1.5 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 rounded-lg transition-all cursor-pointer"
                  title="နောင်လ"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Week Days Label Header */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold mb-1.5 bg-slate-50 py-1.5 rounded-lg border border-slate-100">
              {WEEKDAYS.map((day, idx) => (
                <div key={idx} className={day.color}>
                  {day.short}
                </div>
              ))}
            </div>

            {/* Month Day Grid cells */}
            <div className="grid grid-cols-7 gap-1">
              {calendarCells.map((cell, idx) => {
                const count = cell.dateStr ? getGuestsForDate(cell.dateStr).length : 0;
                const isSelected = cell.isCurrentMonth && cell.dateStr === selectedDateStr;
                const isToday = cell.isCurrentMonth && (() => {
                  const t = new Date();
                  return t.getFullYear() === year && t.getMonth() === month && t.getDate() === cell.day;
                })();

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      if (cell.isCurrentMonth && cell.dateStr) {
                        setSelectedDateStr(cell.dateStr);
                      }
                    }}
                    className={`aspect-square p-1 rounded-xl border flex flex-col justify-between relative transition-all select-none ${getCellColorClass(
                      count,
                      isSelected,
                      cell.isCurrentMonth
                    )}`}
                    style={{ minHeight: '52px' }}
                  >
                    {/* Day number */}
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] font-bold ${
                        cell.isCurrentMonth 
                          ? isToday 
                            ? 'bg-emerald-600 text-white w-5 h-5 rounded-full flex items-center justify-center font-black shadow-xs' 
                            : 'text-slate-800' 
                          : 'text-slate-300'
                      }`}>
                        {cell.day}
                      </span>
                    </div>

                    {/* Guest overlapping count indicators */}
                    {cell.isCurrentMonth && count > 0 && (
                      <div className="flex items-center justify-end">
                        <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-extrabold flex items-center gap-0.5 tracking-tight ${
                          count <= 2 
                            ? 'bg-emerald-200/60 text-emerald-800' 
                            : count <= 5 
                            ? 'bg-amber-200 text-amber-900' 
                            : 'bg-rose-200 text-rose-900'
                        }`}>
                          <Users size={8} />
                          {count}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Color Legend & Mini Stats */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3 text-[10px] text-slate-500 font-bold flex-wrap">
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-md bg-white border border-slate-200 block"></span>
                <span>မရှိပါ (0)</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-md bg-emerald-50 border border-emerald-100 block"></span>
                <span>ပုံမှန် (၁ - ၂ ဦး)</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-md bg-amber-50 border border-amber-200 block"></span>
                <span>စည်ကား (၃ - ၅ ဦး)</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-md bg-rose-50 border border-rose-200 block"></span>
                <span>အလွန်စည်ကား (၆+ ဦး)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Selected Date Guests Detail & Month Stats Panel */}
        <div className="w-full md:w-80 bg-slate-50 flex flex-col h-full overflow-hidden shrink-0">
          {/* Header */}
          <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1.5">
              <Clock size={16} className="text-emerald-400" />
              <span className="font-bold text-xs">အသေးစိတ်နှင့် အချက်အလက်</span>
            </div>
            <button
              onClick={onClose}
              className="text-slate-300 hover:text-white cursor-pointer"
              title="ပိတ်ရန်"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Display Month At a Glance Stats */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-150 shadow-xxs space-y-3">
              <h4 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1 border-b border-slate-100 pb-1.5">
                <TrendingUp size={12} className="text-emerald-500" />
                <span>လအလိုက် Stay Analytics</span>
              </h4>
              
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <div className="text-[9px] font-bold text-slate-400">စုစုပေါင်းတည်းခိုသူ</div>
                  <div className="text-sm font-extrabold text-slate-800">{monthData.uniqueGuestsInMonthCount} ဦး</div>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <div className="text-[9px] font-bold text-slate-400">ပျမ်းမျှနေ့စဉ်ဧည့်သည်</div>
                  <div className="text-sm font-extrabold text-emerald-700">{monthData.averageDaily} ဦး/ရက်</div>
                </div>
              </div>

              <div className="space-y-2 pt-1 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="text-[11px]">တည်းခိုသူမရှိသောရက်များ:</span>
                  <strong className="text-slate-700 font-bold">{monthData.emptyDaysCount} ရက်</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] flex items-center gap-0.5">
                    အစည်ကားဆုံးရက် တည်းခိုသူ:
                  </span>
                  <strong className="text-rose-600 font-bold">{monthData.peakCount} ဦး/ရက်</strong>
                </div>
                
                {monthData.peakCount > 0 && (
                  <div className="bg-rose-50 text-rose-800 text-[10px] p-2 rounded-lg border border-rose-100 leading-normal font-medium">
                    📍 <strong>အစည်ကားဆုံးကာလ/ရက်များ -</strong> {monthData.peakDates.map(dStr => {
                      const dayVal = dStr.split('-')[2];
                      return `${MYANMAR_MONTHS[month]} ${dayVal} ရက်`;
                    }).join(', ')}
                  </div>
                )}
              </div>
            </div>

            {/* Selected Date Details list */}
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1 flex-wrap gap-1">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1 shrink-0">
                  <Calendar size={13} className="text-emerald-600" />
                  ရွေးချယ်ထားသော ရက်စွဲ
                </span>
                <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                  {selectedDayGuests.length} ဦး နေထိုင်ဆဲ
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-semibold">{formattedSelectedDate}</p>

              {/* Guest Stays list */}
              {selectedDayGuests.length === 0 ? (
                <div className="text-center py-6 bg-white rounded-2xl border border-slate-150 p-4">
                  <Users size={24} className="text-slate-300 mx-auto mb-1.5" />
                  <p className="text-xs text-slate-400 font-medium">ဤရက်စွဲတွင် မည်သည့်ဧည့်သည်မှ စာရင်းသွင်းတည်းခိုခြင်းမရှိပါ။</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {selectedDayGuests.map((g) => (
                    <div 
                      key={g.id}
                      className="bg-white p-2.5 rounded-xl border border-slate-150 shadow-xxs flex flex-col gap-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h5 className="font-bold text-xs text-slate-800 leading-tight">
                            {g.name} <span className="font-semibold text-[10px] text-slate-500">({g.age} နှစ်)</span>
                          </h5>
                          <p className="text-[9px] text-slate-400 font-semibold mt-0.5">{g.nrc}</p>
                        </div>
                        <span className={`text-[8.5px] font-extrabold px-1.5 py-0.5 rounded-md ${
                          g.isCurrent 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {g.isCurrent ? labelCurrent : labelDeparted}
                        </span>
                      </div>

                      <div className="text-[10px] text-slate-600 space-y-0.5 bg-slate-50/50 p-1.5 rounded-lg border border-slate-100 font-medium">
                        <div><strong>လာရာဒေသ:</strong> {g.origin}</div>
                        <div><strong>တည်းခိုကာလ:</strong> {g.stayFrom} မှ {g.stayTo} ထိ</div>
                        {g.phone && <div><strong>ဖုန်း:</strong> {g.phone}</div>}
                        {g.parents && <div><strong>မိဘအမည်:</strong> {g.parents}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="p-3 bg-white border-t border-slate-150 flex justify-end shrink-0">
            <button
              onClick={onClose}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer text-center"
            >
              ပိတ်မည်
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
