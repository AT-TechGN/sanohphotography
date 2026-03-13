/**
 * Mock data for HomePage - Used as fallback if API fails
 * Matches exact HTML design/content
 */

export const mockFeaturedPhotos = [
  {
    id: 1,
    filePath: '/api/photos/hero1.jpg',
    thumbnailPath: '/api/photos/thumbs/hero1.jpg',
    album: { title: 'Mariage' },
    width: 800,
    height: 600,
    isFeatured: true
  },
  {
    id: 2,
    filePath: '/api/photos/hero2.jpg',
    thumbnailPath: '/api/photos/thumbs/hero2.jpg',
    album: { title: 'Portrait' },
    width: 600,
    height: 800
  },
  {
    id: 3,
    filePath: '/api/photos/hero3.jpg',
    thumbnailPath: '/api/photos/thumbs/hero3.jpg',
    album: { title: 'Famille' },
    width: 800,
    height: 600
  }
];

export const mockStats = {
  totalSessions: 850,
  serviceTypes: 12,
  satisfactionRate: 98,
  yearsExperience: 7
};

export const mockServices = [
  { id: 1, name: 'Mariage', price: '1 500 000 GNF', icon: '💍', bgClass: 'sb1', tag: 'Populaire' },
  { id: 2, name: 'Baptême', price: '500 000 GNF', icon: '🍼', bgClass: 'sb2' },
  { id: 3, name: 'Anniversaire', price: '400 000 GNF', icon: '🎂', bgClass: 'sb3' },
  { id: 4, name: 'Cérémonie', price: '800 000 GNF', icon: '🎗️', bgClass: 'sb4' },
  { id: 5, name: 'Shopping / Mode', price: '600 000 GNF', icon: '👗', bgClass: 'sb5' },
  { id: 6, name: 'Catalogue Produits', price: '700 000 GNF', icon: '📦', bgClass: 'sb6' },
  { id: 7, name: 'Corporate', price: '900 000 GNF', icon: '🏢', bgClass: 'sb7' },
  { id: 8, name: 'Portrait & Book', price: '350 000 GNF', icon: '🧑‍🎨', bgClass: 'sb8', tag: 'Nouveau' }
];

export const mockGalleryPhotos = Array.from({ length: 8 }, (_, i) => ({
  id: i + 1,
  filePath: `/api/photos/gallery${i + 1}.jpg`,
  album: { title: `Album ${i + 1}` },
  bgClass: `gi${(i % 8) + 1}`,
  isFeatured: i === 0 || i === 6
}));

export const mockReviews = [
  {
    id: 1,
    stars: 5,
    text: "PhotoBook Studio a sublimé notre mariage. Mamadou a su capturer chaque instant avec une sensibilité rare — les larmes, les rires, les regards complices. Notre album est un trésor que nous contemplerons toute notre vie.",
    author: "Aïssatou & Ibrahima Kouyaté",
    type: "Mariage — Juin 2025",
    avatar: "👰"
  },
  {
    id: 2,
    stars: 5,
    text: "Shooting corporate impeccable. Les photos de notre équipe pour notre site web sont professionnelles et chaleureuses à la fois. Délai de livraison respecté, qualité exceptionnelle.",
    author: "Seydou Condé",
    type: "Corporate — Mai 2025",
    avatar: "👔"
  },
  {
    id: 3,
    stars: 5,
    text: "Les photos du baptême de notre fille sont magnifiques. L'équipe est discrète, professionnelle et met vraiment les gens à l'aise. Je recommande les yeux fermés.",
    author: "Fatoumata Barry",
    type: "Baptême — Avril 2025",
    avatar: "👶"
  }
];

