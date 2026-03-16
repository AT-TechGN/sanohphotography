<?php

namespace App\Controller\Api;

use App\Entity\Photo;
use App\Repository\PhotoRepository;
use App\Repository\AlbumRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\Filesystem\Filesystem;
use Psr\Log\LoggerInterface;

/**
 * Gestion admin des photos via upload manuel (sans VichUploader).
 *
 * CORRECTIONS APPLIQUÉES :
 * ─────────────────────────────────────────────────────────────────────────
 * 1. Suppression de UploadHandlerInterface (VichUploader) du constructeur.
 *    L'entité Photo n'a pas #[Vich\Uploadable] → autowire échouait au boot.
 *
 * 2. Suppression de SerializerInterface (inutilisé).
 *
 * 3. Suppression de ValidatorInterface (non nécessaire ici — validation
 *    faite par les contraintes ORM au flush).
 *
 * 4. L'upload est désormais manuel (identique à PhotoController),
 *    conforme à la configuration vich_uploader.yaml existante.
 *
 * 5. Correction du filtre de fichiers dans upload() : l'ancienne version
 *    vérifiait FileBag de manière inversée (condition toujours fausse).
 *
 * 6. Route préfixée /admin/photos → sous /api/ via security.yaml.
 *    PhotoController est sous /api/admin/ → PAS de conflit (chemins différents).
 * ─────────────────────────────────────────────────────────────────────────
 */
#[Route('/admin/photos')]
class AdminPhotoController extends AbstractController
{
    private string $uploadDir;
    private string $thumbDir;

    public function __construct(
        private PhotoRepository        $photoRepository,
        private AlbumRepository        $albumRepository,
        private EntityManagerInterface $em,
        private LoggerInterface        $logger
    ) {}

    // ─────────────────────────────────────────────────────────────────────
    // GET /api/admin/photos — Liste avec pagination
    // ─────────────────────────────────────────────────────────────────────
    #[Route('', name: 'admin_photo_list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $albumId = $request->query->get('albumId');
        $page    = max(1, (int) $request->query->get('page', 1));
        $limit   = min(100, max(1, (int) $request->query->get('limit', 20)));

        $photos = $this->photoRepository->findByAlbumOrAll(
            $albumId ? (int) $albumId : null,
            $page,
            $limit
        );

        return $this->json([
            'data'       => array_map([$this, 'serializePhoto'], $photos),
            'pagination' => [
                'page'  => $page,
                'limit' => $limit,
                'total' => $this->photoRepository->countByAlbumOrAll(
                    $albumId ? (int) $albumId : null
                ),
            ],
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────
    // POST /api/admin/photos — Upload (multipart: files[], albumId)
    // ─────────────────────────────────────────────────────────────────────
    #[Route('', name: 'admin_photo_upload', methods: ['POST'])]
    public function upload(Request $request): JsonResponse
    {
        $albumId = $request->request->get('albumId');
        if (!$albumId) {
            throw new BadRequestHttpException('albumId est requis');
        }

        $album = $this->albumRepository->find($albumId);
        if (!$album) {
            throw new NotFoundHttpException('Album non trouvé');
        }

        // CORRECTION : récupérer files[] correctement (tableau ou fichier unique)
        $rawFiles = $request->files->get('files');
        $files    = is_array($rawFiles) ? $rawFiles : ($rawFiles ? [$rawFiles] : []);

        if (empty($files)) {
            throw new BadRequestHttpException('Aucun fichier reçu');
        }

        $uploadDir = $this->getParameter('kernel.project_dir') . '/public/uploads/photos/';
        $thumbDir  = $this->getParameter('kernel.project_dir') . '/public/uploads/thumbnails/';

        // Créer les dossiers si nécessaire
        $fs = new Filesystem();
        $fs->mkdir([$uploadDir, $thumbDir]);

        $uploaded = [];

        foreach ($files as $file) {
            // Vérifier que c'est bien une image
            $mimeType = $file->getMimeType();
            if (!str_starts_with($mimeType ?? '', 'image/')) {
                $this->logger->warning('Fichier ignoré (pas une image): ' . $file->getClientOriginalName());
                continue;
            }

            try {
                $originalName = $file->getClientOriginalName();
                $extension    = $file->getClientOriginalExtension() ?: $file->guessExtension() ?: 'jpg';
                $newFilename  = uniqid('photo_', true) . '.' . $extension;

                // Déplacer vers uploads/photos/
                $file->move($uploadDir, $newFilename);

                // Créer l'entité Photo
                $photo = new Photo();
                $photo->setAlbum($album);
                $photo->setFilePath('/uploads/photos/' . $newFilename);
                $photo->setThumbnailPath('/uploads/photos/' . $newFilename); // même chemin par défaut
                $photo->setOriginalFilename($originalName);
                $photo->setFileSize((string) $file->getSize());
                $photo->setIsFeatured(false);
                $photo->setSortOrder($album->getPhotos()->count() + count($uploaded));
                $photo->setTakenAt(new \DateTime());

                $this->em->persist($photo);
                $uploaded[] = $photo;

            } catch (\Exception $e) {
                $this->logger->error('Erreur upload photo: ' . $e->getMessage(), [
                    'file' => $file->getClientOriginalName(),
                ]);
            }
        }

        $this->em->flush();

        return $this->json([
            'success' => true,
            'count'   => count($uploaded),
            'photos'  => array_map([$this, 'serializePhoto'], $uploaded),
        ], 201);
    }

    // ─────────────────────────────────────────────────────────────────────
    // GET /api/admin/photos/{id}
    // ─────────────────────────────────────────────────────────────────────
    #[Route('/{id}', name: 'admin_photo_get', methods: ['GET'])]
    public function get(int $id): JsonResponse
    {
        $photo = $this->photoRepository->find($id)
            ?? throw new NotFoundHttpException('Photo non trouvée');

        return $this->json($this->serializePhoto($photo));
    }

    // ─────────────────────────────────────────────────────────────────────
    // PATCH /api/admin/photos/{id} — Toggle featured, sortOrder
    // ─────────────────────────────────────────────────────────────────────
    #[Route('/{id}', name: 'admin_photo_update', methods: ['PUT', 'PATCH'])]
    public function update(Request $request, int $id): JsonResponse
    {
        $photo = $this->photoRepository->find($id)
            ?? throw new NotFoundHttpException('Photo non trouvée');

        $data = json_decode($request->getContent(), true) ?: [];

        if (array_key_exists('isFeatured', $data)) {
            $photo->setIsFeatured((bool) $data['isFeatured']);
        }
        if (array_key_exists('sortOrder', $data)) {
            $photo->setSortOrder((int) $data['sortOrder']);
        }

        $this->em->flush();

        return $this->json([
            'success' => true,
            'photo'   => $this->serializePhoto($photo),
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────
    // DELETE /api/admin/photos/{id}
    // ─────────────────────────────────────────────────────────────────────
    #[Route('/{id}', name: 'admin_photo_delete', methods: ['DELETE'])]
    public function delete(int $id): JsonResponse
    {
        $photo = $this->photoRepository->find($id)
            ?? throw new NotFoundHttpException('Photo non trouvée');

        // Supprimer le fichier physique
        if ($photo->getFilePath()) {
            $fs       = new Filesystem();
            $fullPath = $this->getParameter('kernel.project_dir') . '/public' . $photo->getFilePath();
            if ($fs->exists($fullPath)) {
                $fs->remove($fullPath);
            }
        }

        $this->em->remove($photo);
        $this->em->flush();

        return $this->json(['success' => true]);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Sérialisation centralisée
    // ─────────────────────────────────────────────────────────────────────
    private function serializePhoto(Photo $photo): array
    {
        return [
            'id'               => $photo->getId(),
            'filePath'         => $photo->getFilePath(),
            'thumbnailPath'    => $photo->getThumbnailPath(),
            'originalFilename' => $photo->getOriginalFilename(),
            'fileSize'         => $photo->getFileSize(),
            'width'            => $photo->getWidth(),
            'height'           => $photo->getHeight(),
            'isFeatured'       => $photo->isFeatured(),
            'sortOrder'        => $photo->getSortOrder(),
            'takenAt'          => $photo->getTakenAt()?->format('Y-m-d H:i:s'),
            'album'            => $photo->getAlbum() ? [
                'id'    => $photo->getAlbum()->getId(),
                'title' => $photo->getAlbum()->getTitle(),
            ] : null,
        ];
    }
}
