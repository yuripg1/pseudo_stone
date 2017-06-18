DROP SCHEMA IF EXISTS pseudo_stone;
CREATE SCHEMA pseudo_stone DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci;
USE pseudo_stone;
CREATE TABLE transaction(
  recipientTransactionId BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  sale_affiliation_key BINARY(16) NOT NULL
  initiatorTransactionId VARCHAR(255) NULL,
  authorisationResponse VARCHAR(255) NULL,
  authorisationResponseReason VARCHAR(255) NULL,
  completionRequired TINYINT UNSIGNED NULL,
  amount INT UNSIGNED NULL,
  cancelled TINYINT UNSIGNED NULL,
  dateCreated DATETIME NULL,
  PRIMARY KEY (recipientTransactionId)
)ENGINE = InnoDB;
