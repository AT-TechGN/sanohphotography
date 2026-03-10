import { useEffect, useState } from 'react';
import serviceService from '../../services/serviceService';
import useUIStore from '../../stores/uiStore';
import Loading from '../../components/common/Loading';

const ServicesManagement = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingService, setEditingService] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const { showSuccess, showError } = useUIStore();

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    durationMin: '',
    basePrice: '',
    maxParticipants: '',
    isActive: true,
  });

  const categories = [
    { value: 'mariage', label: 'Mariage' },
    { value: 'portrait', label: 'Portrait' },
    { value: 'grossesse', label: 'Grossesse' },
    { value: 'famille', label: 'Famille' },
    { value: 'bapteme', label: 'Baptême' },
    { value: 'corporate', label: 'Corporate' },
    { value: 'mode', label: 'Mode' },
    { value: 'catalogue', label: 'Catalogue' },
  ];

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      const data = await serviceService.getActive();
      setServices(data);
    } catch (error) {
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
    } catch (error) {
      showError(error.response?.data?.error || 'Erreur lors de l\'enregistrement');
    }
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      category: service.category,
      description: service.description || '',
      durationMin: service.durationMin,
      basePrice: service.basePrice,
      maxParticipants: service.maxParticipants || '',
      isActive: service.isActive,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce service ?')) return;
    
    try {
      await serviceService.delete(id);
      showSuccess('Service supprimé');
      loadServices();
    } catch (error) {
      showError('Erreur lors de la suppression');
    }
  };

  const handleToggleActive = async (id) => {
    try {
      await serviceService.toggleActive(id);
      loadServices();
    } catch (error) {
      showError('Erreur lors de la modification');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      description: '',
      durationMin: '',
      basePrice: '',
      maxParticipants: '',
      isActive: true,
    });
    setEditingService(null);
    setShowForm(false);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-GN', {
      style: 'currency',
      currency: 'GNF',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) return <Loading fullScreen />;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Gestion des Services</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
        >
          {showForm ? 'Annuler' : '+ Nouveau service'}
        </button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-6">
            {editingService ? 'Modifier le service' : 'Nouveau service'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Nom *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Catégorie *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                required
              >
                <option value="">Sélectionner...</option>
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                rows="3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Durée (minutes) *</label>
              <input
                type="number"
                value={formData.durationMin}
                onChange={(e) => setFormData({ ...formData, durationMin: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                required
                min="15"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Prix de base (GNF) *</label>
              <input
                type="number"
                value={formData.basePrice}
                onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                required
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Max participants</label>
              <input
                type="number"
                value={formData.maxParticipants}
                onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                min="1"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="mr-2"
              />
              <label className="text-sm font-medium">Service actif</label>
            </div>

            <div className="col-span-2 flex gap-4">
              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
              >
                {editingService ? 'Modifier' : 'Créer'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-300 px-6 py-2 rounded-lg hover:bg-gray-400"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des services */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <div
            key={service.id}
            className={`bg-white rounded-lg shadow-lg p-6 ${
              !service.isActive && 'opacity-60'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-lg">{service.name}</h3>
              <span
                className={`px-2 py-1 rounded text-xs ${
                  service.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {service.isActive ? 'Actif' : 'Inactif'}
              </span>
            </div>

            <p className="text-sm text-gray-600 mb-4">{service.description}</p>

            <div className="space-y-2 mb-4 text-sm">
              <p>📂 {service.category}</p>
              <p>⏱️ {service.durationMin} min</p>
              <p className="font-bold text-blue-600">{formatPrice(service.basePrice)}</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(service)}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Modifier
              </button>
              <button
                onClick={() => handleToggleActive(service.id)}
                className="flex-1 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700"
              >
                {service.isActive ? 'Désactiver' : 'Activer'}
              </button>
              <button
                onClick={() => handleDelete(service.id)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ServicesManagement;
