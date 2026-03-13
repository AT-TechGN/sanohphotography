import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import galleryService from '../services/galleryService';
import useUIStore from '../stores/uiStore';
import {
  mockFeaturedPhotos,
  mockStats,
  mockServices,
  mockGalleryPhotos,
  mockReviews
} from '../data/homepageMocks';
import { CameraIcon } from '@heroicons/react/24/outline';

const fadeVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const HomePage = () => {
  const [featuredPhotos, setFeaturedPhotos] = useState(mockFeaturedPhotos);
  const [stats] = useState(mockStats);
  const [loadingHero, setLoadingHero] = useState(true);
  const [galleryPhotos, setGalleryPhotos] = useState(mockGalleryPhotos);
  const { openLightbox } = useUIStore();

  useEffect(() => {
    const fetchHero = async () => {
      try {
        setLoadingHero(true);
        const res = await galleryService.getFeatured?.(3);
        if (res?.data) setFeaturedPhotos(res.data);
      } catch (e) {
        console.warn(e);
        setFeaturedPhotos(mockFeaturedPhotos);
      } finally {
        setLoadingHero(false);
      }
    };
    fetchHero();
  }, []);

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const res = await galleryService.getPhotos?.({ limit: 8 });
        if (res?.data) setGalleryPhotos(res.data);
      } catch (e) {
        console.warn(e);
        setGalleryPhotos(mockGalleryPhotos);
      }
    };
    fetchGallery();
  }, []);

  const handleHeroPhotoClick = (index) => {
    const images = featuredPhotos.map((p) => ({ src: p.filePath, alt: p.album?.title || '', width: p.width || 1200, height: p.height || 800 }));
    openLightbox(images, index);
  };

  const handleGalleryPhotoClick = (index) => {
    const images = galleryPhotos.map((p) => ({ src: p.filePath, alt: p.album?.title || '', width: p.width || 1200, height: p.height || 800 }));
    openLightbox(images, index);
  };

  // contact form handler is not used on this page — keep contactService available if needed elsewhere

  // simple counter animation ref
  const countersRef = useRef([]);
  useEffect(() => {
    countersRef.current.forEach((el, i) => {
      if (!el) return;
      const target = [stats.totalSessions, stats.serviceTypes, stats.satisfactionRate, stats.yearsExperience][i] || 0;
      let current = 0;
      const step = Math.max(1, Math.floor(target / 50));
      const int = setInterval(() => {
        current = Math.min(current + step, target);
        el.textContent = `${current}${i === 2 ? '%' : '+'}`;
        if (current >= target) clearInterval(int);
      }, 30);
    });
  }, [stats]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 pt-16">
      {/* HERO */}
      <Motion.section id="hero" className="relative h-[80vh] min-h-[520px] flex items-end overflow-hidden" initial="hidden" animate="visible" variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}>
        <div className="absolute inset-0 grid grid-cols-1 md:grid-cols-3 gap-1 z-0">
          {featuredPhotos.map((photo, idx) => (
            <div key={photo.id || idx} className="relative overflow-hidden cursor-pointer group" onClick={() => handleHeroPhotoClick(idx)}>
              {loadingHero ? (
                <div className={`w-full h-full flex items-center justify-center bg-gray-800`}>
                  <div className="text-6xl opacity-20">{photo.icon || ['💍', '📷', '🌸'][idx]}</div>
                </div>
              ) : (
                <img src={photo.thumbnailPath || photo.filePath} alt={photo.album?.title || ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              )}
            </div>
          ))}
        </div>

        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/60 to-black/80 z-10" />

        <div className="relative z-20 max-w-3xl ml-auto p-6 md:p-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-10 h-px bg-purple-600" />
            <span className="text-xs uppercase tracking-wider text-purple-300">Photographe — Conakry</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-4">
            L'art de figer <br />les <em className="not-italic text-purple-500 font-normal">instants précieux</em>
          </h1>

          <p className="text-lg text-gray-300 mb-8">Chaque émotion capturée, chaque souvenir sublimé par une approche artistique et humaine.</p>

          <div className="flex gap-4">
            <Link to="#contact" className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-semibold">Réserver une séance</Link>
            <Link to="#gallery" className="inline-flex items-center gap-2 px-4 py-2 border border-gray-700 rounded-md text-gray-200">Voir la galerie</Link>
          </div>
        </div>
      </Motion.section>

      {/* STATS */}
      <Motion.section id="stats" className="bg-gray-800 border-t border-b border-gray-700 py-8" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeVariants}>
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 text-center gap-4">
          {[{ value: stats.totalSessions, label: 'Séances réalisées' }, { value: stats.serviceTypes, label: 'Types de prestations' }, { value: stats.satisfactionRate, label: '% clients satisfaits' }, { value: stats.yearsExperience, label: 'Années d\'expérience' }].map((s, i) => (
            <div key={s.label} className="py-4">
              <div ref={(el) => (countersRef.current[i] = el)} className="text-3xl font-extrabold text-purple-500">0</div>
              <div className="text-xs uppercase tracking-wider text-gray-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </Motion.section>

      {/* ABOUT */}
      <Motion.section id="about" className="py-16 max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center" initial="hidden" whileInView="visible" variants={fadeVariants}>
        <div className="order-2 lg:order-1">
          <div className="relative w-full h-96 bg-gradient-to-br from-gray-800 to-gray-700 rounded-md overflow-hidden flex items-center justify-center">
            <div className="text-8xl opacity-10">📷</div>
            <div className="absolute bottom-6 left-6 bg-purple-500 text-white px-4 py-2 rounded">7+ ans</div>
          </div>
        </div>
        <div className="order-1 lg:order-2">
          <div className="mb-3 flex items-center gap-3">
            <span className="w-8 h-px bg-purple-600" />
            <span className="text-xs uppercase text-purple-300">Notre studio</span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-extrabold mb-4">Capturer l'âme de chaque <em className="text-purple-500 not-italic">moment</em></h2>
          <p className="text-gray-300 mb-4">PhotoBook Studio allie expertise technique et sensibilité artistique pour transformer chaque séance en œuvre d'art.</p>
          <div className="mt-6">
            <div className="text-2xl font-bold text-white italic">Mamadou Diallo</div>
            <div className="text-xs uppercase text-gray-400 mt-1">Photographe fondateur</div>
          </div>
        </div>
      </Motion.section>

      {/* SERVICES */}
      <Motion.section id="services" className="py-16 bg-gray-900" initial="hidden" whileInView="visible" variants={fadeVariants}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="text-xs uppercase text-purple-300 mb-2">Prestations</div>
              <h3 className="text-2xl lg:text-3xl font-extrabold">Nos <em className="text-purple-500 not-italic">prestations</em></h3>
            </div>
            <Link to="/services" className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded">Voir tous</Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {mockServices.map((service) => (
              <div key={service.id} className="relative bg-gray-800 rounded-md overflow-hidden p-4">
                <div className="text-2xl mb-3">{service.icon}</div>
                <div className="font-serif text-lg text-white">{service.name}</div>
                <div className="text-sm text-purple-400 mt-2">À partir de {service.price}</div>
              </div>
            ))}
          </div>
        </div>
      </Motion.section>

      {/* GALLERY */}
      <Motion.section id="gallery" className="py-16" initial="hidden" whileInView="visible" variants={fadeVariants}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-end justify-between mb-6">
            <div>
              <div className="text-xs uppercase text-purple-300">Portfolio</div>
              <h3 className="text-2xl lg:text-3xl font-extrabold">Galerie <em className="text-purple-500 not-italic">récente</em></h3>
            </div>
            <Link to="/gallery" className="text-sm text-gray-300 underline">Voir tout</Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {galleryPhotos.map((photo, idx) => (
              <div key={photo.id || idx} className="relative overflow-hidden rounded-md cursor-pointer group" onClick={() => handleGalleryPhotoClick(idx)}>
                <img src={photo.thumbnailPath || photo.filePath} alt={photo.album?.title || ''} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all" />
              </div>
            ))}
          </div>
        </div>
      </Motion.section>

      {/* REVIEWS */}
      <Motion.section id="reviews" className="py-16 bg-gray-900" initial="hidden" whileInView="visible" variants={fadeVariants}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="text-xs uppercase text-purple-300">Témoignages</div>
              <h3 className="text-2xl lg:text-3xl font-extrabold">Ce que disent <em className="text-purple-500 not-italic">nos clients</em></h3>
            </div>
            <div className="text-right">
              <div className="text-4xl font-extrabold text-purple-500">4.9</div>
              <div className="text-sm text-gray-400">Basé sur 127 avis</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {mockReviews.map((r) => (
              <div key={r.id} className={`p-6 rounded-md ${r.featured ? 'bg-gradient-to-b from-purple-800 to-gray-800' : 'bg-gray-800'}`}>
                <div className="text-2xl text-purple-400 mb-4">{Array(r.stars).fill('★').join('')}</div>
                <p className="italic text-gray-200 mb-6">{r.text}</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-purple-700 flex items-center justify-center">{r.avatar}</div>
                  <div>
                    <div className="font-medium text-white">{r.author}</div>
                    <div className="text-xs text-gray-400 uppercase">{r.type}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Motion.section>
    </div>
  );
};

export default HomePage;
