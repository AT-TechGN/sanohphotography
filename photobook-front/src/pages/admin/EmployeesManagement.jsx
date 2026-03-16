/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useState } from 'react';
import employeeService from '../../services/employeeService';
import useUIStore from '../../stores/uiStore';
import Loading from '../../components/common/Loading';
import {
  PlusIcon, PencilIcon, TrashIcon, UserIcon,
  PhoneIcon, EnvelopeIcon, BriefcaseIcon,
  CalendarDaysIcon, XCircleIcon,
} from '@heroicons/react/24/outline';

const EmployeesManagement = () => {
  const [employees,      setEmployees]      = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [availabilities, setAvailabilities] = useState([]);
  const [blockedSlots,   setBlockedSlots]   = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [showForm,       setShowForm]       = useState(false);
  const [activeTab,      setActiveTab]      = useState('list');
  const [showAvailForm,  setShowAvailForm]  = useState(false);
  const [showBlockForm,  setShowBlockForm]  = useState(false);
  const { showSuccess, showError } = useUIStore();

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '',
    phone: '', position: '', hourlyRate: '', isActive: true,
  });

  const [availForm, setAvailForm] = useState({ day_of_week: '1', start_time: '09:00', end_time: '18:00' });
  const [blockForm, setBlockForm] = useState({ start_datetime: '', end_datetime: '', reason: '' });

  const daysOfWeek = [
    { value: 1, label: 'Lundi'    },
    { value: 2, label: 'Mardi'    },
    { value: 3, label: 'Mercredi' },
    { value: 4, label: 'Jeudi'    },
    { value: 5, label: 'Vendredi' },
    { value: 6, label: 'Samedi'   },
    { value: 7, label: 'Dimanche' },
  ];

  useEffect(() => { loadEmployees(); }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const data = await employeeService.getActive();
      setEmployees(data ?? []);
    } catch (err) {
      console.error(err);
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
      setAvailabilities(avail ?? []);
      setBlockedSlots(slots ?? []);
    } catch (err) {
      console.error(err);
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
    } catch (err) {
      console.error(err);
      showError('Erreur enregistrement');
    }
  };

  const handleDeleteEmployee = async (id) => {
    // BUG CORRIGÉ : confirm() → window.confirm()
    if (!window.confirm('Supprimer cet employé ?')) return;
    try {
      await employeeService.delete(id);
      showSuccess('Employé supprimé');
      if (selectedEmployee?.id === id) { setSelectedEmployee(null); setActiveTab('list'); }
      loadEmployees();
    } catch (err) {
      console.error(err);
      showError('Erreur suppression');
    }
  };

  const handleAddAvailability = async (e) => {
    e.preventDefault();
    try {
      await employeeService.addAvailability(selectedEmployee.id, {
        day_of_week: parseInt(availForm.day_of_week),
        start_time:  availForm.start_time,
        end_time:    availForm.end_time,
      });
      showSuccess('Disponibilité ajoutée');
      setShowAvailForm(false);
      setAvailForm({ day_of_week: '1', start_time: '09:00', end_time: '18:00' });
      loadEmployeeDetails(selectedEmployee.id);
    } catch (err) {
      console.error(err);
      showError('Erreur ajout disponibilité');
    }
  };

  const handleDeleteAvailability = async (availId) => {
    try {
      await employeeService.deleteAvailability(availId);
      showSuccess('Disponibilité supprimée');
      loadEmployeeDetails(selectedEmployee.id);
    } catch (err) {
      console.error(err);
      showError('Erreur suppression');
    }
  };

  const handleAddBlockedSlot = async (e) => {
    e.preventDefault();
    try {
      await employeeService.addBlockedSlot(selectedEmployee.id, {
        start_datetime: blockForm.start_datetime,
        end_datetime:   blockForm.end_datetime,
        reason:         blockForm.reason,
      });
      showSuccess('Congé/absence ajouté');
      setShowBlockForm(false);
      setBlockForm({ start_datetime: '', end_datetime: '', reason: '' });
      loadEmployeeDetails(selectedEmployee.id);
    } catch (err) {
      console.error(err);
      showError('Erreur ajout congé');
    }
  };

  const handleDeleteBlockedSlot = async (slotId) => {
    try {
      await employeeService.deleteBlockedSlot(slotId);
      showSuccess('Congé supprimé');
      loadEmployeeDetails(selectedEmployee.id);
    } catch (err) {
      console.error(err);
      showError('Erreur suppression');
    }
  };

  const resetForm = () => {
    setFormData({ firstName: '', lastName: '', email: '', phone: '', position: '', hourlyRate: '', isActive: true });
    setSelectedEmployee(null);
    setShowForm(false);
  };

  const selectEmployee = (employee) => {
    setSelectedEmployee(employee);
    setActiveTab('details');
    loadEmployeeDetails(employee.id);
  };

  const editEmployee = (employee) => {
    setSelectedEmployee(employee);
    setFormData({
      firstName:  employee.firstName,
      lastName:   employee.lastName,
      email:      employee.email,
      phone:      employee.phone || '',
      position:   employee.position || '',
      hourlyRate: employee.hourlyRate || '',
      isActive:   employee.isActive ?? true,
    });
    setShowForm(true);
  };

  if (loading) return <Loading fullScreen text="Chargement des employés..." />;

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestion des Employés</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{employees.length} employé(s)</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
        >
          <span className="inline-flex items-center gap-2">
            {showForm ? <XCircleIcon className="w-5 h-5" /> : <PlusIcon className="w-5 h-5" />}
            {showForm ? 'Annuler' : 'Nouvel employé'}
          </span>
        </button>
      </div>

      {/* Formulaire employé */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            {selectedEmployee ? 'Modifier l\'employé' : 'Nouvel employé'}
          </h2>
          <form onSubmit={handleSubmitEmployee} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { key: 'firstName', label: 'Prénom *',        type: 'text',   icon: UserIcon,     required: true  },
              { key: 'lastName',  label: 'Nom *',           type: 'text',   icon: UserIcon,     required: true  },
              { key: 'email',     label: 'Email *',         type: 'email',  icon: EnvelopeIcon, required: true  },
              { key: 'phone',     label: 'Téléphone *',     type: 'tel',    icon: PhoneIcon,    required: true  },
              { key: 'position',  label: 'Poste *',         type: 'text',   icon: BriefcaseIcon,required: true  },
              { key: 'hourlyRate',label: 'Taux horaire (GNF)', type: 'number', icon: null,      required: false },
            ].map(({ key, label, type, icon: Icon, required }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</label>
                <div className="relative">
                  {Icon && <Icon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />}
                  <input
                    type={type}
                    value={formData[key]}
                    onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                    className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                    required={required}
                  />
                </div>
              </div>
            ))}
            <div className="md:col-span-2 flex gap-4">
              <button type="submit" className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:shadow-lg transition-all">
                {selectedEmployee ? 'Modifier' : 'Créer'}
              </button>
              <button type="button" onClick={resetForm} className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('list')}
          className={`px-5 py-2 rounded-lg font-medium transition-all ${activeTab === 'list' ? 'bg-white dark:bg-gray-700 text-purple-600 shadow-sm' : 'text-gray-600 dark:text-gray-400'}`}
        >
          Liste
        </button>
        {selectedEmployee && (
          <button
            onClick={() => setActiveTab('details')}
            className={`px-5 py-2 rounded-lg font-medium transition-all ${activeTab === 'details' ? 'bg-white dark:bg-gray-700 text-purple-600 shadow-sm' : 'text-gray-600 dark:text-gray-400'}`}
          >
            {selectedEmployee.firstName} {selectedEmployee.lastName}
          </button>
        )}
      </div>

      {/* Liste */}
      {activeTab === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employees.length === 0 ? (
            <div className="col-span-3 bg-white dark:bg-gray-800 rounded-2xl p-12 text-center">
              <UserIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Aucun employé. Créez le premier.</p>
            </div>
          ) : employees.map((employee) => (
            <div key={employee.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-all p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold">
                    {employee.firstName?.[0]}{employee.lastName?.[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">{employee.firstName} {employee.lastName}</h3>
                    <p className="text-sm text-purple-600">{employee.position}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400 mb-4">
                <p className="flex items-center gap-2"><EnvelopeIcon className="w-4 h-4" />{employee.email}</p>
                <p className="flex items-center gap-2"><PhoneIcon className="w-4 h-4" />{employee.phone}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => selectEmployee(employee)} className="flex-1 px-4 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 text-sm font-medium transition-colors">
                  Détails
                </button>
                <button onClick={() => editEmployee(employee)} className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 transition-colors">
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button onClick={() => handleDeleteEmployee(employee.id)} className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 transition-colors">
                  <TrashIcon className="w-4 h-4" />
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
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Disponibilités récurrentes</h2>
              <button onClick={() => setShowAvailForm(!showAvailForm)} className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl text-sm font-medium">
                <PlusIcon className="w-4 h-4" /> Ajouter
              </button>
            </div>

            {showAvailForm && (
              <form onSubmit={handleAddAvailability} className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Jour</label>
                  <select value={availForm.day_of_week} onChange={(e) => setAvailForm({ ...availForm, day_of_week: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
                    {daysOfWeek.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Heure début</label>
                  <input type="time" value={availForm.start_time} onChange={(e) => setAvailForm({ ...availForm, start_time: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Heure fin</label>
                  <input type="time" value={availForm.end_time} onChange={(e) => setAvailForm({ ...availForm, end_time: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800" />
                </div>
                <div className="md:col-span-3 flex gap-2">
                  <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium">Ajouter</button>
                  <button type="button" onClick={() => setShowAvailForm(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm">Annuler</button>
                </div>
              </form>
            )}

            <div className="space-y-2">
              {availabilities.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">Aucune disponibilité définie</p>
              ) : availabilities.map((avail) => (
                <div key={avail.id} className="flex justify-between items-center border border-gray-200 dark:border-gray-600 p-3 rounded-xl">
                  <div className="flex items-center gap-3">
                    <CalendarDaysIcon className="w-5 h-5 text-purple-600" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {daysOfWeek.find((d) => d.value === avail.dayOfWeek)?.label}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">{avail.startTime} — {avail.endTime}</span>
                  </div>
                  <button onClick={() => handleDeleteAvailability(avail.id)} className="p-1 text-red-500 hover:text-red-700 transition-colors">
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Congés/Absences */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Congés et absences</h2>
              <button onClick={() => setShowBlockForm(!showBlockForm)} className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl text-sm font-medium">
                <PlusIcon className="w-4 h-4" /> Ajouter
              </button>
            </div>

            {showBlockForm && (
              <form onSubmit={handleAddBlockedSlot} className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date début</label>
                  <input type="datetime-local" value={blockForm.start_datetime} onChange={(e) => setBlockForm({ ...blockForm, start_datetime: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date fin</label>
                  <input type="datetime-local" value={blockForm.end_datetime} onChange={(e) => setBlockForm({ ...blockForm, end_datetime: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Raison</label>
                  <input type="text" value={blockForm.reason} onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800" placeholder="Congé, absence..." required />
                </div>
                <div className="md:col-span-3 flex gap-2">
                  <button type="submit" className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium">Ajouter</button>
                  <button type="button" onClick={() => setShowBlockForm(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm">Annuler</button>
                </div>
              </form>
            )}

            <div className="space-y-2">
              {blockedSlots.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">Aucun congé/absence prévu</p>
              ) : blockedSlots.map((slot) => (
                <div key={slot.id} className="flex justify-between items-center border border-gray-200 dark:border-gray-600 p-3 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{slot.reason}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Du {new Date(slot.startDateTime).toLocaleString('fr-FR')} au {new Date(slot.endDateTime).toLocaleString('fr-FR')}
                    </p>
                  </div>
                  <button onClick={() => handleDeleteBlockedSlot(slot.id)} className="p-1 text-red-500 hover:text-red-700 transition-colors">
                    <TrashIcon className="w-4 h-4" />
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
