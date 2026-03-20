import { useState, useEffect, useRef } from 'react';
import { motion as Motion } from 'framer-motion';
import contactService from '../../services/contactService';
import {
  MapPinIcon, PhoneIcon, EnvelopeIcon, ClockIcon,
  CheckCircleIcon, PaperAirplaneIcon, XMarkIcon,
} from '@heroicons/react/24/outline';

/* ─────────────────────────────────────────────────────────────────────────────
   ContactSection — carte Leaflet/OpenStreetMap + formulaire contact
   Localisation : Kaloum, Conakry, Guinée
   Coordonnées  : 9.5370, -13.6773
───────────────────────────────────────────────────────────────────────────── */

// Infos du studio
const STUDIO = {
  lat:     9.5370,
  lng:    -13.6773,
  name:   'Sanoh Photography Studio',
  address:'Kankan, Avenue de la République',
  city:   'Conakry, Guinée',
  phone:  '+224 610 00 31 71',
  email:  'contact@sanohphotography.com',
  hours:  [
    { day: 'Lundi — Vendredi', time: '08h — 19h' },
    { day: 'Samedi',           time: '09h — 17h' },
    { day: 'Dimanche',         time: 'Sur rendez-vous' },
  ],
};

/* ── Carte interactive via OpenStreetMap (iframe Leaflet hosted) ─────────── */
const InteractiveMap = () => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    // Charger Leaflet dynamiquement (pas besoin d'installer npm)
    const loadLeaflet = async () => {
      if (window.L) { initMap(); return; }

      // Injecter le CSS Leaflet
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id   = 'leaflet-css';
        link.rel  = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
        document.head.appendChild(link);
      }

      // Injecter le JS Leaflet
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
        script.onload  = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });

      initMap();
    };

    const initMap = () => {
      if (!mapRef.current || mapInstance.current) return;

      const L = window.L;

      // Créer la carte centrée sur Conakry
      const map = L.map(mapRef.current, {
        center:           [STUDIO.lat, STUDIO.lng],
        zoom:             15,
        zoomControl:      true,
        scrollWheelZoom:  true,
        attributionControl: true,
      });

      // Tuiles OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom:     19,
      }).addTo(map);

      // Marqueur personnalisé ambre
      const markerIcon = L.divIcon({
        className: '',
        html: `
          <div style="
            width:44px; height:44px;
            background: linear-gradient(135deg, #f59e0b, #d97706);
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 3px solid white;
            box-shadow: 0 4px 15px rgba(245,158,11,0.5);
            display:flex; align-items:center; justify-content:center;
          ">
            <div style="transform:rotate(45deg); font-size:18px;">📷</div>
          </div>
        `,
        iconSize:   [44, 44],
        iconAnchor: [22, 44],
        popupAnchor:[0, -48],
      });

      // Popup riche
      const popup = L.popup({
        maxWidth: 280,
        className: 'sanoh-popup',
      }).setContent(`
        <div style="font-family:'DM Sans',sans-serif; padding:4px;">
          <div style="font-weight:700; font-size:14px; color:#1f2937; margin-bottom:4px;">
            📷 ${STUDIO.name}
          </div>
          <div style="font-size:12px; color:#6b7280; margin-bottom:6px;">
            📍 ${STUDIO.address}<br>${STUDIO.city}
          </div>
          <div style="font-size:12px; color:#6b7280; margin-bottom:6px;">
            📞 ${STUDIO.phone}
          </div>
          <a href="https://www.google.com/maps/dir/?api=1&destination=${STUDIO.lat},${STUDIO.lng}"
             target="_blank"
             style="
               display:inline-block; margin-top:4px;
               background:linear-gradient(135deg,#f59e0b,#d97706);
               color:white; border-radius:8px;
               padding:6px 12px; font-size:11px;
               font-weight:600; text-decoration:none;
             ">
            🗺️ Itinéraire
          </a>
        </div>
      `);

      const marker = L.marker([STUDIO.lat, STUDIO.lng], { icon: markerIcon })
        .addTo(map)
        .bindPopup(popup)
        .openPopup();

      // Cercle de zone (rayon 200m)
      L.circle([STUDIO.lat, STUDIO.lng], {
        radius:      300,
        color:       '#f59e0b',
        fillColor:   '#f59e0b',
        fillOpacity: 0.08,
        weight:      2,
        dashArray:   '6,4',
      }).addTo(map);

      mapInstance.current = map;
      setMapReady(true);
    };

    loadLeaflet().catch(console.error);

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full min-h-[320px] rounded-2xl overflow-hidden">
      {/* Fond de chargement */}
      {!mapReady && (
        <div className="absolute inset-0 bg-gray-800 flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-400">Chargement de la carte…</span>
          </div>
        </div>
      )}
      <div ref={mapRef} className="w-full h-full" style={{ minHeight: '320px' }} />
    </div>
  );
};

/* ── Formulaire de contact ────────────────────────────────────────────────── */
const ContactForm = () => {
  const [form, setForm]           = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading]     = useState(false);
  const [success, setSuccess]     = useState(false);
  const [error, setError]         = useState('');

  const SUBJECTS = [
    'Demande de devis — Mariage',
    'Demande de devis — Portrait',
    'Demande de devis — Famille',
    'Demande de devis — Événement',
    'Question générale',
    'Partenariat / Collaboration',
    'Autre',
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await contactService.send(form);
      setSuccess(true);
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      setError(err.response?.data?.errors?.join(', ') || 'Erreur lors de l\'envoi. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <Motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex flex-col items-center justify-center h-full py-16 text-center"
    >
      <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
        <CheckCircleIcon className="w-10 h-10 text-green-400" />
      </div>
      <h3 className="text-2xl font-bold text-white mb-3">Message envoyé !</h3>
      <p className="text-gray-400 max-w-xs mb-6">
        Merci pour votre message. Nous vous répondrons dans les 24h.
      </p>
      <button
        onClick={() => setSuccess(false)}
        className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-400 transition-colors"
      >
        <XMarkIcon className="w-4 h-4" />
        Nouveau message
      </button>
    </Motion.div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
            Nom complet *
          </label>
          <input
            type="text" required
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="Ousmane Sanoh"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
            Email *
          </label>
          <input
            type="email" required
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            placeholder="vous@exemple.com"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
          Sujet *
        </label>
        <select
          required
          value={form.subject}
          onChange={e => setForm({ ...form, subject: e.target.value })}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors text-sm appearance-none"
        >
          <option value="" className="bg-gray-900">Sélectionner un sujet…</option>
          {SUBJECTS.map(s => (
            <option key={s} value={s} className="bg-gray-900">{s}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
          Message *
        </label>
        <textarea
          required rows={5}
          value={form.message}
          onChange={e => setForm({ ...form, message: e.target.value })}
          placeholder="Décrivez votre projet, vos dates souhaitées, le nombre de personnes…"
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors text-sm resize-none"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          <XMarkIcon className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <button
        type="submit" disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-amber-500/30 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 transition-all"
      >
        {loading ? (
          <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <PaperAirplaneIcon className="w-5 h-5" />
        )}
        {loading ? 'Envoi en cours…' : 'Envoyer le message'}
      </button>
    </form>
  );
};

/* ── Section principale ───────────────────────────────────────────────────── */
const ContactSection = () => (
  <Motion.section
    id="contact"
    className="py-20 bg-gray-950"
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-80px' }}
    transition={{ duration: 0.7 }}
  >
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">

      {/* Header */}
      <div className="text-center mb-14">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="h-px w-12 bg-amber-500" />
          <span className="text-xs font-semibold uppercase tracking-widest text-amber-400">
            Contactez-nous
          </span>
          <div className="h-px w-12 bg-amber-500" />
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          Parlons de votre{' '}
          <span className="text-amber-500 italic font-light">projet</span>
        </h2>
        <p className="text-gray-400 max-w-xl mx-auto text-sm sm:text-base">
          Basés à Kankan, nous intervenons partout en Guinée et dans la sous-région.
          Contactez-nous pour un devis gratuit sous 24h.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">

        {/* ── Colonne gauche : infos + carte ─────────────────────────── */}
        <div className="space-y-6">
          {/* Infos de contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
            {[
              {
                Icon: MapPinIcon,
                title: 'Adresse',
                lines: [STUDIO.address, STUDIO.city],
                color: 'text-amber-400',
                bg:    'bg-amber-500/10',
              },
              {
                Icon: PhoneIcon,
                title: 'Téléphone',
                lines: [STUDIO.phone, 'WhatsApp disponible'],
                color: 'text-green-400',
                bg:    'bg-green-500/10',
              },
              {
                Icon: EnvelopeIcon,
                title: 'Email',
                lines: [STUDIO.email],
                color: 'text-blue-400',
                bg:    'bg-blue-500/10',
              },
              {
                Icon: ClockIcon,
                title: 'Horaires',
                lines: STUDIO.hours.map(h => `${h.day} : ${h.time}`),
                color: 'text-orange-400',
                bg:    'bg-orange-500/10',
              },
            ].map(({ Icon, title, lines, color, bg }) => (
              <div key={title}
                className="flex items-start gap-4 p-4 bg-white/3 border border-white/5 rounded-2xl hover:border-amber-500/20 transition-colors"
              >
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">{title}</p>
                  {lines.map((l, i) => (
                    <p key={i} className="text-sm text-gray-300 leading-snug truncate">{l}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Carte OpenStreetMap interactive */}
          <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
            style={{ height: '320px' }}>
            <InteractiveMap />
          </div>

          {/* Badge Conakry */}
          <div className="flex items-center gap-3 px-4 py-3 bg-white/3 border border-white/5 rounded-xl">
            <span className="text-2xl">🇬🇳</span>
            <div>
              <p className="text-sm font-semibold text-white">Kankan, Guinée</p>
              <p className="text-xs text-gray-400">Kankan · Avenue de la République</p>
            </div>
            <a
              href={`https://www.openstreetmap.org/?mlat=${STUDIO.lat}&mlon=${STUDIO.lng}#map=16/${STUDIO.lat}/${STUDIO.lng}`}
              target="_blank" rel="noopener noreferrer"
              className="ml-auto text-xs text-amber-400 hover:text-amber-300 font-medium underline"
            >
              Voir sur OSM →
            </a>
          </div>
        </div>

        {/* ── Colonne droite : formulaire ─────────────────────────────── */}
        <div className="bg-white/3 border border-white/8 rounded-2xl p-6 sm:p-8">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-white mb-1">Envoyez-nous un message</h3>
            <p className="text-sm text-gray-400">Réponse garantie sous 24h ouvrées</p>
          </div>
          <ContactForm />
        </div>
      </div>

    </div>
  </Motion.section>
);

export default ContactSection;
