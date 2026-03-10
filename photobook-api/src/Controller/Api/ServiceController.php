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

#[Route('/api/services')]
final class ServiceController extends AbstractController
{
    public function __construct(
        private ServiceRepository $serviceRepository,
        private EntityManagerInterface $em
    ) {}

    /**
     * Obtenir les services par catégorie
     */
    #[Route('/by-category/{category}', name: 'api_services_by_category', methods: ['GET'])]
    public function getByCategory(string $category): JsonResponse
    {
        $services = $this->serviceRepository->findBy(
            ['category' => $category, 'isActive' => true],
            ['sortOrder' => 'ASC']
        );

        return $this->json($services, Response::HTTP_OK, [], [
            'groups' => ['service:read']
        ]);
    }

    /**
     * Obtenir les services actifs uniquement
     */
    #[Route('/active', name: 'api_services_active', methods: ['GET'])]
    public function getActive(): JsonResponse
    {
        $services = $this->serviceRepository->findBy(
            ['isActive' => true],
            ['sortOrder' => 'ASC']
        );

        return $this->json($services, Response::HTTP_OK, [], [
            'groups' => ['service:read']
        ]);
    }

    /**
     * Obtenir les catégories de services avec comptage
     */
    #[Route('/categories', name: 'api_services_categories', methods: ['GET'])]
    public function getCategories(): JsonResponse
    {
        $qb = $this->serviceRepository->createQueryBuilder('s')
            ->select('s.category, COUNT(s.id) as total')
            ->where('s.isActive = :active')
            ->setParameter('active', true)
            ->groupBy('s.category')
            ->orderBy('total', 'DESC');

        $results = $qb->getQuery()->getResult();

        $categories = [];
        foreach ($results as $result) {
            $categories[] = [
                'category' => $result['category'],
                'count' => (int) $result['total']
            ];
        }

        return $this->json($categories);
    }

    /**
     * Réorganiser l'ordre des services
     */
    #[Route('/reorder', name: 'api_services_reorder', methods: ['POST'])]
    public function reorder(Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_PHOTOGRAPHE');

        $data = json_decode($request->getContent(), true);

        if (!isset($data['order']) || !is_array($data['order'])) {
            return $this->json(['error' => 'Format invalide'], Response::HTTP_BAD_REQUEST);
        }

        foreach ($data['order'] as $item) {
            if (isset($item['id']) && isset($item['sortOrder'])) {
                $service = $this->serviceRepository->find($item['id']);
                if ($service) {
                    $service->setSortOrder($item['sortOrder']);
                }
            }
        }

        $this->em->flush();

        return $this->json(['message' => 'Ordre mis à jour avec succès']);
    }

    /**
     * Activer/Désactiver un service
     */
    #[Route('/{id}/toggle-active', name: 'api_service_toggle_active', methods: ['PATCH'])]
    public function toggleActive(int $id): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_PHOTOGRAPHE');

        $service = $this->serviceRepository->find($id);
        
        if (!$service) {
            return $this->json(['error' => 'Service non trouvé'], Response::HTTP_NOT_FOUND);
        }

        $service->setIsActive(!$service->isActive());
        $this->em->flush();

        return $this->json([
            'message' => 'Statut modifié avec succès',
            'isActive' => $service->isActive()
        ]);
    }
}
