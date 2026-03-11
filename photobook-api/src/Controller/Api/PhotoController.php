<?php

namespace App\Controller\Api;

use App\Entity\Photo;
use App\Entity\Album;
use App\Entity\Tag;
use App\Repository\PhotoRepository;
use App\Repository\AlbumRepository;
use App\Repository\TagRepository;
use App\Repository\BookingRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\String\Slugger\SluggerInterface;

#[Route('/api/admin')]
final class PhotoController extends AbstractController
{
    private $photoRepository;
    private $albumRepository;
    private $tagRepository;
    private $bookingRepository;
    private $entityManager;
    private $slugger;

    public function __construct(
        PhotoRepository $photoRepository,
        AlbumRepository $albumRepository,
        TagRepository $tagRepository,
        BookingRepository $bookingRepository,
        EntityManagerInterface $entityManager,
        SluggerInterface $slugger
    ) {
        $this->photoRepository = $photoRepository;
        $this->albumRepository = $albumRepository;
        $this->tagRepository = $tagRepository;
        $this->bookingRepository = $bookingRepository;
        $this->entityManager = $entityManager;
        $this->slugger = $slugger;
    }

    /**
     * Obtenir tous les albums (admin)
     */
    #[Route('/albums', name: 'app_api_admin_albums', methods: ['GET'])]
    public function getAlbums(Request $request): Response
    {
        $category = $request->query->get('category');
        $isPublic = $request->query->get('isPublic');
        
        $albums = $this->albumRepository->findAll();
        
        if ($category) {
            $albums = array_filter($albums, fn($a) => $a->getCategory() === $category);
        }
        if ($isPublic !== null) {
            $isPublicBool = $isPublic === 'true';
            $albums = array_filter($albums, fn($a) => $a->isPublic() === $isPublicBool);
        }

        $data = array_map(function($album) {
            return [
                'id' => $album->getId(),
                'title' => $album->getTitle(),
                'description' => $album->getDescription(),
                'category' => $album->getCategory(),
                'isPublic' => $album->isPublic(),
                'publishedAt' => $album->getPublishedAt()?->format('Y-m-d H:i:s'),
                'createdAt' => $album->getCreatedAt()?->format('Y-m-d H:i:s'),
                'booking' => $album->getBooking() ? [
                    'id' => $album->getBooking()->getId(),
                    'service' => $album->getBooking()->getService()?->getName(),
                    'client' => $album->getBooking()->getClient()?->getFirstName() . ' ' . $album->getBooking()->getClient()?->getLastName(),
                ] : null,
                'photosCount' => $album->getPhotos()->count(),
            ];
        }, $albums);

        return $this->json($data);
    }

    /**
     * Obtenir un album (admin)
     */
    #[Route('/albums/{id}', name: 'app_api_admin_album_get', methods: ['GET'])]
    public function getAlbum(int $id): Response
    {
        $album = $this->albumRepository->find($id);
        if (!$album) {
            return $this->json(['error' => 'Album non trouvé'], 404);
        }

        $photos = array_map(function($photo) {
            return [
                'id' => $photo->getId(),
                'filePath' => $photo->getFilePath(),
                'thumbnailPath' => $photo->getThumbnailPath(),
                'originalFilename' => $photo->getOriginalFilename(),
                'fileSize' => $photo->getFileSize(),
                'width' => $photo->getWidth(),
                'height' => $photo->getHeight(),
                'takenAt' => $photo->getTakenAt()?->format('Y-m-d H:i:s'),
                'isFeatured' => $photo->isFeatured(),
                'sortOrder' => $photo->getSortOrder(),
                'tags' => $photo->getTags()->map(fn($t) => ['id' => $t->getId(), 'name' => $t->getName()])->toArray(),
            ];
        }, $album->getPhotos()->toArray());

        return $this->json([
            'id' => $album->getId(),
            'title' => $album->getTitle(),
            'description' => $album->getDescription(),
            'category' => $album->getCategory(),
            'isPublic' => $album->isPublic(),
            'publishedAt' => $album->getPublishedAt()?->format('Y-m-d H:i:s'),
            'createdAt' => $album->getCreatedAt()?->format('Y-m-d H:i:s'),
            'booking' => $album->getBooking() ? [
                'id' => $album->getBooking()->getId(),
                'service' => $album->getBooking()->getService()?->getName(),
                'client' => $album->getBooking()->getClient()?->getFirstName() . ' ' . $album->getBooking()->getClient()?->getLastName(),
            ] : null,
            'photos' => $photos,
        ]);
    }

    /**
     * Créer un album
     */
    #[Route('/albums', name: 'app_api_admin_album_create', methods: ['POST'])]
    public function createAlbum(Request $request): Response
    {
        $data = json_decode($request->getContent(), true);

        $album = new Album();
        $album->setTitle($data['title'] ?? 'Nouvel Album');
        $album->setDescription($data['description'] ?? '');
        $album->setCategory($data['category'] ?? 'PORTRAIT');
        $album->setIsPublic($data['isPublic'] ?? false);
        $album->setCreatedAt(new \DateTime());

        if (!empty($data['bookingId'])) {
            $booking = $this->bookingRepository->find($data['bookingId']);
            if ($booking) {
                $album->setBooking($booking);
            }
        }

        if (!empty($data['publish'])) {
            $album->setPublishedAt(new \DateTime());
        }

        $this->entityManager->persist($album);
        $this->entityManager->flush();

        return $this->json([
            'id' => $album->getId(),
            'title' => $album->getTitle(),
            'message' => 'Album créé avec succès'
        ], 201);
    }

    /**
     * Mettre à jour un album
     */
    #[Route('/albums/{id}', name: 'app_api_admin_album_update', methods: ['PUT'])]
    public function updateAlbum(int $id, Request $request): Response
    {
        $album = $this->albumRepository->find($id);
        if (!$album) {
            return $this->json(['error' => 'Album non trouvé'], 404);
        }

        $data = json_decode($request->getContent(), true);

        if (isset($data['title'])) {
            $album->setTitle($data['title']);
        }
        if (isset($data['description'])) {
            $album->setDescription($data['description']);
        }
        if (isset($data['category'])) {
            $album->setCategory($data['category']);
        }
        if (isset($data['isPublic'])) {
            $album->setIsPublic($data['isPublic']);
        }
        if (isset($data['publish']) && $data['publish']) {
            $album->setPublishedAt(new \DateTime());
        }

        $this->entityManager->flush();

        return $this->json(['message' => 'Album mis à jour']);
    }

    /**
     * Supprimer un album
     */
    #[Route('/albums/{id}', name: 'app_api_admin_album_delete', methods: ['DELETE'])]
    public function deleteAlbum(int $id): Response
    {
        $album = $this->albumRepository->find($id);
        if (!$album) {
            return $this->json(['error' => 'Album non trouvé'], 404);
        }

        $this->entityManager->remove($album);
        $this->entityManager->flush();

        return $this->json(['message' => 'Album supprimé']);
    }

    /**
     * Obtenir toutes les photos (admin)
     */
    #[Route('/photos', name: 'app_api_admin_photos', methods: ['GET'])]
    public function getPhotos(Request $request): Response
    {
        $albumId = $request->query->get('albumId');
        
        if ($albumId) {
            $album = $this->albumRepository->find($albumId);
            $photos = $album ? $album->getPhotos()->toArray() : [];
        } else {
            $photos = $this->photoRepository->findAll();
        }

        $data = array_map(function($photo) {
            return [
                'id' => $photo->getId(),
                'filePath' => $photo->getFilePath(),
                'thumbnailPath' => $photo->getThumbnailPath(),
                'originalFilename' => $photo->getOriginalFilename(),
                'fileSize' => $photo->getFileSize(),
                'width' => $photo->getWidth(),
                'height' => $photo->getHeight(),
                'takenAt' => $photo->getTakenAt()?->format('Y-m-d H:i:s'),
                'isFeatured' => $photo->isFeatured(),
                'sortOrder' => $photo->getSortOrder(),
                'album' => $photo->getAlbum() ? [
                    'id' => $photo->getAlbum()->getId(),
                    'title' => $photo->getAlbum()->getTitle(),
                ] : null,
                'tags' => $photo->getTags()->map(fn($t) => ['id' => $t->getId(), 'name' => $t->getName()])->toArray(),
            ];
        }, $photos);

        return $this->json($data);
    }

    /**
     * Obtenir une photo (admin)
     */
    #[Route('/photos/{id}', name: 'app_api_admin_photo_get', methods: ['GET'])]
    public function getPhoto(int $id): Response
    {
        $photo = $this->photoRepository->find($id);
        if (!$photo) {
            return $this->json(['error' => 'Photo non trouvée'], 404);
        }

        return $this->json([
            'id' => $photo->getId(),
            'filePath' => $photo->getFilePath(),
            'thumbnailPath' => $photo->getThumbnailPath(),
            'originalFilename' => $photo->getOriginalFilename(),
            'fileSize' => $photo->getFileSize(),
            'width' => $photo->getWidth(),
            'height' => $photo->getHeight(),
            'takenAt' => $photo->getTakenAt()?->format('Y-m-d H:i:s'),
            'isFeatured' => $photo->isFeatured(),
            'sortOrder' => $photo->getSortOrder(),
            'album' => $photo->getAlbum() ? [
                'id' => $photo->getAlbum()->getId(),
                'title' => $photo->getAlbum()->getTitle(),
            ] : null,
            'tags' => $photo->getTags()->map(fn($t) => ['id' => $t->getId(), 'name' => $t->getName()])->toArray(),
        ]);
    }

    /**
     * Ajouter des photos à un album (upload simple - pour intégration avec front)
     */
    #[Route('/photos', name: 'app_api_admin_photo_create', methods: ['POST'])]
    public function addPhotos(Request $request): Response
    {
        $albumId = $request->request->get('albumId');
        $files = $request->files->get('files');
        
        if (!$albumId) {
            return $this->json(['error' => 'Album ID requis'], 400);
        }

        $album = $this->albumRepository->find($albumId);
        if (!$album) {
            return $this->json(['error' => 'Album non trouvé'], 404);
        }

        $uploadedPhotos = [];
        
        if ($files) {
            $uploadDir = $this->getParameter('kernel.project_dir') . '/public/uploads/photos/';
            $thumbDir = $this->getParameter('kernel.project_dir') . '/public/uploads/thumbnails/';
            
            foreach ($files as $file) {
                $originalFilename = $file->getClientOriginalName();
                $newFilename = uniqid() . '.' . $file->getExtension();
                
                // Déplacer le fichier
                $file->move($uploadDir, $newFilename);
                
                // Créer la photo en base
                $photo = new Photo();
                $photo->setFilePath('/uploads/photos/' . $newFilename);
                $photo->setThumbnailPath('/uploads/thumbnails/' . $newFilename);
                $photo->setOriginalFilename($originalFilename);
                $photo->setFileSize($file->getSize());
                $photo->setIsFeatured(false);
                $photo->setSortOrder($album->getPhotos()->count());
                $photo->setTakenAt(new \DateTime());
                $photo->setAlbum($album);
                
                $this->entityManager->persist($photo);
                
                $uploadedPhotos[] = [
                    'id' => $photo->getId(),
                    'filename' => $originalFilename,
                ];
            }
            
            $this->entityManager->flush();
        }

        return $this->json([
            'message' => count($uploadedPhotos) . ' photo(s) ajoutée(s)',
            'photos' => $uploadedPhotos,
        ], 201);
    }

    /**
     * Mettre à jour une photo
     */
    #[Route('/photos/{id}', name: 'app_api_admin_photo_update', methods: ['PUT'])]
    public function updatePhoto(int $id, Request $request): Response
    {
        $photo = $this->photoRepository->find($id);
        if (!$photo) {
            return $this->json(['error' => 'Photo non trouvée'], 404);
        }

        $data = json_decode($request->getContent(), true);

        if (isset($data['isFeatured'])) {
            $photo->setIsFeatured($data['isFeatured']);
        }
        if (isset($data['sortOrder'])) {
            $photo->setSortOrder($data['sortOrder']);
        }
        if (isset($data['takenAt'])) {
            $photo->setTakenAt(new \DateTime($data['takenAt']));
        }

        // Gérer les tags
        if (isset($data['tags'])) {
            foreach ($photo->getTags() as $tag) {
                $photo->removeTag($tag);
            }
            
            foreach ($data['tags'] as $tagName) {
                $tag = $this->tagRepository->findOneBy(['name' => $tagName]);
                if (!$tag) {
                    $tag = new Tag();
                    $tag->setName($tagName);
                    $tag->setSlug($this->slugger->slug($tagName)->toString());
                    $this->entityManager->persist($tag);
                }
                $photo->addTag($tag);
            }
        }

        $this->entityManager->flush();

        return $this->json(['message' => 'Photo mise à jour']);
    }

    /**
     * Supprimer une photo
     */
    #[Route('/photos/{id}', name: 'app_api_admin_photo_delete', methods: ['DELETE'])]
    public function deletePhoto(int $id): Response
    {
        $photo = $this->photoRepository->find($id);
        if (!$photo) {
            return $this->json(['error' => 'Photo non trouvée'], 404);
        }

        // Supprimer le fichier physique
        $filePath = $this->getParameter('kernel.project_dir') . '/public' . $photo->getFilePath();
        if (file_exists($filePath)) {
            unlink($filePath);
        }

        $this->entityManager->remove($photo);
        $this->entityManager->flush();

        return $this->json(['message' => 'Photo supprimée']);
    }

    /**
     * Obtenir tous les tags
     */
    #[Route('/tags', name: 'app_api_admin_tags', methods: ['GET'])]
    public function getTags(): Response
    {
        $tags = $this->tagRepository->findAll();
        
        $data = array_map(function($tag) {
            return [
                'id' => $tag->getId(),
                'name' => $tag->getName(),
                'slug' => $tag->getSlug(),
                'count' => $tag->getPhotos()->count(),
            ];
        }, $tags);

        return $this->json($data);
    }

    /**
     * Créer un tag
     */
    #[Route('/tags', name: 'app_api_admin_tag_create', methods: ['POST'])]
    public function createTag(Request $request): Response
    {
        $data = json_decode($request->getContent(), true);
        
        $tag = new Tag();
        $tag->setName($data['name']);
        $tag->setSlug($this->slugger->slug($data['name'])->toString());
        
        $this->entityManager->persist($tag);
        $this->entityManager->flush();

        return $this->json([
            'id' => $tag->getId(),
            'name' => $tag->getName(),
        ], 201);
    }

    /**
     * Obtenir les réservations pour association album
     */
    #[Route('/bookings/for-album', name: 'app_api_admin_bookings_for_album', methods: ['GET'])]
    public function getBookingsForAlbum(): Response
    {
        $bookings = $this->bookingRepository->findBy(['status' => 'completed'], ['bookingDate' => 'DESC'], 50);
        
        $data = array_map(function($booking) {
            return [
                'id' => $booking->getId(),
                'service' => $booking->getService()?->getName(),
                'client' => $booking->getClient()?->getFirstName() . ' ' . $booking->getClient()?->getLastName(),
                'date' => $booking->getBookingDate()?->format('Y-m-d'),
                'hasAlbum' => $booking->getAlbums()->count() > 0,
            ];
        }, $bookings);

        return $this->json($data);
    }

    /**
     * Statistiques photos
     */
    #[Route('/photos/stats', name: 'app_api_admin_photos_stats', methods: ['GET'])]
    public function getStats(): Response
    {
        $totalPhotos = $this->photoRepository->count([]);
        $totalAlbums = $this->albumRepository->count([]);
        $publicAlbums = $this->albumRepository->findBy(['isPublic' => true]);
        
        $thisMonth = new \DateTime('first day of this month');
        $photosThisMonth = 0;
        foreach ($this->photoRepository->findAll() as $photo) {
            $createdAt = $photo->getAlbum()?->getCreatedAt();
            if ($createdAt && $createdAt >= $thisMonth) {
                $photosThisMonth++;
            }
        }

        return $this->json([
            'totalPhotos' => $totalPhotos,
            'totalAlbums' => $totalAlbums,
            'publicAlbums' => count($publicAlbums),
            'photosThisMonth' => $photosThisMonth,
        ]);
    }
}
