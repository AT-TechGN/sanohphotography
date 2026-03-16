<?php

namespace App\Entity;

use App\Repository\ServiceRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: ServiceRepository::class)]
class Service
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 100)]
    #[Groups(['service:read', 'service:write', 'booking:read'])]
    #[Assert\NotBlank(message: 'Le nom du service est requis')]
    #[Assert\Length(min: 3, max: 100, minMessage: 'Le nom doit contenir au moins {{ limit }} caractères')]
    private ?string $name = null;

    #[ORM\Column(length: 50)]
    #[Groups(['service:read', 'service:write', 'booking:read'])]
    #[Assert\NotBlank(message: 'La catégorie est requise')]
    #[Assert\Choice(
        choices: ['mariage', 'fiancailles', 'bapteme', 'communion', 'anniversaire', 'ceremonie', 
                  'shopping', 'mode', 'catalogue', 'corporate', 'culinaire',
                  'portrait', 'grossesse', 'naissance', 'famille', 'book_artistique'],
        message: 'Catégorie invalide'
    )]
    private ?string $category = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['service:read', 'service:write'])]
    private ?string $description = null;

    #[ORM\Column]
    #[Groups(['service:read', 'service:write', 'booking:read'])]
    #[Assert\NotBlank(message: 'La durée est requise')]
    #[Assert\Positive(message: 'La durée doit être positive')]
    #[Assert\Range(min: 15, max: 480, notInRangeMessage: 'La durée doit être entre {{ min }} et {{ max }} minutes')]
    private ?int $durationMin = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2)]
    #[Groups(['service:read', 'service:write', 'booking:read'])]
    #[Assert\NotBlank(message: 'Le prix de base est requis')]
    #[Assert\Positive(message: 'Le prix doit être positif')]
    private ?string $basePrice = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['service:read', 'service:write'])]
    #[Assert\Positive(message: 'Le nombre de participants doit être positif')]
    private ?int $maxParticipants = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['service:read', 'service:write'])]
    private ?string $thumbnail = null;

    #[ORM\Column]
    #[Groups(['service:read', 'service:write'])]
    private ?bool $isActive = null;

    #[ORM\Column(type: Types::SMALLINT)]
    #[Groups(['service:read', 'service:write'])]
    #[Assert\PositiveOrZero(message: 'L\'ordre doit être positif ou zéro')]
    private ?int $sortOrder = null;

    /**
     * @var Collection<int, Booking>
     */
    #[ORM\OneToMany(targetEntity: Booking::class, mappedBy: 'service')]
    private Collection $bookings;

    public function __construct()
    {
        $this->bookings = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(string $name): static
    {
        $this->name = $name;

        return $this;
    }

    public function getCategory(): ?string
    {
        return $this->category;
    }

    public function setCategory(string $category): static
    {
        $this->category = $category;

        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): static
    {
        $this->description = $description;

        return $this;
    }

    public function getDurationMin(): ?int
    {
        return $this->durationMin;
    }

    public function setDurationMin(int $durationMin): static
    {
        $this->durationMin = $durationMin;

        return $this;
    }

    public function getBasePrice(): ?string
    {
        return $this->basePrice;
    }

    public function setBasePrice(string $basePrice): static
    {
        $this->basePrice = $basePrice;

        return $this;
    }

    public function getMaxParticipants(): ?int
    {
        return $this->maxParticipants;
    }

    public function setMaxParticipants(?int $maxParticipants): static
    {
        $this->maxParticipants = $maxParticipants;

        return $this;
    }

    public function getThumbnail(): ?string
    {
        return $this->thumbnail;
    }

    public function setThumbnail(?string $thumbnail): static
    {
        $this->thumbnail = $thumbnail;

        return $this;
    }

    public function isActive(): ?bool
    {
        return $this->isActive;
    }

    public function setIsActive(bool $isActive): static
    {
        $this->isActive = $isActive;

        return $this;
    }

    public function getSortOrder(): ?int
    {
        return $this->sortOrder;
    }

    public function setSortOrder(int $sortOrder): static
    {
        $this->sortOrder = $sortOrder;

        return $this;
    }

    /**
     * @return Collection<int, Booking>
     */
    public function getBookings(): Collection
    {
        return $this->bookings;
    }

    public function addBooking(Booking $booking): static
    {
        if (!$this->bookings->contains($booking)) {
            $this->bookings->add($booking);
            $booking->setService($this);
        }

        return $this;
    }

    public function removeBooking(Booking $booking): static
    {
        if ($this->bookings->removeElement($booking)) {
            // set the owning side to null (unless already changed)
            if ($booking->getService() === $this) {
                $booking->setService(null);
            }
        }

        return $this;
    }
}
