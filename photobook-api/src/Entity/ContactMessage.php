<?php

namespace App\Entity;

use App\Repository\ContactMessageRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: ContactMessageRepository::class)]
class ContactMessage
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 100)]
    private ?string $senderName = null;

    #[ORM\Column(length: 180)]
    private ?string $senderEmail = null;

    #[ORM\Column(length: 150)]
    private ?string $subject = null;

    #[ORM\Column(type: Types::TEXT)]
    private ?string $body = null;

    #[ORM\Column]
    private ?bool $isRead = false;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $replyBody = null;

    #[ORM\Column(nullable: true)]
    private ?\DateTime $repliedAt = null;

    #[ORM\Column]
    private ?\DateTime $createdAt = null;

    // ── Getters / Setters ─────────────────────────────────────────────────────

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getSenderName(): ?string
    {
        return $this->senderName;
    }

    public function setSenderName(string $senderName): static
    {
        $this->senderName = $senderName;
        return $this;
    }

    public function getSenderEmail(): ?string
    {
        return $this->senderEmail;
    }

    public function setSenderEmail(string $senderEmail): static
    {
        $this->senderEmail = $senderEmail;
        return $this;
    }

    public function getSubject(): ?string
    {
        return $this->subject;
    }

    public function setSubject(string $subject): static
    {
        $this->subject = $subject;
        return $this;
    }

    public function getBody(): ?string
    {
        return $this->body;
    }

    public function setBody(string $body): static
    {
        $this->body = $body;
        return $this;
    }

    public function isRead(): ?bool
    {
        return $this->isRead;
    }

    public function setIsRead(bool $isRead): static
    {
        $this->isRead = $isRead;
        return $this;
    }

    public function getReplyBody(): ?string
    {
        return $this->replyBody;
    }

    public function setReplyBody(?string $replyBody): static
    {
        $this->replyBody = $replyBody;
        return $this;
    }

    public function getRepliedAt(): ?\DateTime
    {
        return $this->repliedAt;
    }

    public function setRepliedAt(?\DateTime $repliedAt): static
    {
        $this->repliedAt = $repliedAt;
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
}
