<?php

namespace App\Repository;

use App\Entity\Photo;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Photo>
 */
class PhotoRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Photo::class);
    }

    /**
     * Find public photos with filters
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
                'today' => (new \DateTime())->format('Y-m-d 00:00:00'),
                'week' => (new \DateTime())->modify('-1 week')->format('Y-m-d 00:00:00'),
                'month' => (new \DateTime())->modify('-1 month')->format('Y-m-d 00:00:00'),
                default => null
            };
            if ($startDate) {
                $qb->andWhere('p.createdAt > :startDate')->setParameter('startDate', $startDate);
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
                'today' => (new \DateTime())->format('Y-m-d 00:00:00'),
                'week' => (new \DateTime())->modify('-1 week')->format('Y-m-d 00:00:00'),
                'month' => (new \DateTime())->modify('-1 month')->format('Y-m-d 00:00:00'),
                default => null
            };
            if ($startDate) {
                $qb->andWhere('p.createdAt > :startDate')->setParameter('startDate', $startDate);
            }
        }

        return (int) $qb->getQuery()->getSingleScalarResult();
    }

    /**
     * Featured photos for hero
     */
    public function findFeaturedPhotos(int $limit = 10): array
    {
        return $this->createQueryBuilder('p')
            ->where('p.isFeatured = true')
            ->orderBy('p.sortOrder', 'ASC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    /**
     * Admin: photos by album or all
     */
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
        $qb = $this->createQueryBuilder('p')
            ->select('COUNT(p.id)');

        if ($albumId) {
            $qb->where('p.album = :albumId')->setParameter('albumId', $albumId);
        }

        return (int) $qb->getQuery()->getSingleScalarResult();
    }
}

