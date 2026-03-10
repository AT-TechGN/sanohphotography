<?php

namespace App\Enum;

/**
 * Statuts de réservation selon le workflow du cahier des charges
 */
enum BookingStatus: string
{
    case PENDING = 'pending';           // En attente de confirmation
    case CONFIRMED = 'confirmed';       // Confirmée par le photographe
    case IN_PROGRESS = 'in_progress';   // Séance en cours
    case COMPLETED = 'completed';       // Terminée
    case CANCELLED = 'cancelled';       // Annulée

    /**
     * Obtenir le label français
     */
    public function label(): string
    {
        return match($this) {
            self::PENDING => 'En attente',
            self::CONFIRMED => 'Confirmée',
            self::IN_PROGRESS => 'En cours',
            self::COMPLETED => 'Terminée',
            self::CANCELLED => 'Annulée',
        };
    }

    /**
     * Vérifier si le statut permet l'annulation
     */
    public function canBeCancelled(): bool
    {
        return in_array($this, [self::PENDING, self::CONFIRMED]);
    }

    /**
     * Vérifier si le statut permet la modification
     */
    public function canBeModified(): bool
    {
        return in_array($this, [self::PENDING, self::CONFIRMED]);
    }

    /**
     * Obtenir les transitions possibles
     */
    public function allowedTransitions(): array
    {
        return match($this) {
            self::PENDING => [self::CONFIRMED, self::CANCELLED],
            self::CONFIRMED => [self::IN_PROGRESS, self::CANCELLED],
            self::IN_PROGRESS => [self::COMPLETED],
            self::COMPLETED => [],
            self::CANCELLED => [],
        };
    }
}
