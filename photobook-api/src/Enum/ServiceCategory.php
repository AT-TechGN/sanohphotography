<?php

namespace App\Enum;

/**
 * Catégories de services selon le cahier des charges
 */
enum ServiceCategory: string
{
    // Catégorie Événementielle
    case MARIAGE = 'mariage';
    case FIANCAILLES = 'fiancailles';
    case BAPTEME = 'bapteme';
    case COMMUNION = 'communion';
    case ANNIVERSAIRE = 'anniversaire';
    case CEREMONIE = 'ceremonie';
    
    // Catégorie Commerciale
    case SHOPPING = 'shopping';
    case MODE = 'mode';
    case CATALOGUE = 'catalogue';
    case CORPORATE = 'corporate';
    case CULINAIRE = 'culinaire';
    
    // Catégorie Personnelle
    case PORTRAIT = 'portrait';
    case GROSSESSE = 'grossesse';
    case NAISSANCE = 'naissance';
    case FAMILLE = 'famille';
    case BOOK_ARTISTIQUE = 'book_artistique';

    /**
     * Obtenir toutes les valeurs
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * Obtenir le label français
     */
    public function label(): string
    {
        return match($this) {
            self::MARIAGE => 'Mariage & Fiançailles',
            self::FIANCAILLES => 'Fiançailles',
            self::BAPTEME => 'Baptême & Communion',
            self::COMMUNION => 'Communion',
            self::ANNIVERSAIRE => 'Anniversaire & Fête',
            self::CEREMONIE => 'Cérémonie religieuse',
            self::SHOPPING => 'Photographie Shopping / Mode',
            self::MODE => 'Mode',
            self::CATALOGUE => 'Catalogue produit',
            self::CORPORATE => 'Photo Corporate / RH',
            self::CULINAIRE => 'Photographie culinaire',
            self::PORTRAIT => 'Portrait individuel',
            self::GROSSESSE => 'Grossesse & Naissance',
            self::NAISSANCE => 'Naissance',
            self::FAMILLE => 'Photo de famille',
            self::BOOK_ARTISTIQUE => 'Book artistique',
        };
    }

    /**
     * Obtenir la catégorie principale
     */
    public function mainCategory(): string
    {
        return match($this) {
            self::MARIAGE, self::FIANCAILLES, self::BAPTEME, 
            self::COMMUNION, self::ANNIVERSAIRE, self::CEREMONIE => 'Événementielle',
            
            self::SHOPPING, self::MODE, self::CATALOGUE, 
            self::CORPORATE, self::CULINAIRE => 'Commerciale',
            
            self::PORTRAIT, self::GROSSESSE, self::NAISSANCE, 
            self::FAMILLE, self::BOOK_ARTISTIQUE => 'Personnelle',
        };
    }
}
