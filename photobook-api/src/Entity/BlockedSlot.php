<?php

namespace App\Entity;

use App\Repository\BlockedSlotRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: BlockedSlotRepository::class)]
class BlockedSlot
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column]
    private ?\DateTime $startDatetime = null;

    #[ORM\Column]
    private ?\DateTime $endDatetime = null;

    #[ORM\Column(length: 30)]
    private ?string $reason = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $description = null;

    #[ORM\ManyToOne(inversedBy: 'blockedSlots')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Employee $employee = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getStartDatetime(): ?\DateTime
    {
        return $this->startDatetime;
    }

    public function setStartDatetime(\DateTime $startDatetime): static
    {
        $this->startDatetime = $startDatetime;

        return $this;
    }

    public function getEndDatetime(): ?\DateTime
    {
        return $this->endDatetime;
    }

    public function setEndDatetime(\DateTime $endDatetime): static
    {
        $this->endDatetime = $endDatetime;

        return $this;
    }

    public function getReason(): ?string
    {
        return $this->reason;
    }

    public function setReason(string $reason): static
    {
        $this->reason = $reason;

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

    public function getEmployee(): ?Employee
    {
        return $this->employee;
    }

    public function setEmployee(?Employee $employee): static
    {
        $this->employee = $employee;

        return $this;
    }
}
