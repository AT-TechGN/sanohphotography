<?php

namespace App\Enum;

/**
 * Statuts de facture selon le cahier des charges
 */
enum InvoiceStatus: string
{
    case PENDING = 'pending';       // En attente de paiement
    case PAID = 'paid';            // Payée
    case CANCELLED = 'cancelled';   // Annulée

    /**
     * Obtenir le label français
     */
    public function label(): string
    {
        return match($this) {
            self::PENDING => 'En attente de paiement',
            self::PAID => 'Payée',
            self::CANCELLED => 'Annulée',
        };
    }

    /**
     * Vérifier si la facture peut être annulée
     */
    public function canBeCancelled(): bool
    {
        return $this === self::PENDING;
    }
}
