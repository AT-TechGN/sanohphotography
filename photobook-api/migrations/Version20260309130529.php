<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260309130529 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE album (id INT AUTO_INCREMENT NOT NULL, title VARCHAR(150) NOT NULL, description LONGTEXT NOT NULL, category VARCHAR(50) NOT NULL, is_public TINYINT NOT NULL, published_at DATETIME DEFAULT NULL, created_at DATETIME NOT NULL, booking_id INT DEFAULT NULL, INDEX IDX_39986E433301C60 (booking_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE availability (id INT AUTO_INCREMENT NOT NULL, day_of_week SMALLINT DEFAULT NULL, start_time TIME NOT NULL, end_time TIME NOT NULL, is_recurring TINYINT NOT NULL, specific_date DATE DEFAULT NULL, employee_id INT DEFAULT NULL, INDEX IDX_3FB7A2BF8C03F15C (employee_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE blocked_slot (id INT AUTO_INCREMENT NOT NULL, start_datetime DATETIME NOT NULL, end_datetime DATETIME NOT NULL, reason VARCHAR(30) NOT NULL, description VARCHAR(255) DEFAULT NULL, employee_id INT NOT NULL, INDEX IDX_5013E7198C03F15C (employee_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE booking (id INT AUTO_INCREMENT NOT NULL, booking_date DATE NOT NULL, start_time TIME NOT NULL, status VARCHAR(20) NOT NULL, total_price NUMERIC(10, 2) NOT NULL, end_time TIME DEFAULT NULL, client_notes LONGTEXT DEFAULT NULL, internal_notes LONGTEXT DEFAULT NULL, created_at DATETIME NOT NULL, relation VARCHAR(1) DEFAULT NULL, client_id INT NOT NULL, service_id INT NOT NULL, employee_id INT DEFAULT NULL, INDEX IDX_E00CEDDE19EB6921 (client_id), INDEX IDX_E00CEDDEED5CA9E6 (service_id), INDEX IDX_E00CEDDE8C03F15C (employee_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE contact_message (id INT AUTO_INCREMENT NOT NULL, sender_name VARCHAR(100) NOT NULL, sender_email VARCHAR(180) NOT NULL, subject VARCHAR(150) NOT NULL, body LONGTEXT NOT NULL, is_read TINYINT NOT NULL, replied_at DATETIME DEFAULT NULL, created_at DATETIME NOT NULL, PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE employee (id INT AUTO_INCREMENT NOT NULL, position VARCHAR(100) NOT NULL, contract_type VARCHAR(20) NOT NULL, hourly_rate NUMERIC(10, 2) NOT NULL, hire_date DATE NOT NULL, is_active TINYINT NOT NULL, specializations JSON DEFAULT NULL, bio LONGTEXT DEFAULT NULL, user_id INT NOT NULL, UNIQUE INDEX UNIQ_5D9F75A1A76ED395 (user_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE invoice (id INT AUTO_INCREMENT NOT NULL, invoice_number VARCHAR(30) NOT NULL, amount_ht NUMERIC(10, 2) NOT NULL, tax_rate NUMERIC(5, 2) NOT NULL, amount_ttc NUMERIC(10, 2) NOT NULL, status VARCHAR(20) NOT NULL, due_date DATE DEFAULT NULL, paid_at DATETIME DEFAULT NULL, pdf_path VARCHAR(255) DEFAULT NULL, created_at DATETIME NOT NULL, booking_id INT NOT NULL, UNIQUE INDEX UNIQ_906517443301C60 (booking_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE notification (id INT AUTO_INCREMENT NOT NULL, type VARCHAR(50) NOT NULL, title VARCHAR(150) NOT NULL, message LONGTEXT NOT NULL, is_read TINYINT NOT NULL, relate_entity VARCHAR(50) NOT NULL, related_id INT DEFAULT NULL, created_at DATETIME NOT NULL, user_id INT DEFAULT NULL, INDEX IDX_BF5476CAA76ED395 (user_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE photo (id INT AUTO_INCREMENT NOT NULL, file_path VARCHAR(255) NOT NULL, thumbnail_path VARCHAR(255) DEFAULT NULL, original_filename VARCHAR(255) DEFAULT NULL, file_size BIGINT DEFAULT NULL, width INT DEFAULT NULL, height INT DEFAULT NULL, taken_at DATETIME DEFAULT NULL, is_featured TINYINT NOT NULL, sort_order INT NOT NULL, album_id INT NOT NULL, tags_id INT DEFAULT NULL, INDEX IDX_14B784181137ABCF (album_id), INDEX IDX_14B784188D7B4FB4 (tags_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE review (id INT AUTO_INCREMENT NOT NULL, rating SMALLINT NOT NULL, title VARCHAR(100) NOT NULL, content LONGTEXT NOT NULL, status VARCHAR(20) NOT NULL, is_featured TINYINT NOT NULL, moderated_at DATETIME DEFAULT NULL, created_at DATETIME NOT NULL, client_id INT NOT NULL, INDEX IDX_794381C619EB6921 (client_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE service (id INT AUTO_INCREMENT NOT NULL, name VARCHAR(100) NOT NULL, category VARCHAR(50) NOT NULL, description LONGTEXT DEFAULT NULL, duration_min INT NOT NULL, base_price NUMERIC(10, 2) NOT NULL, max_participants INT DEFAULT NULL, thumbnail VARCHAR(255) DEFAULT NULL, is_active TINYINT NOT NULL, sort_order SMALLINT NOT NULL, PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE tag (id INT AUTO_INCREMENT NOT NULL, name VARCHAR(50) NOT NULL, slug VARCHAR(50) NOT NULL, PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE user (id INT AUTO_INCREMENT NOT NULL, email VARCHAR(180) NOT NULL, roles JSON NOT NULL, password VARCHAR(255) NOT NULL, first_name VARCHAR(80) NOT NULL, last_name VARCHAR(80) NOT NULL, phone VARCHAR(20) DEFAULT NULL, avatar VARCHAR(255) DEFAULT NULL, is_active TINYINT NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, UNIQUE INDEX UNIQ_IDENTIFIER_EMAIL (email), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE album ADD CONSTRAINT FK_39986E433301C60 FOREIGN KEY (booking_id) REFERENCES booking (id)');
        $this->addSql('ALTER TABLE availability ADD CONSTRAINT FK_3FB7A2BF8C03F15C FOREIGN KEY (employee_id) REFERENCES employee (id)');
        $this->addSql('ALTER TABLE blocked_slot ADD CONSTRAINT FK_5013E7198C03F15C FOREIGN KEY (employee_id) REFERENCES employee (id)');
        $this->addSql('ALTER TABLE booking ADD CONSTRAINT FK_E00CEDDE19EB6921 FOREIGN KEY (client_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE booking ADD CONSTRAINT FK_E00CEDDEED5CA9E6 FOREIGN KEY (service_id) REFERENCES service (id)');
        $this->addSql('ALTER TABLE booking ADD CONSTRAINT FK_E00CEDDE8C03F15C FOREIGN KEY (employee_id) REFERENCES employee (id)');
        $this->addSql('ALTER TABLE employee ADD CONSTRAINT FK_5D9F75A1A76ED395 FOREIGN KEY (user_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE invoice ADD CONSTRAINT FK_906517443301C60 FOREIGN KEY (booking_id) REFERENCES booking (id)');
        $this->addSql('ALTER TABLE notification ADD CONSTRAINT FK_BF5476CAA76ED395 FOREIGN KEY (user_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE photo ADD CONSTRAINT FK_14B784181137ABCF FOREIGN KEY (album_id) REFERENCES album (id)');
        $this->addSql('ALTER TABLE photo ADD CONSTRAINT FK_14B784188D7B4FB4 FOREIGN KEY (tags_id) REFERENCES tag (id)');
        $this->addSql('ALTER TABLE review ADD CONSTRAINT FK_794381C619EB6921 FOREIGN KEY (client_id) REFERENCES user (id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE album DROP FOREIGN KEY FK_39986E433301C60');
        $this->addSql('ALTER TABLE availability DROP FOREIGN KEY FK_3FB7A2BF8C03F15C');
        $this->addSql('ALTER TABLE blocked_slot DROP FOREIGN KEY FK_5013E7198C03F15C');
        $this->addSql('ALTER TABLE booking DROP FOREIGN KEY FK_E00CEDDE19EB6921');
        $this->addSql('ALTER TABLE booking DROP FOREIGN KEY FK_E00CEDDEED5CA9E6');
        $this->addSql('ALTER TABLE booking DROP FOREIGN KEY FK_E00CEDDE8C03F15C');
        $this->addSql('ALTER TABLE employee DROP FOREIGN KEY FK_5D9F75A1A76ED395');
        $this->addSql('ALTER TABLE invoice DROP FOREIGN KEY FK_906517443301C60');
        $this->addSql('ALTER TABLE notification DROP FOREIGN KEY FK_BF5476CAA76ED395');
        $this->addSql('ALTER TABLE photo DROP FOREIGN KEY FK_14B784181137ABCF');
        $this->addSql('ALTER TABLE photo DROP FOREIGN KEY FK_14B784188D7B4FB4');
        $this->addSql('ALTER TABLE review DROP FOREIGN KEY FK_794381C619EB6921');
        $this->addSql('DROP TABLE album');
        $this->addSql('DROP TABLE availability');
        $this->addSql('DROP TABLE blocked_slot');
        $this->addSql('DROP TABLE booking');
        $this->addSql('DROP TABLE contact_message');
        $this->addSql('DROP TABLE employee');
        $this->addSql('DROP TABLE invoice');
        $this->addSql('DROP TABLE notification');
        $this->addSql('DROP TABLE photo');
        $this->addSql('DROP TABLE review');
        $this->addSql('DROP TABLE service');
        $this->addSql('DROP TABLE tag');
        $this->addSql('DROP TABLE user');
    }
}
