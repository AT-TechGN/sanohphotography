<?php

namespace App\Controller\Api;

use App\Entity\Availability;
use App\Entity\BlockedSlot;
use App\Repository\EmployeeRepository;
use App\Repository\AvailabilityRepository;
use App\Repository\BlockedSlotRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/employees')]
final class EmployeeController extends AbstractController
{
    public function __construct(
        private EmployeeRepository $employeeRepository,
        private AvailabilityRepository $availabilityRepository,
        private BlockedSlotRepository $blockedSlotRepository,
        private EntityManagerInterface $em
    ) {}

    /**
     * Obtenir les employés actifs
     */
    #[Route('/active', name: 'api_employees_active', methods: ['GET'])]
    public function getActive(): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $employees = $this->employeeRepository->findBy(
            ['isActive' => true],
            ['firstName' => 'ASC']
        );

        return $this->json($employees, Response::HTTP_OK, [], [
            'groups' => ['employee:read']
        ]);
    }

    /**
     * Obtenir les disponibilités d'un employé
     */
    #[Route('/{id}/availabilities', name: 'api_employee_availabilities', methods: ['GET'])]
    public function getAvailabilities(int $id): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $employee = $this->employeeRepository->find($id);
        if (!$employee) {
            return $this->json(['error' => 'Employé non trouvé'], Response::HTTP_NOT_FOUND);
        }

        $availabilities = $this->availabilityRepository->findBy(
            ['employee' => $employee],
            ['dayOfWeek' => 'ASC', 'startTime' => 'ASC']
        );

        return $this->json($availabilities, Response::HTTP_OK, [], [
            'groups' => ['availability:read']
        ]);
    }

    /**
     * Ajouter une disponibilité récurrente
     */
    #[Route('/{id}/availabilities', name: 'api_employee_add_availability', methods: ['POST'])]
    public function addAvailability(int $id, Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $employee = $this->employeeRepository->find($id);
        if (!$employee) {
            return $this->json(['error' => 'Employé non trouvé'], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);

        if (!isset($data['day_of_week'], $data['start_time'], $data['end_time'])) {
            return $this->json([
                'error' => 'Les champs day_of_week, start_time et end_time sont requis'
            ], Response::HTTP_BAD_REQUEST);
        }

        try {
            $startTime = new \DateTime($data['start_time']);
            $endTime = new \DateTime($data['end_time']);
        } catch (\Exception $e) {
            return $this->json(['error' => 'Format d\'heure invalide'], Response::HTTP_BAD_REQUEST);
        }

        $availability = new Availability();
        $availability->setEmployee($employee);
        $availability->setDayOfWeek($data['day_of_week']);
        $availability->setStartTime($startTime);
        $availability->setEndTime($endTime);

        $this->em->persist($availability);
        $this->em->flush();

        return $this->json([
            'message' => 'Disponibilité ajoutée',
            'availability' => $availability
        ], Response::HTTP_CREATED, [], [
            'groups' => ['availability:read']
        ]);
    }

    /**
     * Supprimer une disponibilité
     */
    #[Route('/availabilities/{id}', name: 'api_employee_delete_availability', methods: ['DELETE'])]
    public function deleteAvailability(int $id): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $availability = $this->availabilityRepository->find($id);
        if (!$availability) {
            return $this->json(['error' => 'Disponibilité non trouvée'], Response::HTTP_NOT_FOUND);
        }

        $this->em->remove($availability);
        $this->em->flush();

        return $this->json(['message' => 'Disponibilité supprimée']);
    }

    /**
     * Obtenir les congés/absences d'un employé
     */
    #[Route('/{id}/blocked-slots', name: 'api_employee_blocked_slots', methods: ['GET'])]
    public function getBlockedSlots(int $id, Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $employee = $this->employeeRepository->find($id);
        if (!$employee) {
            return $this->json(['error' => 'Employé non trouvé'], Response::HTTP_NOT_FOUND);
        }

        $startDate = $request->query->get('start_date');
        $endDate = $request->query->get('end_date');

        $qb = $this->blockedSlotRepository->createQueryBuilder('bs')
            ->where('bs.employee = :employee')
            ->setParameter('employee', $employee)
            ->orderBy('bs.startDateTime', 'ASC');

        if ($startDate && $endDate) {
            try {
                $start = new \DateTime($startDate);
                $end = new \DateTime($endDate);
                
                $qb->andWhere('bs.startDateTime <= :end')
                   ->andWhere('bs.endDateTime >= :start')
                   ->setParameter('start', $start)
                   ->setParameter('end', $end);
            } catch (\Exception $e) {
                return $this->json(['error' => 'Format de date invalide'], Response::HTTP_BAD_REQUEST);
            }
        }

        $blockedSlots = $qb->getQuery()->getResult();

        return $this->json($blockedSlots, Response::HTTP_OK, [], [
            'groups' => ['blocked_slot:read']
        ]);
    }

    /**
     * Ajouter un congé/absence
     */
    #[Route('/{id}/blocked-slots', name: 'api_employee_add_blocked_slot', methods: ['POST'])]
    public function addBlockedSlot(int $id, Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $employee = $this->employeeRepository->find($id);
        if (!$employee) {
            return $this->json(['error' => 'Employé non trouvé'], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);

        if (!isset($data['start_datetime'], $data['end_datetime'], $data['reason'])) {
            return $this->json([
                'error' => 'Les champs start_datetime, end_datetime et reason sont requis'
            ], Response::HTTP_BAD_REQUEST);
        }

        try {
            $startDateTime = new \DateTime($data['start_datetime']);
            $endDateTime = new \DateTime($data['end_datetime']);
        } catch (\Exception $e) {
            return $this->json(['error' => 'Format de date/heure invalide'], Response::HTTP_BAD_REQUEST);
        }

        if ($startDateTime >= $endDateTime) {
            return $this->json([
                'error' => 'La date de fin doit être après la date de début'
            ], Response::HTTP_BAD_REQUEST);
        }

        $blockedSlot = new BlockedSlot();
        $blockedSlot->setEmployee($employee);
        $blockedSlot->setStartDateTime($startDateTime);
        $blockedSlot->setEndDateTime($endDateTime);
        $blockedSlot->setReason($data['reason']);

        $this->em->persist($blockedSlot);
        $this->em->flush();

        return $this->json([
            'message' => 'Congé/absence enregistré',
            'blockedSlot' => $blockedSlot
        ], Response::HTTP_CREATED, [], [
            'groups' => ['blocked_slot:read']
        ]);
    }

    /**
     * Supprimer un congé/absence
     */
    #[Route('/blocked-slots/{id}', name: 'api_employee_delete_blocked_slot', methods: ['DELETE'])]
    public function deleteBlockedSlot(int $id): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $blockedSlot = $this->blockedSlotRepository->find($id);
        if (!$blockedSlot) {
            return $this->json(['error' => 'Congé/absence non trouvé'], Response::HTTP_NOT_FOUND);
        }

        $this->em->remove($blockedSlot);
        $this->em->flush();

        return $this->json(['message' => 'Congé/absence supprimé']);
    }

    /**
     * Planning hebdomadaire d'un employé
     */
    #[Route('/{id}/weekly-schedule', name: 'api_employee_weekly_schedule', methods: ['GET'])]
    public function getWeeklySchedule(int $id, Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $employee = $this->employeeRepository->find($id);
        if (!$employee) {
            return $this->json(['error' => 'Employé non trouvé'], Response::HTTP_NOT_FOUND);
        }

        $weekStart = $request->query->get('week_start') ?? 'monday this week';
        
        try {
            $startDate = new \DateTime($weekStart);
            $endDate = clone $startDate;
            $endDate->modify('+6 days');
        } catch (\Exception $e) {
            return $this->json(['error' => 'Format de date invalide'], Response::HTTP_BAD_REQUEST);
        }

        // Disponibilités récurrentes
        $availabilities = $this->availabilityRepository->findBy(
            ['employee' => $employee],
            ['dayOfWeek' => 'ASC', 'startTime' => 'ASC']
        );

        // Congés/absences de la semaine
        $blockedSlots = $this->blockedSlotRepository->createQueryBuilder('bs')
            ->where('bs.employee = :employee')
            ->andWhere('bs.startDateTime <= :end')
            ->andWhere('bs.endDateTime >= :start')
            ->setParameter('employee', $employee)
            ->setParameter('start', $startDate)
            ->setParameter('end', $endDate)
            ->getQuery()
            ->getResult();

        return $this->json([
            'employee' => $employee,
            'weekStart' => $startDate->format('Y-m-d'),
            'weekEnd' => $endDate->format('Y-m-d'),
            'availabilities' => $availabilities,
            'blockedSlots' => $blockedSlots
        ], Response::HTTP_OK, [], [
            'groups' => ['employee:read', 'availability:read', 'blocked_slot:read']
        ]);
    }
}
