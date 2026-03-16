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
 *
 * CORRECTIONS :
 * ─────────────────────────────────────────────────────────────────────────
 * 1. isEmployeeAvailable() utilisait b.scheduledDate et b.scheduledTime en DQL
 *    mais l'entité Booking a bookingDate et startTime → DQL exception → 500.
 *
 * 2. assignEmployee() appelait $booking->getScheduledTime() et
 *    $booking->getScheduledDate() → méthodes inexistantes sur l'entité.
 *    Corrigé → getStartTime() et getBookingDate().
 *
 * 3. isEmployeeAvailable() appelait $booking->getScheduledTime() →
 *    corrigé → getStartTime().
 * ─────────────────────────────────────────────────────────────────────────
 */
class BookingService
{
    public function __construct(
        private BookingRepository      $bookingRepository,
        private AvailabilityRepository $availabilityRepository,
        private BlockedSlotRepository  $blockedSlotRepository,
        private EmployeeRepository     $employeeRepository
    ) {}

    /**
     * Calculer les créneaux disponibles pour un service à une date donnée.
     */
    public function getAvailableSlots(Service $service, \DateTime $date): array
    {
        $slots    = [];
        $duration = $service->getDurationMin();

        $openingTime = new \DateTime($date->format('Y-m-d') . ' 09:00:00');
        $closingTime = new \DateTime($date->format('Y-m-d') . ' 18:00:00');

        $currentSlot = clone $openingTime;

        while ($currentSlot < $closingTime) {
            $slotEnd = clone $currentSlot;
            $slotEnd->modify("+{$duration} minutes");

            if ($slotEnd > $closingTime) {
                break;
            }

            $availableEmployee = $this->findAvailableEmployee($currentSlot, $slotEnd, $date);

            // Ajouter le créneau si un employé est disponible OU si aucun employé n'est configuré
            // (cas d'un studio qui n'a pas encore saisi ses employés)
            if ($availableEmployee !== null || $this->employeeRepository->count(['isActive' => true]) === 0) {
                $slots[] = [
                    'startTime'   => $currentSlot->format('H:i'),
                    'endTime'     => $slotEnd->format('H:i'),
                    'datetimeIso' => $currentSlot->format('Y-m-d\TH:i:s'),
                    'employee'    => $availableEmployee ? [
                        'id'        => $availableEmployee->getId(),
                        'firstName' => $availableEmployee->getUser()->getFirstName(),
                        'lastName'  => $availableEmployee->getUser()->getLastName(),
                    ] : null,
                    'available'   => true,
                ];
            }

            $currentSlot->modify('+30 minutes');
        }

        return $slots;
    }

    /**
     * Trouver un employé disponible pour un créneau.
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
     * Vérifier si un employé est disponible sur un créneau.
     */
    private function isEmployeeAvailable(
        Employee  $employee,
        \DateTime $startTime,
        \DateTime $endTime,
        \DateTime $date
    ): bool {
        // 1. Disponibilités récurrentes (jours/heures de travail)
        $dayOfWeek = (int) $date->format('N');
        $hasRecurringAvailability = false;

        foreach ($employee->getAvailabilities() as $availability) {
            if ($availability->getDayOfWeek() === $dayOfWeek) {
                $availStart = \DateTime::createFromFormat('H:i:s', $availability->getStartTime()->format('H:i:s'));
                $availEnd   = \DateTime::createFromFormat('H:i:s', $availability->getEndTime()->format('H:i:s'));
                $slotStart  = \DateTime::createFromFormat('H:i:s', $startTime->format('H:i:s'));
                $slotEnd    = \DateTime::createFromFormat('H:i:s', $endTime->format('H:i:s'));

                if ($slotStart >= $availStart && $slotEnd <= $availEnd) {
                    $hasRecurringAvailability = true;
                    break;
                }
            }
        }

        // Si aucune disponibilité récurrente configurée → on autorise
        // (évite de bloquer tous les créneaux si l'employé n'a pas encore
        // configuré ses horaires)
        if (!$hasRecurringAvailability && $employee->getAvailabilities()->isEmpty()) {
            $hasRecurringAvailability = true;
        }

        if (!$hasRecurringAvailability) {
            return false;
        }

        // 2. Congés/absences (BlockedSlots)
        $blockedSlots = $this->blockedSlotRepository->createQueryBuilder('bs')
            ->where('bs.employee = :employee')
            ->andWhere('bs.startDatetime <= :endTime')
            ->andWhere('bs.endDatetime >= :startTime')
            ->setParameter('employee', $employee)
            ->setParameter('startTime', $startTime)
            ->setParameter('endTime',   $endTime)
            ->getQuery()
            ->getResult();

        if (count($blockedSlots) > 0) {
            return false;
        }

        // 3. Réservations existantes
        // CORRECTION : b.scheduledDate → b.bookingDate, b.scheduledTime → b.startTime
        $existingBookings = $this->bookingRepository->createQueryBuilder('b')
            ->where('b.employee = :employee')
            ->andWhere('b.bookingDate = :date')
            ->andWhere('b.startTime <= :endTime')
            ->andWhere('b.status NOT IN (:cancelled)')
            ->setParameter('employee',  $employee)
            ->setParameter('date',      $date->format('Y-m-d'))
            ->setParameter('endTime',   $endTime->format('H:i:s'))
            ->setParameter('cancelled', ['cancelled'])
            ->getQuery()
            ->getResult();

        foreach ($existingBookings as $booking) {
            // CORRECTION : getScheduledTime() → getStartTime()
            $bookingStart = $booking->getStartTime();
            $bookingEnd   = clone $bookingStart;
            $bookingEnd->modify('+' . $booking->getService()->getDurationMin() . ' minutes');

            if ($startTime < $bookingEnd && $endTime > $bookingStart) {
                return false;
            }
        }

        return true;
    }

    /**
     * Assigner automatiquement un employé disponible à une réservation.
     *
     * CORRECTION : getScheduledTime() → getStartTime()
     *              getScheduledDate() → getBookingDate()
     */
    public function assignEmployee(Booking $booking): ?Employee
    {
        // CORRECTION : utilise les vrais getters de l'entité Booking
        $startTime = $booking->getStartTime();
        $duration  = $booking->getService()->getDurationMin();
        $endTime   = clone $startTime;
        $endTime->modify("+{$duration} minutes");

        return $this->findAvailableEmployee($startTime, $endTime, $booking->getBookingDate());
    }
}
