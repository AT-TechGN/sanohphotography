import { useEffect, useState, useCallback } from 'react';
import serviceService from '../../services/serviceService';
import useUIStore from '../../stores/uiStore';
import Loading from '../../components/common/Loading';
import {
  PlusIcon, PencilIcon, TrashIcon,
  CheckCircleIcon, XCircleIcon, CameraIcon,
  ClockIcon, CurrencyDollarIcon, UsersIcon,
} from '@heroicons/react/24/outline';

/**
 * CORRECTIONS :
 * 1. Catégories alignées avec l'entité Service backend
 *    (Assert\Choice : mariage, fiancailles, bapteme, portrait, famille…)
 *    Avant : WEDDING, PORTRAIT… (invalide → validation Symfony échoue)
 *
 * 2. React DOM insertBefore error → ajout de key stable sur les boutons
 *    et wrapper fragment sur le rendu conditionnel d'icônes
 *
 * 3. Ajout useCallback sur loadServices pour éviter re-renders infinis
 */
const ServicesManagement = () => {
  const [services,       setServices]       = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [editingService, setEditingService] = useState(null);
  const [showForm,       setShowForm]       = useState(false);
  const { showSuccess, showError } = useUIStore();

  const emptyForm = {
    name: '', category: '', description: '',
    durationMin: '', basePrice: '', maxParticipants: '', isActive: true,
  };
  const [formData, setFormData] = useState(emptyForm);

  // ── Catégories alignées avec Assert\Choice de l'entité Service ─────────
  const categories = [
    { value: 'mariage',        label: '💍 Mariage',               icon: '💍', color: 'from-orange-500 to-rose-500'     },
    { value: 'fiancailles',    label: '💑 Fiançailles',            icon: '💑', color: 'from-rose-500 to-orange-400'     },
    { value: 'bapteme',        label: '✝️ Baptême',               icon: '✝️', color: 'from-blue-400 to-cyan-400'     },
    { value: 'communion',      label: '🕊️ Communion',             icon: '🕊️', color: 'from-sky-400 to-blue-400'      },
    { value: 'anniversaire',   label: '🎂 Anniversaire',           icon: '🎂', color: 'from-amber-500 to-orange-500'   },
    { value: 'ceremonie',      label: '🎊 Cérémonie',              icon: '🎊', color: 'from-amber-500 to-orange-500'  },
    { value: 'portrait',       label: '🤳 Portrait',               icon: '🤳', color: 'from-orange-500 to-amber-500'  },
    { value: 'grossesse',      label: '🤰 Grossesse',              icon: '🤰', color: 'from-green-500 to-emerald-500' },
    { value: 'naissance',      label: '👶 Naissance',              icon: '👶', color: 'from-teal-400 to-cyan-400'     },
    { value: 'famille',        label: '👨‍👩‍👧 Famille',              icon: '👨‍👩‍👧', color: 'from-teal-500 to-cyan-500'  },
    { value: 'mode',           label: '👗 Mode',                   icon: '👗', color: 'from-fuchsia-500 to-orange-500'  },
    { value: 'shopping',       label: '🛍️ Shopping',              icon: '🛍️', color: 'from-violet-500 to-amber-500' },
    { value: 'catalogue',      label: '📦 Catalogue produit',      icon: '📦', color: 'from-indigo-500 to-blue-500'   },
    { value: 'corporate',      label: '🏢 Corporate',              icon: '🏢', color: 'from-gray-600 to-gray-700'     },
    { value: 'culinaire',      label: '🍽️ Culinaire',             icon: '🍽️', color: 'from-yellow-500 to-orange-500' },
    { value: 'book_artistique',label: '🎨 Book artistique',        icon: '🎨', color: 'from-emerald-500 to-green-600' },
  ];

  const getCategoryInfo = (val) =>
    categories.find(c => c.value === val) || { label: val, icon: '📸', color: 'from-gray-500 to-gray-600' };

  const loadServices = useCallback(async () => {
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
  }, []);

  useEffect(() => { loadServices(); }, [loadServices]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        durationMin:     parseInt(formData.durationMin, 10),
        basePrice:       parseFloat(formData.basePrice),
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants, 10) : null,
      };
      if (editingService) {
        await serviceService.update(editingService.id, payload);
        showSuccess('Service modifié');
      } else {
        await serviceService.create(payload);
        showSuccess('Service créé');
      }
      resetForm();
      loadServices();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.errors
        ? Object.values(err.response.data.errors).join(' — ')
        : 'Erreur lors de l\'enregistrement';
      showError(msg);
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
    if (!window.confirm('Supprimer ce service ?')) return;
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
      setServices(prev =>
        prev.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s)
      );
    } catch (err) {
      console.error(err);
      showError('Erreur');
      loadServices();
    }
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingService(null);
    setShowForm(false);
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat('fr-GN', { style: 'currency', currency: 'GNF', minimumFractionDigits: 0 }).format(price);

  if (loading) return <Loading fullScreen text="Chargement des services..." />;

  return (
    <div className="p-4 lg:p-8 space-y-6">

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestion des Services</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{services.length} service(s)</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(v => !v); }}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
        >
          <span className="inline-flex items-center gap-2">
            {showForm ? <XCircleIcon className="w-5 h-5" /> : <PlusIcon className="w-5 h-5" />}
            {showForm ? 'Annuler' : 'Nouveau service'}
          </span>
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nom *</label>
              <input
                type="text" value={formData.name} required
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Ex: Séance photo mariage"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Catégorie *</label>
              <select
                value={formData.category} required
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="">Sélectionner...</option>
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
              <textarea
                value={formData.description} rows="3"
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Décrivez ce service..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Durée (min) *</label>
              <div className="relative">
                <ClockIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="number" value={formData.durationMin} required min="15" step="15"
                  onChange={(e) => setFormData({ ...formData, durationMin: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Prix (GNF) *</label>
              <div className="relative">
                <CurrencyDollarIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="number" value={formData.basePrice} required min="0" step="1000"
                  onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Max participants</label>
              <div className="relative">
                <UsersIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="number" value={formData.maxParticipants} min="1"
                  onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center">
              <label className="inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 dark:peer-focus:ring-amber-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600" />
                <span className="ms-3 text-sm font-medium text-gray-700 dark:text-gray-300">Service actif</span>
              </label>
            </div>
            <div className="md:col-span-2 flex gap-4">
              <button type="submit"
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:shadow-lg transition-all">
                {editingService ? 'Modifier' : 'Créer'}
              </button>
              <button type="button" onClick={resetForm}
                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
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
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Aucun service</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Créez votre premier service</p>
          <button onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl font-medium hover:shadow-lg transition-all">
            <PlusIcon className="w-5 h-5" /> Créer un service
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => {
            const cat = getCategoryInfo(service.category);
            return (
              <div key={service.id}
                className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden${!service.isActive ? ' opacity-60' : ''}`}>
                <div className={`bg-gradient-to-r ${cat.color} p-6 text-white`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-4xl">{cat.icon}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${service.isActive ? 'bg-white/20' : 'bg-black/20'}`}>
                      {service.isActive ? '✓ Actif' : '✗ Inactif'}
                    </span>
                  </div>
                  <h3 className="font-bold text-xl">{service.name}</h3>
                  <p className="text-sm text-white/80 mt-1">{cat.label}</p>
                </div>
                <div className="p-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                    {service.description || 'Aucune description'}
                  </p>
                  <div className="space-y-2 mb-5">
                    <div className="flex items-center gap-2 text-sm">
                      <ClockIcon className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{service.durationMin} min</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CurrencyDollarIcon className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span className="font-bold text-gray-900 dark:text-white">{formatPrice(service.basePrice)}</span>
                    </div>
                    {service.maxParticipants && (
                      <div className="flex items-center gap-2 text-sm">
                        <UsersIcon className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">Max {service.maxParticipants}</span>
                      </div>
                    )}
                  </div>
                  {/* FIX : key sur chaque bouton + pas de rendu conditionnel d'icône sans wrapper */}
                  <div className="flex gap-2">
                    <button key="edit" onClick={() => handleEdit(service)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                      <PencilIcon className="w-4 h-4" />
                      <span className="text-sm font-medium">Modifier</span>
                    </button>
                    <button key="toggle" onClick={() => handleToggleActive(service.id)}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        service.isActive
                          ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-100'
                          : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100'
                      }`}>
                      {/* FIX : Fragment avec key pour éviter insertBefore error */}
                      {service.isActive ? <XCircleIcon className="w-4 h-4" /> : <CheckCircleIcon className="w-4 h-4" />}
                      <span className="text-sm font-medium">{service.isActive ? 'Désactiver' : 'Activer'}</span>
                    </button>
                    <button key="delete" onClick={() => handleDelete(service.id)}
                      className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                      title="Supprimer">
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
