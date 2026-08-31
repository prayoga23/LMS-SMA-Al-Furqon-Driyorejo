'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { getFirebaseMessaging } from '@/lib/firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { Bell, X } from 'lucide-react';

export const NotificationManager: React.FC = () => {
  const { user } = useAuth();
  const [showPrompt, setShowPrompt] = useState(false);
  const [toast, setToast] = useState<{ title: string; body: string; url?: string } | null>(null);

  useEffect(() => {
    if (!user || typeof window === 'undefined' || !('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      registerDeviceToken();
    } else if (Notification.permission === 'default') {
      const dismissed = localStorage.getItem('fcm_prompt_dismissed');
      if (!dismissed) {
        setShowPrompt(true);
      }
    }

    // Listen for foreground push messages
    let unsubscribe: (() => void) | undefined;
    getFirebaseMessaging().then((messaging) => {
      if (messaging) {
        unsubscribe = onMessage(messaging, (payload) => {
          const title = payload.notification?.title || payload.data?.title || 'Notifikasi Baru';
          const body = payload.notification?.body || payload.data?.body || '';
          const url = payload.data?.url || payload.data?.click_action;

          setToast({ title, body, url });
          setTimeout(() => setToast(null), 6000);
        });
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  const registerDeviceToken = async () => {
    try {
      if (!('serviceWorker' in navigator)) return;

      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      const messaging = await getFirebaseMessaging();
      if (!messaging) return;

      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || undefined;

      const token = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: registration,
      });

      if (token) {
        const userAgent = navigator.userAgent;
        let browser = 'Browser';
        if (userAgent.includes('Chrome')) browser = 'Chrome';
        else if (userAgent.includes('Firefox')) browser = 'Firefox';
        else if (userAgent.includes('Safari')) browser = 'Safari';
        else if (userAgent.includes('Edge')) browser = 'Edge';

        await api.post('/notifications/device', {
          token,
          platform: 'WEB',
          deviceName: navigator.platform || 'Web Device',
          browser,
          appVersion: '1.0.0',
        });
      }
    } catch (error) {
      console.warn('[NotificationManager] Registration warning:', error);
    }
  };

  const handleAllowNotification = async () => {
    try {
      const permission = await Notification.requestPermission();
      setShowPrompt(false);
      if (permission === 'granted') {
        await registerDeviceToken();
      }
    } catch (error) {
      console.error('[NotificationManager] Permission error:', error);
      setShowPrompt(false);
    }
  };

  const handleDismissPrompt = () => {
    setShowPrompt(false);
    localStorage.setItem('fcm_prompt_dismissed', 'true');
  };

  return (
    <>
      {/* Foreground Push Toast Popup */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 max-w-sm w-full bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-emerald-500/30 animate-in fade-in slide-in-from-top-4 duration-300 flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-600 text-white shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold truncate text-white">{toast.title}</h4>
            <p className="text-xs text-slate-300 mt-0.5 line-clamp-2">{toast.body}</p>
            {toast.url && (
              <a
                href={toast.url}
                className="inline-block mt-2 text-xs font-semibold text-emerald-400 hover:underline"
              >
                Lihat Detail &rarr;
              </a>
            )}
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Soft Permission Request Banner */}
      {showPrompt && (
        <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 max-w-sm w-full bg-white p-4 rounded-2xl shadow-xl border border-emerald-100 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800 shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-bold text-slate-900">Aktifkan Notifikasi Website</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Dapatkan pemberitahuan langsung untuk nilai baru, presensi, SPP, dan pengumuman sekolah.
              </p>
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={handleAllowNotification}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                >
                  Izinkan Notifikasi
                </button>
                <button
                  onClick={handleDismissPrompt}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs rounded-xl transition-all"
                >
                  Nanti Saja
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
