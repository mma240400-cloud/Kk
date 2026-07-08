/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Guest } from '../types';

// Let's create high-quality default SVGs for profile placeholders so the user can see them and download them directly
export const createAvatarSvg = (name: string, bgColor: string, txtColor: string = '#FFFFFF'): string => {
  const initials = name.slice(0, 2);
  const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
      <rect width="100%" height="100%" fill="${bgColor}"/>
      <circle cx="60" cy="45" r="22" fill="none" stroke="${txtColor}" stroke-width="4" opacity="0.9"/>
      <path d="M25 95 C 25 70, 95 70, 95 95" fill="none" stroke="${txtColor}" stroke-width="4" stroke-linecap="round" opacity="0.9"/>
      <text x="50%" y="82%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="bold" font-size="14" fill="${txtColor}">${initials}</text>
    </svg>
  `.trim();
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
};

export const INITIAL_GUESTS: Guest[] = [
  {
    id: 'guest-1',
    name: 'ဦးမင်းနောင်',
    photo: createAvatarSvg('ဦးမင်းနောင်', '#1e3a8a'),
    dob: '1985-05-15',
    age: 41,
    nrc: '၁၂/လမတ(နိုင်)၁၅၄၃၂၁',
    parents: 'ဦးအောင်မင်း + ဒေါ်လှလှ',
    ethnicityReligion: 'ဗမာ / ဗုဒ္ဓ',
    origin: 'ရန်ကုန်၊ လသာမြို့နယ်',
    reason: 'အလုပ်ကိစ္စဖြင့် ခေတ္တလာရောက်လည်ပတ်ခြင်း',
    stayFrom: '2026-07-01',
    stayTo: '2026-07-15',
    isCurrent: true,
    remarks: 'ခြံဝင်းအတွင်း ဧည့်ဂေဟာတွင် တည်းခိုမည်ဖြစ်ပါသည်။',
    createdAt: '2026-07-01T09:00:00.000Z',
    familyMembers: [
      {
        id: 'fam-1-1',
        name: 'ဒေါ်နီနီခင်',
        relation: 'ဇနီး',
        age: 38,
        nrc: '၁၂/လမတ(နိုင်)၁၅၄၃၂၂',
        photo: createAvatarSvg('ဒေါ်နီနီခင်', '#db2777'),
      },
      {
        id: 'fam-1-2',
        name: 'မောင်မင်းသန့်',
        relation: 'သား',
        age: 12,
        photo: createAvatarSvg('မောင်မင်းသန့်', '#059669'),
      }
    ]
  },
  {
    id: 'guest-2',
    name: 'မသက်နှင်းဝေ',
    photo: createAvatarSvg('မသက်နှင်းဝေ', '#7c3aed'),
    dob: '1998-10-22',
    age: 27,
    nrc: '၉/မရမ(နိုင်)၀၉၈၇၆၅',
    parents: 'ဦးသန်းထွန်း + ဒေါ်မြမြ',
    ethnicityReligion: 'ဗမာ / ဗုဒ္ဓ',
    origin: 'မန္တလေး၊ မဟာအောင်မြေမြို့နယ်',
    reason: 'တက္ကသိုလ်စာမေးပွဲ ဖြေဆိုရန် လာရောက်ခြင်း',
    stayFrom: '2026-07-03',
    stayTo: '2026-07-10',
    isCurrent: true,
    remarks: 'စာမေးပွဲကာလပြီးပါက ဇာတိသို့ ပြန်ပါမည်။',
    createdAt: '2026-07-03T14:30:00.000Z',
    familyMembers: []
  },
  {
    id: 'guest-3',
    name: 'ဦးစိုင်းနောင်ခမ်း',
    photo: createAvatarSvg('ဦးစိုင်းနောင်ခမ်း', '#d97706'),
    dob: '1990-01-05',
    age: 36,
    nrc: '၁၃/တကန(နိုင်)၁၁၂၂၃၃',
    parents: 'ဦးစိုင်းခမ်း + ဒေါ်နန်းလှ',
    ethnicityReligion: 'ရှမ်း / ဗုဒ္ဓ',
    origin: 'ရှမ်းပြည်နယ်၊ တောင်ကြီးမြို့',
    reason: 'ဆေးကုသရန် ခေတ္တလာရောက်တည်းခိုခြင်း',
    stayFrom: '2026-06-20',
    stayTo: '2026-06-28',
    isCurrent: false, // ပြန်လည်ထွက်ခွာပြီး (Already left)
    remarks: 'ဆေးရုံဆင်းပြီးနောက် နေအိမ်သို့ ပြန်လည်ထွက်ခွာသွားပါပြီ။',
    createdAt: '2026-06-20T11:15:00.000Z',
    familyMembers: [
      {
        id: 'fam-3-1',
        name: 'နန်းမွေလှိုင်',
        relation: 'ညီမ',
        age: 29,
        nrc: '၁၃/တကန(နိုင်)၁၁၂၂၃၄',
        photo: createAvatarSvg('နန်းမွေလှိုင်', '#0891b2'),
      }
    ]
  }
];
