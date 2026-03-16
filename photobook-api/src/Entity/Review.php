<?php

namespace App\Entity;

use App\Repository\ReviewRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: ReviewRepository::class)]
class Review
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(type: Types::SMALLINT)]
    #[Groups(['review:read', 'review:write'])]
    #[Assert\NotBlank(message: 'La note est requise')]
    #[Assert\Range(min: 1, max: 5, notInRangeMessage: 'La note doit être entre {{ min }} et {{ max }} étoiles')]
    private ?int $rating = null;

    #[ORM\Column(length: 100)]
    #[Groups(['review:read', 'review:write'])]
    #[Assert\NotBlank(message: 'Le titre est requis')]
    #[Assert\Length(min: 5, max: 100, minMessage: 'Le titre doit contenir au moins {{ limit }} caractères')]
    private ?string $title = null;

    #[ORM\Column(type: Types::TEXT)]
    #[Groups(['review:read', 'review:write'])]
    #[Assert\NotBlank(message: 'Le contenu est requis')]
    #[Assert\Length(min: 20, max: 1000, minMessage: 'Le contenu doit contenir au moins {{ limit }} caractères')]
    private ?string $content = null;

    #[ORM\Column(length: 20)]
    #[Groups(['review:read'])]
    #[Assert\Choice(choices: ['pending', 'approved', 'rejected'], message: 'Statut invalide')]
    private ?string $status = null;

    #[ORM\Column]
    #[Groups(['review:read'])]
    private ?bool $isFeatured = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['review:read'])]
    private ?\DateTime $moderatedAt = null;

    #[ORM\Column]
    #[Groups(['review:read'])]
    private ?\DateTime $createdAt = null;

    #[ORM\ManyToOne(inversedBy: 'reviews')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['review:read'])]
    private ?User $client = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getRating(): ?int
    {
        return $this->rating;
    }

    public function setRating(int $rating): static
    {
        $this->rating = $rating;

        return $this;
    }

    public function getTitle(): ?string
    {
        return $this->title;
    }

    public function setTitle(string $title): static
    {
        $this->title = $title;

        return $this;
    }

    public function getContent(): ?string
    {
        return $this->content;
    }

    public function setContent(string $content): static
    {
        $this->content = $content;

        return $this;
    }

    public function getStatus(): ?string
    {
        return $this->status;
    }

    public function setStatus(string $status): static
    {
        $this->status = $status;

        return $this;
    }

    public function isFeatured(): ?bool
    {
        return $this->isFeatured;
    }

    public function setIsFeatured(bool $isFeatured): static
    {
        $this->isFeatured = $isFeatured;

        return $this;
    }

    public function getModeratedAt(): ?\DateTime
    {
        return $this->moderatedAt;
    }

    public function setModeratedAt(?\DateTime $moderatedAt): static
    {
        $this->moderatedAt = $moderatedAt;

        return $this;
    }

    public function getCreatedAt(): ?\DateTime
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTime $createdAt): static
    {
        $this->createdAt = $createdAt;

        return $this;
    }

    public function getClient(): ?User
    {
        return $this->client;
    }

    public function setClient(?User $client): static
    {
        $this->client = $client;

        return $this;
    }
}
