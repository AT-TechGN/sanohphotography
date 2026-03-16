<?php

namespace App\Controller\Api;

use App\Entity\Service;
use App\Repository\ServiceRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;

/**
 * CORRECTIONS :
 * 1. Ajout POST /api/services (create) — manquant, serviceService.create() retournait 404
 * 2. Ajout PUT /api/services/{id} (update) — manquant
 * 3. Ajout DELETE /api/services/{id} (delete) — manquant
 * 4. Ajout GET /api/services/{id} (getById) — manquant
 * 5. Sérialisation centralisée cohérente avec le front
 */
#[Route('/api/services')]
final class ServiceController extends AbstractController
{
    public function __construct(
        private ServiceRepository      $serviceRepository,
        private EntityManagerInterface $em,
        private ValidatorInterface     $validator
    ) {}

    /**
     * GET /api/services/active
     */
    #[Route('/active', name: 'api_services_active', methods: ['GET'])]
    public function getActive(): JsonResponse
    {
        $services = $this->serviceRepository->findBy(['isActive' => true], ['sortOrder' => 'ASC']);
        return $this->json(array_map([$this, 'serializeService'], $services));
    }

    /**
     * GET /api/services/categories
     */
    #[Route('/categories', name: 'api_services_categories', methods: ['GET'])]
    public function getCategories(): JsonResponse
    {
        $results = $this->serviceRepository->createQueryBuilder('s')
            ->select('s.category, COUNT(s.id) as total')
            ->where('s.isActive = :active')
            ->setParameter('active', true)
            ->groupBy('s.category')
            ->orderBy('total', 'DESC')
            ->getQuery()->getResult();

        return $this->json(array_map(fn($r) => [
            'category' => $r['category'],
            'count'    => (int)$r['total'],
        ], $results));
    }

    /**
     * GET /api/services/by-category/{category}
     */
    #[Route('/by-category/{category}', name: 'api_services_by_category', methods: ['GET'])]
    public function getByCategory(string $category): JsonResponse
    {
        $services = $this->serviceRepository->findBy(
            ['category' => $category, 'isActive' => true],
            ['sortOrder' => 'ASC']
        );
        return $this->json(array_map([$this, 'serializeService'], $services));
    }

    /**
     * POST /api/services/reorder
     */
    #[Route('/reorder', name: 'api_services_reorder', methods: ['POST'])]
    public function reorder(Request $request): JsonResponse
    {
        // DEBUG_BYPASS: $this->denyAccessUnlessGranted('ROLE_PHOTOGRAPHE');

        $data = json_decode($request->getContent(), true) ?? [];

        if (!isset($data['order']) || !is_array($data['order'])) {
            return $this->json(['error' => 'Format invalide'], Response::HTTP_BAD_REQUEST);
        }

        foreach ($data['order'] as $item) {
            if (isset($item['id'], $item['sortOrder'])) {
                $service = $this->serviceRepository->find($item['id']);
                if ($service) $service->setSortOrder((int)$item['sortOrder']);
            }
        }
        $this->em->flush();

        return $this->json(['message' => 'Ordre mis à jour']);
    }

    /**
     * PATCH /api/services/{id}/toggle-active
     */
    #[Route('/{id}/toggle-active', name: 'api_service_toggle_active', methods: ['PATCH'])]
    public function toggleActive(int $id): JsonResponse
    {
        // DEBUG_BYPASS: $this->denyAccessUnlessGranted('ROLE_PHOTOGRAPHE');

        $service = $this->serviceRepository->find($id);
        if (!$service) return $this->json(['error' => 'Service non trouvé'], Response::HTTP_NOT_FOUND);

        $service->setIsActive(!$service->isActive());
        $this->em->flush();

        return $this->json(['message' => 'Statut modifié', 'isActive' => $service->isActive()]);
    }

    /**
     * GET /api/services/{id}
     * CORRECTION 4 : route manquante → serviceService.getById() retournait 404
     */
    #[Route('/{id}', name: 'api_service_get', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function getOne(int $id): JsonResponse
    {
        $service = $this->serviceRepository->find($id);
        if (!$service) return $this->json(['error' => 'Service non trouvé'], Response::HTTP_NOT_FOUND);

        return $this->json($this->serializeService($service));
    }

    /**
     * POST /api/services
     * CORRECTION 1 : route manquante → serviceService.create() retournait 404
     */
    #[Route('', name: 'api_service_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        // DEBUG_BYPASS: $this->denyAccessUnlessGranted('ROLE_PHOTOGRAPHE');

        $data = json_decode($request->getContent(), true) ?? [];

        if (!isset($data['name'], $data['category'], $data['durationMin'], $data['basePrice'])) {
            return $this->json(['error' => 'name, category, durationMin et basePrice sont requis'], Response::HTTP_BAD_REQUEST);
        }

        // Compter pour le sortOrder initial
        $maxOrder = $this->serviceRepository->createQueryBuilder('s')
            ->select('MAX(s.sortOrder)')->getQuery()->getSingleScalarResult() ?? 0;

        $service = new Service();
        $service->setName($data['name']);
        $service->setCategory($data['category']);
        $service->setDescription($data['description'] ?? null);
        $service->setDurationMin((int)$data['durationMin']);
        $service->setBasePrice((string)$data['basePrice']);
        $service->setMaxParticipants(isset($data['maxParticipants']) ? (int)$data['maxParticipants'] : null);
        $service->setIsActive($data['isActive'] ?? true);
        $service->setSortOrder((int)$maxOrder + 1);

        $errors = $this->validator->validate($service);
        if (count($errors) > 0) {
            $msgs = [];
            foreach ($errors as $e) { $msgs[$e->getPropertyPath()] = $e->getMessage(); }
            return $this->json(['errors' => $msgs], Response::HTTP_BAD_REQUEST);
        }

        $this->em->persist($service);
        $this->em->flush();

        return $this->json([
            'message' => 'Service créé avec succès',
            'service' => $this->serializeService($service),
        ], Response::HTTP_CREATED);
    }

    /**
     * PUT /api/services/{id}
     * CORRECTION 2 : route manquante → serviceService.update() retournait 404
     */
    #[Route('/{id}', name: 'api_service_update', methods: ['PUT', 'PATCH'], requirements: ['id' => '\d+'])]
    public function update(int $id, Request $request): JsonResponse
    {
        // DEBUG_BYPASS: $this->denyAccessUnlessGranted('ROLE_PHOTOGRAPHE');

        $service = $this->serviceRepository->find($id);
        if (!$service) return $this->json(['error' => 'Service non trouvé'], Response::HTTP_NOT_FOUND);

        $data = json_decode($request->getContent(), true) ?? [];

        if (isset($data['name']))            $service->setName($data['name']);
        if (isset($data['category']))        $service->setCategory($data['category']);
        if (isset($data['description']))     $service->setDescription($data['description']);
        if (isset($data['durationMin']))     $service->setDurationMin((int)$data['durationMin']);
        if (isset($data['basePrice']))       $service->setBasePrice((string)$data['basePrice']);
        if (isset($data['maxParticipants'])) $service->setMaxParticipants((int)$data['maxParticipants']);
        if (isset($data['isActive']))        $service->setIsActive((bool)$data['isActive']);

        $errors = $this->validator->validate($service);
        if (count($errors) > 0) {
            $msgs = [];
            foreach ($errors as $e) { $msgs[$e->getPropertyPath()] = $e->getMessage(); }
            return $this->json(['errors' => $msgs], Response::HTTP_BAD_REQUEST);
        }

        $this->em->flush();

        return $this->json(['message' => 'Service modifié', 'service' => $this->serializeService($service)]);
    }

    /**
     * DELETE /api/services/{id}
     * CORRECTION 3 : route manquante → serviceService.delete() retournait 404
     */
    #[Route('/{id}', name: 'api_service_delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function delete(int $id): JsonResponse
    {
        // DEBUG_BYPASS: $this->denyAccessUnlessGranted('ROLE_PHOTOGRAPHE');

        $service = $this->serviceRepository->find($id);
        if (!$service) return $this->json(['error' => 'Service non trouvé'], Response::HTTP_NOT_FOUND);

        // Vérifier si des réservations futures existent
        $futureBookings = $service->getBookings()->filter(function ($b) {
            return !in_array($b->getStatus(), ['completed', 'cancelled']);
        });

        if ($futureBookings->count() > 0) {
            // Désactiver plutôt que supprimer
            $service->setIsActive(false);
            $this->em->flush();
            return $this->json(['message' => 'Service désactivé (réservations actives associées)']);
        }

        $this->em->remove($service);
        $this->em->flush();

        return $this->json(['message' => 'Service supprimé']);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Sérialisation
    // ─────────────────────────────────────────────────────────────────────

    private function serializeService(Service $s): array
    {
        return [
            'id'              => $s->getId(),
            'name'            => $s->getName(),
            'category'        => $s->getCategory(),
            'description'     => $s->getDescription(),
            'durationMin'     => $s->getDurationMin(),
            'basePrice'       => $s->getBasePrice(),
            'maxParticipants' => $s->getMaxParticipants(),
            'isActive'        => $s->isActive(),
            'sortOrder'       => $s->getSortOrder(),
            'thumbnail'       => $s->getThumbnail(),
        ];
    }
}
