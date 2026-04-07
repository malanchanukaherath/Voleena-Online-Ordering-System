-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: localhost    Database: voleena_foods_db
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `daily_stock`
--

DROP TABLE IF EXISTS `daily_stock`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `daily_stock` (
  `stock_id` int unsigned NOT NULL AUTO_INCREMENT,
  `menu_item_id` int unsigned NOT NULL,
  `stock_date` date NOT NULL,
  `opening_quantity` int NOT NULL DEFAULT '0',
  `sold_quantity` int NOT NULL DEFAULT '0',
  `adjusted_quantity` int NOT NULL DEFAULT '0',
  `closing_quantity` int GENERATED ALWAYS AS (((`opening_quantity` - `sold_quantity`) + `adjusted_quantity`)) STORED,
  `version` int NOT NULL DEFAULT '0',
  `updated_by` int unsigned DEFAULT NULL,
  `last_updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`stock_id`),
  UNIQUE KEY `uk_item_date` (`menu_item_id`,`stock_date`),
  KEY `idx_stock_date` (`stock_date`),
  KEY `idx_closing_qty` (`closing_quantity`),
  KEY `idx_updated_by` (`updated_by`),
  KEY `idx_stock_item_date` (`menu_item_id`,`stock_date`,`closing_quantity`),
  KEY `idx_stock_menu_date` (`menu_item_id`,`stock_date`),
  CONSTRAINT `fk_stock_menu_item` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_item` (`menu_item_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_stock_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `staff` (`staff_id`) ON DELETE SET NULL,
  CONSTRAINT `chk_opening_positive` CHECK ((`opening_quantity` >= 0)),
  CONSTRAINT `chk_sold_positive` CHECK ((`sold_quantity` >= 0)),
  CONSTRAINT `chk_stock_valid` CHECK ((`closing_quantity` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `daily_stock`
--

LOCK TABLES `daily_stock` WRITE;
/*!40000 ALTER TABLE `daily_stock` DISABLE KEYS */;
INSERT INTO `daily_stock` (`stock_id`, `menu_item_id`, `stock_date`, `opening_quantity`, `sold_quantity`, `adjusted_quantity`, `version`, `updated_by`, `last_updated`) VALUES (1,1,'2026-04-05',12,3,0,1,NULL,'2026-04-05 11:43:53');
/*!40000 ALTER TABLE `daily_stock` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-07 10:36:42
