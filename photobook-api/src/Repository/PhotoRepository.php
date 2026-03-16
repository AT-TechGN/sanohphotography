<?php

namespace App\Repository;

use App\Entity\Photo;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Photo>
 *
 * CORRECTION : Photo entity a takenAt, PAS createdAt.
 * Les requêtes utilisant p.createdAt causaient un 500.
 */
class PhotoRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Photo::class);
    }

    /**
     * Find public photos with filters
     * CORRECTION : p.createdAt → p.takenAt (champ réel de l'entité)
     */
    public function findPublicPhotos(string $period = 'all', ?string $category = null, int $page = 1, int $limit = 20): array
    {
        $qb = $this->createQueryBuilder('p')
            ->join('p.album', 'a')
            ->where('a.isPublic = true')
            ->orderBy('p.isFeatured', 'DESC')
            ->addOrderBy('p.sortOrder', 'ASC')
            ->addOrderBy('p.id', 'DESC')
            ->setFirstResult(($page - 1) * $limit)
            ->setMaxResults($limit);

        if ($category) {
            $qb->andWhere('a.category = :category')->setParameter('category', $category);
        }

        if ($period !== 'all') {
            $startDate = match($period) {
                'today' => (new \DateTime())->setTime(0, 0, 0),
                'week'  => (new \DateTime())->modify('-1 week'),
                'month' => (new \DateTime())->modify('-1 month'),
                default => null,
            };
            if ($startDate) {
                // CORRECTION : utilise p.takenAt (Photo n'a pas createdAt)
                $qb->andWhere('p.takenAt > :startDate')->setParameter('startDate', $startDate);
            }
        }

        return $qb->getQuery()->getResult();
    }

    public function countPublicPhotos(string $period = 'all', ?string $category = null): int
    {
        $qb = $this->createQueryBuilder('p')
            ->select('COUNT(p.id)')
            ->join('p.album', 'a')
            ->where('a.isPublic = true');

        if ($category) {
            $qb->andWhere('a.category = :category')->setParameter('category', $category);
        }

        if ($period !== 'all') {
            $startDate = match($period) {
                'today' => (new \DateTime())->setTime(0, 0, 0),
                'week'  => (new \DateTime())->modify('-1 week'),
                'month' => (new \DateTime())->modify('-1 month'),
                default => null,
            };
            if ($startDate) {
                $qb->andWhere('p.takenAt > :startDate')->setParameter('startDate', $startDate);
            }
        }

        return (int) $qb->getQuery()->getSingleScalarResult();
    }

    public function findFeaturedPhotos(int $limit = 10): array
    {
        // Priorité aux photos marquées isFeatured, sinon toutes photos d'albums publics
        $featured = $this->createQueryBuilder('p')
            ->join('p.album', 'a')
            ->where('p.isFeatured = true')
            ->andWhere('a.isPublic = true')
            ->orderBy('p.sortOrder', 'ASC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();

        if (count($featured) >= $limit) {
            return $featured;
        }

        // Fallback : photos d'albums publics si pas assez de featured
        return $this->createQueryBuilder('p')
            ->join('p.album', 'a')
            ->where('a.isPublic = true')
            ->orderBy('p.isFeatured', 'DESC')
            ->addOrderBy('p.id', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    public function findByAlbumOrAll(?int $albumId, int $page = 1, int $limit = 20): array
    {
        $qb = $this->createQueryBuilder('p')
            ->orderBy('p.sortOrder', 'ASC')
            ->addOrderBy('p.id', 'DESC')
            ->setFirstResult(($page - 1) * $limit)
            ->setMaxResults($limit);

        if ($albumId) {
            $qb->andWhere('p.album = :albumId')->setParameter('albumId', $albumId);
        }

        return $qb->getQuery()->getResult();
    }

    public function countByAlbumOrAll(?int $albumId): int
    {
        $qb = $this->createQueryBuilder('p')->select('COUNT(p.id)');
        if ($albumId) {
            $qb->where('p.album = :albumId')->setParameter('albumId', $albumId);
        }
        return (int) $qb->getQuery()->getSingleScalarResult();
    }
}
