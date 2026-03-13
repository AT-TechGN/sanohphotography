/* eslint-disable react-hooks/exhaustive-deps */

import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import bookingService from '../../services/bookingService';
import { motion as Motion } from 'framer-motion';

const CalendarBooking = ({ onDateSelect, onEventClick }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const bookings = await bookingService.getUserBookings();
      
      const formattedEvents = bookings.map(booking => ({
        id: booking.id,
        title: booking.service?.name || 'Réservation',
        start: `${booking.bookingDate}T${booking.startTime}`,
        end: booking.endTime ? `${booking.bookingDate}T${booking.endTime}` : undefined,
        backgroundColor: getStatusColor(booking.status),
        borderColor: getStatusColor(booking.status),
        extendedProps: {
          status: booking.status,
          service: booking.service,
          totalPrice: booking.totalPrice,
        }
      }));

      setEvents(formattedEvents);
    } catch {
      console.error('Erreur chargement réservations');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#F59E0B',
      confirmed: '#10B981',
      completed: '#3B82F6',
      cancelled: '#EF4444',
    };
    return colors[status] || '#6B7280';
  };

  const handleDateClick = (info) => {
    if (onDateSelect) {
      onDateSelect(info.date);
    }
  };

  const handleEventClick = (info) => {
    if (onEventClick) {
      onEventClick(info.event.extendedProps);
    }
  };

  const handleEventDrop = async (info) => {
    try {
      const eventId = info.event.id;
      const newDate = info.event.start;
      
      // Ici vous pouvez appeler votre API pour mettre à jour la réservation
      // await bookingService.updateBookingDate(eventId, newDate);
      
      console.log('Event dropped:', eventId, newDate);
    } catch {
      console.error('Erreur mise à jour réservation:');
      info.revert(); // Annuler le déplacement en cas d'erreur
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
    >
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        locale={frLocale}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        events={events}
        editable={true}
        droppable={true}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={true}
        weekends={true}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        eventDrop={handleEventDrop}
        eventResizeStop={handleEventDrop}
        height="auto"
        slotMinTime="08:00:00"
        slotMaxTime="20:00:00"
        slotDuration="00:30:00"
        businessHours={{
          daysOfWeek: [1, 2, 3, 4, 5, 6], // Lundi - Samedi
          startTime: '09:00',
          endTime: '18:00',
        }}
        eventContent={(eventInfo) => (
          <div className="p-1 text-xs">
            <div className="font-semibold truncate">{eventInfo.event.title}</div>
            <div className="text-xs opacity-90">
              {eventInfo.timeText}
            </div>
          </div>
        )}
      />

      {/* Légende des statuts */}
      <div className="mt-6 flex flex-wrap gap-4 justify-center">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-yellow-500"></div>
          <span className="text-sm text-gray-600 dark:text-gray-300">En attente</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500"></div>
          <span className="text-sm text-gray-600 dark:text-gray-300">Confirmée</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-500"></div>
          <span className="text-sm text-gray-600 dark:text-gray-300">Terminée</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500"></div>
          <span className="text-sm text-gray-600 dark:text-gray-300">Annulée</span>
        </div>
      </div>
    </Motion.div>
  );
};

export default CalendarBooking;
