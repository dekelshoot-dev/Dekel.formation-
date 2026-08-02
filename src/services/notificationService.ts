import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { AppNotification } from '../types';

export const sendRealtimeNotification = async (
  notif: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'>
): Promise<void> => {
  const userEmail = notif.userEmail.toLowerCase();
  const newNotif: AppNotification = {
    ...notif,
    userEmail,
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    isRead: false,
    createdAt: new Date().toISOString()
  };

  try {
    await addDoc(collection(db, 'notifications'), newNotif);
  } catch (err) {
    // Fallback to local storage for offline support
    const key = `sio_notifications_${userEmail}`;
    const saved = localStorage.getItem(key);
    const current = saved ? JSON.parse(saved) : [];
    localStorage.setItem(key, JSON.stringify([newNotif, ...current]));
  }
};
