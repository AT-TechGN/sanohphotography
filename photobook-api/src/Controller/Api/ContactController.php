<?php

namespace App\Controller\Api;

use App\Entity\ContactMessage;
use App\Repository\ContactMessageRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/contact')]
final class ContactController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private ContactMessageRepository $repo,
        private ValidatorInterface $validator
    ) {}

    /** POST /api/contact — Envoyer un message (public) */
    #[Route('', name: 'api_contact_send', methods: ['POST'])]
    public function send(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true) ?? [];

        $name    = trim($data['name']    ?? $data['senderName']  ?? '');
        $email   = trim($data['email']   ?? $data['senderEmail'] ?? '');
        $subject = trim($data['subject'] ?? '');
        $body    = trim($data['message'] ?? $data['body']        ?? '');

        // Validation simple
        $errors = [];
        if (!$name)              $errors[] = 'Le nom est requis';
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = 'Email invalide';
        if (!$subject)           $errors[] = 'Le sujet est requis';
        if (strlen($body) < 10)  $errors[] = 'Le message doit contenir au moins 10 caractères';

        if ($errors) {
            return $this->json(['errors' => $errors], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $msg = new ContactMessage();
        $msg->setSenderName($name);
        $msg->setSenderEmail($email);
        $msg->setSubject($subject);
        $msg->setBody($body);
        $msg->setIsRead(false);
        $msg->setCreatedAt(new \DateTime());

        $this->em->persist($msg);
        $this->em->flush();

        return $this->json([
            'message' => 'Votre message a bien été envoyé. Nous vous répondrons dans les plus brefs délais.',
            'id'      => $msg->getId(),
        ], Response::HTTP_CREATED);
    }

    /** GET /api/contact — Liste des messages (admin) */
    #[Route('', name: 'api_contact_list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_PHOTOGRAPHE');
        $messages = $this->repo->findBy([], ['createdAt' => 'DESC']);
        return $this->json(array_map([$this, 'serialize'], $messages));
    }

    /** PATCH /api/contact/{id}/read — Marquer comme lu */
    #[Route('/{id}/read', name: 'api_contact_read', methods: ['PATCH'], requirements: ['id' => '\d+'])]
    public function markRead(int $id): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_PHOTOGRAPHE');
        $msg = $this->repo->find($id);
        if (!$msg) return $this->json(['error' => 'Message non trouvé'], 404);
        $msg->setIsRead(true);
        $this->em->flush();
        return $this->json($this->serialize($msg));
    }

    /** DELETE /api/contact/{id} */
    #[Route('/{id}', name: 'api_contact_delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function delete(int $id): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_PHOTOGRAPHE');
        $msg = $this->repo->find($id);
        if (!$msg) return $this->json(['error' => 'Message non trouvé'], 404);
        $this->em->remove($msg);
        $this->em->flush();
        return $this->json(['message' => 'Message supprimé']);
    }

    private function serialize(ContactMessage $m): array
    {
        return [
            'id'          => $m->getId(),
            'senderName'  => $m->getSenderName(),
            'senderEmail' => $m->getSenderEmail(),
            'subject'     => $m->getSubject(),
            'body'        => $m->getBody(),
            'isRead'      => $m->isIsRead(),
            'createdAt'   => $m->getCreatedAt()?->format('c'),
        ];
    }
}
