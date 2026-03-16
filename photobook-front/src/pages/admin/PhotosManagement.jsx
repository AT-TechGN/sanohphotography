import { useEffect, useState, useCallback } from 'react';
import photoService from '../../services/photoService';
import galleryService from '../../services/galleryService';
import useUIStore from '../../stores/uiStore';
import Loading from '../../components/common/Loading';
import {
  PhotoIcon, PlusIcon, PencilIcon, TrashIcon, EyeIcon,
  CloudArrowUpIcon, StarIcon, ArrowTopRightOnSquareIcon,
  FolderIcon, CalendarDaysIcon, UserIcon, FunnelIcon,
  Squares2X2Icon, ListBulletIcon, ArrowUpTrayIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

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

  const [formData, setFormData] = useState({
    title: '', description: '', category: 'PORTRAIT',
    isPublic: false, bookingId: '', publish: false,
  });

  const categories = [
    { value: 'all',       label: 'Toutes catégories' },
    { value: 'WEDDING',   label: '💍 Mariage'         },
    { value: 'PORTRAIT',  label: '🤳 Portrait'        },
    { value: 'FAMILY',    label: '👨‍👩‍👧 Famille'       },
    { value: 'EVENT',     label: '🎉 Événement'        },
    { value: 'PRODUCT',   label: '📦 Produit'          },
    { value: 'CORPORATE', label: '🏢 Corporate'        },
    { value: 'OTHER',     label: '📌 Autre'            },
  ];

  // ── CORRECTION 1 : loadData déclaré AVANT le useEffect qui l'appelle
  // ── CORRECTION 2 : useCallback avec dépendances [] → plus de boucle infinie
  // ── CORRECTION 3 : galleryService.getFeatured normalisé dans le service,
  //    featuredPhotos.data est toujours un tableau → plus de crash
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [albumsData, statsData, bookingsData, featuredPhotos] = await Promise.all([
        photoService.getAlbums(),           // CORRECTION route : /admin/albums (sans /api/ en trop)
        photoService.getStats(),
        photoService.getBookingsForAlbum(),
        galleryService.getFeatured(3),      // retourne toujours { data: [] } (normalisé)
      ]);
      setAlbums(albumsData ?? []);
      setStats({ ...statsData, featuredPhotos: featuredPhotos?.data?.length ?? 0 });
      setBookings((bookingsData ?? []).filter(b => !b.hasAlbum));
    } catch (err) {
      console.error('Erreur chargement données:', err);
      showError('Erreur chargement données');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── CORRECTION 4 : handleFileUpload déclaré AVANT handleDrop qui en dépend
  const handleFileUpload = useCallback(async (files) => {
    if (!selectedAlbum) { showError("Sélectionnez d'abord un album"); return; }
    setUploading(true);
    try {
      await photoService.uploadPhotos(selectedAlbum.id, Array.from(files));
      showSuccess('Photos uploadées');
      const photosData = await photoService.getPhotos({ albumId: selectedAlbum.id });
      setPhotos(photosData ?? []);
    } catch (err) {
      console.error('Erreur upload:', err);
      showError('Erreur upload');
    } finally {
      setUploading(false);
    }
  }, [selectedAlbum, showError, showSuccess]);

  const loadAlbumPhotos = async (albumId) => {
    try {
      const [albumData, photosData] = await Promise.all([
        photoService.getAlbum(albumId),     // CORRECTION route : /admin/albums/:id (sans /api/)
        photoService.getPhotos({ albumId }),
      ]);
      setSelectedAlbum(albumData);
      setPhotos(photosData ?? []);
      setViewMode('album-detail');
    } catch (err) {
      console.error('Erreur chargement album:', err);
      showError('Erreur chargement album');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedAlbum) {
        await photoService.updateAlbum(selectedAlbum.id, formData);
        showSuccess('Album mis à jour');
      } else {
        await photoService.createAlbum(formData);
        showSuccess('Album créé');
      }
      resetForm();
      loadData();
    } catch (err) {
      console.error('Erreur enregistrement:', err);
      showError('Erreur enregistrement');
    }
  };

  const handleDeleteAlbum = async (id) => {
    if (!window.confirm('Supprimer cet album et toutes ses photos ?')) return;
    try {
      await photoService.deleteAlbum(id);
      showSuccess('Album supprimé');
      if (selectedAlbum?.id === id) { setSelectedAlbum(null); setViewMode('albums'); }
      loadData();
    } catch (err) {
      console.error('Erreur suppression album:', err);
      showError('Erreur suppression');
    }
  };

  const handleToggleFeatured = async (photoId, isFeatured) => {
    try {
      await photoService.updatePhoto(photoId, { isFeatured: !isFeatured });
      // CORRECTION 5 : setState fonctionnel → pas de closure stale
      setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, isFeatured: !isFeatured } : p));
      showSuccess(isFeatured ? 'Retiré des vedettes' : 'Ajouté aux vedettes');
    } catch (err) {
      console.error('Erreur mise à jour photo:', err);
      showError('Erreur mise à jour');
    }
  };

  const handleDeletePhoto = async (photoId) => {
    if (!window.confirm('Supprimer cette photo ?')) return;
    try {
      await photoService.deletePhoto(photoId);
      setPhotos(prev => prev.filter(p => p.id !== photoId)); // CORRECTION 5 bis
      showSuccess('Photo supprimée');
    } catch (err) {
      console.error('Erreur suppression photo:', err);
      showError('Erreur suppression');
    }
  };

  const resetForm = () => {
    setFormData({ title: '', description: '', category: 'PORTRAIT', isPublic: false, bookingId: '', publish: false });
    setSelectedAlbum(null);
    setShowForm(false);
  };

  const editAlbum = (album) => {
    setSelectedAlbum(album);
    setFormData({ title: album.title, description: album.description || '', category: album.category, isPublic: album.isPublic, bookingId: album.booking?.id || '', publish: false });
    setShowForm(true);
  };

  const createNewAlbum = () => { resetForm(); setShowForm(true); };

  const handleDrag = useCallback((e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  }, []);

  // CORRECTION 4 bis : handleDrop après handleFileUpload
  const handleDrop = useCallback((e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files);
  }, [handleFileUpload]);

  const filteredAlbums = filterCategory === 'all' ? albums : albums.filter(a => a.category === filterCategory);

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

  // CORRECTION 9 (Loading.jsx) : prop text utilisé pour l'UX
  if (loading) return <Loading fullScreen text="Chargement des albums..." />;

  return (
    <div className="p-4 lg:p-8 space-y-6">

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestion Photos & Albums</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{albums.length} album(s) • {stats?.totalPhotos || 0} photo(s)</p>
        </div>
        <button onClick={createNewAlbum} className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:shadow-lg transition-all">
          <PlusIcon className="w-5 h-5" /> Nouvel Album
        </button>
      </div>

      {/* Stats KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Albums',   value: stats?.totalAlbums     || 0, g: 'from-purple-500 to-purple-600', t: 'text-purple-100', Icon: FolderIcon       },
          { label: 'Total Photos',   value: stats?.totalPhotos     || 0, g: 'from-pink-500 to-pink-600',     t: 'text-pink-100',   Icon: PhotoIcon        },
          { label: 'Albums Publics', value: stats?.publicAlbums    || 0, g: 'from-cyan-500 to-cyan-600',     t: 'text-cyan-100',   Icon: EyeIcon          },
          { label: 'Ce mois',        value: stats?.photosThisMonth || 0, g: 'from-orange-500 to-orange-600', t: 'text-orange-100', Icon: CloudArrowUpIcon },
          { label: 'Photos Hero',    value: stats?.featuredPhotos  || 0, g: 'from-indigo-500 to-blue-600',   t: 'text-indigo-100', Icon: StarIcon         },
        ].map(({ label, value, g, t, Icon }) => (
          <div key={label} className={`bg-gradient-to-br ${g} rounded-2xl p-5 text-white shadow-lg`}>
            <div className="flex items-center justify-between">
              <div><p className={`${t} text-sm`}>{label}</p><p className="text-3xl font-bold">{value}</p></div>
              <Icon className="w-10 h-10 text-white/30" />
            </div>
          </div>
        ))}
      </div>

      {/* Retour */}
      {viewMode === 'album-detail' && (
        <button onClick={() => { setViewMode('albums'); setSelectedAlbum(null); }} className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-800 font-medium">
          ← Retour aux albums
        </button>
      )}

      {/* Formulaire */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{selectedAlbum ? "Modifier l'album" : 'Nouvel album'}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Titre *</label>
              <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="Ex: Mariage Marie & Jean" required />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent" rows="3" placeholder="Décrivez cet album..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Catégorie *</label>
              <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                {categories.filter(c => c.value !== 'all').map((cat) => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Réservation associée</label>
              <select value={formData.bookingId} onChange={(e) => setFormData({ ...formData, bookingId: e.target.value })} className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                <option value="">Aucune</option>
                {bookings.map((b) => <option key={b.id} value={b.id}>{b.client} - {b.service} ({b.date})</option>)}
              </select>
            </div>
            <div className="flex items-center gap-6">
              <label className="inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={formData.isPublic} onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })} className="sr-only peer" />
                <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600" />
                <span className="ms-3 text-sm font-medium text-gray-700 dark:text-gray-300">Album public</span>
              </label>
            </div>
            <div className="md:col-span-2 flex gap-4">
              <button type="submit" className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:shadow-lg transition-all">{selectedAlbum ? 'Enregistrer' : "Créer l'album"}</button>
              <button type="button" onClick={resetForm} className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">Annuler</button>
            </div>
          </form>
        </div>
      )}

      {/* Vues conditionnelles - key stable pour éviter insertBefore */}
      <div key={viewMode}>
      {viewMode === 'albums' && (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-2"><FunnelIcon className="w-5 h-5 text-purple-600" /><span className="font-medium text-gray-900 dark:text-white">Filtrer:</span></div>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button key={cat.value} onClick={() => setFilterCategory(cat.value)} className={`px-4 py-2 rounded-lg font-medium transition-all ${filterCategory === cat.value ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>{cat.label}</button>
                ))}
              </div>
              <div className="flex items-center gap-2 border-l border-gray-200 dark:border-gray-600 pl-4">
                <button onClick={() => setViewFormat('grid')} className={`p-2 rounded-lg ${viewFormat === 'grid' ? 'bg-purple-100 text-purple-600' : 'text-gray-500'}`}><Squares2X2Icon className="w-5 h-5" /></button>
                <button onClick={() => setViewFormat('list')} className={`p-2 rounded-lg ${viewFormat === 'list' ? 'bg-purple-100 text-purple-600' : 'text-gray-500'}`}><ListBulletIcon className="w-5 h-5" /></button>
              </div>
            </div>
          </div>

          {filteredAlbums.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center">
              <FolderIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Aucun album</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">Créez votre premier album photo</p>
              <button onClick={createNewAlbum} className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"><PlusIcon className="w-5 h-5" />Créer un album</button>
            </div>
          ) : viewFormat === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredAlbums.map((album) => (
                <div key={album.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden group">
                  <div className="aspect-square bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center relative">
                    <FolderIcon className="w-20 h-20 text-purple-300 dark:text-purple-600" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button onClick={() => loadAlbumPhotos(album.id)} className="p-3 bg-white rounded-full hover:bg-gray-100"><EyeIcon className="w-5 h-5 text-gray-700" /></button>
                      <button onClick={() => editAlbum(album)} className="p-3 bg-white rounded-full hover:bg-gray-100"><PencilIcon className="w-5 h-5 text-gray-700" /></button>
                      <button onClick={() => handleDeleteAlbum(album.id)} className="p-3 bg-white rounded-full hover:bg-gray-100"><TrashIcon className="w-5 h-5 text-red-600" /></button>
                    </div>
                    {album.isPublic && <span className="absolute top-3 right-3 px-2 py-1 bg-green-500 text-white text-xs rounded-full">Public</span>}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 dark:text-white truncate">{album.title}</h3>
                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-500 dark:text-gray-400"><PhotoIcon className="w-4 h-4" /><span>{album.photosCount} photo(s)</span></div>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 dark:text-gray-400"><CalendarDaysIcon className="w-4 h-4" /><span>{formatDate(album.createdAt)}</span></div>
                    {album.booking && <div className="flex items-center gap-2 mt-2 text-sm text-purple-600"><ArrowTopRightOnSquareIcon className="w-4 h-4" /><span>{album.booking.service}</span></div>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <tr>{['Album','Catégorie','Photos','Statut','Date','Actions'].map(h => <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredAlbums.map((album) => (
                    <tr key={album.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center"><FolderIcon className="w-6 h-6 text-purple-600" /></div>
                          <div><p className="font-medium text-gray-900 dark:text-white">{album.title}</p>{album.booking && <p className="text-sm text-purple-600">{album.booking.client}</p>}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4"><span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs font-medium">{album.category}</span></td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{album.photosCount} photos</td>
                      <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-semibold ${album.isPublic ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'}`}>{album.isPublic ? 'Public' : 'Privé'}</span></td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{formatDate(album.createdAt)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => loadAlbumPhotos(album.id)} className="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg"><EyeIcon className="w-5 h-5" /></button>
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
        </>
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
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${selectedAlbum.isPublic ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-700'}`}>{selectedAlbum.isPublic ? '✓ Public' : '✗ Privé'}</span>
                  {selectedAlbum.booking && <span className="text-sm text-purple-600 flex items-center gap-1"><UserIcon className="w-4 h-4" />{selectedAlbum.booking.client} - {selectedAlbum.booking.service}</span>}
                </div>
              </div>
              <button onClick={() => editAlbum(selectedAlbum)} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30"><PencilIcon className="w-5 h-5" />Modifier</button>
            </div>
          </div>

          {/* Zone drag & drop */}
          <div className={`bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border-2 border-dashed transition-colors ${dragActive ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-200 dark:border-gray-600'}`} onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}>
            <div className="text-center">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${dragActive ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500'}`}><ArrowUpTrayIcon className="w-8 h-8" /></div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{dragActive ? 'Déposez vos photos ici' : 'Glissez-déposez vos photos'}</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">ou cliquez pour sélectionner des fichiers</p>
              <input type="file" multiple accept="image/*" onChange={(e) => handleFileUpload(e.target.files)} className="hidden" id="photo-upload" disabled={uploading} />
              <label htmlFor="photo-upload" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:shadow-lg transition-all cursor-pointer">
                {uploading
                  ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  : <CloudArrowUpIcon className="w-5 h-5" />}
                {uploading ? 'Upload en cours...' : 'Sélectionner des photos'}
              </label>
            </div>
          </div>

          {/* Photos */}
          {photos.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center">
              <PhotoIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Aucune photo</h3>
              <p className="text-gray-500 dark:text-gray-400">Ajoutez des photos à cet album via le formulaire ci-dessus</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {photos.map((photo) => (
                <div key={photo.id} className="group relative aspect-square bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden">
                  <img src={photo.filePath} alt={photo.originalFilename} className="w-full h-full object-cover" loading="lazy" onError={(e) => { e.target.src = 'https://via.placeholder.com/300?text=Image'; }} />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleToggleFeatured(photo.id, photo.isFeatured)} className={`p-2 rounded-full transition-colors ${photo.isFeatured ? 'bg-yellow-400 text-white' : 'bg-white/20 text-white hover:bg-white/40'}`} title={photo.isFeatured ? 'Retirer des vedettes' : 'Mettre en vedette'}>
                        {photo.isFeatured ? <StarSolidIcon className="w-5 h-5" /> : <StarIcon className="w-5 h-5" />}
                      </button>
                      <button onClick={() => handleDeletePhoto(photo.id)} className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"><TrashIcon className="w-5 h-5" /></button>
                    </div>
                    <p className="text-white text-xs text-center px-2 truncate w-full">{photo.originalFilename}</p>
                  </div>
                  {photo.isFeatured && <div className="absolute top-2 right-2"><StarSolidIcon className="w-6 h-6 text-yellow-400" /></div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      </div>{/* fin key={viewMode} */}
    </div>
  );
};

export default PhotosManagement;
