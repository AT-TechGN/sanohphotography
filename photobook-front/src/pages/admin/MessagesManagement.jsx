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
const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  : '—';

const initials = (name = '') => name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

/* ── Composant principal ─────────────────────────────────────────────────── */
export default function MessagesManagement() {
  const { showSuccess, showError } = useUIStore();

  const [messages,  setMessages]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [filter,    setFilter]    = useState('all'); // all | unread | replied
  const [selected,  setSelected]  = useState(null);  // message ouvert
  const [replyText, setReplyText] = useState('');
  const [replying,  setReplying]  = useState(false);
  const [deleting,  setDeleting]  = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await contactService.getAll();
      setMessages(Array.isArray(data) ? data : []);
    } catch { showError('Erreur chargement messages'); }
    finally  { setLoading(false); }
  }, [showError]);

  useEffect(() => { load(); }, [load]);

  // Marquer comme lu quand on ouvre
  const openMessage = async (msg) => {
    setSelected(msg);
    setReplyText('');
    if (!msg.isRead) {
      try {
        await contactService.markAsRead(msg.id);
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isRead: true } : m));
      } catch { /* silencieux */ }
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !selected) return;
    setReplying(true);
    try {
      const res = await contactService.reply(selected.id, replyText);
      showSuccess('Réponse envoyée !');
      setMessages(prev => prev.map(m => m.id === selected.id ? res.contact : m));
      setSelected(res.contact);
      setReplyText('');
    } catch (err) {
      showError(err.response?.data?.error || 'Erreur envoi réponse');
    } finally { setReplying(false); }
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await contactService.delete(id);
      showSuccess('Message supprimé');
      setMessages(prev => prev.filter(m => m.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch { showError('Erreur suppression'); }
    finally  { setDeleting(null); }
  };

  // Filtrage + recherche
  const filtered = messages.filter(m => {
    if (filter === 'unread'  && m.isRead)     return false;
    if (filter === 'replied' && !m.replyBody) return false;
    if (search) {
      const s = search.toLowerCase();
      return m.senderName?.toLowerCase().includes(s)
          || m.senderEmail?.toLowerCase().includes(s)
          || m.subject?.toLowerCase().includes(s);
    }
    return true;
  });

  const unreadCount = messages.filter(m => !m.isRead).length;

  return (
    <div className="h-full flex flex-col p-3 sm:p-4 lg:p-6 gap-4">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
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
        <button onClick={load}
          className="px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-400 transition-colors">
          Actualiser
        </button>
      </div>

      {/* ── Filtres + recherche ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text" placeholder="Rechercher un message…"
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900 dark:text-white"
          />
        </div>
        <div className="flex gap-2">
          {[
            { id: 'all',     label: 'Tous'     },
            { id: 'unread',  label: 'Non lus'  },
            { id: 'replied', label: 'Répondus' },
          ].map(({ id, label }) => (
            <button key={id} onClick={() => setFilter(id)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                filter === id
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                  : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-amber-400'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Corps : liste + détail ─────────────────────────────────────── */}
      <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">

        {/* Liste messages */}
        <div className={`flex flex-col gap-2 overflow-y-auto ${selected ? 'hidden lg:flex lg:w-80 xl:w-96 flex-shrink-0' : 'w-full'}`}>
          {loading ? (
            <div className="flex-1 flex items-center justify-center py-12">
              <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <EnvelopeIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">Aucun message</p>
            </div>
          ) : filtered.map(msg => (
            <Motion.button key={msg.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => openMessage(msg)}
              className={`w-full text-left p-4 rounded-2xl border transition-all ${
                selected?.id === msg.id
                  ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-400'
                  : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-amber-300 dark:hover:border-amber-500/50'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                  msg.isRead
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                    : 'bg-amber-500 text-white'
                }`}>
                  {initials(msg.senderName)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className={`text-sm font-semibold truncate ${msg.isRead ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-white'}`}>
                      {msg.senderName}
                    </span>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {new Date(msg.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <p className={`text-xs truncate mb-1 ${msg.isRead ? 'text-gray-500' : 'text-amber-600 dark:text-amber-400 font-medium'}`}>
                    {msg.subject}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{msg.body}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {!msg.isRead && (
                      <span className="w-2 h-2 bg-amber-500 rounded-full" />
                    )}
                    {msg.replyBody && (
                      <span className="text-[10px] px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full font-medium">
                        ✓ Répondu
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Motion.button>
          ))}
        </div>

        {/* Détail message */}
        <AnimatePresence mode="wait">
          {selected && (
            <Motion.div
              key={selected.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col min-h-0 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden"
            >
              {/* Header détail */}
              <div className="flex items-center gap-3 p-5 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
                <div className="w-11 h-11 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold">
                  {initials(selected.senderName)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 dark:text-white">{selected.senderName}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{selected.senderEmail}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleDelete(selected.id)}
                    disabled={deleting === selected.id}
                    className="p-2 rounded-xl text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="Supprimer"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelected(null)}
                    className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors lg:hidden"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Corps scrollable */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {/* Sujet + date */}
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-lg mb-1">{selected.subject}</h4>
                  <p className="text-xs text-gray-400 flex items-center gap-1.5">
                    <ClockIcon className="w-3.5 h-3.5" />
                    {fmtDate(selected.createdAt)}
                  </p>
                </div>

                {/* Message original */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Message</p>
                  <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {selected.body}
                  </p>
                </div>

                {/* Réponse existante */}
                {selected.replyBody && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-2xl p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-3 flex items-center gap-2">
                      <CheckCircleIcon className="w-4 h-4" />
                      Votre réponse · {fmtDate(selected.repliedAt)}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                      {selected.replyBody}
                    </p>
                  </div>
                )}
              </div>

              {/* Zone réponse */}
              <div className="border-t border-gray-100 dark:border-gray-700 p-5 flex-shrink-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                  {selected.replyBody ? 'Modifier la réponse' : 'Répondre'}
                </p>
                <textarea
                  rows={4}
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder={`Bonjour ${selected.senderName?.split(' ')[0]},\n\nMerci pour votre message…`}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                />
                <div className="flex items-center justify-between mt-3">
                  <p className="text-xs text-gray-400">
                    La réponse est sauvegardée · En attente de configuration email
                  </p>
                  <button
                    onClick={handleReply}
                    disabled={replying || !replyText.trim()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-400 disabled:opacity-50 transition-all"
                  >
                    {replying
                      ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <PaperAirplaneIcon className="w-4 h-4" />
                    }
                    {replying ? 'Envoi…' : 'Envoyer'}
                  </button>
                </div>
              </div>
            </Motion.div>
          )}
        </AnimatePresence>

        {/* Placeholder quand rien sélectionné sur desktop */}
        {!selected && !loading && filtered.length > 0 && (
          <div className="hidden lg:flex flex-1 items-center justify-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
            <div className="text-center">
              <EnvelopeOpenIcon className="w-14 h-14 text-gray-200 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 dark:text-gray-500">Sélectionnez un message</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
