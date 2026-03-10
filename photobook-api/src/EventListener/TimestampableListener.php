<?php

namespace App\EventListener;

use Doctrine\Bundle\DoctrineBundle\Attribute\AsDoctrineListener;
use Doctrine\ORM\Event\PrePersistEventArgs;
use Doctrine\ORM\Event\PreUpdateEventArgs;
use Doctrine\ORM\Events;

#[AsDoctrineListener(event: Events::prePersist, priority: 500)]
#[AsDoctrineListener(event: Events::preUpdate, priority: 500)]
class TimestampableListener
{
    public function prePersist(PrePersistEventArgs $args): void
    {
        $entity = $args->getObject();

        // Vérifier si l'entité a une méthode setCreatedAt
        if (method_exists($entity, 'setCreatedAt') && method_exists($entity, 'getCreatedAt')) {
            if ($entity->getCreatedAt() === null) {
                $entity->setCreatedAt(new \DateTime());
            }
        }

        // Vérifier si l'entité a une méthode setUpdatedAt
        if (method_exists($entity, 'setUpdatedAt')) {
            $entity->setUpdatedAt(new \DateTime());
        }
    }

    public function preUpdate(PreUpdateEventArgs $args): void
    {
        $entity = $args->getObject();

        // Mettre à jour automatiquement updatedAt lors de la modification
        if (method_exists($entity, 'setUpdatedAt')) {
            $entity->setUpdatedAt(new \DateTime());
            
            // Forcer Doctrine à reconnaître le changement
            $em = $args->getObjectManager();
            $metadata = $em->getClassMetadata(get_class($entity));
            $em->getUnitOfWork()->recomputeSingleEntityChangeSet($metadata, $entity);
        }
    }
}
