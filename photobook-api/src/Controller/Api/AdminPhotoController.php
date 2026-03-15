<?php

namespace App\Controller\Api;

use App\Entity\Photo;
use App\Entity\Album;
use App\Repository\PhotoRepository;
use App\Repository\AlbumRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Serializer\SerializerInterface;
use Vich\UploaderBundle\Handler\UploadHandlerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

#[Route('/admin/photos')]
class AdminPhotoController extends AbstractController
{
    public function __construct(
        private PhotoRepository $photoRepository,
        private AlbumRepository $albumRepository,
        private EntityManagerInterface $em,
        private SerializerInterface $serializer,
        private UploadHandlerInterface $uploader,
        private ValidatorInterface $validator,
        private LoggerInterface $logger
    ) {
    }

    /**
     * GET /admin/photos - List photos (?albumId, page, limit)
     */
    #[Route('', name: 'admin_photo_list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $albumId = $request->query->get('albumId');
        $page = max(1, (int)$request->query->get('page', 1));
        $limit = min(100, max(1, (int)$request->query->get('limit', 20)));

        $photos = $this->photoRepository->findByAlbumOrAll($albumId, $page, $limit); // TODO: repo method

        $data = array_map(fn(Photo $photo) => $this->serializePhoto($photo), $photos);

        return $this->json([
            'data' => $data,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $this->photoRepository->countByAlbumOrAll($albumId), // TODO: repo
            ]
        ]);
    }

    /**
     * POST /admin/photos - Upload photos (multipart: files[], albumId)
     */
    #[Route('', name: 'admin_photo_upload', methods: ['POST'])]
    public function upload(Request $request): JsonResponse
    {
        $albumId = $request->request->get('albumId');
        if (!$albumId || !($album = $this->albumRepository->find($albumId))) {
            throw new BadRequestHttpException('Album ID requis et valide');
        }

        $files = $request->files->get('files');
        if (!$files || !($files instanceof \Symfony\Component\HttpFoundation\FileBag && count($files->all()) === 0)) {
            throw new BadRequestHttpException('Aucun fichier image valide');
        }

        $photos = [];
        foreach ($files->all() as $file) {
            if (!$file->isImage()) continue;

            $photo = new Photo();
            $photo->setAlbum($album);
            $photo->setOriginalFilename($file->getClientOriginalName());
            $photo->setFileSize((string)$file->getSize());
            
            // Vich upload
            $this->uploader->upload($photo, 'imageFile'); // Assumes Vich mapping 'imageFile'

            // Metadata (requires intervention)
            $image = \ Intervention\Image\ImageManagerStatic::make($file);
            $photo->setWidth($image->width());
            $photo->setHeight($image->height());

            $errors = $this->validator->validate($photo);
            if (count($errors) > 0) {
                $this->logger->error('Photo validation failed', ['errors' => (string)$errors]);
                continue;
            }

            $this->em->persist($photo);
            $photos[] = $photo;
        }

        $this->em->flush();

        return $this->json([
            'success' => true,
            'count' => count($photos),
            'photos' => array_map(fn(Photo $p) => $this->serializePhoto($p), $photos)
        ]);
    }

    /**
     * GET /admin/photos/{id}
     */
    #[Route('/{id}', name: 'admin_photo_get', methods: ['GET'])]
    public function get(int $id): JsonResponse
    {
        $photo = $this->photoRepository->find($id) ?? throw new NotFoundHttpException('Photo non trouvée');
        return $this->json($this->serializePhoto($photo));
    }

    /**
     * PUT /admin/photos/{id} - Toggle featured, sortOrder, etc.
     */
    #[Route('/{id}', name: 'admin_photo_update', methods: ['PUT', 'PATCH'])]
    public function update(Request $request, int $id): JsonResponse
    {
        $photo = $this->photoRepository->find($id) ?? throw new NotFoundHttpException();
        
        $data = json_decode($request->getContent(), true) ?: $request->request->all();
        
        if (isset($data['isFeatured'])) $photo->setIsFeatured((bool)$data['isFeatured']);
        if (isset($data['sortOrder'])) $photo->setSortOrder((int)$data['sortOrder']);

        $this->em->flush();

        return $this->json([
            'success' => true,
            'photo' => $this->serializePhoto($photo)
        ]);
    }

    /**
     * DELETE /admin/photos/{id}
     */
    #[Route('/{id}', name: 'admin_photo_delete', methods: ['DELETE'])]
    public function delete(int $id): JsonResponse
    {
        $photo = $this->photoRepository->find($id) ?? throw new NotFoundHttpException();
        
        // Delete file
        if ($photo->getFilePath()) {
            $fs = new \Symfony\Component\Filesystem\Filesystem();
            $fs->remove($this->getParameter('kernel.project_dir') . '/public' . $photo->getFilePath());
        }

        $this->em->remove($photo);
        $this->em->flush();

        return $this->json(['success' => true]);
    }

    private function serializePhoto(Photo $photo): array
    {
        return [
            'id' => $photo->getId(),
            'filePath' => $photo->getFilePath(),
            'thumbnailPath' => $photo->getThumbnailPath(),
            'originalFilename' => $photo->getOriginalFilename(),
            'width' => $photo->getWidth(),
            'height' => $photo->getHeight(),
            'isFeatured' => $photo->isFeatured(),
            'sortOrder' => $photo->getSortOrder(),
            'album' => [
                'id' => $photo->getAlbum()->getId(),
                'title' => $photo->getAlbum()->getTitle(),
            ],
            'takenAt' => $photo->getTakenAt()?->format('Y-m-d H:i:s'),
        ];
    }
}

