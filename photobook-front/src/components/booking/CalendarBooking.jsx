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
  const [events,  setEvents]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      // BUG CORRIGÉ : getUserBookings() n'existe pas dans bookingService
      // La bonne méthode est getMyBookings()
      const bookings = await bookingService.getMyBookings();
      const data = Array.isArray(bookings) ? bookings : [];

      const formattedEvents = data.map((booking) => ({
        id:    String(booking.id),
        title: booking.service?.name || 'Réservation',
        // BUG CORRIGÉ : bookingDate/startTime → scheduledDate/scheduledTime
        start: booking.scheduledDate && booking.scheduledTime
          ? `${booking.scheduledDate}T${booking.scheduledTime}`
          : booking.scheduledDate,
        backgroundColor: getStatusColor(booking.status),
        borderColor:     getStatusColor(booking.status),
        extendedProps: {
          status:     booking.status,
          service:    booking.service,
          totalPrice: booking.totalPrice ?? booking.service?.basePrice,
        },
      }));

      setEvents(formattedEvents);
    } catch (err) {
      console.error('Erreur chargement réservations:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending:     '#F59E0B',
      confirmed:   '#10B981',
      in_progress: '#8B5CF6',
      completed:   '#3B82F6',
      cancelled:   '#EF4444',
    };
    return colors[status] || '#6B7280';
  };

  const handleDateClick   = (info) => onDateSelect?.(info.date);
  const handleEventClick  = (info) => onEventClick?.(info.event.extendedProps);

  const handleEventDrop = async (info) => {
    try {
      // Placeholder pour mise à jour de date via l'API admin
      console.log('Event dropped:', info.event.id, info.event.start);
    } catch {
      info.revert();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600" />
      </div>
    );
  }

  return (
    <Motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
    >
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        locale={frLocale}
        headerToolbar={{
          left:   'prev,next today',
          center: 'title',
          right:  'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        events={events}
        editable={false}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={true}
        weekends={true}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        eventDrop={handleEventDrop}
        height="auto"
        slotMinTime="08:00:00"
        slotMaxTime="20:00:00"
        slotDuration="00:30:00"
        businessHours={{
          daysOfWeek: [1, 2, 3, 4, 5, 6],
          startTime:  '09:00',
          endTime:    '18:00',
        }}
        eventContent={(eventInfo) => (
          <div className="p-1 text-xs">
            <div className="font-semibold truncate">{eventInfo.event.title}</div>
            {eventInfo.timeText && <div className="opacity-90">{eventInfo.timeText}</div>}
          </div>
        )}
      />

      {/* Légende */}
      <div className="mt-6 flex flex-wrap gap-4 justify-center">
        {[
          { color: 'bg-yellow-500',  label: 'En attente'  },
          { color: 'bg-green-500',   label: 'Confirmée'   },
          { color: 'bg-amber-500',  label: 'En cours'    },
          { color: 'bg-blue-500',    label: 'Terminée'    },
          { color: 'bg-red-500',     label: 'Annulée'     },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded ${color}`} />
            <span className="text-sm text-gray-600 dark:text-gray-300">{label}</span>
          </div>
        ))}
      </div>
    </Motion.div>
  );
};

export default CalendarBooking;
