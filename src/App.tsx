/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Plus,
  Settings,
  LogOut,
  Users,
  CheckCircle2,
  AlertCircle,
  FileDown,
  FileUp,
  Download,
  Trash2,
  Info,
  ChevronDown,
  SlidersHorizontal,
  Home,
  X,
  QrCode,
  Share2,
  Clipboard,
  Check,
  Calendar,
  Lock,
  Unlock,
  Printer,
  Eye,
  EyeOff
} from 'lucide-react';
import { Guest, FilterStatus, SortOption } from './types';
import { INITIAL_GUESTS } from './data/mockData';
import GuestCard from './components/GuestCard';
import GuestDetail from './components/GuestDetail';
import GuestForm from './components/GuestForm';
import QRCode from 'qrcode';

const LOCAL_STORAGE_KEY = 'myanmar_guest_registry_data';

const unicodeBtoa = (str: string) => btoa(unescape(encodeURIComponent(str)));
const unicodeAtob = (str: string) => decodeURIComponent(escape(atob(str)));

const KEY_MAP: Record<string, string> = {
  id: 'i',
  name: 'n',
  nrc: 'c',
  age: 'a',
  dob: 'd',
  stayFrom: 'f',
  stayTo: 't',
  origin: 'o',
  reason: 'r',
  remarks: 'm',
  parents: 'p',
  ethnicityReligion: 'e',
  isCurrent: 'u',
  familyMembers: 'y',
  relation: 'l'
};

const REVERSE_KEY_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(KEY_MAP).map(([k, v]) => [v, k])
);

const compressGuest = (g: any) => {
  const result: any = {};
  for (const [key, val] of Object.entries(g)) {
    if (key === 'photo') continue;
    const shortKey = KEY_MAP[key] || key;
    if (key === 'familyMembers' && Array.isArray(val)) {
      result[shortKey] = val.map((m: any) => {
        const compressedMember: any = {};
        for (const [mKey, mVal] of Object.entries(m)) {
          if (mKey === 'photo') continue;
          compressedMember[KEY_MAP[mKey] || mKey] = mVal;
        }
        return compressedMember;
      });
    } else {
      result[shortKey] = val;
    }
  }
  return result;
};

const decompressGuest = (cg: any) => {
  const result: any = {};
  for (const [key, val] of Object.entries(cg)) {
    const longKey = REVERSE_KEY_MAP[key] || key;
    if (longKey === 'familyMembers' && Array.isArray(val)) {
      result[longKey] = val.map((m: any) => {
        const decompressedMember: any = {};
        for (const [mKey, mVal] of Object.entries(m)) {
          decompressedMember[REVERSE_KEY_MAP[mKey] || mKey] = mVal;
        }
        return decompressedMember;
      });
    } else {
      result[longKey] = val;
    }
  }
  return result;
};

// Helper to calculate date ranges (This Month, Last Month, etc.)
const getMonthRange = (offset: number) => {
  const d = new Date();
  d.setDate(1); // Set day to 1 first to avoid month overflow
  d.setMonth(d.getMonth() + offset);
  const year = d.getFullYear();
  const month = d.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const rd = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${rd}`;
  };
  
  return {
    start: formatDate(firstDay),
    end: formatDate(lastDay)
  };
};

export default function App() {
  // Main database state
  const [guests, setGuests] = useState<Guest[]>([]);
  
  // Navigation & view states
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Date Range Filter state
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [showDateFilter, setShowDateFilter] = useState(false);
  
  // Custom configurations (e.g. Admin Info)
  const [adminPhone, setAdminPhone] = useState(() => {
    return localStorage.getItem('guest_registry_admin_phone') || '09672804206';
  });
  const [adminRole, setAdminRole] = useState(() => {
    return localStorage.getItem('guest_registry_admin_role') || 'Admin';
  });
  const [adminPasscode, setAdminPasscode] = useState(() => {
    return localStorage.getItem('guest_registry_admin_passcode') || '123456';
  });
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Dynamic button/status labels state
  const [labelAll, setLabelAll] = useState(() => {
    return localStorage.getItem('guest_registry_label_all') || 'အားလုံး';
  });
  const [labelCurrent, setLabelCurrent] = useState(() => {
    return localStorage.getItem('guest_registry_label_current') || 'နေထိုင်ဆဲ';
  });
  const [labelDeparted, setLabelDeparted] = useState(() => {
    return localStorage.getItem('guest_registry_label_departed') || 'ထွက်ခွာပြီး';
  });
  const [showEditLabelsModal, setShowEditLabelsModal] = useState(false);
  const [tempLabelAll, setTempLabelAll] = useState('');
  const [tempLabelCurrent, setTempLabelCurrent] = useState('');
  const [tempLabelDeparted, setTempLabelDeparted] = useState('');

  // Sync temp labels when opening the modal
  useEffect(() => {
    if (showEditLabelsModal) {
      setTempLabelAll(labelAll);
      setTempLabelCurrent(labelCurrent);
      setTempLabelDeparted(labelDeparted);
    }
  }, [showEditLabelsModal, labelAll, labelCurrent, labelDeparted]);

  const saveLabels = (all: string, current: string, departed: string) => {
    setLabelAll(all);
    setLabelCurrent(current);
    setLabelDeparted(departed);
    localStorage.setItem('guest_registry_label_all', all);
    localStorage.setItem('guest_registry_label_current', current);
    localStorage.setItem('guest_registry_label_departed', departed);
    showToast('ခလုတ်စာသားများကို ပြင်ဆင်ပြီးပါပြီ');
  };
  
  // Admin Login States
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('is_admin_logged_in') === 'true';
  });
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [loginPasscode, setLoginPasscode] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showLoginPasscode, setShowLoginPasscode] = useState(false);
  const [showAdminPasscode, setShowAdminPasscode] = useState(false);
  const [showPublicSuccess, setShowPublicSuccess] = useState(false);
  
  // Bulk Selection States
  const [selectedGuestIds, setSelectedGuestIds] = useState<string[]>([]);
  
  // Copy feedback toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = guests.length;
    const current = guests.filter(g => g.isCurrent).length;
    const departed = total - current;
    const totalFamily = guests.reduce((sum, g) => sum + (g.familyMembers?.length || 0), 0);
    return { total, current, departed, totalFamily };
  }, [guests]);

  const isDateFilterActive = !!(filterStartDate || filterEndDate);

  const dateFilteredGuestsCount = useMemo(() => {
    if (!isDateFilterActive) return guests.length;
    return guests.filter((guest) => {
      if (filterStartDate) {
        if (guest.stayTo && guest.stayTo < filterStartDate) return false;
      }
      if (filterEndDate) {
        if (guest.stayFrom && guest.stayFrom > filterEndDate) return false;
      }
      return true;
    }).length;
  }, [guests, filterStartDate, filterEndDate, isDateFilterActive]);

  // Load guests on start
  useEffect(() => {
    const initialized = localStorage.getItem('guest_registry_initialized');
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    
    if (initialized === 'true') {
      if (stored) {
        try {
          setGuests(JSON.parse(stored));
        } catch (e) {
          console.error('Error loading guests from localStorage', e);
          setGuests([]);
        }
      } else {
        setGuests([]);
      }
    } else {
      // First time loading - initialize with mock/demo data
      setGuests(INITIAL_GUESTS);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_GUESTS));
      localStorage.setItem('guest_registry_initialized', 'true');
    }
  }, []);

  // Save guests to localStorage whenever they change
  const saveGuestsToStorage = (newGuests: Guest[]) => {
    setGuests(newGuests);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newGuests));
  };

  // Keep configuration states synced to localStorage
  useEffect(() => {
    localStorage.setItem('guest_registry_admin_phone', adminPhone);
  }, [adminPhone]);

  useEffect(() => {
    localStorage.setItem('guest_registry_admin_role', adminRole);
  }, [adminRole]);

  useEffect(() => {
    localStorage.setItem('guest_registry_admin_passcode', adminPasscode);
  }, [adminPasscode]);

  // Clear selections when admin status changes (logout)
  useEffect(() => {
    if (!isAdminLoggedIn) {
      setSelectedGuestIds([]);
    }
  }, [isAdminLoggedIn]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Share & QR Code states
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareQRType, setShareQRType] = useState<'link' | 'sync' | 'text'>('link');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [incomingGuests, setIncomingGuests] = useState<Guest[] | null>(null);
  const [qrTruncated, setQrTruncated] = useState(false);
  const [qrSyncCount, setQrSyncCount] = useState(0);
  const [generatedShareText, setGeneratedShareText] = useState('');

  // Check for scanned data in URL on load/hash change
  useEffect(() => {
    const handleHashCheck = () => {
      const hash = window.location.hash;
      if (hash && hash.startsWith('#import=')) {
        try {
          const encodedData = hash.substring('#import='.length);
          if (encodedData) {
            const decodedStr = unicodeAtob(encodedData);
            let parsed = JSON.parse(decodedStr);
            if (Array.isArray(parsed)) {
              // Decompress guests if they are compressed
              parsed = parsed.map((item: any) => {
                if ('n' in item && !('name' in item)) {
                  return decompressGuest(item);
                }
                return item;
              });
              if (parsed.length > 0) {
                setIncomingGuests(parsed);
              }
            }
          }
        } catch (e) {
          console.error('Error decoding incoming QR data:', e);
          showToast('QR Code ဒေတာဖတ်ရာတွင် အမှားအယွင်းရှိနေပါသည်');
        }
      }
    };

    handleHashCheck();

    window.addEventListener('hashchange', handleHashCheck);
    return () => {
      window.removeEventListener('hashchange', handleHashCheck);
    };
  }, []);

  // Generate QR Code data url when modal opens or type changes
  useEffect(() => {
    if (!showShareModal) return;

    const generateQR = async () => {
      let textToEncode = '';
      let isTruncated = false;
      let syncCount = guests.length;

      if (shareQRType === 'link') {
        textToEncode = `${window.location.origin}${window.location.pathname}`;
      } else if (shareQRType === 'sync') {
        let success = false;
        let guestsToEncode = [...guests];
        
        while (guestsToEncode.length > 0 && !success) {
          try {
            const compressedGuests = guestsToEncode.map(g => compressGuest(g));
            const base64Data = unicodeBtoa(JSON.stringify(compressedGuests));
            const candidateText = `${window.location.origin}${window.location.pathname}#import=${base64Data}`;
            
            // Try generating dummy QR Code data URL to verify it fits
            await QRCode.toDataURL(candidateText, {
              width: 320,
              margin: 2
            });
            
            textToEncode = candidateText;
            success = true;
            syncCount = guestsToEncode.length;
            isTruncated = guestsToEncode.length < guests.length;
          } catch (e: any) {
            if (guestsToEncode.length > 1) {
              guestsToEncode.shift(); // remove oldest guest to fit limit
            } else {
              // Can't even encode 1, fallback to link
              textToEncode = `${window.location.origin}${window.location.pathname}`;
              syncCount = 0;
              success = true;
            }
          }
        }
        
        if (guests.length > 0 && syncCount === 0) {
          textToEncode = `${window.location.origin}${window.location.pathname}`;
          isTruncated = true;
        }
      } else if (shareQRType === 'text') {
        let success = false;
        let guestsToEncode = [...guests];
        
        while (guestsToEncode.length > 0 && !success) {
          try {
            const todayStr = new Date().toLocaleDateString('my-MM', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
            
            let textSummary = `ဧည့်စာရင်း အကျဉ်းချုပ် အစီရင်ခံစာ\n`;
            textSummary += `ထုတ်ယူသည့်နေ့စွဲ - ${todayStr}\n`;
            textSummary += `အိမ်ထောင်စု/အက်ဒမင်ဖုန်း - ${adminPhone}\n`;
            textSummary += `-------------------------\n`;
            textSummary += `စုစုပေါင်းဧည့်သည် - ${stats.total} ဦး\n`;
            textSummary += `လက်ရှိနေထိုင်ဆဲ - ${stats.current} ဦး\n`;
            textSummary += `ထွက်ခွာပြီး - ${stats.departed} ဦး\n`;
            textSummary += `အတူပါလာသည့်မိသားစုဝင် - ${stats.totalFamily} ဦး\n`;
            textSummary += `-------------------------\n`;
            
            guestsToEncode.forEach((g, idx) => {
              textSummary += `${idx + 1}။ ${g.name} (${g.age} နှစ်)\n`;
              textSummary += `   မှတ်ပုံတင် - ${g.nrc}\n`;
              textSummary += `   လာရပ် - ${g.origin}\n`;
              textSummary += `   အခြေအနေ - ${g.isCurrent ? 'နေထိုင်ဆဲ' : 'ထွက်ခွာပြီး'}\n`;
              if (g.familyMembers && g.familyMembers.length > 0) {
                textSummary += `   မိသားစုဝင် - ${g.familyMembers.map(m => `${m.name}(${m.relation})`).join(', ')}\n`;
              }
              textSummary += `\n`;
            });
            
            const candidateText = textSummary.trim();
            
            // Try generating dummy QR Code to verify it fits
            await QRCode.toDataURL(candidateText, {
              width: 320,
              margin: 2
            });
            
            textToEncode = candidateText;
            success = true;
            syncCount = guestsToEncode.length;
            isTruncated = guestsToEncode.length < guests.length;
          } catch (e: any) {
            if (guestsToEncode.length > 1) {
              guestsToEncode.pop(); // remove last item to fit limit
            } else {
              textToEncode = "ဒေတာပမာဏ အလွန်များပြားသဖြင့် စာသားမထုတ်ပေးနိုင်ပါ။";
              syncCount = 0;
              success = true;
            }
          }
        }
      }

      setGeneratedShareText(textToEncode);
      setQrTruncated(isTruncated);
      setQrSyncCount(syncCount);

      try {
        const dataUrl = await QRCode.toDataURL(textToEncode, {
          width: 320,
          margin: 2,
          color: {
            dark: '#059669', // emerald-600
            light: '#ffffff'
          }
        });
        setQrCodeDataUrl(dataUrl);
      } catch (err) {
        console.error('Error generating QR code', err);
        showToast('QR Code ထုတ်လုပ်ရာတွင် အမှားအယွင်းရှိပါသည်');
      }
    };

    generateQR();
  }, [showShareModal, shareQRType, guests, adminPhone, stats]);

  const handleCopyShareContent = () => {
    if (!generatedShareText) return;
    navigator.clipboard.writeText(generatedShareText)
      .then(() => showToast('ကူးယူပြီးပါပြီ'))
      .catch(() => alert('ကူးယူ၍မရပါ။'));
  };

  const handleDownloadQR = () => {
    if (!qrCodeDataUrl) return;
    const link = document.createElement('a');
    link.href = qrCodeDataUrl;
    link.download = `guest_registry_qr_${shareQRType}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('QR Code ပုံရိပ်ကို ဒေါင်းလုဒ်ဆွဲလိုက်ပါပြီ');
  };

  // Find currently selected guest
  const selectedGuest = useMemo(() => {
    return guests.find(g => g.id === selectedGuestId) || null;
  }, [guests, selectedGuestId]);

  // Handle Search & Filter & Sort
  const filteredAndSortedGuests = useMemo(() => {
    return guests
      .filter((guest) => {
        // 1. Status Filter
        if (statusFilter === 'current' && !guest.isCurrent) return false;
        if (statusFilter === 'departed' && guest.isCurrent) return false;

        // 2. Date Range Filter (Overlap Check)
        // A guest stayed during the filtered range if their stay interval [stayFrom, stayTo]
        // overlaps with the selected filter interval [filterStartDate, filterEndDate].
        if (filterStartDate) {
          // If the guest's stay ended before filterStartDate, they did not stay during the range.
          if (guest.stayTo && guest.stayTo < filterStartDate) return false;
        }
        if (filterEndDate) {
          // If the guest's stay started after filterEndDate, they did not stay during the range.
          if (guest.stayFrom && guest.stayFrom > filterEndDate) return false;
        }

        // 3. Search Query (Name, NRC, Origin)
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        const matchesName = guest.name.toLowerCase().includes(q);
        const matchesNrc = guest.nrc.toLowerCase().includes(q);
        const matchesOrigin = guest.origin.toLowerCase().includes(q);
        const matchesFamily = guest.familyMembers?.some(m => 
          m.name.toLowerCase().includes(q) || (m.nrc && m.nrc.toLowerCase().includes(q))
        );

        return matchesName || matchesNrc || matchesOrigin || matchesFamily;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (sortBy === 'nameAsc') {
          return a.name.localeCompare(b.name, 'my');
        }
        if (sortBy === 'nameDesc') {
          return b.name.localeCompare(a.name, 'my');
        }
        return 0;
      });
  }, [guests, searchQuery, statusFilter, sortBy, filterStartDate, filterEndDate]);

  // Add or Edit save handler
  const handleSaveGuest = (savedGuest: Guest) => {
    let updated: Guest[];
    if (editingGuest) {
      updated = guests.map(g => g.id === savedGuest.id ? savedGuest : g);
      showToast('ဧည့်သည်အချက်အလက်ကို ပြင်ဆင်သိမ်းဆည်းပြီးပါပြီ');
    } else {
      updated = [savedGuest, ...guests];
      showToast('ဧည့်သည်အသစ်ကို စာရင်းသွင်းသိမ်းဆည်းပြီးပါပြီ');
    }
    saveGuestsToStorage(updated);
    setIsFormOpen(false);
    setEditingGuest(null);
    
    if (!isAdminLoggedIn) {
      setShowPublicSuccess(true);
    }
    
    // If we were viewing the detail, update selected state too
    if (selectedGuestId === savedGuest.id) {
      // triggers re-render of detail
    }
  };

  // Toggle isCurrent status (Stayed vs Departed)
  const handleStatusToggle = (id: string, isCurrent: boolean) => {
    const updated = guests.map(g => g.id === id ? { ...g, isCurrent } : g);
    saveGuestsToStorage(updated);
    showToast(isCurrent ? 'အခြေအနေကို နေထိုင်ဆဲ သို့ ပြောင်းလဲလိုက်ပါပြီ' : 'အခြေအနေကို ပြန်လည်ထွက်ခွာ သို့ ပြောင်းလဲလိုက်ပါပြီ');
  };

  // Delete guest record
  const handleDeleteGuest = (id: string) => {
    const target = guests.find(g => g.id === id);
    if (!target) return;
    
    if (confirm(`ဧည့်သည် "${target.name}" ၏ အချက်အလက်များအားလုံးကို စာရင်းမှ ဖျက်ပစ်ရန် သေချာပါသလား?`)) {
      const updated = guests.filter(g => g.id !== id);
      saveGuestsToStorage(updated);
      setSelectedGuestId(null);
      setSelectedGuestIds(prev => prev.filter(item => item !== id));
      showToast('ဧည့်သည်စာရင်းကို ဖျက်သိမ်းပြီးပါပြီ');
    }
  };

  // Bulk Delete selected guests
  const handleBulkDelete = () => {
    if (selectedGuestIds.length === 0) return;
    
    if (confirm(`ရွေးချယ်ထားသော ဧည့်သည် ${selectedGuestIds.length} ဦး၏ အချက်အလက်များအားလုံးကို စာရင်းမှ လုံးဝဖျက်ပစ်ရန် သေချာပါသလား?`)) {
      const updated = guests.filter(g => !selectedGuestIds.includes(g.id));
      saveGuestsToStorage(updated);
      
      // If the currently viewed guest was deleted, close the details modal
      if (selectedGuestId && selectedGuestIds.includes(selectedGuestId)) {
        setSelectedGuestId(null);
      }
      
      setSelectedGuestIds([]);
      showToast('ရွေးချယ်ထားသော ဧည့်သည်စာရင်းများကို ဖျက်သိမ်းပြီးပါပြီ');
    }
  };

  // Toggle selection for a single guest
  const handleToggleSelectGuest = (id: string) => {
    setSelectedGuestIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Backup Database (Export JSON)
  const handleExportData = () => {
    const dataStr = JSON.stringify(guests, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `ဧည့်စာရင်း_Backup_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    showToast('အချက်အလက်အားလုံးကို Backup (.json) ဖိုင်ဖြင့် ထုတ်ယူပြီးပါပြီ');
  };

  // Restore Database (Import JSON)
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed)) {
            if (confirm('ယခုသွင်းမည့် Backup ဖိုင်သည် လက်ရှိစနစ်ရှိ အချက်အလက်များကို အစားထိုးသွားမည်ဖြစ်ပါသည်။ သေချာပါသလား?')) {
              saveGuestsToStorage(parsed);
              showToast('Backup ဖိုင်မှ အချက်အလက်များကို အောင်မြင်စွာ ပြန်လည်တင်သွင်းပြီးပါပြီ');
            }
          } else {
            alert('ဖော်မတ်မမှန်ကန်ပါ။ မှန်ကန်သော .json ဧည့်စာရင်း Backup ဖိုင်ကို ရွေးချယ်ပေးပါ။');
          }
        } catch (err) {
          alert('ဖိုင်ဖတ်ရန် မဖြစ်နိုင်ပါ။ Backup ဖိုင် ပျက်စီးနေနိုင်ပါသည်။');
        }
      };
      reader.readAsText(file);
    }
  };

  // Copy single guest info directly from card
  const handleCopySingleGuestInfo = (guest: Guest, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent card click
    
    let text = `👤 ဧည့်သည်အမည်: ${guest.name} (${guest.age} နှစ်)\n`;
    text += `💳 မှတ်ပုံတင်: ${guest.nrc}\n`;
    text += `📍 လာရာဒေသ: ${guest.origin}\n`;
    text += `⏱ ကာလ: ${guest.stayFrom} မှ ${guest.stayTo} ထိ\n`;
    text += `🟢 အခြေအနေ: ${guest.isCurrent ? 'နေထိုင်ဆဲ' : 'ပြန်လည်ထွက်ခွာပြီး'}`;
    
    navigator.clipboard.writeText(text)
      .then(() => showToast(`${guest.name} ၏ အချက်အလက်ကို ကူးယူပြီးပါပြီ`))
      .catch(() => alert('ကူးယူ၍မရပါ။'));
  };

  return (
    <>
      <div className="min-h-screen bg-[#F8F9FA] text-slate-800 font-sans flex flex-col pb-12 print:hidden">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-semibold px-5 py-3 rounded-xl shadow-2xl z-50 animate-bounce flex items-center gap-2 border border-slate-800">
          <CheckCircle2 size={16} className="text-emerald-400" />
          {toastMessage}
        </div>
      )}

      {/* Main Container Wrapper */}
      <div className="w-full max-w-4xl mx-auto px-4 pt-4 md:pt-8 flex-1 flex flex-col gap-5">
        
        {!isAdminLoggedIn ? (
          <GuestForm
            isPublicForm={true}
            onSave={handleSaveGuest}
            onAdminLoginClick={() => setShowAdminLoginModal(true)}
            labelCurrent={labelCurrent}
            labelDeparted={labelDeparted}
          />
        ) : (
          <>
            {/* Top Native-styled Header (Matching Screenshot 1) */}
            <header className="bg-white rounded-2xl p-4 md:p-5 border border-slate-200 shadow-xs flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-600 text-white rounded-xl">
                <Home size={22} />
              </div>
              <div>
                <h1 className="font-bold text-xl md:text-2xl text-slate-900 flex items-center gap-2 tracking-tight">
                  ဧည့်စာရင်း
                </h1>
                <p className="text-xs text-slate-400 font-medium">အိမ်ထောင်စု / ဧည့်သည်စာရင်း တိုင်ကြားစနစ်</p>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowShareModal(true)}
                className="p-2 bg-slate-50 hover:bg-slate-100 text-emerald-600 hover:text-emerald-800 rounded-xl transition-all border border-slate-100 cursor-pointer"
                title="QR Code ဖြင့် မျှဝေရန်"
                id="share-qr-header-btn"
              >
                <QrCode size={20} />
              </button>
              <button
                onClick={() => setShowSettingsModal(true)}
                className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-xl transition-all border border-slate-100 cursor-pointer"
                title="စနစ် ဆက်တင်များ"
              >
                <Settings size={20} />
              </button>
              <button
                onClick={() => {
                  if (confirm('အက်ဒမင်စနစ်မှ ထွက်ခွာလိုပါသလား?')) {
                    setIsAdminLoggedIn(false);
                    localStorage.removeItem('is_admin_logged_in');
                    showToast('အက်ဒမင်စနစ်မှ ထွက်ခွာပြီးပါပြီ');
                  }
                }}
                className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-rose-600 rounded-xl transition-all border border-slate-100 cursor-pointer"
                title="ထွက်ရန်"
              >
                <LogOut size={20} />
              </button>
              
              {/* Desktop / Big screen Add Button */}
              <button
                onClick={() => {
                  setEditingGuest(null);
                  setIsFormOpen(true);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs transition-transform active:scale-95 flex items-center gap-1.5 shadow-xs"
                id="add-guest-header-btn"
              >
                <Plus size={16} />
                အသစ်
              </button>
            </div>
          </div>

          {/* Admin Details Row */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
            <div className="font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
              <span>{adminPhone} · <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-bold text-[10px] uppercase">{adminRole}</span></span>
            </div>
            
            {/* Backup & Restore Action Row */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowShareModal(true)}
                className="hover:text-emerald-600 flex items-center gap-1 transition-colors font-semibold cursor-pointer"
                title="QR Code ဖြင့် မျှဝေရန်"
              >
                <QrCode size={13} />
                QR ဖြင့်မျှဝေရန်
              </button>

              <button
                onClick={handleExportData}
                className="hover:text-emerald-600 flex items-center gap-1 transition-colors font-semibold cursor-pointer"
                title="ဒေတာအားလုံးကို သိမ်းဆည်းရန်"
              >
                <FileDown size={13} />
                Backup ထုတ်ရန်
              </button>
              
              <label className="hover:text-emerald-600 flex items-center gap-1 transition-colors cursor-pointer font-semibold">
                <FileUp size={13} />
                Restore သွင်းရန်
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </header>

        {/* Form View Overlay/Toggler */}
        {isFormOpen ? (
          <GuestForm
            initialGuest={editingGuest}
            onSave={handleSaveGuest}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingGuest(null);
            }}
            labelCurrent={labelCurrent}
            labelDeparted={labelDeparted}
          />
        ) : (
          <>
            {/* Statistics Cards (Only on Main Dashboard) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className={`p-3.5 rounded-2xl border shadow-xs flex items-center justify-between gap-2 transition-all duration-300 relative overflow-hidden ${
                isDateFilterActive 
                  ? 'bg-emerald-50/40 border-emerald-200/80 ring-1 ring-emerald-400/20' 
                  : 'bg-white border-slate-150'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-300 ${
                    isDateFilterActive 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    <Users size={18} className={isDateFilterActive ? "animate-pulse" : ""} />
                  </div>
                  <div>
                    <div className={`text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 ${
                      isDateFilterActive ? 'text-emerald-700/90' : 'text-slate-400'
                    }`}>
                      {isDateFilterActive ? 'သတ်မှတ်ရက်အတွင်း ဧည့်သည်' : 'ဧည့်သည်စုစုပေါင်း'}
                    </div>
                    <div className={`text-lg font-bold transition-colors duration-300 ${
                      isDateFilterActive ? 'text-emerald-800' : 'text-slate-800'
                    }`}>
                      {isDateFilterActive ? dateFilteredGuestsCount : stats.total} ဦး
                    </div>
                  </div>
                </div>
                
                {isDateFilterActive && (
                  <button
                    onClick={() => {
                      setFilterStartDate('');
                      setFilterEndDate('');
                      showToast('ရက်စွဲစစ်ထုတ်မှုအားလုံးကို ဖျက်လိုက်ပါပြီ');
                    }}
                    className="p-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg transition-all cursor-pointer"
                    title="ရက်စွဲ စစ်ထုတ်မှုကို ပြန်ဖျက်ရန်"
                  >
                    <span className="text-[10px] font-extrabold px-1.5">× ဖျက်မည်</span>
                  </button>
                )}
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-slate-150 shadow-xs flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-emerald-600/80 uppercase tracking-wider">{labelCurrent}</div>
                  <div className="text-lg font-bold text-emerald-800">{stats.current} ဦး</div>
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-slate-150 shadow-xs flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center flex-shrink-0">
                  <AlertCircle size={18} />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{labelDeparted}</div>
                  <div className="text-lg font-bold text-slate-600">{stats.departed} ဦး</div>
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-slate-150 shadow-xs flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <Users size={18} />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-emerald-600/80 uppercase tracking-wider">မိသားစုဝင်စုစုပေါင်း</div>
                  <div className="text-lg font-bold text-emerald-900">{stats.totalFamily} ဦး</div>
                </div>
              </div>
            </div>

            {/* Interactive Filters, Sorts and Search Bar (Screenshot 1 Layout) */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3 shrink-0">
              {/* Search Bar Input */}
              <div className="relative w-full">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="အမည် / မှတ်ပုံတင် / လာရာဒေသ ရှာရန်"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F8F9FA] border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm text-slate-800 font-medium"
                  id="search-input"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold bg-slate-200/60 w-5 h-5 rounded-full flex items-center justify-center"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Status Filters and Sort Segmented controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                {/* Segmented Filter */}
                <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600 w-full sm:w-auto items-center gap-0.5">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg transition-all ${
                      statusFilter === 'all'
                        ? 'bg-white text-slate-900 shadow-xs font-bold'
                        : 'hover:text-slate-950'
                    }`}
                  >
                    {labelAll} ({stats.total})
                  </button>
                  <button
                    onClick={() => setStatusFilter('current')}
                    className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
                      statusFilter === 'current'
                        ? 'bg-white text-emerald-800 shadow-xs font-bold'
                        : 'hover:text-slate-950'
                    }`}
                  >
                    {labelCurrent} ({stats.current})
                  </button>
                  <button
                    onClick={() => setStatusFilter('departed')}
                    className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg transition-all ${
                      statusFilter === 'departed'
                        ? 'bg-white text-slate-800 shadow-xs font-bold'
                        : 'hover:text-slate-950'
                    }`}
                  >
                    {labelDeparted} ({stats.departed})
                  </button>
                  
                  {isAdminLoggedIn && (
                    <button
                      onClick={() => setShowEditLabelsModal(true)}
                      className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-white rounded-lg transition-all cursor-pointer flex-shrink-0 ml-1"
                      title="ခလုတ်စာသားများ ပြင်ဆင်ရန်"
                    >
                      <SlidersHorizontal size={12} />
                    </button>
                  )}
                </div>

                {/* Sort dropdown */}
                <div className="flex items-center gap-1.5 justify-end">
                  <SlidersHorizontal size={13} className="text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">စီစဥ်ရန်:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 py-1.5 px-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                  >
                    <option value="newest">နောက်ဆုံးသွင်းသူ (သစ်မှဟောင်း)</option>
                    <option value="oldest">ပထမဆုံးသွင်းသူ (ဟောင်းမှသစ်)</option>
                    <option value="nameAsc">အမည် (က-မှ-အ)</option>
                    <option value="nameDesc">အမည် (အ-မှ-က)</option>
                  </select>
                </div>
              </div>

              {/* Date Range Filter Section */}
              <div className="border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setShowDateFilter(!showDateFilter)}
                  className="flex items-center justify-between w-full text-xs font-bold text-slate-500 hover:text-emerald-700 transition-colors py-1 cursor-pointer"
                  id="date-filter-toggle-btn"
                >
                  <div className="flex items-center gap-1.5">
                    <Calendar size={14} className={filterStartDate || filterEndDate ? "text-emerald-600 animate-pulse" : "text-slate-400"} />
                    <span>တည်းခိုသည့်ကာလအလိုက် စစ်ထုတ်ရန်</span>
                    {(filterStartDate || filterEndDate) && (
                      <span className="bg-emerald-50 text-emerald-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-emerald-100">
                        စစ်ထုတ်ထားသည်
                      </span>
                    )}
                  </div>
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${showDateFilter ? "rotate-180 text-emerald-600" : ""}`}
                  />
                </button>

                {showDateFilter && (
                  <div className="pt-2.5 space-y-3 animate-in fade-in slide-in-from-top-1 duration-150">
                    {/* Quick presets buttons */}
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const range = getMonthRange(0);
                          setFilterStartDate(range.start);
                          setFilterEndDate(range.end);
                          showToast('ယခုလ တည်းခိုသူများကို ရွေးချယ်ပြီးပါပြီ');
                        }}
                        className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all border cursor-pointer ${
                          filterStartDate === getMonthRange(0).start && filterEndDate === getMonthRange(0).end
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200/60'
                        }`}
                      >
                        ယခုလ (This Month)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const range = getMonthRange(-1);
                          setFilterStartDate(range.start);
                          setFilterEndDate(range.end);
                          showToast('ပြီးခဲ့သောလ တည်းခိုသူများကို ရွေးချယ်ပြီးပါပြီ');
                        }}
                        className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all border cursor-pointer ${
                          filterStartDate === getMonthRange(-1).start && filterEndDate === getMonthRange(-1).end
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200/60'
                        }`}
                      >
                        ပြီးခဲ့သောလ (Last Month)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFilterStartDate('');
                          setFilterEndDate('');
                          showToast('ရက်စွဲစစ်ထုတ်မှုအားလုံးကို ဖျက်လိုက်ပါပြီ');
                        }}
                        className="px-3 py-1.5 text-[11px] font-bold bg-white hover:bg-slate-50 text-slate-500 rounded-lg border border-slate-200/60 transition-all cursor-pointer"
                      >
                        အားလုံးပြန်လည်သတ်မှတ်ရန်
                      </button>
                    </div>

                    {/* Custom Date Inputs */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          စတင်မည့်ရက် (Stay From)
                        </label>
                        <input
                          type="date"
                          value={filterStartDate}
                          onChange={(e) => setFilterStartDate(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          ပြီးဆုံးမည့်ရက် (Stay To)
                        </label>
                        <input
                          type="date"
                          value={filterEndDate}
                          onChange={(e) => setFilterEndDate(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Results count & Printing Action Bar */}
            <div className="flex items-center justify-between gap-3 px-1.5 py-1 flex-wrap">
              <p className="text-xs font-bold text-slate-500">
                {(searchQuery || statusFilter !== 'all' || filterStartDate || filterEndDate) ? (
                  <>
                    ရှာဖွေတွေ့ရှိသည့် ရလဒ် - <span className="text-emerald-700 font-extrabold">{filteredAndSortedGuests.length} ဦး</span>
                  </>
                ) : (
                  <>
                    စာရင်းဝင်ဧည့်သည်စုစုပေါင်း - <span className="text-slate-700 font-extrabold">{filteredAndSortedGuests.length} ဦး</span>
                  </>
                )}
              </p>
              
              <div className="flex items-center gap-2 flex-wrap">
                {filteredAndSortedGuests.length > 0 && (
                  <button
                    onClick={() => window.print()}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs hover:shadow-md active:scale-95 transition-all cursor-pointer"
                    title="လက်ရှိစာရင်းကို ပုံနှိပ်ထုတ်ယူရန် သို့မဟုတ် PDF သိမ်းဆည်းရန်"
                  >
                    <Printer size={14} />
                    <span>စာရင်းထုတ်မည် / PDF သိမ်းမည်</span>
                  </button>
                )}
              </div>
            </div>

            {/* Admin Bulk Action Controls */}
            {isAdminLoggedIn && filteredAndSortedGuests.length > 0 && (
              <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 px-4 shadow-2xs -mt-1">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="bulk-select-all"
                    checked={filteredAndSortedGuests.length > 0 && filteredAndSortedGuests.every(g => selectedGuestIds.includes(g.id))}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedGuestIds(filteredAndSortedGuests.map(g => g.id));
                      } else {
                        setSelectedGuestIds([]);
                      }
                    }}
                    className="w-5 h-5 text-emerald-600 border-slate-300 rounded-lg focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                  />
                  <label htmlFor="bulk-select-all" className="text-xs font-extrabold text-slate-600 cursor-pointer select-none">
                    ဧည့်သည်အားလုံးကို ရွေးချယ်မည် ({filteredAndSortedGuests.length} ဦး)
                  </label>
                </div>

                {selectedGuestIds.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 bg-slate-200/60 px-2.5 py-1 rounded-lg">
                      {selectedGuestIds.length} ဦး ရွေးချယ်ပြီး
                    </span>
                    <button
                      onClick={handleBulkDelete}
                      className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:shadow-md active:scale-95 transition-all cursor-pointer"
                      title="ရွေးချယ်ထားသော ဧည့်သည်စာရင်းများကို အမြန်ဖျက်မည်"
                    >
                      <Trash2 size={13} />
                      <span>ရွေးချယ်ထားသည်များ အစုလိုက်ဖျက်မည်</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Guest List container */}
            <div className="space-y-3.5 flex-1">
              {filteredAndSortedGuests.length === 0 ? (
                /* Empty state matching Screenshot 1 */
                <div className="py-16 px-4 bg-white border border-slate-100 rounded-3xl text-center flex flex-col items-center justify-center shadow-xs">
                  <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-300">
                    <Users size={38} />
                  </div>
                  <h3 className="font-bold text-slate-700 text-base mb-1" id="empty-state-title">
                    စာရင်းသွင်းထားသည့် ဧည့်သည်မရှိသေးပါ
                  </h3>
                  <p className="text-xs text-slate-400 max-w-xs mb-6 leading-relaxed">
                    အမည်၊ မှတ်ပုံတင် သို့မဟုတ် လာရာဒေသများဖြင့်လည်း ရှာဖွေနိုင်ပါသည်။ ဧည့်သည်အသစ်ထည့်ရန် အောက်ပါခလုတ်ကို နှိပ်ပါ။
                  </p>
                  
                  <button
                    onClick={() => {
                      setEditingGuest(null);
                      setIsFormOpen(true);
                    }}
                    className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm transition-all active:scale-95 shadow-xs flex items-center gap-1.5"
                    id="empty-state-add-btn"
                  >
                    <Plus size={18} />
                    အသစ်ထည့်သွင်းမည်
                  </button>
                </div>
              ) : (
                /* Interactive Guest Grid */
                <div className="grid grid-cols-1 gap-3.5">
                  {filteredAndSortedGuests.map((guest) => (
                    <GuestCard
                      key={guest.id}
                      guest={guest}
                      onClick={() => setSelectedGuestId(guest.id)}
                      onCopyInfo={(e) => handleCopySingleGuestInfo(guest, e)}
                      isSelected={isAdminLoggedIn && selectedGuestIds.includes(guest.id)}
                      onSelectToggle={isAdminLoggedIn ? () => handleToggleSelectGuest(guest.id) : undefined}
                      labelCurrent={labelCurrent}
                      labelDeparted={labelDeparted}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
          </>
        )}
      </div>

      {/* Guest Detail Modal Overlay */}
      {selectedGuest && (
        <GuestDetail
          guest={selectedGuest}
          onClose={() => setSelectedGuestId(null)}
          onEdit={() => {
            setEditingGuest(selectedGuest);
            setIsFormOpen(true);
            setSelectedGuestId(null);
          }}
          onDelete={() => {
            handleDeleteGuest(selectedGuest.id);
          }}
          onStatusToggle={handleStatusToggle}
          labelCurrent={labelCurrent}
          labelDeparted={labelDeparted}
        />
      )}

      {/* Settings Modal (Edit Admin Info) */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                <Settings size={16} />
                စနစ် ဆက်တင်များ
              </h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-300 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="flex flex-col">
                <label className="text-xs font-semibold text-slate-600 mb-1" htmlFor="set-admin-phone">
                  အက်ဒမင် ဖုန်းနံပါတ် / ဆက်သွယ်ရန်
                </label>
                <input
                  id="set-admin-phone"
                  type="text"
                  value={adminPhone}
                  onChange={(e) => setAdminPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-semibold text-slate-600 mb-1" htmlFor="set-admin-role">
                  တာဝန် / ရာထူး
                </label>
                <input
                  id="set-admin-role"
                  type="text"
                  value={adminRole}
                  onChange={(e) => setAdminRole(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-semibold text-slate-600 mb-1" htmlFor="set-admin-passcode">
                  အက်ဒမင် ဝင်ရောက်ရန် လျှို့ဝှက်နံပါတ် (Passcode)
                </label>
                <div className="relative">
                  <input
                    id="set-admin-passcode"
                    type={showAdminPasscode ? "text" : "password"}
                    value={adminPasscode}
                    onChange={(e) => setAdminPasscode(e.target.value)}
                    placeholder="ဥပမာ - ၁၂၃၄၅၆"
                    className="w-full pl-3 pr-10 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 font-medium tracking-widest"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPasscode(!showAdminPasscode)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg cursor-pointer flex items-center justify-center"
                    title={showAdminPasscode ? "လျှို့ဝှက်နံပါတ် ဖျောက်မည်" : "လျှို့ဝှက်နံပါတ် ပြမည်"}
                  >
                    {showAdminPasscode ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Information disclaimer */}
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 text-emerald-800 flex gap-2">
                <Info size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-[10px] leading-relaxed">
                  ဤအချက်အလက်များသည် သင့်ဖုန်း/ဘရောက်ဆာ၏ Local Storage တွင်သာ လုံခြုံစွာ သိမ်းဆည်းထားပြီး မည်သည့်ဆာဗာဆီသို့မျှ ပေးပို့ခြင်း မရှိပါ။ အချက်အလက်များ မပျောက်ပျက်စေရန် Backup ထုတ်ယူထားနိုင်ပါသည်။
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border-t border-slate-100 p-3 flex flex-wrap gap-2 justify-end">
              <button
                onClick={() => {
                  if (confirm('ဒေတာများအားလုံးကို လုံးဝ (လုံးဝ) ဖျက်ဆီးပစ်ရန် သေချာပါသလား? ဖျက်ပြီးပါက ပြန်လည်ရယူနိုင်မည် မဟုတ်ပါ။')) {
                    saveGuestsToStorage([]);
                    localStorage.setItem('guest_registry_initialized', 'true');
                    setShowSettingsModal(false);
                    showToast('ဒေတာများအားလုံးကို လုံးဝဖျက်သိမ်းပြီးပါပြီ');
                  }
                }}
                className="px-3 py-2 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg text-xs font-bold mr-auto cursor-pointer"
                title="ဒေတာအားလုံးကို အပြီးတိုင် ဖျက်ပစ်မည်"
              >
                ဒေတာအားလုံးဖျက်မည်
              </button>
              <button
                onClick={() => {
                  if (confirm('အစမ်းသရုပ်ပြဒေတာများကို ပြန်လည်ထည့်သွင်းလိုပါသလား? လက်ရှိဒေတာများအပေါ် ထပ်ရေးမည်ဖြစ်ပါသည်။')) {
                    saveGuestsToStorage(INITIAL_GUESTS);
                    localStorage.setItem('guest_registry_initialized', 'true');
                    setShowSettingsModal(false);
                    showToast('အစမ်းသရုပ်ပြဒေတာများ ထည့်သွင်းပြီးပါပြီ');
                  }
                }}
                className="px-3 py-2 text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold cursor-pointer"
                title="အစမ်းဒေတာများ ပြန်လည်ထည့်မည်"
              >
                အစမ်းဒေတာထည့်ရန်
              </button>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                ပိတ်မည်
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Labels Modal */}
      {showEditLabelsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                <SlidersHorizontal size={16} className="text-emerald-400" />
                ခလုတ်စာသားများ ပြင်ဆင်ရန်
              </h3>
              <button
                onClick={() => setShowEditLabelsModal(false)}
                className="text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="flex flex-col">
                <label className="text-xs font-semibold text-slate-600 mb-1" htmlFor="set-label-all">
                  အားလုံး Filter (All Guests Label)
                </label>
                <input
                  id="set-label-all"
                  type="text"
                  value={tempLabelAll}
                  onChange={(e) => setTempLabelAll(e.target.value)}
                  placeholder="အားလုံး"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 font-medium"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-semibold text-slate-600 mb-1" htmlFor="set-label-current">
                  လက်ရှိနေထိုင်ဆဲ (Current Status Label)
                </label>
                <input
                  id="set-label-current"
                  type="text"
                  value={tempLabelCurrent}
                  onChange={(e) => setTempLabelCurrent(e.target.value)}
                  placeholder="နေထိုင်ဆဲ"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 font-medium"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-semibold text-slate-600 mb-1" htmlFor="set-label-departed">
                  ထွက်ခွာပြီး (Departed Status Label)
                </label>
                <input
                  id="set-label-departed"
                  type="text"
                  value={tempLabelDeparted}
                  onChange={(e) => setTempLabelDeparted(e.target.value)}
                  placeholder="ထွက်ခွာပြီး"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 font-medium"
                />
              </div>
              
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[10px] text-slate-500 leading-normal">
                💡 ဤစာသားများကို ပြောင်းလဲပါက ဧည့်သည်ကတ်ပြားများ၊ အသေးစိတ်ဖော်ပြချက်များ၊ ရက်စွဲစစ်ထုတ်မှုနှင့် စာရင်းသွင်းပုံစံများရှိ အခြေအနေပြခလုတ်များ အားလုံးတွင် အလိုအလျောက် ပြောင်းလဲပေးမည်ဖြစ်ပါသည်။
              </div>
            </div>

            <div className="bg-slate-50 border-t border-slate-100 p-3 flex gap-2 justify-end">
              <button
                onClick={() => {
                  setTempLabelAll('အားလုံး');
                  setTempLabelCurrent('နေထိုင်ဆဲ');
                  setTempLabelDeparted('ထွက်ခွာပြီး');
                }}
                className="px-3 py-2 text-slate-500 hover:text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold mr-auto cursor-pointer"
                title="မူလအတိုင်း ပြန်လည်သတ်မှတ်မည်"
              >
                Reset
              </button>
              <button
                onClick={() => setShowEditLabelsModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-bold cursor-pointer"
              >
                မလုပ်တော့ပါ
              </button>
              <button
                onClick={() => {
                  if (!tempLabelAll.trim() || !tempLabelCurrent.trim() || !tempLabelDeparted.trim()) {
                    alert('ခလုတ်စာသားများကို အလွတ်မထားရပါ။');
                    return;
                  }
                  saveLabels(tempLabelAll, tempLabelCurrent, tempLabelDeparted);
                  setShowEditLabelsModal(false);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                သိမ်းဆည်းမည်
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share & QR Code Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-emerald-800 text-white px-5 py-3.5 flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <QrCode size={18} />
                QR Code ဖြင့် မျှဝေခြင်း
              </h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-emerald-200 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Tabs */}
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex gap-1">
              <button
                onClick={() => setShareQRType('link')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  shareQRType === 'link'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                }`}
              >
                စနစ်လင့်ခ် (URL)
              </button>
              <button
                onClick={() => setShareQRType('sync')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  shareQRType === 'sync'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                }`}
              >
                ဒေတာအပြည့်အစုံ (Sync)
              </button>
              <button
                onClick={() => setShareQRType('text')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  shareQRType === 'text'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                }`}
              >
                စာသားအကျဉ်းချုပ်
              </button>
            </div>

            {/* QR display content */}
            <div className="p-6 flex flex-col items-center justify-center space-y-4">
              <div className="p-4 bg-white rounded-2xl border-2 border-emerald-100/80 shadow-inner flex items-center justify-center w-60 h-60 relative overflow-hidden">
                {qrCodeDataUrl ? (
                  <img
                    src={qrCodeDataUrl}
                    alt="QR Code"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="animate-pulse flex flex-col items-center gap-2">
                    <QrCode size={40} className="text-slate-300" />
                    <span className="text-xs text-slate-400 font-medium">QR Code ဖန်တီးနေသည်...</span>
                  </div>
                )}
              </div>

              {/* Explainer / Description */}
              <div className="text-center max-w-xs space-y-1">
                <p className="text-xs font-bold text-slate-700">
                  {shareQRType === 'link' && 'စနစ်ဝင်ရောက်ရန် Link QR Code'}
                  {shareQRType === 'sync' && 'ဧည့်သည်စာရင်း အချက်အလက် Sync QR Code'}
                  {shareQRType === 'text' && 'အစီရင်ခံစာ စာသားအကျဉ်းချုပ် QR Code'}
                </p>
                <p className="text-[11px] leading-relaxed text-slate-400">
                  {shareQRType === 'link' && 'အခြားစက်များမှ ဤဧည့်စာရင်းစနစ်ထဲသို့ လွယ်ကူလျင်မြန်စွာ ဝင်ရောက်အသုံးပြုနိုင်ရန် ဖုန်းကင်မရာဖြင့် စကင်ဖတ်ပါ။'}
                  {shareQRType === 'sync' && `လက်ရှိစက်ရှိ ဧည့်သည်စာရင်း (${stats.total} ဦး) အားလုံးကို အခြားစက်ထဲသို့ တိုက်ရိုက်ကူးပြောင်းရန် ဖုန်းကင်မရာဖြင့် စကင်ဖတ်ပါ။`}
                  {shareQRType === 'text' && 'ဧည့်စာရင်းအစီရင်ခံစာ စာသားအကျဉ်းချုပ်ကို QR scanner ဖြင့် အလွယ်တကူ ကူးယူသိမ်းဆည်းရန် စကင်ဖတ်ပါ။'}
                </p>

                {qrTruncated && (
                  <div className="mt-2.5 p-2 bg-amber-50 border border-amber-200 rounded-xl text-[10.5px] text-amber-800 leading-normal font-medium text-left">
                    ⚠️ <strong>ဒေတာပမာဏ အလွန်များပြားပါသည် -</strong> QR Code ဆံ့နိုင်ရန်အတွက် နောက်ဆုံးဝင်ရောက်ထားသော ဧည့်သည် <strong>{qrSyncCount} ဦး</strong> စာရင်းကိုသာ ထည့်သွင်းပေးထားပါသည်။
                  </div>
                )}
              </div>
            </div>

            {/* Actions Footer */}
            <div className="bg-slate-50 border-t border-slate-100 p-4 flex gap-2 justify-end">
              <button
                onClick={handleCopyShareContent}
                className="mr-auto px-3.5 py-2 text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-xl text-xs font-bold border border-slate-200 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Clipboard size={14} />
                Copy ကူးမည်
              </button>
              <button
                onClick={handleDownloadQR}
                className="px-3.5 py-2 text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl text-xs font-bold border border-emerald-200/60 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Download size={14} />
                ဒေါင်းလုဒ်ဆွဲမည်
              </button>
              <button
                onClick={() => setShowShareModal(false)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                ပိတ်မည်
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Incoming Guests Import Prompt */}
      {incomingGuests && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-emerald-800 text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <QrCode size={18} />
                ဧည့်သည်စာရင်း တင်သွင်းရန် တောင်းဆိုချက်
              </h3>
              <button
                onClick={() => {
                  setIncomingGuests(null);
                  window.location.hash = '';
                }}
                className="text-emerald-200 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-900 flex items-start gap-3">
                <Info size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm mb-1">အခြားစက်မှ မျှဝေလာသော ဧည့်သည်စာရင်း</h4>
                  <p className="text-xs leading-relaxed text-slate-600">
                    စုစုပေါင်း ဧည့်သည် <strong className="text-emerald-700 font-bold">{incomingGuests.length} ဦး</strong> ကို တွေ့ရှိရပါသည်။ လက်ရှိစက်ထဲသို့ မည်သို့ ထည့်သွင်းလိုပါသလဲ?
                  </p>
                </div>
              </div>

              {/* List of incoming guests */}
              <div className="max-h-48 overflow-y-auto border border-slate-150 rounded-xl p-3 bg-slate-50 space-y-2">
                {incomingGuests.map((g, idx) => (
                  <div key={idx} className="text-xs bg-white p-2.5 rounded-lg border border-slate-100 flex items-center justify-between shadow-xxs">
                    <div>
                      <p className="font-bold text-slate-800">{g.name}</p>
                      <p className="text-[10px] text-slate-400">{g.nrc} • {g.origin}</p>
                    </div>
                    {g.familyMembers && g.familyMembers.length > 0 && (
                      <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        +{g.familyMembers.length} ဦး
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 border-t border-slate-100 p-4 flex gap-2 justify-end">
              <button
                onClick={() => {
                  setIncomingGuests(null);
                  window.location.hash = '';
                }}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                ပယ်ဖျက်မည်
              </button>
              
              <button
                onClick={() => {
                  const existingNrcs = new Set(guests.map(g => g.nrc));
                  const merged = [...guests];
                  let addedCount = 0;
                  
                  incomingGuests.forEach(incoming => {
                    if (!existingNrcs.has(incoming.nrc)) {
                      merged.push({
                        ...incoming,
                        id: incoming.id || String(Date.now() + Math.random())
                      });
                      addedCount++;
                    }
                  });

                  saveGuestsToStorage(merged);
                  showToast(`ဧည့်သည်စာရင်းအသစ် ${addedCount} ဦးကို ပေါင်းထည့်ပြီးပါပြီ`);
                  setIncomingGuests(null);
                  window.location.hash = '';
                }}
                className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold border border-emerald-200 transition-all cursor-pointer"
              >
                ပေါင်းထည့်မည် (Merge)
              </button>

              <button
                onClick={() => {
                  if (confirm('လက်ရှိစာရင်းအားလုံးကို ဖျက်ပြီး တင်သွင်းလာသော စာရင်းဖြင့် အစားထိုးမည်မှာ သေချာပါသလား?')) {
                    saveGuestsToStorage(incomingGuests);
                    showToast(`ဧည့်သည်စာရင်းအားလုံးကို အောင်မြင်စွာ အစားထိုးပြီးပါပြီ`);
                    setIncomingGuests(null);
                    window.location.hash = '';
                  }
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                အစားထိုးသွင်းမည် (Replace)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Login Modal */}
      {showAdminLoginModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                <Lock size={16} className="text-emerald-400" />
                အက်ဒမင် စနစ်သို့ ဝင်ရောက်ရန်
              </h3>
              <button
                onClick={() => {
                  setShowAdminLoginModal(false);
                  setLoginPasscode('');
                  setLoginError('');
                  setShowLoginPasscode(false);
                }}
                className="text-slate-300 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (loginPasscode === adminPasscode) {
                  setIsAdminLoggedIn(true);
                  localStorage.setItem('is_admin_logged_in', 'true');
                  setShowAdminLoginModal(false);
                  setLoginPasscode('');
                  setLoginError('');
                  setShowLoginPasscode(false);
                  showToast('အက်ဒမင် စနစ်သို့ ဝင်ရောက်ခြင်း အောင်မြင်ပါသည်');
                } else {
                  setLoginError('လျှို့ဝှက်နံပါတ် မှားယွင်းနေပါသည်။ ပြန်လည်ကြိုးစားပါ။');
                }
              }}
              className="p-5 space-y-4"
            >
              <div className="flex flex-col">
                <label className="text-xs font-semibold text-slate-600 mb-1" htmlFor="login-passcode">
                  အက်ဒမင် လျှို့ဝှက်နံပါတ် (Passcode) ရိုက်ထည့်ပါ
                </label>
                <div className="relative">
                  <input
                    id="login-passcode"
                    type={showLoginPasscode ? "text" : "password"}
                    required
                    value={loginPasscode}
                    onChange={(e) => setLoginPasscode(e.target.value)}
                    placeholder="လျှို့ဝှက်နံပါတ် (Default: 123456)"
                    className="w-full pl-3 pr-10 py-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-center tracking-widest text-slate-800"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPasscode(!showLoginPasscode)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg cursor-pointer flex items-center justify-center"
                    title={showLoginPasscode ? "လျှို့ဝှက်နံပါတ် ဖျောက်မည်" : "လျှို့ဝှက်နံပါတ် ပြမည်"}
                  >
                    {showLoginPasscode ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {loginError && (
                  <p className="text-xs font-medium text-rose-500 mt-1.5 text-center">{loginError}</p>
                )}
              </div>

              <div className="bg-slate-50 border-t border-slate-100 -mx-5 -mb-5 p-3.5 flex gap-2 justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowAdminLoginModal(false);
                    setLoginPasscode('');
                    setLoginError('');
                    setShowLoginPasscode(false);
                  }}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                >
                  ပယ်ဖျက်
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Unlock size={14} />
                  ဝင်ရောက်မည်
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Public Success Overlay Card */}
      {showPublicSuccess && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner animate-bounce">
              <CheckCircle2 size={36} />
            </div>
            
            <h2 className="text-xl font-bold text-slate-950 mb-2">
              ဧည့်စာရင်းတိုင်ကြားမှု အောင်မြင်ပါသည်
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed mb-6 font-medium">
              သင့်ဧည့်စာရင်းကို စနစ်ထဲသို့ အောင်မြင်စွာ တင်သွင်းသိမ်းဆည်းပြီးပါပြီ။ လိုအပ်ပါက အောက်ပါခလုတ်ကို နှိပ်၍ နောက်ထပ်ဧည့်သည်စာရင်းကို ဆက်လက်တိုင်ကြားနိုင်ပါသည်။
            </p>

            <button
              onClick={() => {
                setShowPublicSuccess(false);
              }}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm transition-all hover:shadow-lg active:scale-[0.98] cursor-pointer"
            >
              နောက်ထပ် ဧည့်သည် တိုင်ကြားရန်
            </button>
          </div>
        </div>
      )}

    </div>

    {/* Printable Only Section */}
    <div className="hidden print:block bg-white text-black p-8 font-sans w-full max-w-4xl mx-auto">
      <div className="text-center mb-6 border-b-2 border-slate-900 pb-4">
        <h1 className="text-2xl font-bold tracking-wide">ဧည့်သည်စာရင်း တိုင်ကြားလွှာမှတ်တမ်း</h1>
        <p className="text-sm mt-1 text-slate-600 font-medium">အိမ်ထောင်စု / ဧည့်သည်စာရင်း စီမံခန့်ခွဲမှုစနစ် (ဧည့်စာရင်းစနစ်)</p>
        <div className="text-xs text-left mt-5 flex justify-between font-semibold text-slate-700">
          <span>ထုတ်ယူသည့်ရက်စွဲ: {new Date().toLocaleDateString('my-MM', { dateStyle: 'long' })}</span>
          <span>စာရင်းဝင်ဧည့်သည် စုစုပေါင်း: {filteredAndSortedGuests.length} ဦး</span>
        </div>
      </div>

      <table className="w-full border-collapse border border-slate-800 text-xs text-left">
        <thead>
          <tr className="bg-slate-100 font-bold">
            <th className="border border-slate-800 p-2 text-center w-10">စဥ်</th>
            <th className="border border-slate-800 p-2 w-16 text-center">ဓာတ်ပုံ</th>
            <th className="border border-slate-800 p-2">အမည် / အသက်</th>
            <th className="border border-slate-800 p-2">မှတ်ပုံတင်အမှတ်</th>
            <th className="border border-slate-800 p-2">မိဘအမည်</th>
            <th className="border border-slate-800 p-2">လာရာဒေသ / အကြောင်းအရာ</th>
            <th className="border border-slate-800 p-2">တည်းခိုမည့်ကာလ</th>
            <th className="border border-slate-800 p-2 w-20 text-center">အခြေအနေ</th>
            <th className="border border-slate-800 p-2">မိသားစုဝင်များ</th>
          </tr>
        </thead>
        <tbody>
          {filteredAndSortedGuests.map((guest, index) => (
            <tr key={guest.id} className="align-top">
              <td className="border border-slate-800 p-2 text-center font-bold">{index + 1}</td>
              <td className="border border-slate-800 p-2 text-center">
                {guest.photo ? (
                  <img src={guest.photo} className="w-12 h-12 object-cover mx-auto rounded border border-slate-300 animate-none" />
                ) : (
                  <span className="text-slate-400 text-[10px]">မရှိပါ</span>
                )}
              </td>
              <td className="border border-slate-800 p-2 font-bold">
                {guest.name} <span className="text-slate-600 font-normal">({guest.age} နှစ်)</span>
              </td>
              <td className="border border-slate-800 p-2 font-mono font-medium">{guest.nrc}</td>
              <td className="border border-slate-800 p-2">{guest.parents || '-'}</td>
              <td className="border border-slate-800 p-2">
                <div className="font-semibold">{guest.origin}</div>
                {guest.reason && <div className="text-[10px] text-slate-500 mt-1">({guest.reason})</div>}
              </td>
              <td className="border border-slate-800 p-2 font-medium">
                {guest.stayFrom} မှ <br/>{guest.stayTo} ထိ
              </td>
              <td className="border border-slate-800 p-2 text-center font-bold">
                {guest.isCurrent ? 'နေထိုင်ဆဲ' : 'ထွက်ခွာပြီး'}
              </td>
              <td className="border border-slate-800 p-2 text-[11px]">
                {guest.familyMembers && guest.familyMembers.length > 0 ? (
                  <ul className="list-decimal pl-4 space-y-0.5">
                    {guest.familyMembers.map((m) => (
                      <li key={m.id}>
                        {m.name} ({m.relation} - {m.age} နှစ်)
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-slate-400 font-normal">-</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Footer signature line for Print */}
      <div className="mt-16 flex justify-between text-xs font-semibold px-4">
        <div className="text-center">
          <div className="border-b border-slate-400 w-36 mb-1 mx-auto h-8"></div>
          <span>စစ်ဆေးသူ (အက်ဒမင်) လက်မှတ်</span>
        </div>
        <div className="text-center">
          <div className="border-b border-slate-400 w-36 mb-1 mx-auto h-8"></div>
          <span>တိုင်ကြားသူ (အိမ်ရှင်) လက်မှတ်</span>
        </div>
      </div>
    </div>
  </>
);
}
