<?php

namespace App\Entity;

use App\Repository\EmployeeRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: EmployeeRepository::class)]
class Employee
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 100)]
    private ?string $position = null;

    #[ORM\Column(length: 20)]
    private ?string $contractType = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2)]
    private ?string $hourlyRate = null;

    #[ORM\Column(type: Types::DATE_MUTABLE)]
    private ?\DateTime $hireDate = null;

    #[ORM\Column]
    private ?bool $isActive = null;

    #[ORM\Column(nullable: true)]
    private ?array $specializations = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $bio = null;

    #[ORM\OneToOne(inversedBy: 'employee', cascade: ['persist', 'remove'])]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $user = null;

    /**
     * @var Collection<int, Booking>
     */
    #[ORM\OneToMany(targetEntity: Booking::class, mappedBy: 'employee')]
    private Collection $bookings;

    /**
     * @var Collection<int, Availability>
     */
    #[ORM\OneToMany(targetEntity: Availability::class, mappedBy: 'employee')]
    private Collection $availabilities;

    /**
     * @var Collection<int, BlockedSlot>
     */
    #[ORM\OneToMany(targetEntity: BlockedSlot::class, mappedBy: 'employee')]
    private Collection $blockedSlots;

    public function __construct()
    {
        $this->bookings = new ArrayCollection();
        $this->availabilities = new ArrayCollection();
        $this->blockedSlots = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getPosition(): ?string
    {
        return $this->position;
    }

    public function setPosition(string $position): static
    {
        $this->position = $position;

        return $this;
    }

    public function getContractType(): ?string
    {
        return $this->contractType;
    }

    public function setContractType(string $contractType): static
    {
        $this->contractType = $contractType;

        return $this;
    }

    public function getHourlyRate(): ?string
    {
        return $this->hourlyRate;
    }

    public function setHourlyRate(string $hourlyRate): static
    {
        $this->hourlyRate = $hourlyRate;

        return $this;
    }

    public function getHireDate(): ?\DateTime
    {
        return $this->hireDate;
    }

    public function setHireDate(\DateTime $hireDate): static
    {
        $this->hireDate = $hireDate;

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

    public function getSpecializations(): ?array
    {
        return $this->specializations;
    }

    public function setSpecializations(?array $specializations): static
    {
        $this->specializations = $specializations;

        return $this;
    }

    public function getBio(): ?string
    {
        return $this->bio;
    }

    public function setBio(?string $bio): static
    {
        $this->bio = $bio;

        return $this;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(User $user): static
    {
        $this->user = $user;

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
            $booking->setEmployee($this);
        }

        return $this;
    }

    public function removeBooking(Booking $booking): static
    {
        if ($this->bookings->removeElement($booking)) {
            // set the owning side to null (unless already changed)
            if ($booking->getEmployee() === $this) {
                $booking->setEmployee(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, Availability>
     */
    public function getAvailabilities(): Collection
    {
        return $this->availabilities;
    }

    public function addAvailability(Availability $availability): static
    {
        if (!$this->availabilities->contains($availability)) {
            $this->availabilities->add($availability);
            $availability->setEmployee($this);
        }

        return $this;
    }

    public function removeAvailability(Availability $availability): static
    {
        if ($this->availabilities->removeElement($availability)) {
            // set the owning side to null (unless already changed)
            if ($availability->getEmployee() === $this) {
                $availability->setEmployee(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, BlockedSlot>
     */
    public function getBlockedSlots(): Collection
    {
        return $this->blockedSlots;
    }

    public function addBlockedSlot(BlockedSlot $blockedSlot): static
    {
        if (!$this->blockedSlots->contains($blockedSlot)) {
            $this->blockedSlots->add($blockedSlot);
            $blockedSlot->setEmployee($this);
        }

        return $this;
    }

    public function removeBlockedSlot(BlockedSlot $blockedSlot): static
    {
        if ($this->blockedSlots->removeElement($blockedSlot)) {
            // set the owning side to null (unless already changed)
            if ($blockedSlot->getEmployee() === $this) {
                $blockedSlot->setEmployee(null);
            }
        }

        return $this;
    }
}
