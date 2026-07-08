/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Camera, Image as ImageIcon, X, RefreshCw } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (base64Image: string) => void;
  currentImage?: string;
  label?: string;
}

export default function CameraCapture({ onCapture, currentImage, label = 'ဓာတ်ပုံရိုက်ရန် / တင်ရန်' }: CameraCaptureProps) {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.error('Error accessing camera:', err);
      setErrorMsg('ကင်မရာအသုံးပြုခွင့် မရရှိပါ သို့မဟုတ် ကင်မရာမရှိပါ။ ဖိုင်တင်ခြင်းကို အသုံးပြုပေးပါ။');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw the current frame from video
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to base64
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        onCapture(dataUrl);
        stopCamera();
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          onCapture(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            onCapture(reader.result);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full flex flex-col items-center">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {isCameraActive ? (
        <div className="relative w-full max-w-sm aspect-square bg-black rounded-2xl overflow-hidden border-2 border-slate-700 shadow-xl flex flex-col justify-between">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
          
          {/* Overlay Grid lines for framing */}
          <div className="absolute inset-0 border border-white/20 pointer-events-none flex flex-col justify-between">
            <div className="h-1/3 border-b border-white/10" />
            <div className="h-1/3 border-b border-white/10" />
          </div>
          <div className="absolute inset-y-0 left-1/3 right-1/3 border-x border-white/10 pointer-events-none" />

          {/* Close button */}
          <button
            type="button"
            onClick={stopCamera}
            className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors z-10"
            title="ပိတ်ရန်"
          >
            <X size={18} />
          </button>

          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 z-10 px-4">
            <button
              type="button"
              onClick={capturePhoto}
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium rounded-full shadow-lg transition-transform active:scale-95 flex items-center gap-2"
            >
              <Camera size={16} />
              ဓာတ်ပုံရိုက်မည်
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`relative w-full max-w-sm aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all overflow-hidden ${
            dragActive
              ? 'border-indigo-500 bg-indigo-500/5'
              : currentImage
              ? 'border-slate-300 bg-slate-50 hover:border-slate-400'
              : 'border-slate-300 bg-slate-50 hover:border-slate-400'
          }`}
          onClick={triggerFileSelect}
        >
          {currentImage ? (
            <div className="absolute inset-0 w-full h-full group">
              <img
                src={currentImage}
                alt="Captured"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerFileSelect();
                  }}
                  className="p-2.5 bg-white/95 text-slate-800 hover:bg-white rounded-full shadow-md transition-transform hover:scale-105"
                  title="ဓာတ်ပုံအသစ်ရွေးရန်"
                >
                  <ImageIcon size={20} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    startCamera();
                  }}
                  className="p-2.5 bg-white/95 text-slate-800 hover:bg-white rounded-full shadow-md transition-transform hover:scale-105"
                  title="ကင်မရာဖြင့် ရိုက်ကူးရန်"
                >
                  <Camera size={20} />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 border border-indigo-100">
                <Camera size={28} />
              </div>
              <p className="font-semibold text-slate-700 text-sm mb-1">{label}</p>
              <p className="text-xs text-slate-400 max-w-[240px] leading-relaxed">
                ဤနေရာသို့ ပုံဆွဲထည့်ပါ သို့မဟုတ် ကလစ်နှိပ်၍ ဖိုင်ရွေးပါ
              </p>
              
              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    startCamera();
                  }}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <Camera size={14} />
                  ကင်မရာဖွင့်ရန်
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {errorMsg && (
        <p className="text-rose-500 text-xs mt-2 text-center font-medium max-w-sm bg-rose-50 p-2 rounded-lg border border-rose-100">
          {errorMsg}
        </p>
      )}
    </div>
  );
}
