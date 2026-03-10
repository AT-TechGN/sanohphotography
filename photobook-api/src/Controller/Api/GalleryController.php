<?php

namespace App\Controller\Api;

use App\Entity\Photo;
use App\Enum\PhotoPeriod;
use App\Repository\PhotoRepository;
use App\Repository\AlbumRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/gallery')]
final class GalleryController extends AbstractController
{
    public function __construct(
        private PhotoRepository $photoRepository,
        private AlbumRepository $albumRepository
    ) {}

    /**
     * Obtenir les photos de la galerie avec filtres (cahier des charges)
     * Filtres : période (today/week/month/all), catégorie, pagination
     */
    #[Route('', name: 'api_gallery_photos', methods: ['GET'])]
    public function getPhotos(Request $request): JsonResponse
    {
        // Paramètres de filtrage
        $period = $request->query->get('period', 'all');
        $category = $request->query->get('category');
        $page = max(1, (int) $request->query->get('page', 1));
        $limit = min(50, max(1, (int) $request->query->get('limit', 24)));
        
        $qb = $this->photoRepository->createQueryBuilder('p')
            ->innerJoin('p.album', 'a')
            ->where('a.isPublic = :public')
            ->setParameter('public', true)
            ->orderBy('p.takenAt', 'DESC')
            ->addOrderBy('p.sortOrder', 'ASC');

        // Filtre par période
        if ($period !== 'all' && in_array($period, ['today', 'week', 'month'])) {
            $periodEnum = PhotoPeriod::from($period);
            $startDate = $periodEnum->getStartDate();
            
            if ($startDate) {
                $qb->andWhere('p.takenAt >= :startDate')
                   ->setParameter('startDate', $startDate);
            }
        }

        // Filtre par catégorie de service (via album et booking)
        if ($category) {
            $qb->innerJoin('a.booking', 'b')
               ->innerJoin('b.service', 's')
               ->andWhere('s.category = :category')
               ->setParameter('category', $category);
        }

        // Pagination
        $total = count($qb->getQuery()->getResult());
        $qb->setFirstResult(($page - 1) * $limit)
           ->setMaxResults($limit);

        $photos = $qb->getQuery()->getResult();

        return $this->json([
            'data' => $photos,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'totalPages' => ceil($total / $limit)
            ]
        ], Response::HTTP_OK, [], [
            'groups' => ['photo:read']
        ]);
    }

    /**
     * Obtenir les photos en vedette pour la page d'accueil
     */
    #[Route('/featured', name: 'api_gallery_featured', methods: ['GET'])]
    public function getFeaturedPhotos(Request $request): JsonResponse
    {
        $limit = min(20, max(1, (int) $request->query->get('limit', 10)));

        $photos = $this->photoRepository->createQueryBuilder('p')
            ->innerJoin('p.album', 'a')
            ->where('p.isFeatured = :featured')
            ->andWhere('a.isPublic = :public')
            ->setParameter('featured', true)
            ->setParameter('public', true)
            ->orderBy('p.takenAt', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();

        return $this->json($photos, Response::HTTP_OK, [], [
            'groups' => ['photo:read']
        ]);
    }

    /**
     * Obtenir les albums publics avec leurs photos
     */
    #[Route('/albums', name: 'api_gallery_albums', methods: ['GET'])]
    public function getPublicAlbums(Request $request): JsonResponse
    {
        $page = max(1, (int) $request->query->get('page', 1));
        $limit = min(20, max(1, (int) $request->query->get('limit', 12)));

        $qb = $this->albumRepository->createQueryBuilder('a')
            ->where('a.isPublic = :public')
            ->setParameter('public', true)
            ->orderBy('a.createdAt', 'DESC');

        $total = count($qb->getQuery()->getResult());
        
        $qb->setFirstResult(($page - 1) * $limit)
           ->setMaxResults($limit);

        $albums = $qb->getQuery()->getResult();

        return $this->json([
            'data' => $albums,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'totalPages' => ceil($total / $limit)
            ]
        ], Response::HTTP_OK, [], [
            'groups' => ['album:read']
        ]);
    }

    /**
     * Statistiques de la galerie
     */
    #[Route('/stats', name: 'api_gallery_stats', methods: ['GET'])]
    public function getStats(): JsonResponse
    {
        $totalPhotos = $this->photoRepository->createQueryBuilder('p')
            ->select('COUNT(p.id)')
            ->innerJoin('p.album', 'a')
            ->where('a.isPublic = :public')
            ->setParameter('public', true)
            ->getQuery()
            ->getSingleScalarResult();

        $totalAlbums = $this->albumRepository->createQueryBuilder('a')
            ->select('COUNT(a.id)')
            ->where('a.isPublic = :public')
            ->setParameter('public', true)
            ->getQuery()
            ->getSingleScalarResult();

        $photosByPeriod = [];
        foreach (['today', 'week', 'month'] as $period) {
            $periodEnum = PhotoPeriod::from($period);
            $startDate = $periodEnum->getStartDate();
            
            $count = $this->photoRepository->createQueryBuilder('p')
                ->select('COUNT(p.id)')
                ->innerJoin('p.album', 'a')
                ->where('a.isPublic = :public')
                ->andWhere('p.takenAt >= :startDate')
                ->setParameter('public', true)
                ->setParameter('startDate', $startDate)
                ->getQuery()
                ->getSingleScalarResult();

            $photosByPeriod[$period] = (int) $count;
        }

        return $this->json([
            'totalPhotos' => (int) $totalPhotos,
            'totalAlbums' => (int) $totalAlbums,
            'photosByPeriod' => $photosByPeriod
        ]);
    }
}
