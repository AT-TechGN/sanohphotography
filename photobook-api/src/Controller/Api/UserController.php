<?php

namespace App\Controller\Api;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api')]
final class UserController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private UserPasswordHasherInterface $hasher,
        private ValidatorInterface $validator
    ) {}

    /** GET /api/me */
    #[Route('/me', name: 'api_me', methods: ['GET'])]
    public function me(): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        return $this->json($this->serialize($this->getUser()));
    }

    /** PATCH /api/me — Mettre à jour son profil */
    #[Route('/me', name: 'api_me_update', methods: ['PATCH', 'PUT'])]
    public function update(Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        /** @var User $user */
        $user = $this->getUser();
        $data = json_decode($request->getContent(), true) ?? [];

        if (isset($data['firstName']))   $user->setFirstName($data['firstName']);
        if (isset($data['lastName']))    $user->setLastName($data['lastName']);
        if (isset($data['phone']))       $user->setPhone($data['phone']);
        if (isset($data['avatar']))      $user->setAvatar($data['avatar']);

        // Changement de mot de passe
        if (!empty($data['newPassword'])) {
            if (empty($data['currentPassword'])) {
                return $this->json(['error' => 'Mot de passe actuel requis'], 400);
            }
            if (!$this->hasher->isPasswordValid($user, $data['currentPassword'])) {
                return $this->json(['error' => 'Mot de passe actuel incorrect'], 400);
            }
            if (strlen($data['newPassword']) < 6) {
                return $this->json(['error' => 'Le nouveau mot de passe doit contenir au moins 6 caractères'], 400);
            }
            $user->setPassword($this->hasher->hashPassword($user, $data['newPassword']));
        }

        $user->setUpdatedAt(new \DateTime());
        $this->em->flush();

        // Mettre à jour le localStorage côté client via la réponse
        return $this->json([
            'message' => 'Profil mis à jour avec succès',
            'user'    => $this->serialize($user),
        ]);
    }

    /** DELETE /api/me — Supprimer son compte */
    #[Route('/me', name: 'api_me_delete', methods: ['DELETE'])]
    public function delete(Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        /** @var User $user */
        $user = $this->getUser();
        $data = json_decode($request->getContent(), true) ?? [];

        if (empty($data['password'])) {
            return $this->json(['error' => 'Mot de passe requis pour supprimer le compte'], 400);
        }
        if (!$this->hasher->isPasswordValid($user, $data['password'])) {
            return $this->json(['error' => 'Mot de passe incorrect'], 400);
        }

        $this->em->remove($user);
        $this->em->flush();

        return $this->json(['message' => 'Compte supprimé avec succès']);
    }

    private function serialize(?User $user): array
    {
        if (!$user) return [];
        return [
            'id'        => $user->getId(),
            'email'     => $user->getEmail(),
            'firstName' => $user->getFirstName(),
            'lastName'  => $user->getLastName(),
            'phone'     => $user->getPhone(),
            'avatar'    => $user->getAvatar(),
            'roles'     => $user->getRoles(),
            'isActive'  => $user->isActive(),
            'createdAt' => $user->getCreatedAt()?->format('Y-m-d'),
        ];
    }
}
