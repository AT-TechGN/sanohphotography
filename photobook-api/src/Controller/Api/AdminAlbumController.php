<?php

namespace App\Controller\Api;

use App\Entity\Album;
use App\Repository\AlbumRepository;
use App\Repository\BookingRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Serializer\SerializerInterface;

#[Route('/admin/albums')]
class AdminAlbumController extends AbstractController
{
    public function __construct(
        private AlbumRepository $albumRepository,
        private BookingRepository $bookingRepository,
        private EntityManagerInterface $em,
        private SerializerInterface $serializer
    ) {
    }

    /**
     * GET /admin/albums - List albums (?category, ?isPublic)
     */
    #[Route('', name: 'admin_album_list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $category = $request->query->get('category');
        $isPublic = $request->query->get('isPublic') !== null ? (bool)$request->query->get('isPublic') : null;
        $page = max(1, (int)$request->query->get('page', 1));
        $limit = min(100, max(1, (int)$request->query->get('limit', 20)));

        $albums = $this->albumRepository->findByCriteria($category, $isPublic, $page, $limit);

        $data = array_map(fn(Album $album) => [
            'id' => $album->getId(),
            'title' => $album->getTitle(),
            'description' => $album->getDescription(),
            'category' => $album->getCategory(),
            'isPublic' => $album->isPublic(),
            'photosCount' => $album->getPhotos()->count(),
            'booking' => $album->getBooking() ? [
                'id' => $album->getBooking()->getId(),
                'client' => $album->getBooking()->getClient()->getFullName(),
                'service' => $album->getBooking()->getService()->getName(),
                'date' => $album->getBooking()->getStartDate()?->format('Y-m-d'),
            ] : null,
            'createdAt' => $album->getCreatedAt()?->format('Y-m-d H:i:s'),
        ], $albums);

        return $this->json([
            'data' => $data,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
            ]
        ]);
    }

    /**
     * GET /admin/albums/{id}
     */
    #[Route('/{id}', name: 'admin_album_get', methods: ['GET'])]
    public function get(int $id): JsonResponse
    {
        $album = $this->albumRepository->find($id) ?? throw new NotFoundHttpException('Album non trouvé');
        return $this->json([
            'id' => $album->getId(),
            'title' => $album->getTitle(),
            'description' => $album->getDescription(),
            'category' => $album->getCategory(),
            'isPublic' => $album->isPublic(),
            'booking' => $album->getBooking()?->getId(),
            'photosCount' => $album->getPhotos()->count(),
            'createdAt' => $album->getCreatedAt()?->format('Y-m-d H:i:s'),
        ]);
    }

    /**
     * POST /admin/albums - Create album
     */
    #[Route('', name: 'admin_album_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true) ?: [];

        $album = new Album();
        $album->setTitle($data['title'] ?? '');
        $album->setDescription($data['description'] ?? '');
        $album->setCategory($data['category'] ?? 'OTHER');
        $album->setIsPublic($data['isPublic'] ?? false);
        $album->setCreatedAt(new \DateTime());

        if ($bookingId = $data['bookingId'] ?? null) {
            $booking = $this->bookingRepository->find($bookingId);
            if ($booking) $album->setBooking($booking);
        }

        $this->em->persist($album);
        $this->em->flush();

        return $this->json([
            'success' => true,
            'album' => [
                'id' => $album->getId(),
                'title' => $album->getTitle(),
            ]
        ], 201);
    }

    /**
     * PUT /admin/albums/{id} - Update
     */
    #[Route('/{id}', name: 'admin_album_update', methods: ['PUT', 'PATCH'])]
    public function update(Request $request, int $id): JsonResponse
    {
        $album = $this->albumRepository->find($id) ?? throw new NotFoundHttpException();

        $data = json_decode($request->getContent(), true) ?: [];

        if (isset($data['title'])) $album->setTitle($data['title']);
        if (isset($data['description'])) $album->setDescription($data['description']);
        if (isset($data['category'])) $album->setCategory($data['category']);
        if (array_key_exists('isPublic', $data)) $album->setIsPublic((bool)$data['isPublic']);
        if ($bookingId = $data['bookingId'] ?? null) {
            $album->setBooking($this->bookingRepository->find($bookingId));
        }

        $this->em->flush();

        return $this->json(['success' => true, 'album' => $album->getId()]);
    }

    /**
     * DELETE /admin/albums/{id} - Delete (cascade photos?)
     */
    #[Route('/{id}', name: 'admin_album_delete', methods: ['DELETE'])]
    public function delete(int $id): JsonResponse
    {
        $album = $this->albumRepository->find($id) ?? throw new NotFoundHttpException();
        $this->em->remove($album);
        $this->em->flush();

        return $this->json(['success' => true]);
    }
}

