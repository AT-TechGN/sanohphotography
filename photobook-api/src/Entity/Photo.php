<?php

namespace App\Entity;

use App\Repository\PhotoRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: PhotoRepository::class)]
class Photo
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Groups(['photo:read', 'album:read'])]
    #[Assert\NotBlank(message: 'Le chemin du fichier est requis')]
    private ?string $filePath = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['photo:read', 'album:read'])]
    private ?string $thumbnailPath = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['photo:read'])]
    private ?string $originalFilename = null;

    #[ORM\Column(type: Types::BIGINT, nullable: true)]
    #[Groups(['photo:read'])]
    private ?string $fileSize = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['photo:read'])]
    private ?int $width = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['photo:read'])]
    private ?int $height = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['photo:read', 'photo:write'])]
    private ?\DateTime $takenAt = null;

    #[ORM\Column]
    #[Groups(['photo:read', 'photo:write'])]
    private ?bool $isFeatured = null;

    #[ORM\Column]
    #[Groups(['photo:read', 'photo:write'])]
    #[Assert\PositiveOrZero(message: 'L\'ordre doit être positif ou zéro')]
    private ?int $sortOrder = null;

    #[ORM\ManyToOne(inversedBy: 'photos')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['photo:read', 'photo:write'])]
    private ?Album $album = null;

    /**
     * @var Collection<int, Tag>
     */
    #[ORM\ManyToMany(targetEntity: Tag::class, inversedBy: 'photos')]
    #[ORM\JoinTable(name: 'photo_tag')]
    private Collection $tags;

    public function __construct()
    {
        $this->tags = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getFilePath(): ?string
    {
        return $this->filePath;
    }

    public function setFilePath(string $filePath): static
    {
        $this->filePath = $filePath;

        return $this;
    }

    public function getThumbnailPath(): ?string
    {
        return $this->thumbnailPath;
    }

    public function setThumbnailPath(?string $thumbnailPath): static
    {
        $this->thumbnailPath = $thumbnailPath;

        return $this;
    }

    public function getOriginalFilename(): ?string
    {
        return $this->originalFilename;
    }

    public function setOriginalFilename(?string $originalFilename): static
    {
        $this->originalFilename = $originalFilename;

        return $this;
    }

    public function getFileSize(): ?string
    {
        return $this->fileSize;
    }

    public function setFileSize(?string $fileSize): static
    {
        $this->fileSize = $fileSize;

        return $this;
    }

    public function getWidth(): ?int
    {
        return $this->width;
    }

    public function setWidth(?int $width): static
    {
        $this->width = $width;

        return $this;
    }

    public function getHeight(): ?int
    {
        return $this->height;
    }

    public function setHeight(?int $height): static
    {
        $this->height = $height;

        return $this;
    }

    public function getTakenAt(): ?\DateTime
    {
        return $this->takenAt;
    }

    public function setTakenAt(?\DateTime $takenAt): static
    {
        $this->takenAt = $takenAt;

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

    public function getSortOrder(): ?int
    {
        return $this->sortOrder;
    }

    public function setSortOrder(int $sortOrder): static
    {
        $this->sortOrder = $sortOrder;

        return $this;
    }

    public function getAlbum(): ?Album
    {
        return $this->album;
    }

    public function setAlbum(?Album $album): static
    {
        $this->album = $album;

        return $this;
    }

    /**
     * @return Collection<int, Tag>
     */
    public function getTags(): Collection
    {
        return $this->tags;
    }

    public function addTag(Tag $tag): static
    {
        if (!$this->tags->contains($tag)) {
            $this->tags->add($tag);
        }

        return $this;
    }

    public function removeTag(Tag $tag): static
    {
        $this->tags->removeElement($tag);

        return $this;
    }
}
