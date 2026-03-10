<?php

namespace App\Enum;

/**
 * Périodes de filtrage pour la galerie photo (cahier des charges)
 */
enum PhotoPeriod: string
{
    case TODAY = 'today';
    case WEEK = 'week';
    case MONTH = 'month';
    case ALL = 'all';

    /**
     * Obtenir le label français
     */
    public function label(): string
    {
        return match($this) {
            self::TODAY => "Aujourd'hui",
            self::WEEK => 'Cette semaine',
            self::MONTH => 'Ce mois',
            self::ALL => 'Toutes',
        };
    }

    /**
     * Obtenir la date de début pour le filtre
     */
    public function getStartDate(): ?\DateTime
    {
        return match($this) {
            self::TODAY => new \DateTime('today'),
            self::WEEK => new \DateTime('-1 week'),
            self::MONTH => new \DateTime('-1 month'),
            self::ALL => null,
        };
    }
}
