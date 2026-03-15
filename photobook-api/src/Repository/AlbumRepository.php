<?php

namespace App\Repository;

use App\Entity\Album;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Album>
 */
class AlbumRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Album::class);
    }

    /**
     * Find public albums for gallery
     */
    public function findPublicAlbums(int $page = 1, int $limit = 12): array
    {
        return $this->createQueryBuilder('a')
            ->where('a.isPublic = true')
            ->orderBy('a.publishedAt', 'DESC')
            ->setFirstResult(($page - 1) * $limit)
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    public function countPublicAlbums(): int
    {
        $qb = $this->createQueryBuilder('a')
            ->select('COUNT(a.id)')
            ->where('a.isPublic = true');

        return (int) $qb->getQuery()->getSingleScalarResult();
    }

    /**
     * CORRECTION : méthode manquante utilisée par AdminAlbumController
     */
    public function findByCriteria(?string $category, ?bool $isPublic, int $page = 1, int $limit = 20): array
    {
        $qb = $this->createQueryBuilder('a')
            ->orderBy('a.createdAt', 'DESC')
            ->setFirstResult(($page - 1) * $limit)
            ->setMaxResults($limit);

        if ($category) {
            $qb->andWhere('a.category = :category')->setParameter('category', $category);
        }
        if ($isPublic !== null) {
            $qb->andWhere('a.isPublic = :isPublic')->setParameter('isPublic', $isPublic);
        }

        return $qb->getQuery()->getResult();
    }
}
