/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, AlertCircle } from 'lucide-react';
import jsQR from 'jsqr';

interface QRScannerProps {
  onScan: (decodedData: string) => void;
  onClose: () => void;
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [statusText, setStatusText] = useState('ကင်မရာကို ဖွင့်လှစ်နေပါသည်...');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setErrorMsg(null);
    setStatusText('ကင်မရာကို ဖွင့်လှစ်နေပါသည်...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true'); // required to tell iOS safari we don't want fullscreen
        videoRef.current.play();
      }
      setIsCameraActive(true);
      setStatusText('QR Code ကို ကင်မရာအလယ်တွင် ထားရှိပေးပါ');
      // Start scanning loop
      animationFrameRef.current = requestAnimationFrame(scanLoop);
    } catch (err: any) {
      console.error('Error accessing camera for QR:', err);
      setErrorMsg('ကင်မရာအသုံးပြုခွင့် မရရှိပါ သို့မဟုတ် ကင်မရာစက်ပစ္စည်း မတွေ့ရှိပါ။');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const scanLoop = () => {
    if (!videoRef.current || !canvasRef.current) {
      animationFrameRef.current = requestAnimationFrame(scanLoop);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      // Set canvas size to match video
      const width = video.videoWidth;
      const height = video.videoHeight;
      canvas.width = width;
      canvas.height = height;

      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, width, height);

      // Extract image data
      try {
        const imageData = ctx.getImageData(0, 0, width, height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code && code.data) {
          // Detected QR Code!
          // Vibrate device if supported
          if (navigator.vibrate) {
            navigator.vibrate(100);
          }
          stopCamera();
          onScan(code.data);
          return; // Stop loop
        }
      } catch (e) {
        console.error('Error during QR decode:', e);
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanLoop);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col relative">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Camera size={18} className="text-emerald-400" />
            <h3 className="font-bold text-sm">QR Code စကင်နာ (Scan QR)</h3>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="ပိတ်ရန်"
          >
            <X size={20} />
          </button>
        </div>

        {/* Video Stage */}
        <div className="relative w-full aspect-square bg-black overflow-hidden flex items-center justify-center">
          {isCameraActive && (
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              muted
              playsInline
            />
          )}

          {/* Canvas for rendering frames (hidden or used for debug) */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Scanner Framing Overlay */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {/* Dark mask around scanner target */}
            <div className="absolute inset-0 border-[40px] md:border-[60px] border-black/50" />
            
            {/* Target box */}
            <div className="w-56 h-56 md:w-64 md:h-64 border-2 border-emerald-400 rounded-2xl relative shadow-[0_0_15px_rgba(52,211,153,0.3)]">
              {/* Corner brackets */}
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />
              
              {/* Laser line effect */}
              <div className="absolute left-1 right-1 h-0.5 bg-emerald-400 opacity-70 animate-bounce top-1/2" />
            </div>
          </div>

          {!isCameraActive && !errorMsg && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <Camera size={44} className="animate-pulse text-slate-600 mb-2" />
              <p className="text-xs">{statusText}</p>
            </div>
          )}

          {errorMsg && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-slate-900/90">
              <AlertCircle size={44} className="text-rose-500 mb-2" />
              <p className="text-sm font-bold text-white mb-2">အမှားအယွင်း ဖြစ်ပေါ်ပါသည်</p>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xs">{errorMsg}</p>
              <button
                onClick={startCamera}
                className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
              >
                ပြန်လည်ကြိုးစားမည်
              </button>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-5 py-4 bg-slate-950/40 border-t border-slate-800 text-center">
          <p className="text-[11px] font-medium text-emerald-400 leading-normal animate-pulse">
            {statusText}
          </p>
          <p className="text-[10px] text-slate-500 mt-1 leading-normal">
            ဧည့်စာရင်းစနစ်မှ ထုတ်ပေးထားသော QR Code (Sync QR) များကို စကင်ဖတ်၍ အချက်အလက်များ တိုက်ရိုက်ထည့်သွင်းနိုင်ပါသည်။
          </p>
        </div>

      </div>
    </div>
  );
}
