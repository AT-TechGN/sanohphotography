import { useEffect, useState } from 'react';
import serviceService from '../../services/serviceService';
import useUIStore from '../../stores/uiStore';
import Loading from '../../components/common/Loading';
import {
  PlusIcon, PencilIcon, TrashIcon,
  CheckCircleIcon, XCircleIcon, CameraIcon,
  ClockIcon, CurrencyDollarIcon, UsersIcon,
} from '@heroicons/react/24/outline';

const ServicesManagement = () => {
  const [services,        setServices]        = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [editingService,  setEditingService]  = useState(null);
  const [showForm,        setShowForm]        = useState(false);
  const { showSuccess, showError } = useUIStore();

  const [formData, setFormData] = useState({
    name: '', category: '', description: '',
    durationMin: '', basePrice: '', maxParticipants: '', isActive: true,
  });

  const categories = [
    { value: 'WEDDING',   label: '💍 Mariage & Fiançailles',    icon: '💍', color: 'from-pink-500 to-rose-500'     },
    { value: 'BAPTISM',   label: '✝️ Baptême & Communion',      icon: '✝️', color: 'from-blue-500 to-cyan-500'     },
    { value: 'BIRTHDAY',  label: '🎂 Anniversaire & Fête',      icon: '🎂', color: 'from-purple-500 to-pink-500'   },
    { value: 'PORTRAIT',  label: '🤳 Portrait individuel',      icon: '🤳', color: 'from-orange-500 to-amber-500'  },
    { value: 'MATERNITY', label: '🤰 Grossesse & Naissance',    icon: '🤰', color: 'from-green-500 to-emerald-500' },
    { value: 'FAMILY',    label: '👨‍👩‍👧 Photo de famille',       icon: '👨‍👩‍👧', color: 'from-teal-500 to-cyan-500'  },
    { value: 'FASHION',   label: '👗 Photographie Mode',        icon: '👗', color: 'from-fuchsia-500 to-pink-500'  },
    { value: 'PRODUCT',   label: '📦 Catalogue produit',        icon: '📦', color: 'from-indigo-500 to-blue-500'   },
    { value: 'CORPORATE', label: '🏢 Photo Corporate',          icon: '🏢', color: 'from-gray-600 to-gray-700'     },
    { value: 'CULINARY',  label: '🍽️ Photographie culinaire',  icon: '🍽️', color: 'from-yellow-500 to-orange-500' },
  ];

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => { loadServices(); }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      const data = await serviceService.getActive();
      setServices(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      showError('Erreur chargement services');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingService) {
        await serviceService.update(editingService.id, formData);
        showSuccess('Service modifié avec succès');
      } else {
        await serviceService.create(formData);
        showSuccess('Service créé avec succès');
      }
      resetForm();
      loadServices();
    } catch (err) {
      console.error(err);
      showError('Erreur lors de l\'enregistrement');
    }
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setFormData({
      name:            service.name,
      category:        service.category,
      description:     service.description || '',
      durationMin:     service.durationMin,
      basePrice:       service.basePrice,
      maxParticipants: service.maxParticipants || '',
      isActive:        service.isActive,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    // BUG CORRIGÉ : confirm() → window.confirm()
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce service ?')) return;
    try {
      await serviceService.delete(id);
      showSuccess('Service supprimé');
      loadServices();
    } catch (err) {
      console.error(err);
      showError('Erreur lors de la suppression');
    }
  };

  const handleToggleActive = async (id) => {
    try {
      await serviceService.toggleActive(id);
      // mise à jour optimiste locale
      setServices(prev => prev.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s));
    } catch (err) {
      console.error(err);
      showError('Erreur lors de la modification');
      loadServices(); // rollback
    }
  };

  const resetForm = () => {
    setFormData({ name: '', category: '', description: '', durationMin: '', basePrice: '', maxParticipants: '', isActive: true });
    setEditingService(null);
    setShowForm(false);
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat('fr-GN', { style: 'currency', currency: 'GNF', minimumFractionDigits: 0 }).format(price);

  const getCategoryInfo = (categoryValue) =>
    categories.find(c => c.value === categoryValue) || { label: categoryValue, icon: '📸', color: 'from-gray-500 to-gray-600' };

  if (loading) return <Loading fullScreen text="Chargement des services..." />;

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestion des Services</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{services.length} service(s) disponible(s)</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
        >
          {showForm ? <><XCircleIcon className="w-5 h-5" />Annuler</> : <><PlusIcon className="w-5 h-5" />Nouveau service</>}
        </button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            {editingService ? 'Modifier le service' : 'Nouveau service'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nom du service *</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Ex: Séance photo mariage" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Catégorie *</label>
              <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent" required>
                <option value="">Sélectionner une catégorie...</option>
                {categories.map((cat) => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows="4" placeholder="Décrivez ce service..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Durée (minutes) *</label>
              <div className="relative">
                <ClockIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="number" value={formData.durationMin} onChange={(e) => setFormData({ ...formData, durationMin: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required min="15" step="15" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Prix de base (GNF) *</label>
              <div className="relative">
                <CurrencyDollarIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="number" value={formData.basePrice} onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required min="0" step="1000" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Max participants</label>
              <div className="relative">
                <UsersIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="number" value={formData.maxParticipants} onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  min="1" />
              </div>
            </div>
            <div className="flex items-center">
              <label className="inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="sr-only peer" />
                <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600" />
                <span className="ms-3 text-sm font-medium text-gray-700 dark:text-gray-300">Service actif</span>
              </label>
            </div>
            <div className="md:col-span-2 flex gap-4">
              <button type="submit" className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:shadow-lg transition-all">
                {editingService ? 'Modifier' : 'Créer'}
              </button>
              <button type="button" onClick={resetForm} className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des services */}
      {services.length === 0 && !showForm ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center">
          <CameraIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Aucun service disponible</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Commencez par créer votre premier service</p>
          <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:shadow-lg transition-all">
            <PlusIcon className="w-5 h-5" /> Créer un service
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => {
            const categoryInfo = getCategoryInfo(service.category);
            return (
              <div key={service.id} className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden ${!service.isActive && 'opacity-60'}`}>
                <div className={`bg-gradient-to-r ${categoryInfo.color} p-6 text-white`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-4xl">{categoryInfo.icon}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${service.isActive ? 'bg-white/20' : 'bg-black/20'}`}>
                      {service.isActive ? '✓ Actif' : '✗ Inactif'}
                    </span>
                  </div>
                  <h3 className="font-bold text-xl">{service.name}</h3>
                </div>
                <div className="p-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                    {service.description || 'Aucune description'}
                  </p>
                  <div className="space-y-2 mb-5">
                    <div className="flex items-center gap-2 text-sm">
                      <ClockIcon className="w-4 h-4 text-purple-600" />
                      <span className="text-gray-700 dark:text-gray-300">{service.durationMin} minutes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CurrencyDollarIcon className="w-4 h-4 text-green-600" />
                      <span className="font-bold text-gray-900 dark:text-white">{formatPrice(service.basePrice)}</span>
                    </div>
                    {service.maxParticipants && (
                      <div className="flex items-center gap-2 text-sm">
                        <UsersIcon className="w-4 h-4 text-blue-600" />
                        <span className="text-gray-700 dark:text-gray-300">Max {service.maxParticipants} participant(s)</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(service)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                      <PencilIcon className="w-4 h-4" /><span className="text-sm font-medium">Modifier</span>
                    </button>
                    <button onClick={() => handleToggleActive(service.id)} className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${service.isActive ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/30' : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30'}`}>
                      {service.isActive ? <XCircleIcon className="w-4 h-4" /> : <CheckCircleIcon className="w-4 h-4" />}
                      <span className="text-sm font-medium">{service.isActive ? 'Désactiver' : 'Activer'}</span>
                    </button>
                    <button onClick={() => handleDelete(service.id)} className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors" title="Supprimer">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ServicesManagement;
