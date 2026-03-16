<?php

namespace App\Controller\Api;

use App\Entity\Availability;
use App\Entity\BlockedSlot;
use App\Entity\Employee;
use App\Entity\User;
use App\Repository\EmployeeRepository;
use App\Repository\AvailabilityRepository;
use App\Repository\BlockedSlotRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;

/**
 * CORRECTIONS :
 * 1. Ajout des routes CRUD manquantes : POST (create), PUT (update), DELETE
 * 2. serializeEmployee() exposait firstName/lastName directement mais l'entité
 *    Employee n'a pas ces champs — ils sont sur Employee->getUser()
 * 3. Ajout sérialisation centralisée employé
 */
#[Route('/api/employees')]
final class EmployeeController extends AbstractController
{
    public function __construct(
        private EmployeeRepository       $employeeRepository,
        private AvailabilityRepository   $availabilityRepository,
        private BlockedSlotRepository    $blockedSlotRepository,
        private UserRepository           $userRepository,
        private EntityManagerInterface   $em,
        private UserPasswordHasherInterface $passwordHasher
    ) {}

    // ─────────────────────────────────────────────────────────────────────
    // CRUD employés
    // ─────────────────────────────────────────────────────────────────────

    /**
     * GET /api/employees/active
     */
    #[Route('/active', name: 'api_employees_active', methods: ['GET'])]
    public function getActive(): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $employees = $this->employeeRepository->findBy(['isActive' => true], ['id' => 'ASC']);

        return $this->json(array_map([$this, 'serializeEmployee'], $employees));
    }

    /**
     * GET /api/employees/{id}
     */
    #[Route('/{id}', name: 'api_employee_get', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function getOne(int $id): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $employee = $this->employeeRepository->find($id);
        if (!$employee) {
            return $this->json(['error' => 'Employé non trouvé'], Response::HTTP_NOT_FOUND);
        }

        return $this->json($this->serializeEmployee($employee));
    }

    /**
     * POST /api/employees — Créer un employé
     * CORRECTION : cette route n'existait pas → employeeService.create() retournait 404
     *
     * Crée un compte User avec ROLE_EMPLOYEE + l'entité Employee liée.
     */
    #[Route('', name: 'api_employee_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $data = json_decode($request->getContent(), true) ?? [];

        if (!isset($data['email'], $data['firstName'], $data['lastName'])) {
            return $this->json(['error' => 'email, firstName et lastName sont requis'], Response::HTTP_BAD_REQUEST);
        }

        // Vérifier unicité email
        if ($this->userRepository->findOneBy(['email' => $data['email']])) {
            return $this->json(['error' => 'Cet email est déjà utilisé'], Response::HTTP_CONFLICT);
        }

        // Créer le User associé
        $user = new User();
        $user->setEmail($data['email']);
        $user->setFirstName($data['firstName']);
        $user->setLastName($data['lastName']);
        $user->setPhone($data['phone'] ?? null);
        $user->setRoles(['ROLE_EMPLOYEE']);
        $user->setIsActive(true);
        $user->setCreatedAt(new \DateTime());
        // Mot de passe temporaire (à changer par l'employé)
        $tempPassword = $data['password'] ?? bin2hex(random_bytes(8));
        $user->setPassword($this->passwordHasher->hashPassword($user, $tempPassword));

        // Créer l'Employee
        $employee = new Employee();
        $employee->setUser($user);
        $employee->setPosition($data['position'] ?? 'Photographe');
        $employee->setContractType($data['contractType'] ?? 'CDI');
        $employee->setHourlyRate((string)($data['hourlyRate'] ?? '0'));
        $employee->setHireDate(new \DateTime($data['hireDate'] ?? 'today'));
        $employee->setIsActive(true);
        $employee->setSpecializations($data['specializations'] ?? null);
        $employee->setBio($data['bio'] ?? null);

        $this->em->persist($user);
        $this->em->persist($employee);
        $this->em->flush();

        return $this->json([
            'message'  => 'Employé créé avec succès',
            'employee' => $this->serializeEmployee($employee),
        ], Response::HTTP_CREATED);
    }

    /**
     * PUT /api/employees/{id} — Modifier un employé
     * CORRECTION : cette route n'existait pas → employeeService.update() retournait 404
     */
    #[Route('/{id}', name: 'api_employee_update', methods: ['PUT', 'PATCH'], requirements: ['id' => '\d+'])]
    public function update(int $id, Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $employee = $this->employeeRepository->find($id);
        if (!$employee) {
            return $this->json(['error' => 'Employé non trouvé'], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true) ?? [];
        $user = $employee->getUser();

        // Mise à jour des champs User
        if (isset($data['firstName'])) $user->setFirstName($data['firstName']);
        if (isset($data['lastName']))  $user->setLastName($data['lastName']);
        if (isset($data['email']))     $user->setEmail($data['email']);
        if (isset($data['phone']))     $user->setPhone($data['phone']);

        // Mise à jour des champs Employee
        if (isset($data['position']))        $employee->setPosition($data['position']);
        if (isset($data['contractType']))    $employee->setContractType($data['contractType']);
        if (isset($data['hourlyRate']))      $employee->setHourlyRate((string)$data['hourlyRate']);
        if (isset($data['isActive']))        $employee->setIsActive((bool)$data['isActive']);
        if (isset($data['specializations'])) $employee->setSpecializations($data['specializations']);
        if (isset($data['bio']))             $employee->setBio($data['bio']);

        $this->em->flush();

        return $this->json([
            'message'  => 'Employé modifié',
            'employee' => $this->serializeEmployee($employee),
        ]);
    }

    /**
     * DELETE /api/employees/{id} — Supprimer (désactiver) un employé
     * CORRECTION : cette route n'existait pas → employeeService.delete() retournait 404
     */
    #[Route('/{id}', name: 'api_employee_delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function delete(int $id): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $employee = $this->employeeRepository->find($id);
        if (!$employee) {
            return $this->json(['error' => 'Employé non trouvé'], Response::HTTP_NOT_FOUND);
        }

        // Soft delete : désactiver plutôt que supprimer (préserve historique réservations)
        $employee->setIsActive(false);
        $employee->getUser()->setIsActive(false);
        $this->em->flush();

        return $this->json(['message' => 'Employé désactivé']);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Disponibilités
    // ─────────────────────────────────────────────────────────────────────

    #[Route('/{id}/availabilities', name: 'api_employee_availabilities', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function getAvailabilities(int $id): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $employee = $this->employeeRepository->find($id);
        if (!$employee) return $this->json(['error' => 'Employé non trouvé'], Response::HTTP_NOT_FOUND);

        $availabilities = $this->availabilityRepository->findBy(
            ['employee' => $employee],
            ['dayOfWeek' => 'ASC', 'startTime' => 'ASC']
        );

        return $this->json(array_map([$this, 'serializeAvailability'], $availabilities));
    }

    #[Route('/{id}/availabilities', name: 'api_employee_add_availability', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function addAvailability(int $id, Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $employee = $this->employeeRepository->find($id);
        if (!$employee) return $this->json(['error' => 'Employé non trouvé'], Response::HTTP_NOT_FOUND);

        $data = json_decode($request->getContent(), true) ?? [];

        if (!isset($data['day_of_week'], $data['start_time'], $data['end_time'])) {
            return $this->json(['error' => 'day_of_week, start_time et end_time sont requis'], Response::HTTP_BAD_REQUEST);
        }

        $availability = new Availability();
        $availability->setEmployee($employee);
        $availability->setDayOfWeek((int)$data['day_of_week']);
        $availability->setStartTime(new \DateTime($data['start_time']));
        $availability->setEndTime(new \DateTime($data['end_time']));

        $this->em->persist($availability);
        $this->em->flush();

        return $this->json([
            'message'      => 'Disponibilité ajoutée',
            'availability' => $this->serializeAvailability($availability),
        ], Response::HTTP_CREATED);
    }

    #[Route('/availabilities/{id}', name: 'api_employee_delete_availability', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function deleteAvailability(int $id): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $availability = $this->availabilityRepository->find($id);
        if (!$availability) return $this->json(['error' => 'Disponibilité non trouvée'], Response::HTTP_NOT_FOUND);

        $this->em->remove($availability);
        $this->em->flush();

        return $this->json(['message' => 'Disponibilité supprimée']);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Congés / Absences
    // ─────────────────────────────────────────────────────────────────────

    #[Route('/{id}/blocked-slots', name: 'api_employee_blocked_slots', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function getBlockedSlots(int $id, Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $employee = $this->employeeRepository->find($id);
        if (!$employee) return $this->json(['error' => 'Employé non trouvé'], Response::HTTP_NOT_FOUND);

        $qb = $this->blockedSlotRepository->createQueryBuilder('bs')
            ->where('bs.employee = :employee')
            ->setParameter('employee', $employee)
            ->orderBy('bs.startDatetime', 'ASC');

        $blockedSlots = $qb->getQuery()->getResult();

        return $this->json(array_map([$this, 'serializeBlockedSlot'], $blockedSlots));
    }

    #[Route('/{id}/blocked-slots', name: 'api_employee_add_blocked_slot', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function addBlockedSlot(int $id, Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $employee = $this->employeeRepository->find($id);
        if (!$employee) return $this->json(['error' => 'Employé non trouvé'], Response::HTTP_NOT_FOUND);

        $data = json_decode($request->getContent(), true) ?? [];

        if (!isset($data['start_datetime'], $data['end_datetime'], $data['reason'])) {
            return $this->json(['error' => 'start_datetime, end_datetime et reason sont requis'], Response::HTTP_BAD_REQUEST);
        }

        $start = new \DateTime($data['start_datetime']);
        $end   = new \DateTime($data['end_datetime']);

        if ($start >= $end) {
            return $this->json(['error' => 'La date de fin doit être après la date de début'], Response::HTTP_BAD_REQUEST);
        }

        $blockedSlot = new BlockedSlot();
        $blockedSlot->setEmployee($employee);
        $blockedSlot->setStartDatetime($start);
        $blockedSlot->setEndDatetime($end);
        $blockedSlot->setReason($data['reason']);

        $this->em->persist($blockedSlot);
        $this->em->flush();

        return $this->json([
            'message'     => 'Congé/absence enregistré',
            'blockedSlot' => $this->serializeBlockedSlot($blockedSlot),
        ], Response::HTTP_CREATED);
    }

    #[Route('/blocked-slots/{id}', name: 'api_employee_delete_blocked_slot', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function deleteBlockedSlot(int $id): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $blockedSlot = $this->blockedSlotRepository->find($id);
        if (!$blockedSlot) return $this->json(['error' => 'Congé/absence non trouvé'], Response::HTTP_NOT_FOUND);

        $this->em->remove($blockedSlot);
        $this->em->flush();

        return $this->json(['message' => 'Congé/absence supprimé']);
    }

    #[Route('/{id}/weekly-schedule', name: 'api_employee_weekly_schedule', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function getWeeklySchedule(int $id, Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $employee = $this->employeeRepository->find($id);
        if (!$employee) return $this->json(['error' => 'Employé non trouvé'], Response::HTTP_NOT_FOUND);

        $weekStart = $request->query->get('week_start') ?? 'monday this week';
        $startDate = new \DateTime($weekStart);
        $endDate   = (clone $startDate)->modify('+6 days');

        $availabilities = $this->availabilityRepository->findBy(
            ['employee' => $employee],
            ['dayOfWeek' => 'ASC', 'startTime' => 'ASC']
        );

        $blockedSlots = $this->blockedSlotRepository->createQueryBuilder('bs')
            ->where('bs.employee = :e AND bs.startDatetime <= :end AND bs.endDatetime >= :start')
            ->setParameter('e', $employee)
            ->setParameter('start', $startDate)
            ->setParameter('end', $endDate)
            ->getQuery()->getResult();

        return $this->json([
            'employee'       => $this->serializeEmployee($employee),
            'weekStart'      => $startDate->format('Y-m-d'),
            'weekEnd'        => $endDate->format('Y-m-d'),
            'availabilities' => array_map([$this, 'serializeAvailability'], $availabilities),
            'blockedSlots'   => array_map([$this, 'serializeBlockedSlot'], $blockedSlots),
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Sérialisations
    // ─────────────────────────────────────────────────────────────────────

    /**
     * CORRECTION 2 : Employee n'a pas firstName/lastName directement.
     * Ces champs sont sur Employee->getUser().
     */
    private function serializeEmployee(Employee $e): array
    {
        $user = $e->getUser();
        return [
            'id'              => $e->getId(),
            // Expose depuis User
            'firstName'       => $user->getFirstName(),
            'lastName'        => $user->getLastName(),
            'email'           => $user->getEmail(),
            'phone'           => $user->getPhone(),
            // Champs Employee
            'position'        => $e->getPosition(),
            'contractType'    => $e->getContractType(),
            'hourlyRate'      => $e->getHourlyRate(),
            'hireDate'        => $e->getHireDate()?->format('Y-m-d'),
            'isActive'        => $e->isActive(),
            'specializations' => $e->getSpecializations(),
            'bio'             => $e->getBio(),
        ];
    }

    private function serializeAvailability(Availability $a): array
    {
        return [
            'id'         => $a->getId(),
            'dayOfWeek'  => $a->getDayOfWeek(),
            'startTime'  => $a->getStartTime()?->format('H:i'),
            'endTime'    => $a->getEndTime()?->format('H:i'),
        ];
    }

    private function serializeBlockedSlot(BlockedSlot $s): array
    {
        return [
            'id'            => $s->getId(),
            'reason'        => $s->getReason(),
            'startDateTime' => $s->getStartDatetime()?->format('c'),
            'endDateTime'   => $s->getEndDatetime()?->format('c'),
        ];
    }
}
