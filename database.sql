DROP SCHEMA IF EXISTS pseudo_stone;
CREATE SCHEMA pseudo_stone DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci;
USE pseudo_stone;
CREATE TABLE transaction(
  recipientTransactionId BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  initiatorTransactionId VARCHAR(255) NULL DEFAULT NULL,
  authorisationResponse VARCHAR(255) NULL DEFAULT NULL,
  authorisationResponseReason VARCHAR(255) NULL DEFAULT NULL,
  completionRequired TINYINT UNSIGNED NULL DEFAULT NULL,
  PRIMARY KEY (recipientTransactionId)
)ENGINE = InnoDB;
