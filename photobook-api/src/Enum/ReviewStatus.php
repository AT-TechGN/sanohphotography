<?php

namespace App\Enum;

/**
 * Statuts d'avis clients pour le système de modération
 */
enum ReviewStatus: string
{
    case PENDING = 'pending';       // En attente de modération
    case APPROVED = 'approved';     // Approuvé et publié
    case REJECTED = 'rejected';     // Rejeté par le modérateur

    /**
     * Obtenir le label français
     */
    public function label(): string
    {
        return match($this) {
            self::PENDING => 'En attente de modération',
            self::APPROVED => 'Approuvé',
            self::REJECTED => 'Rejeté',
        };
    }

    /**
     * Vérifier si l'avis est visible publiquement
     */
    public function isPublic(): bool
    {
        return $this === self::APPROVED;
    }
}
