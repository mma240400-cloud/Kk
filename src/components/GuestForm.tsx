/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, X, Users, UserPlus, Lock } from 'lucide-react';
import { Guest, FamilyMember } from '../types';
import CameraCapture from './CameraCapture';

interface GuestFormProps {
  initialGuest?: Guest | null;
  onSave: (guest: Guest) => void;
  onCancel?: () => void;
  isPublicForm?: boolean;
  onAdminLoginClick?: () => void;
  labelCurrent?: string;
  labelDeparted?: string;
}

export default function GuestForm({ initialGuest, onSave, onCancel, isPublicForm = false, onAdminLoginClick, labelCurrent = 'နေထိုင်ဆဲ', labelDeparted = 'ထွက်ခွာပြီး' }: GuestFormProps) {
  // Main form fields
  const [name, setName] = useState('');
  const [photo, setPhoto] = useState<string>('');
  const [dob, setDob] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [nrc, setNrc] = useState('');
  const [parents, setParents] = useState('');
  const [ethnicityReligion, setEthnicityReligion] = useState('');
  const [origin, setOrigin] = useState('');
  const [reason, setReason] = useState('');
  const [stayFrom, setStayFrom] = useState('');
  const [stayTo, setStayTo] = useState('');
  const [isCurrent, setIsCurrent] = useState(true);
  const [remarks, setRemarks] = useState('');
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);

  // Sub-form state for adding a family member
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [famName, setFamName] = useState('');
  const [famRelation, setFamRelation] = useState('');
  const [famAge, setFamAge] = useState<number | ''>('');
  const [famNrc, setFamNrc] = useState('');
  const [famPhoto, setFamPhoto] = useState<string>('');
  const [famError, setFamError] = useState('');

  // Auto calculate age if DOB changes
  useEffect(() => {
    if (dob) {
      const birthDate = new Date(dob);
      const today = new Date();
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const monthDifference = today.getMonth() - birthDate.getMonth();
      if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }
      if (calculatedAge >= 0) {
        setAge(calculatedAge);
      }
    }
  }, [dob]);

  // Load initial guest if in EDIT mode
  useEffect(() => {
    if (initialGuest) {
      setName(initialGuest.name);
      setPhoto(initialGuest.photo || '');
      setDob(initialGuest.dob);
      setAge(initialGuest.age);
      setNrc(initialGuest.nrc);
      setParents(initialGuest.parents);
      setEthnicityReligion(initialGuest.ethnicityReligion);
      setOrigin(initialGuest.origin);
      setReason(initialGuest.reason);
      setStayFrom(initialGuest.stayFrom);
      setStayTo(initialGuest.stayTo);
      setIsCurrent(initialGuest.isCurrent);
      setRemarks(initialGuest.remarks || '');
      setFamilyMembers(initialGuest.familyMembers || []);
    } else {
      // Set default stay dates (stayFrom is today, stayTo is today + 1 week)
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);
      
      setStayFrom(today.toISOString().split('T')[0]);
      setStayTo(nextWeek.toISOString().split('T')[0]);
    }
  }, [initialGuest]);

  const handleAddFamilyMember = () => {
    if (!famName.trim()) {
      setFamError('အမည် ထည့်သွင်းပေးပါရန်');
      return;
    }
    if (!famRelation.trim()) {
      setFamError('တော်စပ်ပုံ ရွေးချယ်/ထည့်သွင်းပေးပါရန်');
      return;
    }
    if (famAge === '' || Number(famAge) < 0) {
      setFamError('အသက် မှန်ကန်စွာ ထည့်သွင်းပေးပါရန်');
      return;
    }

    const newMember: FamilyMember = {
      id: `fam-${Date.now()}`,
      name: famName.trim(),
      relation: famRelation.trim(),
      age: Number(famAge),
      nrc: famNrc.trim() || undefined,
      photo: famPhoto || undefined
    };

    setFamilyMembers([...familyMembers, newMember]);
    
    // Reset sub-form
    setFamName('');
    setFamRelation('');
    setFamAge('');
    setFamNrc('');
    setFamPhoto('');
    setFamError('');
    setShowFamilyModal(false);
  };

  const handleRemoveFamilyMember = (id: string) => {
    setFamilyMembers(familyMembers.filter(member => member.id !== id));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      alert('ဧည့်သည်အမည် ထည့်သွင်းပေးပါရန်');
      return;
    }
    if (age === '' || Number(age) < 0) {
      alert('အသက် ထည့်သွင်းပေးပါရန်');
      return;
    }
    if (!nrc.trim()) {
      alert('မှတ်ပုံတင်အမှတ် ထည့်သွင်းပေးပါရန်');
      return;
    }
    if (!origin.trim()) {
      alert('လာရောက်သည့်ဒေသ ထည့်သွင်းပေးပါရန်');
      return;
    }

    const savedGuest: Guest = {
      id: initialGuest ? initialGuest.id : `guest-${Date.now()}`,
      name: name.trim(),
      photo: photo || undefined,
      dob,
      age: Number(age),
      nrc: nrc.trim(),
      parents: parents.trim(),
      ethnicityReligion: ethnicityReligion.trim(),
      origin: origin.trim(),
      reason: reason.trim(),
      stayFrom,
      stayTo,
      isCurrent,
      remarks: remarks.trim(),
      familyMembers,
      createdAt: initialGuest ? initialGuest.createdAt : new Date().toISOString()
    };

    onSave(savedGuest);
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col h-full min-h-[90vh]">
      {/* Header */}
      <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          {!isPublicForm && onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className="p-1.5 hover:bg-slate-800 rounded-full text-slate-300 hover:text-white transition-colors cursor-pointer"
              id="back-button"
            >
              <ArrowLeft size={22} />
            </button>
          ) : (
            <div className="p-2 bg-emerald-600 text-white rounded-xl">
              <Users size={20} />
            </div>
          )}
          <div>
            <h1 className="font-bold text-lg tracking-tight" id="form-title">
              {initialGuest ? 'ဧည့်သည်အချက်အလက် ပြင်ဆင်ရန်' : 'ဧည့်သည်အသစ် စာရင်းသွင်းရန်'}
            </h1>
            <p className="text-xs text-slate-400">ဧည့်သည်နှင့် မိသားစုဝင်များ၏ အသေးစိတ်အချက်အလက်များ</p>
          </div>
        </div>

        {isPublicForm && onAdminLoginClick && (
          <button
            type="button"
            onClick={onAdminLoginClick}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-emerald-400 hover:text-emerald-300 text-xs font-semibold rounded-xl transition-all border border-slate-700 cursor-pointer"
          >
            <Lock size={14} />
            <span>အက်ဒမင် ဝင်ရန်</span>
          </button>
        )}
      </div>

      {/* Scrollable Form Content */}
      <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Photo Upload Area */}
        <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
          <label className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">
            ဧည့်သည်ဓာတ်ပုံ (Photo)
          </label>
          <CameraCapture
            onCapture={(img) => setPhoto(img)}
            currentImage={photo}
            label="ဧည့်သည်ဓာတ်ပုံရိုက်ရန် / တင်ရန်"
          />
        </div>

        {/* Guest General Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-emerald-900 border-l-4 border-emerald-600 pl-2">
            အခြေခံအချက်အလက်များ (Personal Info)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-slate-700 mb-1.5" htmlFor="guest-name">
                အမည် <span className="text-rose-500">*</span>
              </label>
              <input
                id="guest-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="မောင်မောင်"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800"
              />
            </div>

            {/* DOB */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-slate-700 mb-1.5" htmlFor="guest-dob">
                မွေးသက္ကရာဇ် (ရွေးချယ်နိုင်သည်)
              </label>
              <input
                id="guest-dob"
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800"
              />
            </div>

            {/* Age */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-slate-700 mb-1.5" htmlFor="guest-age">
                အသက် <span className="text-rose-500">*</span>
              </label>
              <input
                id="guest-age"
                type="number"
                required
                min="0"
                value={age}
                onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="ဥပမာ - ၂၅"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800"
              />
            </div>

            {/* NRC */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-slate-700 mb-1.5" htmlFor="guest-nrc">
                မှတ်ပုံတင်အမှတ် <span className="text-rose-500">*</span>
              </label>
              <input
                id="guest-nrc"
                type="text"
                required
                value={nrc}
                onChange={(e) => setNrc(e.target.value)}
                placeholder="၁၂/လမတ(နိုင်)၁၂၃၄၅၆"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800"
              />
            </div>

            {/* Parents Name */}
            <div className="flex flex-col md:col-span-2">
              <label className="text-sm font-medium text-slate-700 mb-1.5" htmlFor="guest-parents">
                မိဘအမည် (Father & Mother Names)
              </label>
              <input
                id="guest-parents"
                type="text"
                value={parents}
                onChange={(e) => setParents(e.target.value)}
                placeholder="ဦးလှ + ဒေါ်မြ"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800"
              />
            </div>

            {/* Ethnicity & Religion */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-slate-700 mb-1.5" htmlFor="guest-ethnicity">
                လူမျိုး / ဘာသာ
              </label>
              <input
                id="guest-ethnicity"
                type="text"
                value={ethnicityReligion}
                onChange={(e) => setEthnicityReligion(e.target.value)}
                placeholder="ဗမာ / ဗုဒ္ဓ"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800"
              />
            </div>

            {/* Current Status */}
            <div className="flex flex-col justify-end pb-1">
              <label className="text-sm font-medium text-slate-700 mb-2">
                လက်ရှိနေထိုင်မှုအခြေအနေ (Status)
              </label>
              <div className="flex gap-4">
                <label className="flex-1 flex items-center justify-center gap-2 border border-emerald-200 bg-emerald-50 text-emerald-800 py-2.5 rounded-xl cursor-pointer transition-all hover:bg-emerald-100 font-medium">
                  <input
                    type="radio"
                    checked={isCurrent === true}
                    onChange={() => setIsCurrent(true)}
                    className="accent-emerald-600"
                  />
                  {labelCurrent}
                </label>
                <label className="flex-1 flex items-center justify-center gap-2 border border-slate-200 bg-slate-50 text-slate-700 py-2.5 rounded-xl cursor-pointer transition-all hover:bg-slate-100 font-medium">
                  <input
                    type="radio"
                    checked={isCurrent === false}
                    onChange={() => setIsCurrent(false)}
                    className="accent-slate-600"
                  />
                  {labelDeparted}
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Visit Details */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-emerald-900 border-l-4 border-emerald-600 pl-2">
            ခရီးစဉ်အချက်အလက်များ (Travel & Visit Details)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Origin Region */}
            <div className="flex flex-col md:col-span-2">
              <label className="text-sm font-medium text-slate-700 mb-1.5" htmlFor="guest-origin">
                လာရောက်သည့်ဒေသ <span className="text-rose-500">*</span>
              </label>
              <input
                id="guest-origin"
                type="text"
                required
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="ဥပမာ - မန္တလေးမြို့၊ ချမ်းအေးသာစံမြို့နယ်"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800"
              />
            </div>

            {/* Reason for Visit */}
            <div className="flex flex-col md:col-span-2">
              <label className="text-sm font-medium text-slate-700 mb-1.5" htmlFor="guest-reason">
                လာရောက်သည့်ကိစ္စ
              </label>
              <input
                id="guest-reason"
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="ဥပမာ - ဆွေမျိုးအိမ်သို့ လာရောက်လည်ပတ်ခြင်း"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800"
              />
            </div>

            {/* Stay From */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-slate-700 mb-1.5" htmlFor="stay-from">
                နေထိုင်မည့်ကာလ (မှ)
              </label>
              <input
                id="stay-from"
                type="date"
                value={stayFrom}
                onChange={(e) => setStayFrom(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800"
              />
            </div>

            {/* Stay To */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-slate-700 mb-1.5" htmlFor="stay-to">
                နေထိုင်မည့်ကာလ (ထိ)
              </label>
              <input
                id="stay-to"
                type="date"
                value={stayTo}
                onChange={(e) => setStayTo(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Family Members Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-l-4 border-emerald-600 pl-2">
            <div>
              <h3 className="text-sm font-bold text-emerald-900">
                အတူပါလာသည့် မိသားစုဝင်များ (Family Members)
              </h3>
              <p className="text-xs text-slate-400">
                မိသားစုဝင်တစ်ဦးချင်း ဓာတ်ပုံ+အချက်အလက် ထည့်နိုင်သည်
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setFamError('');
                setShowFamilyModal(true);
              }}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg flex items-center gap-1 shadow-sm transition-all"
              id="add-family-btn"
            >
              <Plus size={14} />
              မိသားစုဝင်ထည့်ရန်
            </button>
          </div>

          {familyMembers.length === 0 ? (
            <div className="p-6 border border-slate-100 bg-slate-50 rounded-2xl text-center text-slate-400 text-xs flex flex-col items-center justify-center">
              <Users size={24} className="text-slate-300 mb-2" />
              အတူပါလာသည့် မိသားစုဝင် မရှိသေးပါ။
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {familyMembers.map((member) => (
                <div
                  key={member.id}
                  className="p-3 border border-slate-200/80 bg-white rounded-xl flex items-center justify-between gap-3 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
                      {member.photo ? (
                        <img
                          src={member.photo}
                          alt={member.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <Users size={18} />
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800 text-xs">{member.name}</h4>
                      <p className="text-[10px] text-emerald-600 font-medium">
                        {member.relation} • အသက် {member.age} နှစ်
                      </p>
                      {member.nrc && (
                        <p className="text-[9px] text-slate-400 truncate max-w-[130px]">{member.nrc}</p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveFamilyMember(member.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                    title="ဖျက်ရန်"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Remarks */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-slate-700 mb-1.5" htmlFor="guest-remarks">
            မှတ်ချက် (Remarks / Extra notes)
          </label>
          <textarea
            id="guest-remarks"
            rows={3}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="မှတ်သားရန်အကြောင်းအရာများ..."
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800 text-sm resize-none"
          />
        </div>
      </form>

      {/* Sticky Bottom Actions */}
      <div className="bg-slate-50 border-t border-slate-100 p-4 shrink-0 flex gap-3">
        {isPublicForm ? (
          <button
            type="button"
            onClick={() => {
              setName('');
              setPhoto('');
              setDob('');
              setAge('');
              setNrc('');
              setParents('');
              setEthnicityReligion('');
              setOrigin('');
              setReason('');
              const today = new Date();
              const nextWeek = new Date();
              nextWeek.setDate(today.getDate() + 7);
              setStayFrom(today.toISOString().split('T')[0]);
              setStayTo(nextWeek.toISOString().split('T')[0]);
              setIsCurrent(true);
              setRemarks('');
              setFamilyMembers([]);
            }}
            className="flex-1 py-3 text-slate-500 hover:text-slate-700 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl font-semibold text-sm transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer"
            id="btn-reset"
          >
            ပြန်စရန် (Reset)
          </button>
        ) : (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 text-slate-700 hover:text-slate-900 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl font-semibold text-sm transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer"
            id="btn-cancel"
          >
            ပယ်ဖျက်
          </button>
        )}
        <button
          type="button"
          onClick={handleFormSubmit}
          className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1 active:scale-[0.98] cursor-pointer"
          id="btn-save"
        >
          {isPublicForm ? 'ဧည့်စာရင်းတင်သွင်းမည်' : 'သိမ်းရန်'}
        </button>
      </div>

      {/* Nested Modal for Adding a Family Member */}
      {showFamilyModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-emerald-800 text-white px-4 py-3 flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                <UserPlus size={16} />
                မိသားစုဝင်အသစ် ထည့်ရန်
              </h3>
              <button
                type="button"
                onClick={() => setShowFamilyModal(false)}
                className="text-emerald-200 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto">
              {famError && (
                <div className="p-2 border border-rose-100 bg-rose-50 text-rose-500 text-xs font-semibold rounded-lg text-center">
                  {famError}
                </div>
              )}

              {/* Family Photo Capture */}
              <div className="flex flex-col items-center justify-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                <label className="text-[10px] font-bold text-slate-400 mb-1.5 uppercase">
                  မိသားစုဝင်ဓာတ်ပုံ (Photo)
                </label>
                <CameraCapture
                  onCapture={(img) => setFamPhoto(img)}
                  currentImage={famPhoto}
                  label="ဓာတ်ပုံရိုက်ရန်"
                />
              </div>

              {/* Name */}
              <div className="flex flex-col">
                <label className="text-xs font-semibold text-slate-600 mb-1" htmlFor="fam-name">
                  အမည် <span className="text-rose-500">*</span>
                </label>
                <input
                  id="fam-name"
                  type="text"
                  required
                  value={famName}
                  onChange={(e) => setFamName(e.target.value)}
                  placeholder="ဦးသန်းမြ"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
                />
              </div>

              {/* Relation / တော်စပ်ပုံ */}
              <div className="flex flex-col">
                <label className="text-xs font-semibold text-slate-600 mb-1" htmlFor="fam-rel">
                  တော်စပ်ပုံ <span className="text-rose-500">*</span>
                </label>
                <input
                  id="fam-rel"
                  type="text"
                  required
                  value={famRelation}
                  onChange={(e) => setFamRelation(e.target.value)}
                  placeholder="ဇနီး၊ သား၊ သမီး၊ ညီမ၊ တူ၊ ဆွေမျိုး စသည်"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
                />
              </div>

              {/* Age */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col">
                  <label className="text-xs font-semibold text-slate-600 mb-1" htmlFor="fam-age">
                    အသက် <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="fam-age"
                    type="number"
                    required
                    min="0"
                    value={famAge}
                    onChange={(e) => setFamAge(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="၃၄"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-semibold text-slate-600 mb-1" htmlFor="fam-nrc">
                    မှတ်ပုံတင် (ရွေးချယ်နိုင်သည်)
                  </label>
                  <input
                    id="fam-nrc"
                    type="text"
                    value={famNrc}
                    onChange={(e) => setFamNrc(e.target.value)}
                    placeholder="၁၂/လမတ(နိုင်)၁၂၃၄၅၇"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="bg-slate-50 border-t border-slate-100 p-3 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowFamilyModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg transition-colors"
              >
                ပယ်ဖျက်
              </button>
              <button
                type="button"
                onClick={handleAddFamilyMember}
                className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
              >
                ထည့်သွင်းမည်
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
