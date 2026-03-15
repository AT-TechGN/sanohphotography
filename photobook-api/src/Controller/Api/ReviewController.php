<?php

namespace App\Controller\Api;

use App\Entity\Review;
use App\Enum\ReviewStatus;
use App\Repository\ReviewRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/reviews')]
final class ReviewController extends AbstractController
{
    public function __construct(
        private ReviewRepository $reviewRepository,
        private EntityManagerInterface $em,
        private ValidatorInterface $validator
    ) {}

    /**
     * Obtenir les avis approuvés (public)
     */
    #[Route('/approved', name: 'api_reviews_approved', methods: ['GET'])]
    public function getApproved(Request $request): JsonResponse
    {
        $page = max(1, (int) $request->query->get('page', 1));
        $limit = min(50, max(1, (int) $request->query->get('limit', 10)));

        $qb = $this->reviewRepository->createQueryBuilder('r')
            ->where('r.status = :status')
            ->setParameter('status', ReviewStatus::APPROVED->value)
            ->orderBy('r.isFeatured', 'DESC')
            ->addOrderBy('r.createdAt', 'DESC');

        $total = count($qb->getQuery()->getResult());

        $qb->setFirstResult(($page - 1) * $limit)
           ->setMaxResults($limit);

        $reviews = $qb->getQuery()->getResult();

        return $this->json([
            'data' => array_map([$this, 'serializeReview'], $reviews),
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'totalPages' => ceil($total / $limit),
            ]
        ]);
    }

    /**
     * Obtenir les avis en attente de modération
     */
    #[Route('/pending', name: 'api_reviews_pending', methods: ['GET'])]
    public function getPending(): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_PHOTOGRAPHE');

        $reviews = $this->reviewRepository->findBy(
            ['status' => ReviewStatus::PENDING->value],
            ['createdAt' => 'DESC']
        );

        return $this->json(array_map([$this, 'serializeReview'], $reviews));
    }

    /**
     * Soumettre un nouvel avis
     */
    #[Route('/submit', name: 'api_review_submit', methods: ['POST'])]
    public function submit(Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_CLIENT');

        $data = json_decode($request->getContent(), true);

        $review = new Review();
        $review->setRating($data['rating'] ?? null);
        // CORRECTION : le front envoie 'comment', l'entité a 'content' — accepter les deux
        $commentText = $data['comment'] ?? $data['content'] ?? null;
        $review->setContent($commentText);
        // Title auto-généré si non fourni (champ obligatoire dans l'entité)
        $review->setTitle($data['title'] ?? ('Avis ' . date('d/m/Y')));
        $review->setStatus(ReviewStatus::PENDING->value);
        $review->setIsFeatured(false);
        $review->setCreatedAt(new \DateTime());
        $review->setClient($this->getUser());

        // Validation
        $errors = $this->validator->validate($review);
        if (count($errors) > 0) {
            $errorMessages = [];
            foreach ($errors as $error) {
                $errorMessages[$error->getPropertyPath()] = $error->getMessage();
            }
            return $this->json(['errors' => $errorMessages], Response::HTTP_BAD_REQUEST);
        }

        $this->em->persist($review);
        $this->em->flush();

        return $this->json([
            'message' => 'Votre avis a été soumis et sera publié après modération',
            'review' => $review
        ], Response::HTTP_CREATED, [], [
            'groups' => ['review:read']
        ]);
    }

    /**
     * Approuver un avis
     */
    #[Route('/{id}/approve', name: 'api_review_approve', methods: ['PATCH'])]
    public function approve(int $id): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_PHOTOGRAPHE');

        $review = $this->reviewRepository->find($id);

        if (!$review) {
            return $this->json(['error' => 'Avis non trouvé'], Response::HTTP_NOT_FOUND);
        }

        $review->setStatus(ReviewStatus::APPROVED->value);
        $review->setModeratedAt(new \DateTime());
        $this->em->flush();

        return $this->json([
            'message' => 'Avis approuvé avec succès',
            'review' => $review
        ], Response::HTTP_OK, [], [
            'groups' => ['review:read']
        ]);
    }

    /**
     * Rejeter un avis
     */
    #[Route('/{id}/reject', name: 'api_review_reject', methods: ['PATCH'])]
    public function reject(int $id): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_PHOTOGRAPHE');

        $review = $this->reviewRepository->find($id);

        if (!$review) {
            return $this->json(['error' => 'Avis non trouvé'], Response::HTTP_NOT_FOUND);
        }

        $review->setStatus(ReviewStatus::REJECTED->value);
        $review->setModeratedAt(new \DateTime());
        $this->em->flush();

        return $this->json([
            'message' => 'Avis rejeté',
            'review' => $review
        ], Response::HTTP_OK, [], [
            'groups' => ['review:read']
        ]);
    }

    /**
     * Mettre en vedette / retirer de la vedette
     */
    #[Route('/{id}/toggle-featured', name: 'api_review_toggle_featured', methods: ['PATCH'])]
    public function toggleFeatured(int $id): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_PHOTOGRAPHE');

        $review = $this->reviewRepository->find($id);

        if (!$review) {
            return $this->json(['error' => 'Avis non trouvé'], Response::HTTP_NOT_FOUND);
        }

        $review->setIsFeatured(!$review->isFeatured());
        $this->em->flush();

        return $this->json([
            'message' => 'Statut vedette modifié',
            'isFeatured' => $review->isFeatured()
        ]);
    }

    /**
     * Statistiques des avis
     */
    #[Route('/stats', name: 'api_reviews_stats', methods: ['GET'])]
    public function getStats(): JsonResponse
    {
        // Note moyenne
        $avgRating = $this->reviewRepository->createQueryBuilder('r')
            ->select('AVG(r.rating)')
            ->where('r.status = :status')
            ->setParameter('status', ReviewStatus::APPROVED->value)
            ->getQuery()
            ->getSingleScalarResult();

        // Répartition par étoiles
        $distribution = [];
        for ($i = 1; $i <= 5; $i++) {
            $count = $this->reviewRepository->createQueryBuilder('r')
                ->select('COUNT(r.id)')
                ->where('r.rating = :rating')
                ->andWhere('r.status = :status')
                ->setParameter('rating', $i)
                ->setParameter('status', ReviewStatus::APPROVED->value)
                ->getQuery()
                ->getSingleScalarResult();

            $distribution[$i] = (int) $count;
        }

        // Total et en attente
        $totalApproved = array_sum($distribution);
        $totalPending = $this->reviewRepository->count(['status' => ReviewStatus::PENDING->value]);

        return $this->json([
            'averageRating' => round($avgRating, 2),
            'totalReviews' => $totalApproved,
            'pendingReviews' => $totalPending,
            'distribution' => $distribution
        ]);
    }

    /**
     * Sérialisation manuelle — évite les problèmes de lazy loading
     * et expose les champs exacts attendus par le frontend
     */
    private function serializeReview(\App\Entity\Review $r): array
    {
        $client = $r->getClient();
        return [
            'id'         => $r->getId(),
            'rating'     => $r->getRating(),
            'title'      => $r->getTitle(),
            'content'    => $r->getContent(),
            'comment'    => $r->getContent(), // alias pour compatibilité frontend
            'status'     => $r->getStatus(),
            'isFeatured' => $r->isFeatured(),
            'createdAt'  => $r->getCreatedAt()?->format('c'),
            'client'     => $client ? [
                'id'        => $client->getId(),
                'firstName' => $client->getFirstName(),
                'lastName'  => $client->getLastName(),
                'avatar'    => $client->getAvatar(),
            ] : null,
        ];
    }
}
