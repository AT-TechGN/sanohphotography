<?php

namespace App\Controller\Api;

use App\Entity\ContactMessage;
use App\Repository\ContactMessageRepository;
use App\Repository\BookingRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/contact')]
final class ContactController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface   $em,
        private ContactMessageRepository $repo,
        private BookingRepository        $bookingRepo
    ) {}

    /* ── PUBLIC ─────────────────────────────────────────────────────────────── */

    /** POST /api/contact — Envoyer un message (sans authentification) */
    #[Route('', name: 'api_contact_send', methods: ['POST'])]
    public function send(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true) ?? [];

        $name    = trim($data['name']    ?? $data['senderName']  ?? '');
        $email   = trim($data['email']   ?? $data['senderEmail'] ?? '');
        $subject = trim($data['subject'] ?? '');
        $body    = trim($data['message'] ?? $data['body']        ?? '');

        $errors = [];
        if (!$name)                                    $errors[] = 'Le nom est requis';
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = 'Email invalide';
        if (!$subject)                                 $errors[] = 'Le sujet est requis';
        if (strlen($body) < 10)                        $errors[] = 'Le message doit contenir au moins 10 caractères';

        if ($errors) {
            return $this->json(['errors' => $errors], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $msg = (new ContactMessage())
            ->setSenderName($name)
            ->setSenderEmail($email)
            ->setSubject($subject)
            ->setBody($body)
            ->setIsRead(false)
            ->setCreatedAt(new \DateTime());

        $this->em->persist($msg);
        $this->em->flush();

        return $this->json([
            'success' => true,
            'message' => 'Votre message a bien été envoyé. Nous vous répondrons dans les 24h.',
            'id'      => $msg->getId(),
        ], Response::HTTP_CREATED);
    }

    /* ── ADMIN ──────────────────────────────────────────────────────────────── */

    /** GET /api/contact — Liste tous les messages */
    #[Route('', name: 'api_contact_list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_PHOTOGRAPHE');
        $messages = $this->repo->findBy([], ['createdAt' => 'DESC']);
        return $this->json(array_map([$this, 'serialize'], $messages));
    }

    /** GET /api/contact/unread-count — Compteurs pour la cloche */
    #[Route('/unread-count', name: 'api_contact_unread_count', methods: ['GET'])]
    public function unreadCount(): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_PHOTOGRAPHE');

        $unreadMessages  = $this->repo->count(['isRead' => false]);
        $pendingBookings = $this->bookingRepo->count(['status' => 'pending']);

        return $this->json([
            'unreadMessages'  => $unreadMessages,
            'pendingBookings' => $pendingBookings,
            'total'           => $unreadMessages + $pendingBookings,
        ]);
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

    /** POST /api/contact/{id}/reply — Répondre à un message */
    #[Route('/{id}/reply', name: 'api_contact_reply', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function reply(int $id, Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_PHOTOGRAPHE');

        $msg = $this->repo->find($id);
        if (!$msg) return $this->json(['error' => 'Message non trouvé'], 404);

        $data  = json_decode($request->getContent(), true) ?? [];
        $reply = trim($data['reply'] ?? '');

        if (strlen($reply) < 5) {
            return $this->json(['error' => 'La réponse doit contenir au moins 5 caractères'], 400);
        }

        $msg->setReplyBody($reply)
            ->setRepliedAt(new \DateTime())
            ->setIsRead(true);

        $this->em->flush();

        return $this->json([
            'success' => true,
            'message' => 'Réponse enregistrée avec succès',
            'contact' => $this->serialize($msg),
        ]);
    }

    /** DELETE /api/contact/{id} — Supprimer un message */
    #[Route('/{id}', name: 'api_contact_delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function delete(int $id): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_PHOTOGRAPHE');

        $msg = $this->repo->find($id);
        if (!$msg) return $this->json(['error' => 'Message non trouvé'], 404);

        $this->em->remove($msg);
        $this->em->flush();

        return $this->json(['success' => true, 'message' => 'Message supprimé']);
    }

    /* ── Sérialisation ──────────────────────────────────────────────────────── */

    private function serialize(ContactMessage $m): array
    {
        return [
            'id'          => $m->getId(),
            'senderName'  => $m->getSenderName(),
            'senderEmail' => $m->getSenderEmail(),
            'subject'     => $m->getSubject(),
            'body'        => $m->getBody(),
            'isRead'      => $m->isRead() ?? false,
            'replyBody'   => $m->getReplyBody(),
            'repliedAt'   => $m->getRepliedAt()?->format('c'),
            'createdAt'   => $m->getCreatedAt()?->format('c'),
        ];
    }
}
