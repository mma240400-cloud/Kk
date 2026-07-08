/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Calendar,
  MapPin,
  Users,
  Copy,
  Download,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock
} from 'lucide-react';
import { Guest, FamilyMember } from '../types';

interface GuestDetailProps {
  guest: Guest;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStatusToggle: (id: string, isCurrent: boolean) => void;
}

export default function GuestDetail({ guest, onClose, onEdit, onDelete, onStatusToggle }: GuestDetailProps) {
  const [activePhoto, setActivePhoto] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  const triggerCopyFeedback = (msg: string) => {
    setCopySuccess(msg);
    setTimeout(() => setCopySuccess(null), 2500);
  };

  // 1. Download Photo
  const handleDownloadPhoto = (photoData: string, filename: string) => {
    const link = document.createElement('a');
    link.href = photoData;
    link.download = `${filename}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerCopyFeedback('ဓာတ်ပုံ ဒေါင်းလုဒ်ရယူပြီးပါပြီ');
  };

  // 2. Copy Photo to Clipboard (Base64 data or SVG blob conversion)
  const handleCopyPhoto = async (photoData: string) => {
    try {
      // If it's standard base64/SVG data:
      if (photoData.startsWith('data:image/svg+xml')) {
        // Since copying SVG directly is tricky, we can draw to canvas and copy as PNG
        const img = new Image();
        img.src = photoData;
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width || 200;
          canvas.height = img.height || 200;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            canvas.toBlob(async (blob) => {
              if (blob) {
                try {
                  await navigator.clipboard.write([
                    new ClipboardItem({ 'image/png': blob })
                  ]);
                  triggerCopyFeedback('ဓာတ်ပုံကို Clipboard ထဲသို့ ကူးယူပြီးပါပြီ');
                } catch (e) {
                  // Fallback: copy the raw base64 or link text
                  await navigator.clipboard.writeText(photoData);
                  triggerCopyFeedback('ဓာတ်ပုံလင့်ခ်ကို ကူးယူပြီးပါပြီ');
                }
              }
            }, 'image/png');
          }
        };
      } else if (photoData.startsWith('data:image/jpeg') || photoData.startsWith('data:image/png')) {
        const response = await fetch(photoData);
        const blob = await response.blob();
        await navigator.clipboard.write([
          new ClipboardItem({ [blob.type]: blob })
        ]);
        triggerCopyFeedback('ဓာတ်ပုံကို Clipboard ထဲသို့ ကူးယူပြီးပါပြီ');
      } else {
        await navigator.clipboard.writeText(photoData);
        triggerCopyFeedback('ဓာတ်ပုံလင့်ခ်ကို ကူးယူပြီးပါပြီ');
      }
    } catch (err) {
      console.error('Failed to copy photo:', err);
      // Fallback: copy plain text URL
      try {
        await navigator.clipboard.writeText(photoData);
        triggerCopyFeedback('ဓာတ်ပုံလင့်ခ်ကို ကူးယူပြီးပါပြီ (လုံခြုံရေးအရ)');
      } catch (e) {
        alert('ဓာတ်ပုံကူးယူရန် အဆင်မပြေပါ။ ဒေါင်းလုဒ်ခလုတ်ကို အသုံးပြုပေးပါ။');
      }
    }
  };

  // 3. Copy Details to Clipboard as fully formatted report text
  const handleCopyFullDetails = () => {
    let report = `📝 ဧည့်စာရင်း တိုင်ကြားခြင်း အသေးစိတ်အချက်အလက်\n`;
    report += `====================================\n`;
    report += `👤 အမည်: ${guest.name} (${guest.age} နှစ်)\n`;
    report += `💳 မှတ်ပုံတင်အမှတ်: ${guest.nrc}\n`;
    if (guest.dob) report += `📅 မွေးသက္ကရာဇ်: ${guest.dob}\n`;
    if (guest.parents) report += `👨‍👩‍👦 မိဘအမည်: ${guest.parents}\n`;
    if (guest.ethnicityReligion) report += `🎋 လူမျိုး / ဘာသာ: ${guest.ethnicityReligion}\n`;
    report += `📍 လာရောက်သည့်ဒေသ: ${guest.origin}\n`;
    if (guest.reason) report += `💼 လာရောက်သည့်ကိစ္စ: ${guest.reason}\n`;
    report += `⏱ နေထိုင်မည့်ကာလ: ${guest.stayFrom} မှ ${guest.stayTo} ထိ\n`;
    report += `🟢 အခြေအနေ: ${guest.isCurrent ? 'နေထိုင်ဆဲ' : 'ပြန်လည်ထွက်ခွာပြီး'}\n`;
    
    if (guest.remarks) {
      report += `💬 မှတ်ချက်: ${guest.remarks}\n`;
    }

    if (guest.familyMembers && guest.familyMembers.length > 0) {
      report += `\n👥 အတူပါလာသည့် မိသားစုဝင်များ (${guest.familyMembers.length} ဦး):\n`;
      guest.familyMembers.forEach((member, index) => {
        report += `${index + 1}။ ${member.name} (${member.relation} • အသက် ${member.age} နှစ်${member.nrc ? ` • ${member.nrc}` : ''})\n`;
      });
    } else {
      report += `\n👥 အတူပါလာသည့် မိသားစုဝင် မရှိပါ။\n`;
    }
    report += `====================================\n`;
    report += `📅 စာရင်းသွင်းချိန်: ${new Date(guest.createdAt).toLocaleString('my-MM', { hour12: true })}\n`;

    navigator.clipboard.writeText(report)
      .then(() => triggerCopyFeedback('အသေးစိတ်အချက်အလက်အားလုံး ကူးယူပြီးပါပြီ'))
      .catch(() => alert('ကူးယူရန် အဆင်မပြေပါ။'));
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-40 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
        
        {/* Detail Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div>
            <span className="text-[10px] font-bold tracking-wider uppercase bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full mb-1 inline-block">
              ဧည့်သည် အသေးစိတ်ကြည့်ရန်
            </span>
            <h2 className="font-bold text-lg tracking-tight">{guest.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-300 hover:text-white transition-colors"
            title="ပိတ်ရန်"
            id="close-detail-btn"
          >
            <X size={20} />
          </button>
        </div>

        {/* Copy Success Feedback Overlay Banner */}
        {copySuccess && (
          <div className="bg-emerald-600 text-white text-xs font-semibold px-4 py-2 text-center animate-in slide-in-from-top duration-200 shrink-0 shadow-sm">
            🎉 {copySuccess}
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Photos and Quick actions row */}
          <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-inner">
            <div
              className="relative w-28 h-28 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 flex-shrink-0 cursor-pointer shadow-md group"
              onClick={() => setActivePhoto(guest.photo || null)}
              title="ဓာတ်ပုံကို အပြည့်ကြည့်ရန် ကလစ်နှိပ်ပါ"
            >
              {guest.photo ? (
                <img
                  src={guest.photo}
                  alt={guest.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:brightness-90 transition-all"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-100">
                  <Users size={32} />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-medium">
                ပုံကြီးကြည့်ရန်
              </div>
            </div>

            <div className="space-y-2 flex-1 w-full">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer select-none transition-all ${
                  guest.isCurrent 
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200' 
                    : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
                }`}
                onClick={() => onStatusToggle(guest.id, !guest.isCurrent)}
                title="အခြေအနေပြောင်းရန် နှိပ်ပါ"
                >
                  {guest.isCurrent ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                  {guest.isCurrent ? 'လက်ရှိ နေထိုင်ဆဲ' : 'ပြန်လည်ထွက်ခွာပြီး'}
                  <span className="text-[9px] underline opacity-75 font-normal ml-0.5">(ပြောင်းရန် နှိပ်ပါ)</span>
                </span>
              </div>

              {/* Action buttons for main photo */}
              {guest.photo && (
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={() => handleCopyPhoto(guest.photo!)}
                    className="px-3 py-1.5 bg-white border border-slate-200 hover:border-emerald-200 text-slate-700 hover:text-emerald-600 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors"
                  >
                    <Copy size={12} />
                    ဓာတ်ပုံ ကူးယူမည်
                  </button>
                  <button
                    onClick={() => handleDownloadPhoto(guest.photo!, `${guest.name}_photo`)}
                    className="px-3 py-1.5 bg-white border border-slate-200 hover:border-emerald-200 text-slate-700 hover:text-emerald-600 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors"
                  >
                    <Download size={12} />
                    ဓာတ်ပုံ ဒေါင်းလုဒ်
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Details list */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <FileText size={16} className="text-emerald-600" />
                ဧည့်သည်အသေးစိတ် အချက်အလက်များ
              </h3>
              <button
                onClick={handleCopyFullDetails}
                className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg flex items-center gap-1 transition-colors"
              >
                <Copy size={12} />
                အားလုံးကူးယူမည်
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5 text-sm">
              <div className="flex flex-col border-b border-slate-50 pb-1.5">
                <span className="text-xs text-slate-400 font-medium">အမည်</span>
                <span className="font-semibold text-slate-800 mt-0.5">{guest.name}</span>
              </div>

              <div className="flex flex-col border-b border-slate-50 pb-1.5">
                <span className="text-xs text-slate-400 font-medium">အသက်</span>
                <span className="font-semibold text-slate-800 mt-0.5">{guest.age} နှစ်</span>
              </div>

              {guest.dob && (
                <div className="flex flex-col border-b border-slate-50 pb-1.5">
                  <span className="text-xs text-slate-400 font-medium">မွေးသက္ကရာဇ်</span>
                  <span className="font-semibold text-slate-800 mt-0.5">{guest.dob}</span>
                </div>
              )}

              <div className="flex flex-col border-b border-slate-50 pb-1.5">
                <span className="text-xs text-slate-400 font-medium">မှတ်ပုံတင်အမှတ်</span>
                <span className="font-semibold text-emerald-900 font-mono mt-0.5">{guest.nrc}</span>
              </div>

              {guest.parents && (
                <div className="flex flex-col sm:col-span-2 border-b border-slate-50 pb-1.5">
                  <span className="text-xs text-slate-400 font-medium">မိဘအမည်</span>
                  <span className="font-semibold text-slate-800 mt-0.5">{guest.parents}</span>
                </div>
              )}

              {guest.ethnicityReligion && (
                <div className="flex flex-col border-b border-slate-50 pb-1.5">
                  <span className="text-xs text-slate-400 font-medium">လူမျိုး / ဘာသာ</span>
                  <span className="font-semibold text-slate-800 mt-0.5">{guest.ethnicityReligion}</span>
                </div>
              )}

              <div className="flex flex-col border-b border-slate-50 pb-1.5">
                <span className="text-xs text-slate-400 font-medium">လာရောက်သည့်ဒေသ</span>
                <span className="font-semibold text-slate-800 mt-0.5 flex items-center gap-1">
                  <MapPin size={13} className="text-slate-400" />
                  {guest.origin}
                </span>
              </div>

              {guest.reason && (
                <div className="flex flex-col sm:col-span-2 border-b border-slate-50 pb-1.5">
                  <span className="text-xs text-slate-400 font-medium">လာရောက်သည့်ကိစ္စ</span>
                  <span className="font-semibold text-slate-800 mt-0.5">{guest.reason}</span>
                </div>
              )}

              <div className="flex flex-col sm:col-span-2 border-b border-slate-50 pb-1.5">
                <span className="text-xs text-slate-400 font-medium">နေထိုင်မည့်ကာလ</span>
                <span className="font-semibold text-slate-800 mt-0.5 flex items-center gap-1.5">
                  <Calendar size={13} className="text-slate-400" />
                  {guest.stayFrom} မှ {guest.stayTo} ထိ
                </span>
              </div>

              <div className="flex flex-col sm:col-span-2">
                <span className="text-xs text-slate-400 font-medium">စာရင်းသွင်းချိန်</span>
                <span className="text-slate-500 text-xs mt-0.5 flex items-center gap-1.5">
                  <Clock size={12} />
                  {new Date(guest.createdAt).toLocaleString('my-MM', { dateStyle: 'long', timeStyle: 'short' })}
                </span>
              </div>
            </div>
          </div>

          {/* Family Members list section */}
          <div className="space-y-3.5 border-t border-slate-100 pt-5">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <Users size={16} className="text-emerald-600" />
              အတူပါလာသည့် မိသားစုဝင်များ ({guest.familyMembers.length} ဦး)
            </h3>

            {guest.familyMembers.length === 0 ? (
              <p className="text-xs text-slate-400 bg-slate-50 p-4 rounded-xl border border-dashed border-slate-200 text-center">
                အတူပါလာသည့် မိသားစုဝင် မရှိပါ။
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {guest.familyMembers.map((member) => (
                  <div
                    key={member.id}
                    className="p-3 border border-slate-150 bg-slate-50 rounded-xl flex items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-lg bg-slate-200 overflow-hidden flex-shrink-0 border border-slate-300 cursor-pointer group relative"
                        onClick={() => member.photo && setActivePhoto(member.photo)}
                        title="ပုံကြီးကြည့်ရန်"
                      >
                        {member.photo ? (
                          <img
                            src={member.photo}
                            alt={member.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:brightness-90 transition-all"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100">
                            <Users size={16} />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800 text-xs">{member.name}</h4>
                        <p className="text-[10px] text-emerald-700 font-medium">
                          {member.relation} • အသက် {member.age} နှစ်
                        </p>
                        {member.nrc && (
                          <p className="text-[9px] text-slate-400 font-mono">{member.nrc}</p>
                        )}
                      </div>
                    </div>

                    {/* Mini actions for family members */}
                    {member.photo && (
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => handleCopyPhoto(member.photo!)}
                          className="p-1 hover:bg-white text-slate-400 hover:text-emerald-600 rounded border border-transparent hover:border-slate-200 transition-all"
                          title="မိသားစုဝင်ဓာတ်ပုံ ကူးရန်"
                        >
                          <Copy size={11} />
                        </button>
                        <button
                          onClick={() => handleDownloadPhoto(member.photo!, `${member.name}_photo`)}
                          className="p-1 hover:bg-white text-slate-400 hover:text-emerald-600 rounded border border-transparent hover:border-slate-200 transition-all"
                          title="မိသားစုဝင်ဓာတ်ပုံ ဒေါင်းလုဒ်"
                        >
                          <Download size={11} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Remarks text block */}
          {guest.remarks && (
            <div className="p-3.5 bg-amber-50/50 border border-amber-100 rounded-2xl">
              <h4 className="text-xs font-bold text-amber-900 mb-1">မှတ်ချက်</h4>
              <p className="text-xs text-amber-800 leading-relaxed whitespace-pre-line">{guest.remarks}</p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="bg-slate-50 border-t border-slate-100 p-4 shrink-0 flex gap-3">
          <button
            onClick={onDelete}
            className="px-4 py-2.5 text-rose-600 hover:text-rose-700 border border-rose-200 hover:bg-rose-50 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-1"
          >
            <Trash2 size={14} />
            စာရင်းမှဖျက်ရန်
          </button>
          <div className="flex-1 flex gap-2">
            <button
              onClick={onEdit}
              className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-xs transition-all shadow-sm flex items-center justify-center gap-1 active:scale-[0.98]"
            >
              <Edit size={14} />
              ပြင်ဆင်ရန်
            </button>
          </div>
        </div>

        {/* Full Screen Photo Lightbox (Mobile viewer / downloader) */}
        {activePhoto && (
          <div
            className="fixed inset-0 bg-black/95 flex flex-col items-center justify-center p-4 z-50 animate-in fade-in duration-200"
            onClick={() => setActivePhoto(null)}
          >
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyPhoto(activePhoto);
                }}
                className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
                title="ဓာတ်ပုံ ကူးယူရန်"
              >
                <Copy size={20} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownloadPhoto(activePhoto, 'photo_large');
                }}
                className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
                title="ဓာတ်ပုံ ဒေါင်းလုဒ်"
              >
                <Download size={20} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActivePhoto(null);
                }}
                className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
                title="ပိတ်ရန်"
              >
                <X size={20} />
              </button>
            </div>
            
            <img
              src={activePhoto}
              alt="Full view"
              referrerPolicy="no-referrer"
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            
            <p className="text-slate-400 text-xs mt-4 text-center select-none">
              ပိတ်ရန် မည်သည့်နေရာမဆို ကလစ်နှိပ်နိုင်ပါသည်
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
