import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, CheckCircle2, Sparkles, Award, Unlock, Check, Info, X, 
  Trash2, CheckCheck, ChevronRight
} from 'lucide-react';
import { User, AppNotification } from '../types';
import { db } from '../firebase';
import { 
  collection, query, where, onSnapshot, doc, updateDoc, 
  deleteDoc, writeBatch, getDocs 
} from 'firebase/firestore';
import { showToast } from './Toast';

interface NotificationBellProps {
  currentUser: User | null;
  onOpenCourse?: (courseId: string) => void;
}

export function NotificationBell({ currentUser, onOpenCourse }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      return;
    }

    const emailClean = currentUser.email.toLowerCase();

    // Subscribe to Firestore real-time notifications
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userEmail', '==', emailClean)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list: AppNotification[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as Omit<AppNotification, 'id'>)
        }));

        // Sort descending by createdAt
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setNotifications(list);
      }, (err) => {
        // Fallback to local storage
        const saved = localStorage.getItem(`sio_notifications_${emailClean}`);
        if (saved) {
          try {
            setNotifications(JSON.parse(saved));
          } catch (e) {}
        }
      });

      return () => unsubscribe();
    } catch (e) {
      const saved = localStorage.getItem(`sio_notifications_${emailClean}`);
      if (saved) {
        try {
          setNotifications(JSON.parse(saved));
        } catch (e) {}
      }
    }
  }, [currentUser]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!currentUser) return null;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { isRead: true });
    } catch (err) {
      // Local fallback
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.isRead);
    if (unread.length === 0) return;

    try {
      const batch = writeBatch(db);
      unread.forEach(n => {
        batch.update(doc(db, 'notifications', n.id), { isRead: true });
      });
      await batch.commit();
      showToast('Toutes les notifications ont été marquées comme lues', 'success');
    } catch (err) {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    }
  };

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (err) {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }
  };

  const clearAllNotifications = async () => {
    if (notifications.length === 0) return;
    try {
      const batch = writeBatch(db);
      notifications.forEach(n => {
        batch.delete(doc(db, 'notifications', n.id));
      });
      await batch.commit();
      showToast('Notifications effacées', 'success');
    } catch (err) {
      setNotifications([]);
    }
  };

  const handleNotificationClick = (notif: AppNotification) => {
    if (!notif.isRead) {
      markAsRead(notif.id);
    }
    if (notif.courseId && onOpenCourse) {
      onOpenCourse(notif.courseId);
      setIsOpen(false);
    }
  };

  const filteredNotifications = notifications.filter(n => filter === 'all' || !n.isRead);

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'module_completed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'course_completed':
        return <Sparkles className="w-4 h-4 text-amber-400" />;
      case 'certificate_earned':
        return <Award className="w-4 h-4 text-indigo-400" />;
      case 'access_granted':
        return <Unlock className="w-4 h-4 text-sky-400" />;
      case 'quiz_passed':
        return <Check className="w-4 h-4 text-purple-400" />;
      default:
        return <Info className="w-4 h-4 text-slate-400" />;
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

      if (diffMinutes < 1) return 'À l\'instant';
      if (diffMinutes < 60) return `il y a ${diffMinutes} min`;
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `il y a ${diffHours} h`;
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        title="Notifications"
        className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer flex items-center justify-center"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-black shadow-lg shadow-rose-500/30 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="fixed sm:absolute inset-x-3 sm:inset-auto sm:right-0 top-16 sm:top-full sm:mt-2 w-auto sm:w-96 max-w-[calc(100vw-1.5rem)] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/90 z-50 overflow-hidden font-sans">
          {/* Header */}
          <div className="p-3.5 bg-slate-950 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <Bell className="w-4 h-4 text-indigo-400 shrink-0" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider truncate">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md shrink-0">
                  {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 text-[11px] shrink-0">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); markAllAsRead(); }}
                  title="Tout marquer comme lu"
                  className="p-1.5 hover:bg-white/10 text-slate-400 hover:text-indigo-300 rounded-lg transition-colors cursor-pointer"
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); clearAllNotifications(); }}
                  title="Tout effacer"
                  className="p-1.5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                title="Fermer"
                className="p-1.5 sm:hidden hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b border-white/10 bg-slate-950/50 text-xs">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setFilter('all'); }}
              className={`flex-1 py-2 text-center font-bold transition-colors cursor-pointer ${
                filter === 'all' ? 'text-indigo-400 border-b-2 border-indigo-500 bg-white/5' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Toutes ({notifications.length})
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setFilter('unread'); }}
              className={`flex-1 py-2 text-center font-bold transition-colors cursor-pointer ${
                filter === 'unread' ? 'text-indigo-400 border-b-2 border-indigo-500 bg-white/5' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Non lues ({unreadCount})
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs font-sans">
                <Bell className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                <p className="font-semibold text-slate-300">Aucune notification {filter === 'unread' ? 'non lue' : ''}</p>
                <p className="text-[10px] text-slate-500 mt-1">Vous êtes à jour !</p>
              </div>
            ) : (
              filteredNotifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-3.5 hover:bg-white/5 transition-all cursor-pointer flex gap-3 items-start group relative ${
                    !n.isRead ? 'bg-indigo-950/20 border-l-2 border-indigo-500' : ''
                  }`}
                >
                  <div className="p-2 rounded-xl bg-slate-800/80 border border-white/10 shrink-0 mt-0.5">
                    {getIcon(n.type)}
                  </div>

                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <p className={`text-xs font-bold truncate ${!n.isRead ? 'text-white font-extrabold' : 'text-slate-200'}`}>
                        {n.title}
                      </p>
                      <span className="text-[10px] text-slate-500 shrink-0">
                        {formatTime(n.createdAt)}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                      {n.message}
                    </p>

                    {n.courseId && (
                      <div className="mt-1.5 flex items-center gap-1 text-[10px] text-indigo-400 font-bold group-hover:translate-x-0.5 transition-transform">
                        <span>Voir la formation</span>
                        <ChevronRight className="w-3 h-3" />
                      </div>
                    )}
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={(e) => deleteNotification(n.id, e)}
                    title="Supprimer"
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-all absolute right-2 top-2"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
