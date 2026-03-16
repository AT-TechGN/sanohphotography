import { useEffect, useState, useCallback } from 'react';
import photoService from '../../services/photoService';
import galleryService from '../../services/galleryService';
import { API_ASSETS_BASE } from '../../services/api';
import useUIStore from '../../stores/uiStore';
import Loading from '../../components/common/Loading';
import {
  PhotoIcon, PlusIcon, PencilIcon, TrashIcon, EyeIcon,
  CloudArrowUpIcon, StarIcon, ArrowTopRightOnSquareIcon,
  FolderIcon, CalendarDaysIcon, UserIcon, FunnelIcon,
  Squares2X2Icon, ListBulletIcon, ArrowUpTrayIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

// Fallback SVG inline — aucune dépendance externe, fonctionne hors ligne
const PHOTO_FALLBACK = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='300' height='300' fill='%23f3f4f6'/%3E%3Crect x='1' y='1' width='298' height='298' fill='none' stroke='%23e5e7eb' stroke-width='1'/%3E%3Ccircle cx='150' cy='115' r='35' fill='%23d1d5db'/%3E%3Cellipse cx='150' cy='210' rx='60' ry='40' fill='%23d1d5db'/%3E%3Ccircle cx='210' cy='80' r='18' fill='%23fbbf24' opacity='.7'/%3E%3Ctext x='150' y='265' font-family='sans-serif' font-size='13' fill='%239ca3af' text-anchor='middle'%3ESans image%3C/text%3E%3C/svg%3E`;

const UploadButton = ({ uploading, onFileChange }) => (
  <div>
    <input
      type="file" multiple accept="image/*"
      onChange={onFileChange}
      className="hidden" id="photo-upload"
      disabled={uploading}
    />
    <label
      htmlFor="photo-upload"
      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl font-medium hover:shadow-lg transition-all cursor-pointer select-none"
    >
      <span className="w-5 h-5 flex items-center justify-center flex-shrink-0">
        {uploading
          ? <span className="block w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
          : <CloudArrowUpIcon className="w-5 h-5" />
        }
      </span>
      <span>{uploading ? 'Upload en cours…' : 'Sélectionner des photos'}</span>
    </label>
  </div>
);

const PhotoCard = ({ photo, onToggleFeatured, onDelete }) => (
  <div className="group relative aspect-square bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden">
    <img
      src={photo.filePath?.startsWith('http') ? photo.filePath : `${API_ASSETS_BASE}${photo.filePath}`} alt={photo.originalFilename || 'Photo'}
      className="w-full h-full object-cover" loading="lazy"
      onError={(e) => {
        e.currentTarget.onerror = null; // évite la boucle infinie si le fallback échoue aussi
        e.currentTarget.src = PHOTO_FALLBACK;
      }}
    />
    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
      <div className="flex items-center gap-2">
        <button
          onClick={() => onToggleFeatured(photo.id, photo.isFeatured)}
          className={`p-2 rounded-full transition-colors ${photo.isFeatured ? 'bg-yellow-400 text-white' : 'bg-white/20 text-white hover:bg-white/40'}`}
          title={photo.isFeatured ? 'Retirer des vedettes' : 'Mettre en vedette'}
        >
          {photo.isFeatured ? <StarSolidIcon className="w-5 h-5" /> : <StarIcon className="w-5 h-5" />}
        </button>
        <button onClick={() => onDelete(photo.id)} className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors">
          <TrashIcon className="w-5 h-5" />
        </button>
      </div>
      <p className="text-white text-xs text-center px-2 truncate w-full">{photo.originalFilename}</p>
    </div>
    {photo.isFeatured && (
      <div className="absolute top-2 right-2"><StarSolidIcon className="w-6 h-6 text-yellow-400" /></div>
    )}
  </div>
);

const AlbumCard = ({ album, onView, onEdit, onDelete, formatDate }) => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden group">
    <div className="aspect-square bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center relative">
      <FolderIcon className="w-20 h-20 text-amber-300 dark:text-amber-600" />
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        <button onClick={() => onView(album.id)} className="p-3 bg-white rounded-full hover:bg-gray-100"><EyeIcon className="w-5 h-5 text-gray-700" /></button>
        <button onClick={() => onEdit(album)} className="p-3 bg-white rounded-full hover:bg-gray-100"><PencilIcon className="w-5 h-5 text-gray-700" /></button>
        <button onClick={() => onDelete(album.id)} className="p-3 bg-white rounded-full hover:bg-gray-100"><TrashIcon className="w-5 h-5 text-red-600" /></button>
      </div>
      {album.isPublic && <span className="absolute top-3 right-3 px-2 py-1 bg-green-500 text-white text-xs rounded-full">Public</span>}
    </div>
    <div className="p-3 sm:p-4">
      <h3 className="font-bold text-gray-900 dark:text-white truncate">{album.title}</h3>
      <div className="flex items-center gap-2 mt-2 text-sm text-gray-500 dark:text-gray-400"><PhotoIcon className="w-4 h-4" /><span>{album.photosCount ?? 0} photo(s)</span></div>
      <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 dark:text-gray-400"><CalendarDaysIcon className="w-4 h-4" /><span>{formatDate(album.createdAt)}</span></div>
      {album.booking && <div className="flex items-center gap-2 mt-2 text-sm text-amber-600"><ArrowTopRightOnSquareIcon className="w-4 h-4" /><span>{album.booking.service}</span></div>}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────
const PhotosManagement = () => {
  const [albums,         setAlbums]         = useState([]);
  const [selectedAlbum,  setSelectedAlbum]  = useState(null);
  const [photos,         setPhotos]         = useState([]);
  const [stats,          setStats]          = useState(null);
  const [bookings,       setBookings]       = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [viewMode,       setViewMode]       = useState('albums');
  const [viewFormat,     setViewFormat]     = useState('grid');
  const [showForm,       setShowForm]       = useState(false);
  const [uploading,      setUploading]      = useState(false);
  const [dragActive,     setDragActive]     = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');
  const { showSuccess, showError } = useUIStore();

  const emptyForm = { title: '', description: '', category: 'portrait', isPublic: false, bookingId: '', publish: false };
  const [formData, setFormData] = useState(emptyForm);

  const categories = [
    { value: 'all',          label: 'Toutes' },
    { value: 'mariage',      label: '💍 Mariage' },
    { value: 'portrait',     label: '🤳 Portrait' },
    { value: 'famille',      label: '👨‍👩‍👧 Famille' },
    { value: 'anniversaire', label: '🎂 Anniversaire' },
    { value: 'corporate',    label: '🏢 Corporate' },
    { value: 'catalogue',    label: '📦 Catalogue' },
    { value: 'mode',         label: '👗 Mode' },
    { value: 'culinaire',    label: '🍽️ Culinaire' },
  ];

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [albumsData, statsData, bookingsData] = await Promise.all([
        photoService.getAlbums().catch(() => []),
        photoService.getStats().catch(() => null),
        photoService.getBookingsForAlbum().catch(() => []),
      ]);
      setAlbums(Array.isArray(albumsData) ? albumsData : []);
      setStats(statsData);
      setBookings((Array.isArray(bookingsData) ? bookingsData : []).filter(b => !b.hasAlbum));
    } catch (err) {
      console.error('loadData error:', err);
      showError('Erreur chargement données');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleFileUpload = useCallback(async (files) => {
    if (!selectedAlbum) { showError("Sélectionnez d'abord un album"); return; }
    if (!files?.length) return;
    setUploading(true);
    try {
      await photoService.uploadPhotos(selectedAlbum.id, Array.from(files));
      showSuccess('Photos uploadées');
      const photosData = await photoService.getPhotos({ albumId: selectedAlbum.id });
      setPhotos(Array.isArray(photosData) ? photosData : []);
    } catch (err) {
      console.error('Upload error:', err);
      showError("Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  }, [selectedAlbum, showError, showSuccess]);

  const handleDrag = useCallback((e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.length) handleFileUpload(e.dataTransfer.files);
  }, [handleFileUpload]);

  const loadAlbumPhotos = useCallback(async (albumId) => {
    try {
      const [albumData, photosData] = await Promise.all([
        photoService.getAlbum(albumId),
        photoService.getPhotos({ albumId }),
      ]);
      setSelectedAlbum(albumData);
      setPhotos(Array.isArray(photosData) ? photosData : []);
      setViewMode('album-detail');
    } catch (err) {
      console.error('loadAlbumPhotos error:', err);
      showError('Erreur chargement album');
    }
  }, [showError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (showForm && selectedAlbum) {
        await photoService.updateAlbum(selectedAlbum.id, formData);
        showSuccess('Album mis à jour');
      } else {
        await photoService.createAlbum(formData);
        showSuccess('Album créé');
      }
      resetForm(); loadData();
    } catch (err) {
      showError(err.response?.data?.error || "Erreur lors de l'enregistrement");
    }
  };

  const handleDeleteAlbum = async (id) => {
    if (!window.confirm('Supprimer cet album et toutes ses photos ?')) return;
    try {
      await photoService.deleteAlbum(id);
      showSuccess('Album supprimé');
      if (selectedAlbum?.id === id) { setSelectedAlbum(null); setViewMode('albums'); }
      loadData();
    } catch (err) { showError('Erreur suppression'); }
  };

  const handleToggleFeatured = useCallback(async (photoId, isFeatured) => {
    try {
      await photoService.updatePhoto(photoId, { isFeatured: !isFeatured });
      setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, isFeatured: !isFeatured } : p));
      showSuccess(isFeatured ? 'Retiré des vedettes' : 'Ajouté aux vedettes');
    } catch (err) { showError('Erreur mise à jour photo'); }
  }, [showSuccess, showError]);

  const handleDeletePhoto = useCallback(async (photoId) => {
    if (!window.confirm('Supprimer cette photo ?')) return;
    try {
      await photoService.deletePhoto(photoId);
      setPhotos(prev => prev.filter(p => p.id !== photoId));
      showSuccess('Photo supprimée');
    } catch (err) { showError('Erreur suppression photo'); }
  }, [showSuccess, showError]);

  const resetForm = () => { setFormData(emptyForm); setSelectedAlbum(null); setShowForm(false); };
  const editAlbum = (album) => {
    setSelectedAlbum(album);
    setFormData({ title: album.title, description: album.description || '', category: album.category, isPublic: album.isPublic, bookingId: album.booking?.id || '', publish: false });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const createNewAlbum = () => { resetForm(); setShowForm(true); };
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const filteredAlbums = filterCategory === 'all' ? albums : albums.filter(a => a.category === filterCategory);

  if (loading) return <Loading fullScreen text="Chargement des albums…" />;

  return (
    <div className="p-3 sm:p-4 lg:p-8 space-y-6">

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestion Photos & Albums</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{albums.length} album(s) · {stats?.totalPhotos ?? 0} photo(s)</p>
        </div>
        <button onClick={createNewAlbum} className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl font-medium hover:shadow-lg transition-all">
          <PlusIcon className="w-5 h-5" />Nouvel Album
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Albums',  value: stats?.totalAlbums    ?? 0, g: 'from-amber-500 to-amber-600', Icon: FolderIcon },
          { label: 'Photos',  value: stats?.totalPhotos    ?? 0, g: 'from-orange-500 to-orange-600',     Icon: PhotoIcon },
          { label: 'Publics', value: stats?.publicAlbums   ?? 0, g: 'from-cyan-500 to-cyan-600',     Icon: EyeIcon },
          { label: 'Ce mois', value: stats?.photosThisMonth ?? 0, g: 'from-orange-500 to-orange-600', Icon: CloudArrowUpIcon },
        ].map(({ label, value, g, Icon }) => (
          <div key={label} className={`bg-gradient-to-br ${g} rounded-2xl p-5 text-white shadow-lg`}>
            <div className="flex items-center justify-between">
              <div><p className="text-white/70 text-sm">{label}</p><p className="text-3xl font-bold mt-1">{value}</p></div>
              <Icon className="w-10 h-10 text-white/30" />
            </div>
          </div>
        ))}
      </div>

      {/* Bouton retour */}
      {viewMode === 'album-detail' && (
        <button onClick={() => { setViewMode('albums'); setSelectedAlbum(null); }} className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-800 dark:text-amber-400 font-medium">
          ← Retour aux albums
        </button>
      )}

      {/* Formulaire */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            {selectedAlbum ? "Modifier l'album" : 'Nouvel album'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Titre *</label>
              <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Ex: Mariage Marie & Jean" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
              <textarea value={formData.description} rows="3" onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Décrivez cet album…" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Catégorie</label>
              <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-amber-500 focus:border-transparent">
                {categories.filter(c => c.value !== 'all').map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Réservation associée</label>
              <select value={formData.bookingId} onChange={(e) => setFormData({ ...formData, bookingId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-amber-500 focus:border-transparent">
                <option value="">Aucune</option>
                {bookings.map(b => <option key={b.id} value={b.id}>{b.client} - {b.service} ({b.date})</option>)}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="isPublic" checked={formData.isPublic} onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })} className="w-4 h-4 text-amber-600 rounded" />
              <label htmlFor="isPublic" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">Album public</label>
            </div>
            <div className="md:col-span-2 flex gap-4">
              <button type="submit" className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:shadow-lg transition-all">
                {selectedAlbum ? 'Enregistrer' : "Créer l'album"}
              </button>
              <button type="button" onClick={resetForm} className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-300 transition-colors">
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Vue Albums */}
      {viewMode === 'albums' && (
        <div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-2"><FunnelIcon className="w-5 h-5 text-amber-600" /><span className="font-medium text-gray-900 dark:text-white">Filtrer</span></div>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <button key={cat.value} onClick={() => setFilterCategory(cat.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filterCategory === cat.value ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'}`}>
                    {cat.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 border-l border-gray-200 dark:border-gray-600 pl-4">
                <button onClick={() => setViewFormat('grid')} className={`p-2 rounded-lg ${viewFormat === 'grid' ? 'bg-amber-100 text-amber-600' : 'text-gray-500'}`}><Squares2X2Icon className="w-5 h-5" /></button>
                <button onClick={() => setViewFormat('list')} className={`p-2 rounded-lg ${viewFormat === 'list' ? 'bg-amber-100 text-amber-600' : 'text-gray-500'}`}><ListBulletIcon className="w-5 h-5" /></button>
              </div>
            </div>
          </div>

          {filteredAlbums.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center">
              <FolderIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Aucun album</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">Créez votre premier album photo</p>
              <button onClick={createNewAlbum} className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl font-medium hover:shadow-lg transition-all">
                <PlusIcon className="w-5 h-5" />Créer un album
              </button>
            </div>
          ) : viewFormat === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredAlbums.map(album => (
                <AlbumCard key={album.id} album={album} onView={loadAlbumPhotos} onEdit={editAlbum} onDelete={handleDeleteAlbum} formatDate={formatDate} />
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <tr>{['Album','Catégorie','Photos','Statut','Date','Actions'].map(h => <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredAlbums.map(album => (
                    <tr key={album.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center"><FolderIcon className="w-6 h-6 text-amber-600" /></div>
                          <div><p className="font-medium text-gray-900 dark:text-white">{album.title}</p>{album.booking && <p className="text-sm text-amber-600">{album.booking.client}</p>}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4"><span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs font-medium">{album.category}</span></td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{album.photosCount ?? 0} photos</td>
                      <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-semibold ${album.isPublic ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'}`}>{album.isPublic ? 'Public' : 'Privé'}</span></td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{formatDate(album.createdAt)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => loadAlbumPhotos(album.id)} className="p-2 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg"><EyeIcon className="w-5 h-5" /></button>
                          <button onClick={() => editAlbum(album)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"><PencilIcon className="w-5 h-5" /></button>
                          <button onClick={() => handleDeleteAlbum(album.id)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><TrashIcon className="w-5 h-5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Vue Détail Album */}
      {viewMode === 'album-detail' && selectedAlbum && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedAlbum.title}</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">{selectedAlbum.description || 'Aucune description'}</p>
                <div className="flex items-center gap-4 mt-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${selectedAlbum.isPublic ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'}`}>
                    {selectedAlbum.isPublic ? '✓ Public' : '✗ Privé'}
                  </span>
                  {selectedAlbum.booking && (
                    <span className="text-sm text-amber-600 flex items-center gap-1">
                      <UserIcon className="w-4 h-4" />
                      {selectedAlbum.booking.client} · {selectedAlbum.booking.service}
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => editAlbum(selectedAlbum)} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 transition-colors">
                <PencilIcon className="w-5 h-5" />Modifier
              </button>
            </div>
          </div>

          {/* Zone upload — UploadButton est un composant stable → plus de insertBefore */}
          <div
            className={`bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border-2 border-dashed transition-colors ${dragActive ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20' : 'border-gray-200 dark:border-gray-600'}`}
            onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
          >
            <div className="text-center">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center transition-colors ${dragActive ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-500'}`}>
                <ArrowUpTrayIcon className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {dragActive ? 'Déposez vos photos ici' : 'Glissez-déposez vos photos'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">ou cliquez pour sélectionner des fichiers</p>
              <UploadButton uploading={uploading} onFileChange={(e) => handleFileUpload(e.target.files)} />
            </div>
          </div>

          {/* Grille photos */}
          {photos.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center">
              <PhotoIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Aucune photo</h3>
              <p className="text-gray-500 dark:text-gray-400">Glissez-déposez ou cliquez pour ajouter des photos</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {photos.map(photo => (
                <PhotoCard key={photo.id} photo={photo} onToggleFeatured={handleToggleFeatured} onDelete={handleDeletePhoto} />
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default PhotosManagement;
