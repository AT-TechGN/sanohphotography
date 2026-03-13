/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useState } from 'react';
import employeeService from '../../services/employeeService';
import useUIStore from '../../stores/uiStore';
import Loading from '../../components/common/Loading';

const EmployeesManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [availabilities, setAvailabilities] = useState([]);
  const [blockedSlots, setBlockedSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('list');
  const { showSuccess, showError } = useUIStore();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: '',
    hourlyRate: '',
    isActive: true,
  });

  const daysOfWeek = [
    { value: 1, label: 'Lundi' },
    { value: 2, label: 'Mardi' },
    { value: 3, label: 'Mercredi' },
    { value: 4, label: 'Jeudi' },
    { value: 5, label: 'Vendredi' },
    { value: 6, label: 'Samedi' },
    { value: 7, label: 'Dimanche' },
  ];
  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const data = await employeeService.getActive();
      setEmployees(data);
    } catch {
      showError('Erreur chargement employés');
    } finally {
      setLoading(false);
    }
  };

  const loadEmployeeDetails = async (id) => {
    try {
      const [avail, slots] = await Promise.all([
        employeeService.getAvailabilities(id),
        employeeService.getBlockedSlots(id),
      ]);
      setAvailabilities(avail);
      setBlockedSlots(slots);
    } catch {
      showError('Erreur chargement détails');
    }
  };

  const handleSubmitEmployee = async (e) => {
    e.preventDefault();
    try {
      if (selectedEmployee) {
        await employeeService.update(selectedEmployee.id, formData);
        showSuccess('Employé modifié');
      } else {
        await employeeService.create(formData);
        showSuccess('Employé créé');
      }
      resetForm();
      loadEmployees();
    } catch {
      showError('Erreur enregistrement');
    }
  };

  const handleDeleteEmployee = async (id) => {
    if (!confirm('Supprimer cet employé ?')) return;
    try {
      await employeeService.delete(id);
      showSuccess('Employé supprimé');
      loadEmployees();
    } catch {
      showError('Erreur suppression');
    }
  };

  const handleAddAvailability = async (employeeId) => {
    const day = prompt('Jour de la semaine (1=Lundi, 7=Dimanche):');
    const startTime = prompt('Heure de début (ex: 09:00):');
    const endTime = prompt('Heure de fin (ex: 18:00):');

    if (!day || !startTime || !endTime) return;

    try {
      await employeeService.addAvailability(employeeId, {
        day_of_week: parseInt(day),
        start_time: startTime,
        end_time: endTime,
      });
      showSuccess('Disponibilité ajoutée');
      loadEmployeeDetails(employeeId);
    } catch {
      showError('Erreur ajout disponibilité');
    }
  };

  const handleDeleteAvailability = async (availId, employeeId) => {
    try {
      await employeeService.deleteAvailability(availId);
      showSuccess('Disponibilité supprimée');
      loadEmployeeDetails(employeeId);
    } catch {
      showError('Erreur suppression');
    }
  };

  const handleAddBlockedSlot = async (employeeId) => {
    const startDate = prompt('Date début (YYYY-MM-DD HH:MM):');
    const endDate = prompt('Date fin (YYYY-MM-DD HH:MM):');
    const reason = prompt('Raison (congé, absence, etc.):');

    if (!startDate || !endDate || !reason) return;

    try {
      await employeeService.addBlockedSlot(employeeId, {
        start_datetime: startDate,
        end_datetime: endDate,
        reason,
      });
      showSuccess('Congé/absence ajouté');
      loadEmployeeDetails(employeeId);
    } catch {
      showError('Erreur ajout congé');
    }
  };

  const handleDeleteBlockedSlot = async (slotId, employeeId) => {
    try {
      await employeeService.deleteBlockedSlot(slotId);
      showSuccess('Congé supprimé');
      loadEmployeeDetails(employeeId);
    } catch {
      showError('Erreur suppression');
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      position: '',
      hourlyRate: '',
      isActive: true,
    });
    setSelectedEmployee(null);
    setShowForm(false);
  };

  const selectEmployee = (employee) => {
    setSelectedEmployee(employee);
    setActiveTab('details');
    loadEmployeeDetails(employee.id);
  };

  if (loading) return <Loading fullScreen />;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Gestion des Employés</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
        >
          {showForm ? 'Annuler' : '+ Nouvel employé'}
        </button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-6">
            {selectedEmployee ? 'Modifier' : 'Nouvel'} employé
          </h2>
          <form onSubmit={handleSubmitEmployee} className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Prénom *</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Nom *</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Téléphone *</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Poste *</label>
              <input
                type="text"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Taux horaire (GNF)</label>
              <input
                type="number"
                value={formData.hourlyRate}
                onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>

            <div className="col-span-2 flex gap-4">
              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
              >
                {selectedEmployee ? 'Modifier' : 'Créer'}
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

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('list')}
          className={`px-6 py-3 rounded-lg font-medium ${
            activeTab === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}
        >
          Liste
        </button>
        {selectedEmployee && (
          <button
            onClick={() => setActiveTab('details')}
            className={`px-6 py-3 rounded-lg font-medium ${
              activeTab === 'details' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            {selectedEmployee.firstName} {selectedEmployee.lastName}
          </button>
        )}
      </div>

      {/* Liste */}
      {activeTab === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employees.map((employee) => (
            <div key={employee.id} className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="font-bold text-lg mb-2">
                {employee.firstName} {employee.lastName}
              </h3>
              <div className="space-y-1 text-sm text-gray-600 mb-4">
                <p>📧 {employee.email}</p>
                <p>📱 {employee.phone}</p>
                <p>💼 {employee.position}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => selectEmployee(employee)}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Détails
                </button>
                <button
                  onClick={() => handleDeleteEmployee(employee.id)}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Détails employé */}
      {activeTab === 'details' && selectedEmployee && (
        <div className="space-y-6">
          {/* Disponibilités */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Disponibilités récurrentes</h2>
              <button
                onClick={() => handleAddAvailability(selectedEmployee.id)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                + Ajouter
              </button>
            </div>
            <div className="space-y-2">
              {availabilities.map((avail) => (
                <div
                  key={avail.id}
                  className="flex justify-between items-center border p-3 rounded-lg"
                >
                  <div>
                    <span className="font-medium">
                      {daysOfWeek.find((d) => d.value === avail.dayOfWeek)?.label}
                    </span>
                    <span className="text-gray-600 ml-3">
                      {avail.startTime} - {avail.endTime}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteAvailability(avail.id, selectedEmployee.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Congés/Absences */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Congés et absences</h2>
              <button
                onClick={() => handleAddBlockedSlot(selectedEmployee.id)}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
              >
                + Ajouter
              </button>
            </div>
            <div className="space-y-2">
              {blockedSlots.map((slot) => (
                <div
                  key={slot.id}
                  className="flex justify-between items-center border p-3 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{slot.reason}</p>
                    <p className="text-sm text-gray-600">
                      Du {new Date(slot.startDateTime).toLocaleString('fr-FR')} au{' '}
                      {new Date(slot.endDateTime).toLocaleString('fr-FR')}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteBlockedSlot(slot.id, selectedEmployee.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeesManagement;
