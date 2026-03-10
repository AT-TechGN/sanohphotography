<?php

namespace App\Service;

use App\Entity\Booking;
use App\Entity\Service;
use App\Entity\Employee;
use App\Repository\BookingRepository;
use App\Repository\AvailabilityRepository;
use App\Repository\BlockedSlotRepository;
use App\Repository\EmployeeRepository;

/**
 * Service métier pour la gestion des réservations
 * Calcul des créneaux disponibles selon le cahier des charges
 */
class BookingService
{
    public function __construct(
        private BookingRepository $bookingRepository,
        private AvailabilityRepository $availabilityRepository,
        private BlockedSlotRepository $blockedSlotRepository,
        private EmployeeRepository $employeeRepository
    ) {}

    /**
     * Calculer les créneaux disponibles pour un service à une date donnée
     * 
     * @param Service $service Le service à réserver
     * @param \DateTime $date La date souhaitée
     * @return array Liste des créneaux disponibles avec employé assignable
     */
    public function getAvailableSlots(Service $service, \DateTime $date): array
    {
        $slots = [];
        $duration = $service->getDurationMin();
        
        // Horaires d'ouverture (à configurer selon le studio)
        $openingTime = new \DateTime($date->format('Y-m-d') . ' 09:00:00');
        $closingTime = new \DateTime($date->format('Y-m-d') . ' 18:00:00');
        
        $currentSlot = clone $openingTime;
        
        while ($currentSlot < $closingTime) {
            $slotEnd = clone $currentSlot;
            $slotEnd->modify("+{$duration} minutes");
            
            if ($slotEnd > $closingTime) {
                break;
            }
            
            // Vérifier si un employé est disponible pour ce créneau
            $availableEmployee = $this->findAvailableEmployee($currentSlot, $slotEnd, $date);
            
            if ($availableEmployee) {
                $slots[] = [
                    'startTime' => $currentSlot->format('H:i'),
                    'endTime' => $slotEnd->format('H:i'),
                    'datetime' => clone $currentSlot,
                    'employee' => $availableEmployee,
                    'available' => true
                ];
            }
            
            // Incrément de 30 minutes entre chaque créneau
            $currentSlot->modify('+30 minutes');
        }
        
        return $slots;
    }

    /**
     * Trouver un employé disponible pour un créneau donné
     */
    private function findAvailableEmployee(\DateTime $startTime, \DateTime $endTime, \DateTime $date): ?Employee
    {
        $employees = $this->employeeRepository->findBy(['isActive' => true]);
        
        foreach ($employees as $employee) {
            if ($this->isEmployeeAvailable($employee, $startTime, $endTime, $date)) {
                return $employee;
            }
        }
        
        return null;
    }

    /**
     * Vérifier si un employé est disponible
     */
    private function isEmployeeAvailable(Employee $employee, \DateTime $startTime, \DateTime $endTime, \DateTime $date): bool
    {
        // 1. Vérifier les disponibilités récurrentes (jours/heures de travail)
        $dayOfWeek = (int) $date->format('N'); // 1 = lundi, 7 = dimanche
        $hasRecurringAvailability = false;
        
        foreach ($employee->getAvailabilities() as $availability) {
            if ($availability->getDayOfWeek() === $dayOfWeek) {
                $availStart = \DateTime::createFromFormat('H:i:s', $availability->getStartTime()->format('H:i:s'));
                $availEnd = \DateTime::createFromFormat('H:i:s', $availability->getEndTime()->format('H:i:s'));
                $slotStart = \DateTime::createFromFormat('H:i:s', $startTime->format('H:i:s'));
                $slotEnd = \DateTime::createFromFormat('H:i:s', $endTime->format('H:i:s'));
                
                if ($slotStart >= $availStart && $slotEnd <= $availEnd) {
                    $hasRecurringAvailability = true;
                    break;
                }
            }
        }
        
        if (!$hasRecurringAvailability) {
            return false;
        }
        
        // 2. Vérifier les congés/absences (slots bloqués)
        $blockedSlots = $this->blockedSlotRepository->createQueryBuilder('bs')
            ->where('bs.employee = :employee')
            ->andWhere('bs.startDateTime <= :endTime')
            ->andWhere('bs.endDateTime >= :startTime')
            ->setParameter('employee', $employee)
            ->setParameter('startTime', $startTime)
            ->setParameter('endTime', $endTime)
            ->getQuery()
            ->getResult();
        
        if (count($blockedSlots) > 0) {
            return false;
        }
        
        // 3. Vérifier les réservations existantes
        $existingBookings = $this->bookingRepository->createQueryBuilder('b')
            ->where('b.assignedEmployee = :employee')
            ->andWhere('b.scheduledDate = :date')
            ->andWhere('b.scheduledTime <= :endTime')
            ->andWhere('b.status NOT IN (:cancelledStatus)')
            ->setParameter('employee', $employee)
            ->setParameter('date', $date->format('Y-m-d'))
            ->setParameter('endTime', $endTime->format('H:i:s'))
            ->setParameter('cancelledStatus', ['cancelled'])
            ->getQuery()
            ->getResult();
        
        foreach ($existingBookings as $booking) {
            $bookingStart = $booking->getScheduledTime();
            $bookingEnd = clone $bookingStart;
            $bookingEnd->modify('+' . $booking->getService()->getDurationMin() . ' minutes');
            
            // Vérifier s'il y a chevauchement
            if ($startTime < $bookingEnd && $endTime > $bookingStart) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * Assigner automatiquement un employé à une réservation
     */
    public function assignEmployee(Booking $booking): ?Employee
    {
        $startTime = $booking->getScheduledTime();
        $duration = $booking->getService()->getDurationMin();
        $endTime = clone $startTime;
        $endTime->modify("+{$duration} minutes");
        
        return $this->findAvailableEmployee($startTime, $endTime, $booking->getScheduledDate());
    }
}
