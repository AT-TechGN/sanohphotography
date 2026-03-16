<?php

namespace App\Controller\Api;

use App\Repository\PhotoRepository;
use App\Repository\AlbumRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/gallery')]
final class GalleryController extends AbstractController
{
    public function __construct(
        private PhotoRepository $photoRepository,
        private AlbumRepository $albumRepository
    ) {
    }

    /**
     * Construit une URL absolue pour un chemin de fichier.
     * Le frontend peut ainsi afficher les images directement sans configuration.
     */
    private function buildUrl(?string $path): ?string
    {
        if (!$path) return null;
        if (str_starts_with($path, 'http')) return $path;
        // Utilise APP_URL si défini, sinon construit depuis la requête courante
        $baseUrl = $_ENV['APP_URL'] ?? $_SERVER['HTTP_HOST'] ?? 'http://localhost:8000';
        if (!str_starts_with($baseUrl, 'http')) {
            $scheme = ($_SERVER['HTTPS'] ?? 'off') !== 'off' ? 'https' : 'http';
            $baseUrl = $scheme . '://' . $baseUrl;
        }
        return rtrim($baseUrl, '/') . $path;
    }

    /**
     * Get photos with filters (public)
     * period: all|today|week|month, category, page, limit
     */
    #[Route('/photos', name: 'api_gallery_photos', methods: ['GET'])]
    public function getPhotos(Request $request): Response
    {
        $period = $request->query->get('period', 'all');
        $category = $request->query->get('category');
        $page = (int) $request->query->get('page', 1);
        $limit = (int) $request->query->get('limit', 24);

        $photos = $this->photoRepository->findPublicPhotos($period, $category, $page, $limit);

        $data = array_map(function($photo) {
            return [
                'id' => $photo->getId(),
                'filePath' => $this->buildUrl($photo->getFilePath()),
                'thumbnailPath' => $this->buildUrl($photo->getThumbnailPath() ?? $photo->getFilePath()),
                'album' => [
                    'id' => $photo->getAlbum()->getId(),
                    'title' => $photo->getAlbum()->getTitle(),
                ],
                'width' => $photo->getWidth(),
                'height' => $photo->getHeight(),
                'isFeatured' => $photo->isFeatured(),
                'takenAt' => $photo->getTakenAt()?->format('Y-m-d H:i:s'),
            ];
        }, $photos);

        return $this->json([
            'data' => $data,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $this->photoRepository->countPublicPhotos($period, $category),
                'totalPages' => ceil($this->photoRepository->countPublicPhotos($period, $category) / $limit),
            ]
        ]);
    }

    /**
     * Get featured photos (hero)
     */
    #[Route('/featured', name: 'api_gallery_featured', methods: ['GET'])]
    public function getFeatured(Request $request): Response
    {
        $limit = (int) $request->query->get('limit', 10);
        $featured = $this->photoRepository->findFeaturedPhotos($limit);

        $data = array_map(function($photo) {
            return [
                'id' => $photo->getId(),
                'filePath' => $this->buildUrl($photo->getFilePath()),
                'thumbnailPath' => $this->buildUrl($photo->getThumbnailPath() ?? $photo->getFilePath()),
                'album' => [
                    'id' => $photo->getAlbum()->getId(),
                    'title' => $photo->getAlbum()->getTitle(),
                ],
                'width' => $photo->getWidth(),
                'height' => $photo->getHeight(),
            ];
        }, $featured);

        return $this->json(['data' => $data]);
    }

    /**
     * Get public albums
     */
    #[Route('/albums', name: 'api_gallery_albums', methods: ['GET'])]
    public function getAlbums(Request $request): Response
    {
        $page = (int) $request->query->get('page', 1);
        $limit = (int) $request->query->get('limit', 12);

        $albums = $this->albumRepository->findPublicAlbums($page, $limit);

        $data = array_map(function($album) {
            return [
                'id' => $album->getId(),
                'title' => $album->getTitle(),
                'description' => $album->getDescription(),
                'category' => $album->getCategory(),
                'photosCount' => $album->getPhotos()->count(),
                'publishedAt' => $album->getPublishedAt()?->format('Y-m-d H:i:s'),
            ];
        }, $albums);

        return $this->json([
            'data' => $data,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'totalPages' => $this->albumRepository->countPublicAlbums(),
            ]
        ]);
    }

    /**
     * Gallery stats
     */
    #[Route('/stats', name: 'api_gallery_stats', methods: ['GET'])]
    public function getStats(): Response
    {
        return $this->json([
            'totalPhotos' => $this->photoRepository->countPublicPhotos('all'),
            'totalAlbums' => $this->albumRepository->countPublicAlbums(),
            'avgRating' => 4.9, // Could query reviews
        ]);
    }
}

