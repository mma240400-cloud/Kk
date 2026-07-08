/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { X, History, Trash2, Import, Calendar, Users, QrCode } from 'lucide-react';
import { ScanHistoryItem } from '../types';

interface ScanHistoryModalProps {
  history: ScanHistoryItem[];
  onReImport: (rawData: string) => void;
  onClearHistory: () => void;
  onClose: () => void;
}

export default function ScanHistoryModal({ history, onReImport, onClearHistory, onClose }: ScanHistoryModalProps) {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100"
      >
        {/* Header */}
        <div className="bg-slate-900 text-white px-4 py-3.5 flex items-center justify-between">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <History size={16} className="text-indigo-400" />
            <span>QR စကင်ဖတ်မှု မှတ်တမ်း ( Scan History )</span>
          </h3>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white cursor-pointer"
            title="ပိတ်ရန်"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content body */}
        <div className="p-4 space-y-3">
          <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 text-[11px] text-indigo-950 flex gap-2">
            <QrCode size={14} className="text-indigo-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              နောက်ဆုံး ဖတ်ရှုခဲ့သော QR Code ၅ ခု၏ မှတ်တမ်းဖြစ်ပါသည်။ ဖုန်းကင်မရာဖြင့် ထပ်မံ စကင်ဖတ်ရန် မလိုဘဲ ဤမှတ်တမ်းမှတစ်ဆင့် အချက်အလက်များကို လွယ်ကူစွာ ပြန်လည်တင်သွင်း (Re-Import) နိုင်ပါသည်။
            </p>
          </div>

          {history.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-150 p-4">
              <History size={32} className="text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-400 font-semibold">စကင်ဖတ်ထားသော မှတ်တမ်းမရှိသေးပါ။</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
              {history.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="bg-white p-3 rounded-xl border border-slate-150 shadow-xxs hover:border-indigo-200 transition-all flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold">
                      <Calendar size={11} className="text-slate-400" />
                      <span>{item.timestamp}</span>
                    </div>
                    <span className="bg-indigo-50 text-indigo-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 border border-indigo-100/60">
                      <Users size={10} />
                      {item.parsedGuestsCount} ဦး တင်သွင်းရန်
                    </span>
                  </div>

                  <div className="text-xs text-slate-700 bg-slate-50 p-2 rounded-lg font-bold border border-slate-100 leading-normal">
                    {item.namesSummary || 'အမည်ဖော်ပြချက်မရှိပါ'}
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => onReImport(item.rawData)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors active:scale-95 cursor-pointer shadow-xs"
                      title="ဤမှတ်တမ်းမှ ဒေတာများကို စနစ်ထဲသို့ ပြန်လည်သွင်းမည်"
                    >
                      <Import size={12} />
                      <span>ဒေတာ ပြန်သွင်းမည် (Re-Import)</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="bg-slate-50 border-t border-slate-100 p-3 flex gap-2 justify-end">
          {history.length > 0 && (
            <button
              onClick={() => {
                if (confirm('စကင်မှတ်တမ်းအားလုံးကို ဖျက်ပစ်ရန် သေချာပါသလား?')) {
                  onClearHistory();
                }
              }}
              className="mr-auto px-3 py-2 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
              title="စကင်ဖတ်မှုမှတ်တမ်းအားလုံးကို အပြီးတိုင်ဖျက်မည်"
            >
              <Trash2 size={13} />
              <span>မှတ်တမ်းဖျက်မည်</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold cursor-pointer"
          >
            ပိတ်မည်
          </button>
        </div>
      </motion.div>
    </div>
  );
}
