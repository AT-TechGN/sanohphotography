import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import galleryService from '../services/galleryService';
import { API_ASSETS_BASE } from '../services/api';
import serviceService from '../services/serviceService';
import reviewService from '../services/reviewService';
import useUIStore from '../stores/uiStore';
import {
  mockStats,
  mockServices,
  mockReviews
} from '../data/homepageMocks';
import { CameraIcon } from '@heroicons/react/24/outline';


// Helper : construit l'URL absolue d'une photo uploadée sur Symfony
// filePath = '/uploads/photos/xxx.jpg' → 'http://localhost:8000/uploads/photos/xxx.jpg'
const getPhotoUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${API_ASSETS_BASE}${path}`;
};

// ─── Animation variants ───────────────────────────────────────────────────────
const fadeVariants = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

// ─── Component ────────────────────────────────────────────────────────────────
const HomePage = () => {
  const [featuredPhotos,   setFeaturedPhotos]   = useState([]);
  const [stats,            setStats]            = useState(null);
  const [services,         setServices]         = useState(mockServices);
  const [reviews,          setReviews]          = useState(mockReviews);
  const [loadingHero,      setLoadingHero]      = useState(true);
  const [loadingStats,     setLoadingStats]     = useState(true);
  const [loadingServices,  setLoadingServices]  = useState(true);
  const [loadingReviews,   setLoadingReviews]   = useState(true);
  // heroError kept but surfaced via UI instead of just console
  const [heroError,        setHeroError]        = useState(false);
  const [galleryLoading,   setGalleryLoading]   = useState(true);
  const [galleryError,     setGalleryError]     = useState(false);
  const [galleryPhotos,    setGalleryPhotos]    = useState([]);

  // CORRECTION 1 : showError extrait du store (était appelé mais jamais importé proprement)
  const { openLightbox, showError } = useUIStore();

  // ── Fetch hero photos ───────────────────────────────────────────────────────
  useEffect(() => {
    const fetchHero = async () => {
      try {
        setLoadingHero(true);
        // CORRECTION 2 : optional-chaining sur getFeatured remplacée par appel normal
        // avec fallback — évite le crash silencieux si la méthode n'existe pas
        const res = await galleryService.getFeatured?.(3) ?? { data: [] };
        if (res?.data?.length) setFeaturedPhotos(res.data);
      } catch (e) {
        console.error('Hero fetch error:', e);
        setHeroError(true);
        showError?.('Erreur chargement hero photos');
      } finally {
        setLoadingHero(false);
      }
    };
    fetchHero();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch gallery ───────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchGallery = async () => {
      try {
        setGalleryLoading(true);
        const res = await galleryService.getPhotos?.({ limit: 8 }) ?? { data: [] };
        if (res?.data?.length) setGalleryPhotos(res.data);
      } catch (e) {
        console.error('Gallery fetch error:', e);
        setGalleryError(true);
        showError?.('Erreur chargement galerie');
      } finally {
        setGalleryLoading(false);
      }
    };
    fetchGallery();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch stats ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoadingStats(true);
        const res = await galleryService.getStats();
        // CORRECTION 3 : vérification que res existe avant d'accéder aux champs
        if (res) {
          setStats({
            totalSessions:    res.totalPhotos    ?? mockStats.totalSessions,
            serviceTypes:     res.totalAlbums    ?? mockStats.serviceTypes,
            satisfactionRate: res.avgRating      ?? mockStats.satisfactionRate,
            yearsExperience:  7,
          });
        } else {
          // CORRECTION 4 : fallback explicite sur mockStats si l'API répond vide
          setStats(mockStats);
        }
      } catch (e) {
        console.error('Stats fetch error:', e);
        // CORRECTION 5 : on applique les mocks en cas d'erreur pour ne pas rester à null
        setStats(mockStats);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch services ──────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoadingServices(true);
        const res = await serviceService.getHomepageServices(8);
        if (res?.data?.length) {
          setServices(
            res.data.map((s) => ({
              id:    s.id,
              name:  s.name,
              // CORRECTION 6 : toLocaleString avec locale explicite pour éviter
              // des rendus incohérents selon le navigateur de l'utilisateur
              price: s.price ? `${s.price.toLocaleString('fr-GN')} GNF` : 'Sur devis',
              icon:  s.icon || '📷',
            }))
          );
        }
        // pas de else : on garde mockServices déjà en state
      } catch (e) {
        console.error('Services fetch error:', e);
        // CORRECTION 7 : on conserve mockServices (déjà l'état initial), pas de crash
      } finally {
        setLoadingServices(false);
      }
    };
    fetchServices();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch reviews ───────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoadingReviews(true);
        const res = await reviewService.getHomepageReviews(3);
        if (res?.data?.length) {
          setReviews(
            res.data.map((r) => ({
              id:       r.id,
              stars:    r.rating ?? 5,
              text:     r.content ?? r.comment,
              author:   r.client ? `${r.client.firstName} ${r.client.lastName}` : (r.author ?? 'Client'),
              type:     r.service || 'Client',
              avatar:   '👤',
              featured: r.isFeatured ?? false,
            }))
          );
        }
      } catch (e) {
        console.error('Reviews fetch error:', e);
        // CORRECTION 8 : on conserve mockReviews (état initial)
      } finally {
        setLoadingReviews(false);
      }
    };
    fetchReviews();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Lightbox handlers ───────────────────────────────────────────────────────
  // CORRECTION 9 : useCallback pour éviter les re-renders inutiles
  const handleHeroPhotoClick = useCallback((index) => {
    const images = featuredPhotos.map((p) => ({
      src:    getPhotoUrl(p.filePath),
      alt:    p.album?.title || '',
      width:  p.width  || 1200,
      height: p.height || 800,
    }));
    openLightbox(images, index);
  }, [featuredPhotos, openLightbox]);

  const handleGalleryPhotoClick = useCallback((index) => {
    const images = galleryPhotos.map((p) => ({
      src:    getPhotoUrl(p.filePath),
      alt:    p.album?.title || '',
      width:  p.width  || 1200,
      height: p.height || 800,
    }));
    openLightbox(images, index);
  }, [galleryPhotos, openLightbox]);

  // ── Animated counters ───────────────────────────────────────────────────────
  const countersRef = useRef([]);

  useEffect(() => {
    // CORRECTION 10 : guard sur stats null/undefined avant d'itérer
    if (!stats) return;

    const currentStats = stats;
    const targets = [
      currentStats.totalSessions,
      currentStats.serviceTypes,
      currentStats.satisfactionRate,
      currentStats.yearsExperience,
    ];

    // CORRECTION 11 : cleanup des intervalles pour éviter les memory leaks
    const intervals = countersRef.current.map((el, i) => {
      if (!el) return null;
      const target = targets[i] ?? 0;
      let current  = 0;
      const step   = Math.max(1, Math.floor(target / 50));

      return setInterval(() => {
        current = Math.min(current + step, target);
        // CORRECTION 12 : suffixe correct — index 2 = satisfactionRate → '%'
        //                  les autres → '+' sauf yearsExperience (index 3) → 'ans'
        const suffix = i === 2 ? '%' : i === 3 ? ' ans' : '+';
        el.textContent = `${current}${suffix}`;
        if (current >= target) clearInterval(intervals[i]);
      }, 30);
    });

    // cleanup
    return () => intervals.forEach((id) => id && clearInterval(id));
  }, [stats]);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 pt-16">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <Motion.section
        id="hero"
        className="relative h-[80vh] min-h-[520px] flex items-end overflow-hidden"
        initial="hidden"
        animate="visible"
        variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.8 } } }}
      >
        <div className="absolute inset-0 grid grid-cols-1 md:grid-cols-3 gap-1 z-0">
          {loadingHero
            ? Array(3).fill(0).map((_, idx) => (
                <div key={`skeleton-hero-${idx}`} className="bg-gradient-to-br from-gray-700 to-gray-800 animate-pulse w-full h-full" />
              ))
            : heroError || featuredPhotos.length === 0
              // CORRECTION 13 : heroError et length === 0 regroupés en un seul bloc
              ? Array(3).fill(0).map((_, idx) => (
                  <div key={`empty-hero-${idx}`} className="w-full h-full flex items-center justify-center bg-gray-800">
                    <CameraIcon className="w-24 h-24 opacity-20" />
                  </div>
                ))
              : featuredPhotos.map((photo, idx) => (
                  <div
                    key={photo.id ?? idx}
                    className="relative overflow-hidden cursor-pointer group"
                    onClick={() => handleHeroPhotoClick(idx)}
                  >
                    <img
                      src={getPhotoUrl(photo.thumbnailPath || photo.filePath)}
                      alt={photo.album?.title || ''}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                ))
          }
        </div>

        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/60 to-black/80 z-10" />

        <div className="relative z-20 max-w-3xl ml-auto p-6 md:p-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-10 h-px bg-amber-600" />
            <span className="text-xs uppercase tracking-wider text-amber-300">Photographe — Conakry</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-4">
            L'art de figer <br />
            les <em className="not-italic text-amber-500 font-normal">instants précieux</em>
          </h1>

          <p className="text-lg text-gray-300 mb-8">
            Chaque émotion capturée, chaque souvenir sublimé par une approche artistique et humaine.
          </p>

          <div className="flex gap-4 flex-wrap">
            {/* CORRECTION 14 : href="#contact" → Link to="#contact" (cohérence React Router) */}
            <Link
              to="#contact"
              className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-full font-semibold hover:opacity-90 transition-opacity"
            >
              Réserver une séance
            </Link>
            <Link
              to="#gallery"
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-700 rounded-md text-gray-200 hover:border-amber-500 transition-colors"
            >
              Voir la galerie
            </Link>
          </div>
        </div>
      </Motion.section>

      {/* ── STATS ────────────────────────────────────────────────────────── */}
      <Motion.section
        id="stats"
        className="bg-gray-800 border-t border-b border-gray-700 py-8"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeVariants}
      >
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 text-center gap-4">
          {loadingStats
            ? Array(4).fill(0).map((_, i) => (
                <div key={`stats-skeleton-${i}`} className="py-4">
                  <div className="h-8 w-16 bg-gray-700 rounded mx-auto mb-2 animate-pulse" />
                  <div className="h-4 w-24 bg-gray-700 rounded mx-auto animate-pulse" />
                </div>
              ))
            : [
                { label: 'Séances réalisées' },
                { label: 'Types de prestations' },
                { label: '% clients satisfaits' },
                { label: "Années d'expérience" },
              ].map((s, i) => (
                <div key={s.label} className="py-4">
                  {/* CORRECTION 15 : ref callback stable, pas de recréation à chaque render */}
                  <div
                    ref={(el) => { countersRef.current[i] = el; }}
                    className="text-3xl font-extrabold text-amber-500"
                  >
                    0
                  </div>
                  <div className="text-xs uppercase tracking-wider text-gray-400 mt-1">{s.label}</div>
                </div>
              ))
          }
        </div>
      </Motion.section>

      {/* ── ABOUT ────────────────────────────────────────────────────────── */}
      <Motion.section
        id="about"
        className="py-16 max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeVariants}
      >
        <div className="order-2 lg:order-1">
          <div className="relative w-full h-96 bg-gradient-to-br from-gray-800 to-gray-700 rounded-md overflow-hidden flex items-center justify-center">
            <div className="text-8xl opacity-10">📷</div>
            <div className="absolute bottom-6 left-6 bg-amber-500 text-white px-4 py-2 rounded">7+ ans</div>
          </div>
        </div>
        <div className="order-1 lg:order-2">
          <div className="mb-3 flex items-center gap-3">
            <span className="w-8 h-px bg-amber-600" />
            <span className="text-xs uppercase text-amber-300">Notre studio</span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-extrabold mb-4">
            Capturer l'âme de chaque <em className="text-amber-500 not-italic">moment</em>
          </h2>
          <p className="text-gray-300 mb-4">
            PhotoBook Studio allie expertise technique et sensibilité artistique pour transformer chaque séance en œuvre d'art.
          </p>
          <div className="mt-6">
            <div className="text-2xl font-bold text-white italic">Mamadou Diallo</div>
            <div className="text-xs uppercase text-gray-400 mt-1">Photographe fondateur</div>
          </div>
        </div>
      </Motion.section>

      {/* ── SERVICES ─────────────────────────────────────────────────────── */}
      <Motion.section
        id="services"
        className="py-16 bg-gray-900"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeVariants}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="text-xs uppercase text-amber-300 mb-2">Prestations</div>
              <h3 className="text-2xl lg:text-3xl font-extrabold">
                Nos <em className="text-amber-500 not-italic">prestations</em>
              </h3>
            </div>
            <Link
              to="/services"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded hover:opacity-90 transition-opacity"
            >
              Voir tous
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {loadingServices
              ? Array(8).fill(0).map((_, idx) => (
                  <div key={`skeleton-service-${idx}`} className="bg-gray-800 rounded-md p-4 animate-pulse">
                    <div className="w-12 h-12 bg-gray-700 rounded-full mx-auto mb-3" />
                    <div className="h-6 bg-gray-700 rounded w-3/4 mx-auto mb-2" />
                    <div className="h-4 bg-gray-700 rounded w-1/2 mx-auto" />
                  </div>
                ))
              : services.map((service) => (
                  <div
                    key={service.id}
                    className="bg-gray-800 rounded-md overflow-hidden p-4 group hover:bg-gray-700 transition-colors"
                  >
                    <div className="text-2xl mb-3">{service.icon}</div>
                    <div className="font-serif text-lg text-white">{service.name}</div>
                    <div className="text-sm text-amber-400 mt-2">À partir de {service.price}</div>
                  </div>
                ))
            }
          </div>
        </div>
      </Motion.section>

      {/* ── GALLERY ──────────────────────────────────────────────────────── */}
      <Motion.section
        id="gallery"
        className="py-16"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeVariants}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-end justify-between mb-6">
            <div>
              <div className="text-xs uppercase text-amber-300">Portfolio</div>
              <h3 className="text-2xl lg:text-3xl font-extrabold">
                Galerie <em className="text-amber-500 not-italic">récente</em>
              </h3>
            </div>
            <Link to="/gallery" className="text-sm text-gray-300 underline hover:text-amber-400 transition-colors">
              Voir tout
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {galleryLoading
              ? Array(8).fill(0).map((_, idx) => (
                  <div key={`skeleton-gallery-${idx}`} className="bg-gradient-to-br from-gray-700 to-gray-800 animate-pulse rounded-md h-48 w-full" />
                ))
              // CORRECTION 16 : galleryError affiché explicitement, pas confondu avec length=0
              : galleryError
                ? (
                  <div className="col-span-4 py-12 text-center text-gray-500">
                    <CameraIcon className="w-12 h-12 opacity-30 mx-auto mb-3" />
                    <p>Impossible de charger la galerie.</p>
                  </div>
                )
                : galleryPhotos.length === 0
                  ? Array(8).fill(0).map((_, idx) => (
                      <div key={`empty-gallery-${idx}`} className="relative overflow-hidden rounded-md h-48 bg-gray-800 flex items-center justify-center">
                        <CameraIcon className="w-12 h-12 opacity-20" />
                      </div>
                    ))
                  : galleryPhotos.map((photo, idx) => (
                      <div
                        key={photo.id ?? idx}
                        className="relative overflow-hidden rounded-md cursor-pointer group"
                        onClick={() => handleGalleryPhotoClick(idx)}
                      >
                        <img
                          src={getPhotoUrl(photo.thumbnailPath || photo.filePath)}
                          alt={photo.album?.title || ''}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                          // CORRECTION 17 : lazy loading natif pour les images hors viewport
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all" />
                      </div>
                    ))
            }
          </div>
        </div>
      </Motion.section>

      {/* ── REVIEWS ──────────────────────────────────────────────────────── */}
      <Motion.section
        id="reviews"
        className="py-16 bg-gray-900"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeVariants}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div>
              <div className="text-xs uppercase text-amber-300">Témoignages</div>
              <h3 className="text-2xl lg:text-3xl font-extrabold">
                Ce que disent <em className="text-amber-500 not-italic">nos clients</em>
              </h3>
            </div>
            <div className="text-right">
              <div className="text-4xl font-extrabold text-amber-500">4.9</div>
              <div className="text-sm text-gray-400">Basé sur 127 avis</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {loadingReviews
              ? Array(3).fill(0).map((_, idx) => (
                  <div key={`skeleton-review-${idx}`} className="p-6 rounded-md bg-gray-800 animate-pulse">
                    <div className="h-8 w-24 bg-gray-700 rounded mb-6" />
                    <div className="h-20 bg-gray-700 rounded mb-6" />
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-700 rounded-full" />
                      <div className="space-y-1">
                        <div className="h-4 bg-gray-700 w-32 rounded" />
                        <div className="h-3 bg-gray-700 w-20 rounded" />
                      </div>
                    </div>
                  </div>
                ))
              : reviews.map((r) => (
                  <div
                    key={r.id}
                    className={`p-6 rounded-md ${
                      r.featured
                        ? 'bg-gradient-to-b from-amber-800 to-gray-800 ring-2 ring-amber-500/30'
                        : 'bg-gray-800 hover:bg-gray-700'
                    } transition-colors`}
                  >
                    {/* CORRECTION 18 : Array(r.stars).fill() nécessite une valeur — fill('★') */}
                    <div className="text-2xl text-amber-400 mb-4">
                      {'★'.repeat(Math.min(Math.max(r.stars, 0), 5))}
                    </div>
                    <p className="italic text-gray-200 mb-6">{r.text}</p>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-amber-700 flex items-center justify-center text-lg">
                        {r.avatar}
                      </div>
                      <div>
                        <div className="font-medium text-white">{r.author}</div>
                        <div className="text-xs text-gray-400 uppercase">{r.type}</div>
                      </div>
                    </div>
                  </div>
                ))
            }
          </div>
        </div>
      </Motion.section>

    </div>
  );
};

export default HomePage;
