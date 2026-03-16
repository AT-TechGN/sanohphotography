import { useEffect, useState, useCallback } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import contactService from '../../services/contactService';
import useUIStore from '../../stores/uiStore';
import {
  EnvelopeIcon, EnvelopeOpenIcon, TrashIcon,
  MagnifyingGlassIcon, CheckCircleIcon, XMarkIcon,
  ClockIcon, PaperAirplaneIcon,
} from '@heroicons/react/24/outline';

/* ── Helpers ─────────────────────────────────────────────────────────────── */
const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const fmtShort = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

const getInitials = (name = '') =>
  name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

/* ── MessageItem — composant stable pour éviter removeChild ─────────────── */
const MessageItem = ({ msg, isSelected, onClick }) => (
  <button
    type="button"
    onClick={() => onClick(msg)}
    className={[
      'w-full text-left p-4 rounded-2xl border transition-all',
      isSelected
        ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-400'
        : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-amber-300 dark:hover:border-amber-500/50',
    ].join(' ')}
  >
    <div className="flex items-start gap-3">
      <div className={[
        'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0',
        msg.isRead ? 'bg-gray-100 dark:bg-gray-700 text-gray-500' : 'bg-amber-500 text-white',
      ].join(' ')}>
        {getInitials(msg.senderName)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span className={[
            'text-sm font-semibold truncate',
            msg.isRead ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-white',
          ].join(' ')}>
            {msg.senderName}
          </span>
          <span className="text-xs text-gray-400 flex-shrink-0">{fmtShort(msg.createdAt)}</span>
        </div>
        <p className={[
          'text-xs truncate mb-1',
          msg.isRead ? 'text-gray-500' : 'text-amber-600 dark:text-amber-400 font-medium',
        ].join(' ')}>
          {msg.subject}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{msg.body}</p>
        <div className="flex items-center gap-2 mt-1.5">
          {!msg.isRead && <span className="w-2 h-2 bg-amber-500 rounded-full inline-block" />}
          {msg.replyBody && (
            <span className="text-[10px] px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full font-medium">
              ✓ Répondu
            </span>
          )}
        </div>
      </div>
    </div>
  </button>
);

/* ── MessageDetail — panneau de détail stable ────────────────────────────── */
const MessageDetail = ({ msg, onClose, onDelete, onReply, deleting }) => {
  const [replyText, setReplyText] = useState(msg.replyBody ?? '');
  const [replying, setReplying]   = useState(false);
  const { showSuccess, showError } = useUIStore();

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setReplying(true);
    try {
      const res = await contactService.reply(msg.id, replyText);
      showSuccess('Réponse envoyée !');
      onReply(res.contact);
    } catch (err) {
      showError(err.response?.data?.error || 'Erreur envoi réponse');
    } finally {
      setReplying(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-5 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
        <div className="w-11 h-11 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold flex-shrink-0">
          {getInitials(msg.senderName)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 dark:text-white truncate">{msg.senderName}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{msg.senderEmail}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={() => onDelete(msg.id)}
            disabled={deleting === msg.id}
            title="Supprimer"
            className="p-2 rounded-xl text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors lg:hidden"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Corps scrollable */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white text-lg mb-1">{msg.subject}</h4>
          <p className="text-xs text-gray-400 flex items-center gap-1.5">
            <ClockIcon className="w-3.5 h-3.5" />
            {fmtDate(msg.createdAt)}
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Message</p>
          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
            {msg.body}
          </p>
        </div>

        {msg.replyBody && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-2xl p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-3 flex items-center gap-2">
              <CheckCircleIcon className="w-4 h-4" />
              Votre réponse · {fmtDate(msg.repliedAt)}
            </p>
            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
              {msg.replyBody}
            </p>
          </div>
        )}
      </div>

      {/* Zone réponse */}
      <div className="border-t border-gray-100 dark:border-gray-700 p-5 flex-shrink-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
          {msg.replyBody ? 'Modifier la réponse' : 'Répondre'}
        </p>
        <textarea
          rows={4}
          value={replyText}
          onChange={e => setReplyText(e.target.value)}
          placeholder={`Bonjour ${msg.senderName?.split(' ')[0]},\n\nMerci pour votre message…`}
          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
        />
        <div className="flex items-center justify-between mt-3 gap-3">
          <p className="text-xs text-gray-400 hidden sm:block">
            Réponse sauvegardée en base de données
          </p>
          <button
            type="button"
            onClick={handleReply}
            disabled={replying || !replyText.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-400 disabled:opacity-50 transition-all ml-auto"
          >
            {replying
              ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <PaperAirplaneIcon className="w-4 h-4" />
            }
            {replying ? 'Envoi…' : 'Envoyer'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Composant principal ─────────────────────────────────────────────────── */
export default function MessagesManagement() {
  const { showSuccess, showError } = useUIStore();

  const [messages,  setMessages]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [filter,    setFilter]    = useState('all');
  const [selected,  setSelected]  = useState(null);
  const [deleting,  setDeleting]  = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await contactService.getAll();
      setMessages(Array.isArray(data) ? data : []);
    } catch {
      showError('Erreur chargement messages');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => { load(); }, [load]);

  const openMessage = async (msg) => {
    setSelected(msg);
    if (!msg.isRead) {
      try {
        await contactService.markAsRead(msg.id);
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isRead: true } : m));
        setSelected(prev => prev?.id === msg.id ? { ...prev, isRead: true } : prev);
      } catch { /* silencieux */ }
    }
  };

  const handleReply = (updatedContact) => {
    setMessages(prev => prev.map(m => m.id === updatedContact.id ? updatedContact : m));
    setSelected(updatedContact);
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await contactService.delete(id);
      showSuccess('Message supprimé');
      setMessages(prev => prev.filter(m => m.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch {
      showError('Erreur suppression');
    } finally {
      setDeleting(null);
    }
  };

  const filtered = messages.filter(m => {
    if (filter === 'unread'  && m.isRead)     return false;
    if (filter === 'replied' && !m.replyBody) return false;
    if (search) {
      const s = search.toLowerCase();
      return (m.senderName  ?? '').toLowerCase().includes(s)
          || (m.senderEmail ?? '').toLowerCase().includes(s)
          || (m.subject     ?? '').toLowerCase().includes(s);
    }
    return true;
  });

  const unreadCount = messages.filter(m => !m.isRead).length;

  return (
    <div className="flex flex-col h-full p-3 sm:p-4 lg:p-6 gap-4 min-h-0">

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <EnvelopeIcon className="w-7 h-7 text-amber-500" />
            Messages
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 bg-red-500 text-white text-sm font-bold rounded-full">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {messages.length} message{messages.length !== 1 ? 's' : ''} · {unreadCount} non lu{unreadCount !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-400 transition-colors"
        >
          Actualiser
        </button>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900 dark:text-white"
          />
        </div>
        <div className="flex gap-2">
          {[
            { id: 'all',     label: 'Tous'     },
            { id: 'unread',  label: 'Non lus'  },
            { id: 'replied', label: 'Répondus' },
          ].map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className={[
                'px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
                filter === id
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                  : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-amber-400',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Corps split */}
      <div className="flex gap-4 flex-1 min-h-0 overflow-hidden">

        {/* Liste — cachée sur mobile si un message est sélectionné */}
        <div className={[
          'flex flex-col gap-2 overflow-y-auto flex-shrink-0',
          selected ? 'hidden lg:flex lg:w-80 xl:w-96' : 'w-full',
        ].join(' ')}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <span className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <EnvelopeIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">Aucun message</p>
            </div>
          ) : (
            filtered.map(msg => (
              <MessageItem
                key={msg.id}
                msg={msg}
                isSelected={selected?.id === msg.id}
                onClick={openMessage}
              />
            ))
          )}
        </div>

        {/* Détail — AnimatePresence correctement wrappé */}
        <div className="flex-1 min-h-0 min-w-0">
          <AnimatePresence mode="wait">
            {selected ? (
              <Motion.div
                key={`detail-${selected.id}`}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.18 }}
                className="h-full"
              >
                <MessageDetail
                  msg={selected}
                  onClose={() => setSelected(null)}
                  onDelete={handleDelete}
                  onReply={handleReply}
                  deleting={deleting}
                />
              </Motion.div>
            ) : (
              <Motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="hidden lg:flex h-full items-center justify-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700"
              >
                <div className="text-center">
                  <EnvelopeOpenIcon className="w-14 h-14 text-gray-200 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 dark:text-gray-500 text-sm">Sélectionnez un message</p>
                </div>
              </Motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
