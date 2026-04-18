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
-- Table structure for table `activity_log`
--

DROP TABLE IF EXISTS `activity_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activity_log` (
  `log_id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_type` enum('CUSTOMER','STAFF','SYSTEM') COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` int unsigned DEFAULT NULL,
  `action` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `entity_id` int unsigned DEFAULT NULL,
  `details` json DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`),
  KEY `idx_user` (`user_type`,`user_id`),
  KEY `idx_entity` (`entity_type`,`entity_id`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_action` (`action`)
) ENGINE=InnoDB AUTO_INCREMENT=331 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity_log`
--

LOCK TABLES `activity_log` WRITE;
/*!40000 ALTER TABLE `activity_log` DISABLE KEYS */;
INSERT INTO `activity_log` VALUES (1,'STAFF',4,'CREATE','8',NULL,'{\"path\": \"/deliveries/8/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-10T22:50:55.458Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1','2026-04-10 22:50:55'),(2,'STAFF',4,'UPDATE','unknown',NULL,'{\"path\": \"/availability\", \"method\": \"PUT\", \"timestamp\": \"2026-04-10T22:50:56.045Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1','2026-04-10 22:50:56'),(3,'STAFF',4,'CREATE','8',NULL,'{\"path\": \"/deliveries/8/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-10T22:51:37.148Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1','2026-04-10 22:51:37'),(4,'STAFF',4,'CREATE','8',NULL,'{\"path\": \"/deliveries/8/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-10T22:52:07.052Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-10 22:52:07'),(5,'STAFF',4,'CREATE','8',NULL,'{\"path\": \"/deliveries/8/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-10T22:52:37.322Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-10 22:52:37'),(6,'STAFF',4,'CREATE','8',NULL,'{\"path\": \"/deliveries/8/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-10T22:52:37.326Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-10 22:52:37'),(7,'STAFF',4,'CREATE','8',NULL,'{\"path\": \"/deliveries/8/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-10T22:52:37.427Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-10 22:52:37'),(8,'STAFF',4,'CREATE','8',NULL,'{\"path\": \"/deliveries/8/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-10T22:53:07.316Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-10 22:53:07'),(9,'STAFF',4,'CREATE','8',NULL,'{\"path\": \"/deliveries/8/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-10T22:53:37.325Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-10 22:53:37'),(10,'STAFF',4,'CREATE','8',NULL,'{\"path\": \"/deliveries/8/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-10T22:53:37.328Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-10 22:53:37'),(11,'STAFF',4,'CREATE','8',NULL,'{\"path\": \"/deliveries/8/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-10T22:53:37.439Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-10 22:53:37'),(12,'STAFF',4,'CREATE','8',NULL,'{\"path\": \"/deliveries/8/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-10T22:54:07.328Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-10 22:54:07'),(13,'STAFF',4,'CREATE','8',NULL,'{\"path\": \"/deliveries/8/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-11T05:04:51.015Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-11 05:04:51'),(14,'STAFF',4,'CREATE','8',NULL,'{\"path\": \"/deliveries/8/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-11T05:05:12.462Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1','2026-04-11 05:05:12'),(15,'STAFF',1,'UPDATE','unknown',NULL,'{\"path\": \"/settings\", \"method\": \"PUT\", \"timestamp\": \"2026-04-11T06:40:39.252Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-11 06:40:39'),(16,'STAFF',4,'CREATE','8',NULL,'{\"path\": \"/deliveries/8/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-11T06:41:03.667Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-11 06:41:03'),(17,'STAFF',4,'UPDATE','8',NULL,'{\"path\": \"/deliveries/8/status\", \"method\": \"PUT\", \"timestamp\": \"2026-04-11T06:41:22.312Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-11 06:41:22'),(18,'STAFF',4,'CREATE','8',NULL,'{\"path\": \"/deliveries/8/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-11T06:44:28.351Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-11 06:44:28'),(19,'STAFF',4,'CREATE','8',NULL,'{\"path\": \"/deliveries/8/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-11T06:44:28.454Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-11 06:44:28'),(20,'STAFF',4,'CREATE','8',NULL,'{\"path\": \"/deliveries/8/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-11T06:44:44.316Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-11 06:44:44'),(21,'STAFF',4,'CREATE','8',NULL,'{\"path\": \"/deliveries/8/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-11T06:44:47.321Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-11 06:44:47'),(22,'STAFF',4,'CREATE','8',NULL,'{\"path\": \"/deliveries/8/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-11T06:44:47.326Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-11 06:44:47'),(23,'STAFF',4,'CREATE','8',NULL,'{\"path\": \"/deliveries/8/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-11T06:44:47.340Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-11 06:44:47'),(24,'STAFF',4,'CREATE','8',NULL,'{\"path\": \"/deliveries/8/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-11T06:45:03.309Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-11 06:45:03'),(25,'STAFF',4,'CREATE','8',NULL,'{\"path\": \"/deliveries/8/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-11T06:45:18.318Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-11 06:45:18'),(26,'STAFF',4,'CREATE','8',NULL,'{\"path\": \"/deliveries/8/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-11T06:45:18.320Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-11 06:45:18'),(27,'STAFF',4,'CREATE','8',NULL,'{\"path\": \"/deliveries/8/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-11T06:45:34.317Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-11 06:45:34'),(28,'STAFF',4,'CREATE','8',NULL,'{\"path\": \"/deliveries/8/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-11T06:45:48.326Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-11 06:45:48'),(29,'STAFF',4,'CREATE','8',NULL,'{\"path\": \"/deliveries/8/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-11T06:46:04.312Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-11 06:46:04'),(30,'STAFF',4,'CREATE','8',NULL,'{\"path\": \"/deliveries/8/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-11T06:46:18.320Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-11 06:46:18'),(31,'STAFF',4,'CREATE','8',NULL,'{\"path\": \"/deliveries/8/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-11T06:46:34.309Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-11 06:46:34'),(32,'STAFF',1,'STAFF_ALREADY_EXISTS','Staff',5,'\"{\\\"staffName\\\":\\\"Delivery2\\\",\\\"email\\\":\\\"delivery2@gmail.com\\\",\\\"role\\\":\\\"Delivery\\\",\\\"isNew\\\":false}\"','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-11 06:48:40'),(33,'STAFF',3,'CREATE','unknown',NULL,'{\"path\": \"/daily\", \"method\": \"POST\", \"timestamp\": \"2026-04-11T06:49:16.424Z\", \"statusCode\": 201}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-11 06:49:16'),(34,'CUSTOMER',4,'UPDATE','unknown',NULL,'{\"path\": \"/me\", \"method\": \"PUT\", \"timestamp\": \"2026-04-11T06:50:01.480Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-11 06:50:01'),(35,'CUSTOMER',4,'CREATE','me',NULL,'{\"path\": \"/me/addresses\", \"method\": \"POST\", \"timestamp\": \"2026-04-11T06:50:01.775Z\", \"statusCode\": 201}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-11 06:50:01'),(36,'CUSTOMER',4,'CREATE','unknown',NULL,'{\"path\": \"/\", \"method\": \"POST\", \"timestamp\": \"2026-04-11T06:50:01.936Z\", \"statusCode\": 201}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-11 06:50:01'),(37,'STAFF',4,'CREATE','8',NULL,'{\"path\": \"/deliveries/8/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-11T06:50:30.957Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-11 06:50:30'),(38,'STAFF',4,'UPDATE','8',NULL,'{\"path\": \"/deliveries/8/status\", \"method\": \"PUT\", \"timestamp\": \"2026-04-11T06:50:38.072Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-11 06:50:38'),(39,'STAFF',3,'UPDATE','10',NULL,'{\"path\": \"/orders/10/status\", \"method\": \"PUT\", \"timestamp\": \"2026-04-11T06:51:20.605Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-11 06:51:20'),(40,'STAFF',4,'CREATE','8',NULL,'{\"path\": \"/deliveries/8/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-11T17:18:23.720Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-11 17:18:23'),(41,'STAFF',4,'CREATE','8',NULL,'{\"path\": \"/deliveries/8/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-11T17:18:26.191Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-11 17:18:26'),(42,'STAFF',4,'CREATE','8',NULL,'{\"path\": \"/deliveries/8/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-11T17:18:27.662Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-11 17:18:27'),(43,'STAFF',4,'CREATE','8',NULL,'{\"path\": \"/deliveries/8/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-11T17:18:27.691Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-11 17:18:27'),(44,'STAFF',4,'CREATE','8',NULL,'{\"path\": \"/deliveries/8/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-11T17:18:28.726Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-11 17:18:28'),(45,'STAFF',4,'CREATE','8',NULL,'{\"path\": \"/deliveries/8/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-11T17:18:59.137Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-11 17:18:59'),(46,'STAFF',4,'CREATE','8',NULL,'{\"path\": \"/deliveries/8/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-11T17:18:59.145Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-11 17:18:59'),(47,'STAFF',4,'CREATE','8',NULL,'{\"path\": \"/deliveries/8/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-11T17:19:29.135Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-11 17:19:29'),(48,'STAFF',4,'CREATE','8',NULL,'{\"path\": \"/deliveries/8/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-11T17:19:29.199Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-11 17:19:29'),(49,'STAFF',4,'CREATE','8',NULL,'{\"path\": \"/deliveries/8/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-11T17:19:59.139Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-11 17:19:59'),(50,'STAFF',4,'CREATE','8',NULL,'{\"path\": \"/deliveries/8/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-11T17:20:29.145Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-11 17:20:29'),(51,'STAFF',4,'CREATE','8',NULL,'{\"path\": \"/deliveries/8/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-11T17:20:29.243Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-11 17:20:29'),(52,'STAFF',4,'CREATE','8',NULL,'{\"path\": \"/deliveries/8/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-11T17:20:59.133Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-11 17:20:59'),(53,'STAFF',4,'CREATE','8',NULL,'{\"path\": \"/deliveries/8/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-11T17:22:03.193Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-11 17:22:03'),(54,'STAFF',1,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-14T05:28:53.978Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-14 05:28:53'),(55,'STAFF',4,'CREATE','8',NULL,'{\"path\": \"/deliveries/8/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-14T05:28:59.901Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-14 05:28:59'),(56,'STAFF',4,'CREATE','8',NULL,'{\"path\": \"/deliveries/8/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-14T05:29:01.865Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-14 05:29:01'),(57,'STAFF',4,'CREATE','8',NULL,'{\"path\": \"/deliveries/8/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-14T05:29:01.890Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-14 05:29:01'),(58,'STAFF',4,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-14T05:29:10.647Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-14 05:29:10'),(59,'STAFF',4,'CREATE','8',NULL,'{\"path\": \"/deliveries/8/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-14T05:29:14.473Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-14 05:29:14'),(60,'STAFF',4,'UPDATE','8',NULL,'{\"path\": \"/deliveries/8/status\", \"method\": \"PUT\", \"timestamp\": \"2026-04-14T05:29:19.286Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-14 05:29:19'),(61,'STAFF',4,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-14T05:29:26.661Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-14 05:29:26'),(62,'STAFF',1,'UPDATE','unknown',NULL,'{\"path\": \"/read-all\", \"method\": \"PATCH\", \"timestamp\": \"2026-04-14T05:29:39.634Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-14 05:29:39'),(63,'STAFF',1,'UPDATE','unknown',NULL,'{\"path\": \"/settings\", \"method\": \"PUT\", \"timestamp\": \"2026-04-16T07:58:32.620Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 07:58:32'),(64,'STAFF',1,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-16T08:02:49.263Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 08:02:49'),(65,'CUSTOMER',2,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-16T08:03:21.102Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 08:03:21'),(66,'STAFF',1,'CREATE','unknown',NULL,'{\"path\": \"/daily\", \"method\": \"POST\", \"timestamp\": \"2026-04-16T08:06:22.816Z\", \"statusCode\": 201}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 08:06:22'),(67,'STAFF',1,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-16T08:06:24.718Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 08:06:24'),(68,'CUSTOMER',2,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-16T08:08:03.129Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 08:08:03'),(69,'STAFF',1,'DELETE','unknown',1,'{\"path\": \"/1\", \"method\": \"DELETE\", \"timestamp\": \"2026-04-16T08:08:12.965Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 08:08:12'),(70,'STAFF',1,'DELETE','unknown',1,'{\"path\": \"/1\", \"method\": \"DELETE\", \"timestamp\": \"2026-04-16T08:08:19.816Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 08:08:19'),(71,'STAFF',1,'CREATE','unknown',NULL,'{\"path\": \"/image\", \"method\": \"POST\", \"timestamp\": \"2026-04-16T08:14:04.515Z\", \"statusCode\": 201}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 08:14:04'),(72,'STAFF',1,'CREATE','unknown',NULL,'{\"path\": \"/\", \"method\": \"POST\", \"timestamp\": \"2026-04-16T08:14:05.436Z\", \"statusCode\": 201}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 08:14:05'),(73,'STAFF',1,'CREATE','unknown',NULL,'{\"path\": \"/image\", \"method\": \"POST\", \"timestamp\": \"2026-04-16T08:14:47.916Z\", \"statusCode\": 201}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 08:14:47'),(74,'STAFF',1,'UPDATE','unknown',1,'{\"path\": \"/1\", \"method\": \"PUT\", \"timestamp\": \"2026-04-16T08:14:49.027Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 08:14:49'),(75,'STAFF',1,'CREATE','unknown',NULL,'{\"path\": \"/image\", \"method\": \"POST\", \"timestamp\": \"2026-04-16T08:15:01.594Z\", \"statusCode\": 201}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 08:15:01'),(76,'STAFF',1,'UPDATE','unknown',1,'{\"path\": \"/1\", \"method\": \"PUT\", \"timestamp\": \"2026-04-16T08:15:09.032Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 08:15:09'),(77,'STAFF',1,'CREATE','unknown',NULL,'{\"path\": \"/image\", \"method\": \"POST\", \"timestamp\": \"2026-04-16T08:15:20.466Z\", \"statusCode\": 201}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 08:15:20'),(78,'STAFF',1,'UPDATE','unknown',1,'{\"path\": \"/1\", \"method\": \"PUT\", \"timestamp\": \"2026-04-16T08:15:22.274Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 08:15:22'),(79,'STAFF',1,'CREATE','unknown',NULL,'{\"path\": \"/image\", \"method\": \"POST\", \"timestamp\": \"2026-04-16T08:15:36.994Z\", \"statusCode\": 201}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 08:15:36'),(80,'STAFF',1,'CREATE','unknown',NULL,'{\"path\": \"/\", \"method\": \"POST\", \"timestamp\": \"2026-04-16T08:15:37.602Z\", \"statusCode\": 201}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 08:15:37'),(81,'STAFF',1,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-16T08:33:07.310Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 08:33:07'),(82,'STAFF',1,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-16T09:06:39.855Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 09:06:39'),(83,'CUSTOMER',2,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-16T09:06:56.209Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 09:06:56'),(84,'STAFF',1,'CREATE','unknown',NULL,'{\"path\": \"/daily\", \"method\": \"POST\", \"timestamp\": \"2026-04-16T09:07:06.356Z\", \"statusCode\": 201}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 09:07:06'),(85,'STAFF',1,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-16T09:07:07.828Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 09:07:07'),(86,'CUSTOMER',2,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-16T09:07:18.127Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 09:07:18'),(87,'STAFF',1,'UPDATE','unknown',1,'{\"path\": \"/1\", \"method\": \"PUT\", \"timestamp\": \"2026-04-16T09:07:25.418Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 09:07:25'),(88,'STAFF',1,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-16T09:07:27.750Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 09:07:27'),(89,'CUSTOMER',2,'UPDATE','unknown',NULL,'{\"path\": \"/me\", \"method\": \"PUT\", \"timestamp\": \"2026-04-16T09:08:30.119Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 09:08:30'),(90,'CUSTOMER',2,'CREATE','me',NULL,'{\"path\": \"/me/addresses\", \"method\": \"POST\", \"timestamp\": \"2026-04-16T09:08:30.212Z\", \"statusCode\": 201}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 09:08:30'),(91,'CUSTOMER',2,'UPDATE','unknown',NULL,'{\"path\": \"/me\", \"method\": \"PUT\", \"timestamp\": \"2026-04-16T09:08:45.764Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 09:08:45'),(92,'CUSTOMER',2,'CREATE','me',NULL,'{\"path\": \"/me/addresses\", \"method\": \"POST\", \"timestamp\": \"2026-04-16T09:08:45.855Z\", \"statusCode\": 201}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 09:08:45'),(93,'STAFF',1,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-16T10:26:18.217Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 10:26:18'),(94,'CUSTOMER',2,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-16T10:51:26.312Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 10:51:26'),(95,'STAFF',2,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-16T16:47:39.666Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 16:47:39'),(96,'CUSTOMER',2,'DELETE','addresses',13,'{\"path\": \"/me/addresses/13\", \"method\": \"DELETE\", \"timestamp\": \"2026-04-16T16:49:03.757Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 16:49:03'),(97,'CUSTOMER',2,'UPDATE','addresses',12,'{\"path\": \"/me/addresses/12\", \"method\": \"PUT\", \"timestamp\": \"2026-04-16T16:49:13.896Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 16:49:13'),(98,'CUSTOMER',2,'UPDATE','unknown',NULL,'{\"path\": \"/me\", \"method\": \"PUT\", \"timestamp\": \"2026-04-16T17:08:58.518Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 17:08:58'),(99,'CUSTOMER',2,'CREATE','unknown',NULL,'{\"path\": \"/\", \"method\": \"POST\", \"timestamp\": \"2026-04-16T17:08:58.822Z\", \"statusCode\": 201}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 17:08:58'),(100,'CUSTOMER',2,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-16T17:43:34.290Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 17:43:34'),(101,'STAFF',1,'UPDATE','10',NULL,'{\"path\": \"/10/status\", \"method\": \"PATCH\", \"timestamp\": \"2026-04-16T17:45:04.111Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 17:45:04'),(102,'STAFF',1,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-16T17:45:21.194Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 17:45:21'),(103,'CUSTOMER',2,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-16T17:45:37.954Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 17:45:37'),(104,'STAFF',2,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-16T17:46:08.587Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 17:46:08'),(105,'CUSTOMER',2,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-16T17:46:17.036Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 17:46:17'),(106,'STAFF',1,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-16T17:46:34.587Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 17:46:34'),(107,'CUSTOMER',2,'DELETE','unknown',NULL,'{\"path\": \"/\", \"method\": \"DELETE\", \"timestamp\": \"2026-04-16T17:46:43.260Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 17:46:43'),(108,'CUSTOMER',2,'UPDATE','unknown',NULL,'{\"path\": \"/me\", \"method\": \"PUT\", \"timestamp\": \"2026-04-16T17:46:52.586Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 17:46:52'),(109,'CUSTOMER',2,'CREATE','unknown',NULL,'{\"path\": \"/\", \"method\": \"POST\", \"timestamp\": \"2026-04-16T17:46:52.779Z\", \"statusCode\": 201}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 17:46:52'),(110,'CUSTOMER',2,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-16T17:46:57.270Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 17:46:57'),(111,'STAFF',1,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-16T17:47:10.762Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 17:47:10'),(112,'STAFF',2,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-16T18:12:17.312Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 18:12:17'),(113,'CUSTOMER',2,'UPDATE','unknown',NULL,'{\"path\": \"/me\", \"method\": \"PUT\", \"timestamp\": \"2026-04-16T18:29:06.168Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 18:29:06'),(114,'CUSTOMER',2,'CREATE','unknown',NULL,'{\"path\": \"/\", \"method\": \"POST\", \"timestamp\": \"2026-04-16T18:29:06.335Z\", \"statusCode\": 201}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 18:29:06'),(115,'CUSTOMER',2,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-16T18:29:09.952Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 18:29:09'),(116,'STAFF',1,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-16T18:29:19.163Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 18:29:19'),(117,'STAFF',2,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-16T18:32:47.761Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 18:32:47'),(118,'STAFF',1,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-16T18:35:29.111Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 18:35:29'),(119,'STAFF',2,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-16T18:36:18.322Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 18:36:18'),(120,'STAFF',4,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-16T18:43:01.434Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 18:43:01'),(121,'CUSTOMER',2,'UPDATE','unknown',NULL,'{\"path\": \"/me\", \"method\": \"PUT\", \"timestamp\": \"2026-04-16T18:43:23.912Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 18:43:23'),(122,'CUSTOMER',2,'CREATE','unknown',NULL,'{\"path\": \"/\", \"method\": \"POST\", \"timestamp\": \"2026-04-16T18:43:24.082Z\", \"statusCode\": 201}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 18:43:24'),(123,'CUSTOMER',2,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-16T18:43:31.263Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 18:43:31'),(124,'STAFF',3,'DELETE','unknown',NULL,'{\"path\": \"/\", \"method\": \"DELETE\", \"timestamp\": \"2026-04-16T18:43:43.729Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 18:43:43'),(125,'STAFF',3,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-16T18:45:06.804Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 18:45:06'),(126,'CUSTOMER',2,'UPDATE','unknown',NULL,'{\"path\": \"/me\", \"method\": \"PUT\", \"timestamp\": \"2026-04-16T18:45:35.983Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 18:45:35'),(127,'CUSTOMER',2,'CREATE','unknown',NULL,'{\"path\": \"/\", \"method\": \"POST\", \"timestamp\": \"2026-04-16T18:45:36.851Z\", \"statusCode\": 201}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 18:45:36'),(128,'CUSTOMER',2,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-16T18:45:54.780Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 18:45:54'),(129,'STAFF',3,'UPDATE','15',NULL,'{\"path\": \"/orders/15/status\", \"method\": \"PUT\", \"timestamp\": \"2026-04-16T18:46:01.085Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 18:46:01'),(130,'STAFF',3,'UPDATE','15',NULL,'{\"path\": \"/orders/15/status\", \"method\": \"PUT\", \"timestamp\": \"2026-04-16T18:46:02.342Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 18:46:02'),(131,'STAFF',3,'UPDATE','unknown',NULL,'{\"path\": \"/read-all\", \"method\": \"PATCH\", \"timestamp\": \"2026-04-16T18:50:02.881Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 18:50:02'),(132,'STAFF',3,'DELETE','unknown',NULL,'{\"path\": \"/\", \"method\": \"DELETE\", \"timestamp\": \"2026-04-16T18:50:03.988Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 18:50:03'),(133,'STAFF',3,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-16T18:50:12.634Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 18:50:12'),(134,'CUSTOMER',2,'UPDATE','unknown',NULL,'{\"path\": \"/read-all\", \"method\": \"PATCH\", \"timestamp\": \"2026-04-16T18:50:17.262Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 18:50:17'),(135,'CUSTOMER',2,'DELETE','unknown',NULL,'{\"path\": \"/\", \"method\": \"DELETE\", \"timestamp\": \"2026-04-16T18:50:17.777Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 18:50:17'),(136,'CUSTOMER',2,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-16T18:50:19.737Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 18:50:19'),(137,'STAFF',1,'UPDATE','unknown',NULL,'{\"path\": \"/read-all\", \"method\": \"PATCH\", \"timestamp\": \"2026-04-16T18:50:27.060Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 18:50:27'),(138,'STAFF',1,'DELETE','unknown',NULL,'{\"path\": \"/\", \"method\": \"DELETE\", \"timestamp\": \"2026-04-16T18:50:27.688Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 18:50:27'),(139,'STAFF',1,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-16T18:50:29.288Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 18:50:29'),(140,'CUSTOMER',2,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-16T18:55:01.899Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-16 18:55:01'),(141,'CUSTOMER',2,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T05:32:59.909Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 05:32:59'),(142,'STAFF',3,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T05:34:29.766Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 05:34:29'),(143,'STAFF',1,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T05:34:34.415Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 05:34:34'),(144,'CUSTOMER',2,'UPDATE','unknown',NULL,'{\"path\": \"/me\", \"method\": \"PUT\", \"timestamp\": \"2026-04-17T05:35:12.794Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 05:35:12'),(145,'CUSTOMER',2,'CREATE','unknown',NULL,'{\"path\": \"/\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T05:35:14.008Z\", \"statusCode\": 201}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 05:35:14'),(146,'CUSTOMER',2,'UPDATE','unknown',NULL,'{\"path\": \"/me\", \"method\": \"PUT\", \"timestamp\": \"2026-04-17T05:36:01.353Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 05:36:01'),(147,'CUSTOMER',2,'CREATE','unknown',NULL,'{\"path\": \"/\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T05:36:02.208Z\", \"statusCode\": 201}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 05:36:02'),(148,'CUSTOMER',2,'UPDATE','unknown',NULL,'{\"path\": \"/me\", \"method\": \"PUT\", \"timestamp\": \"2026-04-17T05:36:29.696Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 05:36:29'),(149,'CUSTOMER',2,'CREATE','unknown',NULL,'{\"path\": \"/\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T05:36:30.567Z\", \"statusCode\": 201}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 05:36:30'),(150,'CUSTOMER',2,'CREATE','unknown',NULL,'{\"path\": \"/initiate\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T05:36:31.183Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 05:36:31'),(151,'CUSTOMER',2,'UPDATE','unknown',NULL,'{\"path\": \"/me\", \"method\": \"PUT\", \"timestamp\": \"2026-04-17T05:36:39.517Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 05:36:39'),(152,'CUSTOMER',2,'CREATE','unknown',NULL,'{\"path\": \"/\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T05:36:40.344Z\", \"statusCode\": 201}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 05:36:40'),(153,'CUSTOMER',2,'UPDATE','unknown',NULL,'{\"path\": \"/me\", \"method\": \"PUT\", \"timestamp\": \"2026-04-17T05:42:02.823Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 05:42:02'),(154,'CUSTOMER',2,'CREATE','unknown',NULL,'{\"path\": \"/\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T05:42:03.928Z\", \"statusCode\": 201}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 05:42:03'),(155,'CUSTOMER',2,'CREATE','unknown',NULL,'{\"path\": \"/initiate\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T05:42:03.945Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 05:42:03'),(156,'CUSTOMER',2,'UPDATE','unknown',NULL,'{\"path\": \"/me\", \"method\": \"PUT\", \"timestamp\": \"2026-04-17T05:43:00.936Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 05:43:00'),(157,'CUSTOMER',2,'CREATE','unknown',NULL,'{\"path\": \"/\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T05:43:01.651Z\", \"statusCode\": 201}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 05:43:01'),(158,'CUSTOMER',2,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T05:43:24.681Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 05:43:24'),(159,'STAFF',3,'UPDATE','21',NULL,'{\"path\": \"/orders/21/status\", \"method\": \"PUT\", \"timestamp\": \"2026-04-17T05:43:33.443Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 05:43:33'),(160,'STAFF',3,'UPDATE','21',NULL,'{\"path\": \"/orders/21/status\", \"method\": \"PUT\", \"timestamp\": \"2026-04-17T05:43:37.223Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 05:43:37'),(161,'STAFF',3,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T05:45:06.669Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 05:45:06'),(162,'STAFF',4,'CREATE','14',NULL,'{\"path\": \"/deliveries/14/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T05:45:13.807Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 05:45:13'),(163,'STAFF',4,'UPDATE','unknown',NULL,'{\"path\": \"/availability\", \"method\": \"PUT\", \"timestamp\": \"2026-04-17T05:45:15.676Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 05:45:15'),(164,'STAFF',4,'CREATE','14',NULL,'{\"path\": \"/deliveries/14/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T05:45:18.265Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 05:45:18'),(165,'STAFF',4,'CREATE','14',NULL,'{\"path\": \"/deliveries/14/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T05:45:18.274Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 05:45:18'),(166,'STAFF',4,'CREATE','14',NULL,'{\"path\": \"/deliveries/14/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T05:45:21.060Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 05:45:21'),(167,'STAFF',4,'CREATE','14',NULL,'{\"path\": \"/deliveries/14/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T05:45:25.880Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 05:45:25'),(168,'STAFF',4,'UPDATE','14',NULL,'{\"path\": \"/deliveries/14/status\", \"method\": \"PUT\", \"timestamp\": \"2026-04-17T05:45:27.880Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 05:45:27'),(169,'STAFF',4,'CREATE','14',NULL,'{\"path\": \"/deliveries/14/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T05:45:27.893Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 05:45:27'),(170,'STAFF',4,'CREATE','14',NULL,'{\"path\": \"/deliveries/14/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T05:45:29.863Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 05:45:29'),(171,'STAFF',4,'CREATE','14',NULL,'{\"path\": \"/deliveries/14/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T05:45:29.868Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 05:45:29'),(172,'STAFF',4,'CREATE','14',NULL,'{\"path\": \"/deliveries/14/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T05:45:31.983Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 05:45:31'),(173,'STAFF',4,'CREATE','14',NULL,'{\"path\": \"/deliveries/14/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T05:45:45.508Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 05:45:45'),(174,'STAFF',4,'CREATE','14',NULL,'{\"path\": \"/deliveries/14/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T05:46:16.316Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 05:46:16'),(175,'STAFF',4,'CREATE','14',NULL,'{\"path\": \"/deliveries/14/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T05:46:16.321Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 05:46:16'),(176,'STAFF',4,'UPDATE','14',NULL,'{\"path\": \"/deliveries/14/status\", \"method\": \"PUT\", \"timestamp\": \"2026-04-17T05:46:41.312Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 05:46:41'),(177,'STAFF',4,'CREATE','14',NULL,'{\"path\": \"/deliveries/14/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T05:46:41.324Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 05:46:41'),(178,'STAFF',4,'CREATE','14',NULL,'{\"path\": \"/deliveries/14/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T05:46:45.500Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 05:46:45'),(179,'STAFF',4,'CREATE','14',NULL,'{\"path\": \"/deliveries/14/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T05:46:45.575Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 05:46:45'),(180,'STAFF',4,'UPDATE','14',NULL,'{\"path\": \"/deliveries/14/status\", \"method\": \"PUT\", \"timestamp\": \"2026-04-17T05:46:48.171Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 05:46:48'),(181,'STAFF',4,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T05:52:08.823Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 05:52:08'),(182,'CUSTOMER',2,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T06:00:11.148Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 06:00:11'),(183,'STAFF',1,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T06:00:18.306Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 06:00:18'),(184,'STAFF',4,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T06:00:23.369Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 06:00:23'),(185,'STAFF',5,'CREATE','9',NULL,'{\"path\": \"/deliveries/9/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T06:00:25.485Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 06:00:25'),(186,'STAFF',5,'UPDATE','9',NULL,'{\"path\": \"/deliveries/9/status\", \"method\": \"PUT\", \"timestamp\": \"2026-04-17T06:00:29.618Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 06:00:29'),(187,'STAFF',5,'UPDATE','9',NULL,'{\"path\": \"/deliveries/9/status\", \"method\": \"PUT\", \"timestamp\": \"2026-04-17T06:00:30.839Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 06:00:30'),(188,'STAFF',5,'UPDATE','9',NULL,'{\"path\": \"/deliveries/9/status\", \"method\": \"PUT\", \"timestamp\": \"2026-04-17T06:00:31.867Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 06:00:31'),(189,'STAFF',5,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T06:00:38.136Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 06:00:38'),(190,'STAFF',4,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T06:00:43.849Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 06:00:43'),(191,'CUSTOMER',2,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T06:00:58.546Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 06:00:58'),(192,'STAFF',1,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T06:06:22.142Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 06:06:22'),(193,'CUSTOMER',2,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T06:11:18.393Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 06:11:18'),(194,'STAFF',3,'UPDATE','14',NULL,'{\"path\": \"/orders/14/status\", \"method\": \"PUT\", \"timestamp\": \"2026-04-17T06:11:27.564Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 06:11:27'),(195,'STAFF',3,'UPDATE','13',NULL,'{\"path\": \"/orders/13/status\", \"method\": \"PUT\", \"timestamp\": \"2026-04-17T06:11:28.654Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 06:11:28'),(196,'STAFF',3,'UPDATE','14',NULL,'{\"path\": \"/orders/14/status\", \"method\": \"PUT\", \"timestamp\": \"2026-04-17T06:11:30.602Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 06:11:30'),(197,'STAFF',3,'UPDATE','13',NULL,'{\"path\": \"/orders/13/status\", \"method\": \"PUT\", \"timestamp\": \"2026-04-17T06:11:32.169Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 06:11:32'),(198,'STAFF',3,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T06:11:34.951Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 06:11:34'),(199,'STAFF',4,'CREATE','13',NULL,'{\"path\": \"/deliveries/13/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T06:11:38.061Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 06:11:38'),(200,'STAFF',4,'UPDATE','13',NULL,'{\"path\": \"/deliveries/13/status\", \"method\": \"PUT\", \"timestamp\": \"2026-04-17T06:11:39.904Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 06:11:39'),(201,'STAFF',4,'CREATE','13',NULL,'{\"path\": \"/deliveries/13/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T06:11:39.914Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 06:11:39'),(202,'STAFF',4,'UPDATE','13',NULL,'{\"path\": \"/deliveries/13/status\", \"method\": \"PUT\", \"timestamp\": \"2026-04-17T06:11:40.997Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 06:11:40'),(203,'STAFF',4,'CREATE','13',NULL,'{\"path\": \"/deliveries/13/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T06:11:41.007Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 06:11:41'),(204,'STAFF',4,'UPDATE','13',NULL,'{\"path\": \"/deliveries/13/status\", \"method\": \"PUT\", \"timestamp\": \"2026-04-17T06:11:42.143Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 06:11:42'),(205,'STAFF',4,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T06:11:47.615Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 06:11:47'),(206,'STAFF',5,'CREATE','12',NULL,'{\"path\": \"/deliveries/12/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T06:11:50.578Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 06:11:50'),(207,'STAFF',5,'UPDATE','12',NULL,'{\"path\": \"/deliveries/12/status\", \"method\": \"PUT\", \"timestamp\": \"2026-04-17T06:11:52.858Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 06:11:52'),(208,'STAFF',5,'CREATE','12',NULL,'{\"path\": \"/deliveries/12/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T06:11:52.868Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 06:11:52'),(209,'STAFF',5,'UPDATE','12',NULL,'{\"path\": \"/deliveries/12/status\", \"method\": \"PUT\", \"timestamp\": \"2026-04-17T06:11:53.862Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 06:11:53'),(210,'STAFF',5,'CREATE','12',NULL,'{\"path\": \"/deliveries/12/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T06:11:53.871Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 06:11:53'),(211,'STAFF',5,'UPDATE','12',NULL,'{\"path\": \"/deliveries/12/status\", \"method\": \"PUT\", \"timestamp\": \"2026-04-17T06:11:55.013Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 06:11:55'),(212,'STAFF',5,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T06:11:59.274Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 06:11:59'),(213,'CUSTOMER',2,'UPDATE','unknown',NULL,'{\"path\": \"/me\", \"method\": \"PUT\", \"timestamp\": \"2026-04-17T06:12:12.926Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 06:12:12'),(214,'CUSTOMER',2,'CREATE','unknown',NULL,'{\"path\": \"/\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T06:12:13.768Z\", \"statusCode\": 201}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 06:12:13'),(215,'CUSTOMER',2,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T06:12:17.976Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 06:12:17'),(216,'STAFF',3,'UPDATE','22',NULL,'{\"path\": \"/orders/22/status\", \"method\": \"PUT\", \"timestamp\": \"2026-04-17T06:12:25.967Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 06:12:25'),(217,'STAFF',3,'UPDATE','22',NULL,'{\"path\": \"/orders/22/status\", \"method\": \"PUT\", \"timestamp\": \"2026-04-17T06:12:28.587Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 06:12:28'),(218,'STAFF',3,'UPDATE','22',NULL,'{\"path\": \"/orders/22/status\", \"method\": \"PUT\", \"timestamp\": \"2026-04-17T06:12:30.155Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 06:12:30'),(219,'STAFF',3,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T06:12:32.224Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 06:12:32'),(220,'STAFF',5,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T06:12:37.952Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 06:12:37'),(221,'STAFF',4,'CREATE','21',NULL,'{\"path\": \"/deliveries/21/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T06:12:43.526Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 06:12:43'),(222,'STAFF',4,'UPDATE','unknown',NULL,'{\"path\": \"/availability\", \"method\": \"PUT\", \"timestamp\": \"2026-04-17T06:12:49.522Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 06:12:49'),(223,'STAFF',4,'UPDATE','21',NULL,'{\"path\": \"/deliveries/21/status\", \"method\": \"PUT\", \"timestamp\": \"2026-04-17T06:12:50.956Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 06:12:50'),(224,'STAFF',4,'CREATE','21',NULL,'{\"path\": \"/deliveries/21/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T06:12:50.970Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 06:12:50'),(225,'STAFF',4,'UPDATE','21',NULL,'{\"path\": \"/deliveries/21/status\", \"method\": \"PUT\", \"timestamp\": \"2026-04-17T06:12:52.039Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 06:12:52'),(226,'STAFF',4,'CREATE','21',NULL,'{\"path\": \"/deliveries/21/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T06:12:52.048Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 06:12:52'),(227,'STAFF',4,'UPDATE','21',NULL,'{\"path\": \"/deliveries/21/status\", \"method\": \"PUT\", \"timestamp\": \"2026-04-17T06:12:53.482Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 06:12:53'),(228,'STAFF',4,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T06:13:22.026Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 06:13:22'),(229,'CUSTOMER',2,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T06:14:02.257Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 06:14:02'),(230,'STAFF',4,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T06:14:08.761Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 06:14:08'),(231,'STAFF',3,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T06:14:29.932Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 06:14:29'),(232,'STAFF',1,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T06:21:55.482Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 06:21:55'),(233,'CUSTOMER',2,'UPDATE','unknown',NULL,'{\"path\": \"/me\", \"method\": \"PUT\", \"timestamp\": \"2026-04-17T06:22:07.568Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 06:22:07'),(234,'CUSTOMER',2,'CREATE','unknown',NULL,'{\"path\": \"/\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T06:22:08.458Z\", \"statusCode\": 201}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 06:22:08'),(235,'CUSTOMER',2,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T06:22:11.747Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 06:22:11'),(236,'STAFF',3,'UPDATE','23',NULL,'{\"path\": \"/orders/23/status\", \"method\": \"PUT\", \"timestamp\": \"2026-04-17T06:22:17.565Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 06:22:17'),(237,'STAFF',3,'UPDATE','23',NULL,'{\"path\": \"/orders/23/status\", \"method\": \"PUT\", \"timestamp\": \"2026-04-17T06:22:19.347Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 06:22:19'),(238,'STAFF',3,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T06:22:21.776Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 06:22:21'),(239,'STAFF',5,'CREATE','22',NULL,'{\"path\": \"/deliveries/22/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T06:22:25.652Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 06:22:25'),(240,'STAFF',5,'UPDATE','22',NULL,'{\"path\": \"/deliveries/22/status\", \"method\": \"PUT\", \"timestamp\": \"2026-04-17T06:22:27.638Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 06:22:27'),(241,'STAFF',5,'CREATE','22',NULL,'{\"path\": \"/deliveries/22/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T06:22:27.648Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 06:22:27'),(242,'STAFF',5,'UPDATE','unknown',NULL,'{\"path\": \"/availability\", \"method\": \"PUT\", \"timestamp\": \"2026-04-17T06:22:29.143Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 06:22:29'),(243,'STAFF',5,'UPDATE','22',NULL,'{\"path\": \"/deliveries/22/status\", \"method\": \"PUT\", \"timestamp\": \"2026-04-17T06:22:31.001Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 06:22:31'),(244,'STAFF',5,'CREATE','22',NULL,'{\"path\": \"/deliveries/22/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T06:22:31.012Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 06:22:31'),(245,'STAFF',5,'UPDATE','22',NULL,'{\"path\": \"/deliveries/22/status\", \"method\": \"PUT\", \"timestamp\": \"2026-04-17T06:22:33.104Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 06:22:33'),(246,'STAFF',5,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T06:22:36.144Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 06:22:36'),(247,'STAFF',4,'CREATE','20',NULL,'{\"path\": \"/deliveries/20/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T06:22:38.420Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 06:22:38'),(248,'STAFF',4,'UPDATE','unknown',NULL,'{\"path\": \"/availability\", \"method\": \"PUT\", \"timestamp\": \"2026-04-17T06:22:39.657Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 06:22:39'),(249,'STAFF',4,'UPDATE','20',NULL,'{\"path\": \"/deliveries/20/status\", \"method\": \"PUT\", \"timestamp\": \"2026-04-17T06:22:41.257Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 06:22:41'),(250,'STAFF',4,'CREATE','20',NULL,'{\"path\": \"/deliveries/20/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T06:22:41.267Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 06:22:41'),(251,'STAFF',4,'UPDATE','20',NULL,'{\"path\": \"/deliveries/20/status\", \"method\": \"PUT\", \"timestamp\": \"2026-04-17T06:22:42.232Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 06:22:42'),(252,'STAFF',4,'CREATE','20',NULL,'{\"path\": \"/deliveries/20/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T06:22:42.244Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 06:22:42'),(253,'STAFF',4,'UPDATE','20',NULL,'{\"path\": \"/deliveries/20/status\", \"method\": \"PUT\", \"timestamp\": \"2026-04-17T06:22:43.140Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 06:22:43'),(254,'STAFF',4,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T06:22:46.744Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 06:22:46'),(255,'CUSTOMER',2,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T06:23:54.506Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 06:23:54'),(256,'CUSTOMER',2,'UPDATE','unknown',NULL,'{\"path\": \"/read-all\", \"method\": \"PATCH\", \"timestamp\": \"2026-04-17T10:14:59.957Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 10:14:59'),(257,'CUSTOMER',2,'DELETE','unknown',NULL,'{\"path\": \"/\", \"method\": \"DELETE\", \"timestamp\": \"2026-04-17T10:15:00.937Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 10:15:00'),(258,'STAFF',1,'UPDATE','unknown',NULL,'{\"path\": \"/read-all\", \"method\": \"PATCH\", \"timestamp\": \"2026-04-17T10:39:56.412Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 10:39:56'),(259,'STAFF',1,'DELETE','unknown',NULL,'{\"path\": \"/\", \"method\": \"DELETE\", \"timestamp\": \"2026-04-17T10:39:57.058Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 10:39:57'),(260,'CUSTOMER',2,'UPDATE','unknown',NULL,'{\"path\": \"/me\", \"method\": \"PUT\", \"timestamp\": \"2026-04-17T10:45:26.353Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 10:45:26'),(261,'CUSTOMER',2,'CREATE','unknown',NULL,'{\"path\": \"/\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T10:45:28.469Z\", \"statusCode\": 201}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 10:45:28'),(262,'STAFF',3,'UPDATE','24',NULL,'{\"path\": \"/orders/24/status\", \"method\": \"PUT\", \"timestamp\": \"2026-04-17T10:46:09.427Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 10:46:09'),(263,'STAFF',3,'UPDATE','24',NULL,'{\"path\": \"/orders/24/status\", \"method\": \"PUT\", \"timestamp\": \"2026-04-17T10:46:13.276Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 10:46:13'),(264,'STAFF',4,'CREATE','23',NULL,'{\"path\": \"/deliveries/23/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T10:46:34.335Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 10:46:34'),(265,'STAFF',4,'CREATE','23',NULL,'{\"path\": \"/deliveries/23/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T10:46:34.375Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 10:46:34'),(266,'STAFF',4,'UPDATE','23',NULL,'{\"path\": \"/deliveries/23/status\", \"method\": \"PUT\", \"timestamp\": \"2026-04-17T10:46:47.595Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 10:46:47'),(267,'STAFF',4,'CREATE','23',NULL,'{\"path\": \"/deliveries/23/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T10:46:47.608Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 10:46:47'),(268,'STAFF',4,'UPDATE','23',NULL,'{\"path\": \"/deliveries/23/status\", \"method\": \"PUT\", \"timestamp\": \"2026-04-17T10:46:54.089Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 10:46:54'),(269,'STAFF',4,'CREATE','23',NULL,'{\"path\": \"/deliveries/23/location\", \"method\": \"POST\", \"timestamp\": \"2026-04-17T10:46:54.099Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 10:46:54'),(270,'STAFF',4,'UPDATE','23',NULL,'{\"path\": \"/deliveries/23/status\", \"method\": \"PUT\", \"timestamp\": \"2026-04-17T10:46:55.673Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 10:46:55'),(271,'CUSTOMER',2,'UPDATE','unknown',NULL,'{\"path\": \"/read-all\", \"method\": \"PATCH\", \"timestamp\": \"2026-04-17T10:47:09.083Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 10:47:09'),(272,'CUSTOMER',2,'DELETE','unknown',NULL,'{\"path\": \"/\", \"method\": \"DELETE\", \"timestamp\": \"2026-04-17T10:47:10.065Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 10:47:10'),(273,'STAFF',1,'UPDATE','unknown',NULL,'{\"path\": \"/read-all\", \"method\": \"PATCH\", \"timestamp\": \"2026-04-17T10:54:49.555Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 10:54:49'),(274,'STAFF',1,'DELETE','unknown',NULL,'{\"path\": \"/\", \"method\": \"DELETE\", \"timestamp\": \"2026-04-17T10:54:50.192Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-17 10:54:50'),(275,'STAFF',3,'CREATE','unknown',NULL,'{\"path\": \"/daily\", \"method\": \"POST\", \"timestamp\": \"2026-04-18T04:57:23.335Z\", \"statusCode\": 201}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-18 04:57:23'),(276,'STAFF',3,'CREATE','unknown',NULL,'{\"path\": \"/daily\", \"method\": \"POST\", \"timestamp\": \"2026-04-18T04:57:26.294Z\", \"statusCode\": 201}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-18 04:57:26'),(277,'STAFF',3,'CREATE','manual-adjust',10,'{\"path\": \"/manual-adjust/10\", \"method\": \"POST\", \"timestamp\": \"2026-04-18T04:57:41.217Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-18 04:57:41'),(278,'STAFF',3,'CREATE','manual-adjust',11,'{\"path\": \"/manual-adjust/11\", \"method\": \"POST\", \"timestamp\": \"2026-04-18T04:57:49.545Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-18 04:57:49'),(279,'STAFF',3,'UPDATE','update',10,'{\"path\": \"/update/10\", \"method\": \"PUT\", \"timestamp\": \"2026-04-18T04:58:00.040Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-18 04:58:00'),(280,'STAFF',3,'UPDATE','update',11,'{\"path\": \"/update/11\", \"method\": \"PUT\", \"timestamp\": \"2026-04-18T04:58:02.622Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-18 04:58:02'),(281,'STAFF',3,'UPDATE','update',10,'{\"path\": \"/update/10\", \"method\": \"PUT\", \"timestamp\": \"2026-04-18T05:01:35.100Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-18 05:01:35'),(282,'STAFF',1,'UPDATE','unknown',NULL,'{\"path\": \"/settings\", \"method\": \"PUT\", \"timestamp\": \"2026-04-18T05:02:33.489Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-18 05:02:33'),(283,'STAFF',1,'UPDATE','unknown',NULL,'{\"path\": \"/settings\", \"method\": \"PUT\", \"timestamp\": \"2026-04-18T05:03:05.005Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-18 05:03:05'),(284,'STAFF',1,'UPDATE','unknown',NULL,'{\"path\": \"/settings\", \"method\": \"PUT\", \"timestamp\": \"2026-04-18T05:03:33.168Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-18 05:03:33'),(285,'STAFF',1,'UPDATE','unknown',NULL,'{\"path\": \"/settings\", \"method\": \"PUT\", \"timestamp\": \"2026-04-18T05:03:44.025Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-18 05:03:44'),(286,'CUSTOMER',2,'UPDATE','unknown',NULL,'{\"path\": \"/me\", \"method\": \"PUT\", \"timestamp\": \"2026-04-18T05:03:47.468Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-18 05:03:47'),(287,'STAFF',1,'UPDATE','unknown',NULL,'{\"path\": \"/settings\", \"method\": \"PUT\", \"timestamp\": \"2026-04-18T05:03:54.419Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-18 05:03:54'),(288,'CUSTOMER',2,'UPDATE','unknown',NULL,'{\"path\": \"/me\", \"method\": \"PUT\", \"timestamp\": \"2026-04-18T05:03:56.897Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-18 05:03:56'),(289,'CUSTOMER',2,'CREATE','unknown',NULL,'{\"path\": \"/\", \"method\": \"POST\", \"timestamp\": \"2026-04-18T05:03:58.056Z\", \"statusCode\": 201}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-18 05:03:58'),(290,'CUSTOMER',2,'UPDATE','unknown',NULL,'{\"path\": \"/read-all\", \"method\": \"PATCH\", \"timestamp\": \"2026-04-18T05:16:09.516Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-18 05:16:09'),(291,'CUSTOMER',2,'DELETE','unknown',NULL,'{\"path\": \"/\", \"method\": \"DELETE\", \"timestamp\": \"2026-04-18T05:16:09.872Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-18 05:16:09'),(292,'CUSTOMER',2,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-18T09:04:17.322Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-18 09:04:17'),(293,'STAFF',1,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-18T13:42:31.875Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-18 13:42:31'),(294,'STAFF',3,'UPDATE','unknown',NULL,'{\"path\": \"/read-all\", \"method\": \"PATCH\", \"timestamp\": \"2026-04-18T13:43:02.489Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0','2026-04-18 13:43:02'),(295,'STAFF',3,'DELETE','unknown',NULL,'{\"path\": \"/\", \"method\": \"DELETE\", \"timestamp\": \"2026-04-18T13:43:02.923Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0','2026-04-18 13:43:02'),(296,'STAFF',1,'CREATE','unknown',NULL,'{\"path\": \"/image\", \"method\": \"POST\", \"timestamp\": \"2026-04-18T13:45:45.806Z\", \"statusCode\": 201}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0','2026-04-18 13:45:45'),(297,'STAFF',1,'CREATE','unknown',NULL,'{\"path\": \"/\", \"method\": \"POST\", \"timestamp\": \"2026-04-18T13:45:53.676Z\", \"statusCode\": 201}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0','2026-04-18 13:45:53'),(298,'STAFF',1,'UPDATE','unknown',2,'{\"path\": \"/2\", \"method\": \"PUT\", \"timestamp\": \"2026-04-18T13:47:24.250Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0','2026-04-18 13:47:24'),(299,'STAFF',1,'UPDATE','unknown',1,'{\"path\": \"/1\", \"method\": \"PUT\", \"timestamp\": \"2026-04-18T13:49:14.474Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0','2026-04-18 13:49:14'),(300,'STAFF',1,'CREATE','unknown',NULL,'{\"path\": \"/image\", \"method\": \"POST\", \"timestamp\": \"2026-04-18T13:49:48.526Z\", \"statusCode\": 201}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0','2026-04-18 13:49:48'),(301,'STAFF',1,'CREATE','unknown',NULL,'{\"path\": \"/\", \"method\": \"POST\", \"timestamp\": \"2026-04-18T13:49:49.170Z\", \"statusCode\": 201}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0','2026-04-18 13:49:49'),(302,'STAFF',1,'CREATE','unknown',NULL,'{\"path\": \"/image\", \"method\": \"POST\", \"timestamp\": \"2026-04-18T13:50:07.206Z\", \"statusCode\": 201}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0','2026-04-18 13:50:07'),(303,'STAFF',1,'CREATE','unknown',NULL,'{\"path\": \"/\", \"method\": \"POST\", \"timestamp\": \"2026-04-18T13:50:08.088Z\", \"statusCode\": 201}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0','2026-04-18 13:50:08'),(304,'STAFF',1,'UPDATE','unknown',2,'{\"path\": \"/2\", \"method\": \"PUT\", \"timestamp\": \"2026-04-18T13:51:21.297Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0','2026-04-18 13:51:21'),(305,'STAFF',1,'UPDATE','unknown',1,'{\"path\": \"/1\", \"method\": \"PUT\", \"timestamp\": \"2026-04-18T13:51:34.144Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0','2026-04-18 13:51:34'),(306,'STAFF',1,'CREATE','unknown',NULL,'{\"path\": \"/image\", \"method\": \"POST\", \"timestamp\": \"2026-04-18T13:52:09.811Z\", \"statusCode\": 201}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0','2026-04-18 13:52:09'),(307,'STAFF',1,'CREATE','unknown',NULL,'{\"path\": \"/\", \"method\": \"POST\", \"timestamp\": \"2026-04-18T13:52:10.555Z\", \"statusCode\": 201}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0','2026-04-18 13:52:10'),(308,'STAFF',1,'CREATE','unknown',NULL,'{\"path\": \"/image\", \"method\": \"POST\", \"timestamp\": \"2026-04-18T13:52:47.183Z\", \"statusCode\": 201}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0','2026-04-18 13:52:47'),(309,'STAFF',1,'CREATE','unknown',NULL,'{\"path\": \"/\", \"method\": \"POST\", \"timestamp\": \"2026-04-18T13:52:47.895Z\", \"statusCode\": 201}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0','2026-04-18 13:52:47'),(310,'STAFF',1,'CREATE','unknown',NULL,'{\"path\": \"/image\", \"method\": \"POST\", \"timestamp\": \"2026-04-18T13:53:15.276Z\", \"statusCode\": 201}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0','2026-04-18 13:53:15'),(311,'STAFF',1,'CREATE','unknown',NULL,'{\"path\": \"/\", \"method\": \"POST\", \"timestamp\": \"2026-04-18T13:53:19.049Z\", \"statusCode\": 201}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0','2026-04-18 13:53:19'),(312,'STAFF',1,'DELETE','unknown',NULL,'{\"path\": \"/\", \"method\": \"DELETE\", \"timestamp\": \"2026-04-18T13:53:23.037Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0','2026-04-18 13:53:23'),(313,'CUSTOMER',2,'UPDATE','unknown',NULL,'{\"path\": \"/me\", \"method\": \"PUT\", \"timestamp\": \"2026-04-18T13:53:43.075Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0','2026-04-18 13:53:43'),(314,'CUSTOMER',2,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-18T13:56:05.599Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0','2026-04-18 13:56:05'),(315,'CUSTOMER',2,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-18T14:11:56.286Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-18 14:11:56'),(316,'STAFF',1,'CREATE','unknown',NULL,'{\"path\": \"/image\", \"method\": \"POST\", \"timestamp\": \"2026-04-18T14:13:12.080Z\", \"statusCode\": 201}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-18 14:13:12'),(317,'STAFF',1,'CREATE','unknown',NULL,'{\"path\": \"/\", \"method\": \"POST\", \"timestamp\": \"2026-04-18T14:13:12.692Z\", \"statusCode\": 201}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-18 14:13:12'),(318,'STAFF',1,'CREATE','unknown',NULL,'{\"path\": \"/image\", \"method\": \"POST\", \"timestamp\": \"2026-04-18T14:14:04.983Z\", \"statusCode\": 201}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-18 14:14:04'),(319,'STAFF',1,'CREATE','unknown',NULL,'{\"path\": \"/\", \"method\": \"POST\", \"timestamp\": \"2026-04-18T14:14:05.885Z\", \"statusCode\": 201}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-18 14:14:05'),(320,'STAFF',1,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-18T14:14:14.275Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-18 14:14:14'),(321,'CUSTOMER',2,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-18T14:39:17.311Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-18 14:39:17'),(322,'STAFF',1,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-18T14:47:08.474Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-18 14:47:08'),(323,'CUSTOMER',2,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-18T14:49:56.873Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-18 14:49:56'),(324,'STAFF',1,'CREATE','unknown',NULL,'{\"path\": \"/daily\", \"method\": \"POST\", \"timestamp\": \"2026-04-18T14:50:06.225Z\", \"statusCode\": 201}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-18 14:50:06'),(325,'STAFF',1,'CREATE','unknown',NULL,'{\"path\": \"/daily\", \"method\": \"POST\", \"timestamp\": \"2026-04-18T14:50:08.579Z\", \"statusCode\": 201}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-18 14:50:08'),(326,'STAFF',1,'CREATE','unknown',NULL,'{\"path\": \"/daily\", \"method\": \"POST\", \"timestamp\": \"2026-04-18T14:50:10.366Z\", \"statusCode\": 201}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-18 14:50:10'),(327,'STAFF',1,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-18T14:50:11.430Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-18 14:50:11'),(328,'CUSTOMER',2,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-18T15:15:32.314Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-18 15:15:32'),(329,'CUSTOMER',2,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-18T15:35:39.841Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-18 15:35:39'),(330,'STAFF',1,'CREATE','unknown',NULL,'{\"path\": \"/logout\", \"method\": \"POST\", \"timestamp\": \"2026-04-18T15:41:51.930Z\", \"statusCode\": 200}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','2026-04-18 15:41:51');
/*!40000 ALTER TABLE `activity_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `address`
--

DROP TABLE IF EXISTS `address`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `address` (
  `address_id` int unsigned NOT NULL AUTO_INCREMENT,
  `customer_id` int unsigned NOT NULL,
  `address_line1` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address_line2` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `postal_code` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `district` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`address_id`),
  KEY `idx_address_customer_id` (`customer_id`),
  CONSTRAINT `fk_address_customer` FOREIGN KEY (`customer_id`) REFERENCES `customer` (`customer_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `address`
--

LOCK TABLES `address` WRITE;
/*!40000 ALTER TABLE `address` DISABLE KEYS */;
INSERT INTO `address` VALUES (1,4,'33/12','Halgampitiyawatta','Kalagedihena','11875','Gamapaha',7.11670000,80.05830000,'2026-04-07 14:22:46','2026-04-07 14:22:46'),(3,4,'43G5+RRC, Kalagedihena, Sri Lanka',NULL,'Kalagedihena',NULL,NULL,7.12704372,80.05916595,'2026-04-07 14:44:52','2026-04-07 14:44:52'),(4,4,'43G5+RRC, Kalagedihena, Sri Lanka',NULL,'Kalagedihena',NULL,NULL,7.12715018,80.05912304,'2026-04-07 15:35:35','2026-04-07 15:35:35'),(5,4,'43G5+RRC, Kalagedihena, Sri Lanka',NULL,'Kalagedihena',NULL,NULL,7.12704372,80.05916595,'2026-04-07 15:45:01','2026-04-07 15:45:01'),(6,4,'43G5+RRC, Kalagedihena, Sri Lanka',NULL,'Kalagedihena',NULL,NULL,7.12704372,80.05916595,'2026-04-07 15:47:04','2026-04-07 15:47:04'),(7,4,'43G5+RRC, Kalagedihena, Sri Lanka','2nd Floor','Kalagedihena',NULL,NULL,7.12704372,80.05916595,'2026-04-07 15:55:22','2026-04-07 15:55:22'),(8,4,'43G5+RRC, Kalagedihena, Sri Lanka','2nd Floor','Kalagedihena',NULL,NULL,7.12704372,80.05916595,'2026-04-07 16:02:42','2026-04-07 16:02:42'),(9,4,'43G5+RRC, Kalagedihena, Sri Lanka','2nd Floor','Kalagedihena',NULL,NULL,7.12704372,80.05916595,'2026-04-07 16:57:43','2026-04-07 16:57:43'),(10,4,'43G5+RRC, Kalagedihena, Sri Lanka',NULL,'Kalagedihena',NULL,NULL,7.12704372,80.05916595,'2026-04-08 23:11:19','2026-04-08 23:11:19'),(11,4,'43G5+RRC, Kalagedihena, Sri Lanka','33/12','Kalagedihena',NULL,NULL,7.12704372,80.05916595,'2026-04-11 12:20:01','2026-04-11 12:20:01'),(12,2,'33/12','Halgampitiyawatta','Kalagedihena','11875',NULL,NULL,NULL,'2026-04-16 14:38:30','2026-04-16 22:19:13');
/*!40000 ALTER TABLE `address` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `app_notification`
--

DROP TABLE IF EXISTS `app_notification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `app_notification` (
  `app_notification_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `recipient_type` enum('CUSTOMER','STAFF') COLLATE utf8mb4_unicode_ci NOT NULL,
  `recipient_id` int unsigned NOT NULL,
  `recipient_role` enum('CUSTOMER','ADMIN','CASHIER','KITCHEN','DELIVERY','STAFF') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `event_type` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload_json` json DEFAULT NULL,
  `priority` enum('LOW','MEDIUM','HIGH','CRITICAL') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'MEDIUM',
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `read_at` datetime DEFAULT NULL,
  `related_order_id` int unsigned DEFAULT NULL,
  `dedupe_key` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`app_notification_id`),
  UNIQUE KEY `uk_app_notif_dedupe_key` (`dedupe_key`),
  KEY `idx_app_notif_recipient_unread_created` (`recipient_type`,`recipient_id`,`is_read`,`created_at`),
  KEY `idx_app_notif_role_unread_created` (`recipient_role`,`is_read`,`created_at`),
  KEY `idx_app_notif_related_order_created` (`related_order_id`,`created_at`),
  KEY `idx_app_notif_event_created` (`event_type`,`created_at`),
  CONSTRAINT `fk_app_notif_order` FOREIGN KEY (`related_order_id`) REFERENCES `order` (`order_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=96 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `app_notification`
--

LOCK TABLES `app_notification` WRITE;
/*!40000 ALTER TABLE `app_notification` DISABLE KEYS */;
INSERT INTO `app_notification` VALUES (1,'CUSTOMER',4,'CUSTOMER','DELIVERY_STATUS_UPDATED','Order #VF2604080001','Your order has been delivered.','{\"status\": \"DELIVERED\", \"orderId\": 9, \"deliveryId\": 8, \"orderNumber\": \"VF2604080001\", \"previousStatus\": \"IN_TRANSIT\"}','HIGH',0,NULL,9,'DELIVERY_STATUS_UPDATED:CUSTOMER:4:9:DELIVERED','2026-04-14 05:29:19','2026-04-14 05:29:19'),(6,'CUSTOMER',4,'CUSTOMER','ORDER_STATUS_UPDATED','Order #VF2604110001','Order delivered','{\"orderId\": 10, \"newStatus\": \"DELIVERED\", \"oldStatus\": \"READY\", \"orderNumber\": \"VF2604110001\"}','MEDIUM',0,NULL,10,'ORDER_STATUS_UPDATED:CUSTOMER:4:10:DELIVERED','2026-04-16 17:45:04','2026-04-16 17:45:04'),(46,'CUSTOMER',4,'CUSTOMER','DELIVERY_STATUS_UPDATED','Order #VF2604110001','Your order has been picked up by the delivery rider.','{\"status\": \"PICKED_UP\", \"orderId\": 10, \"deliveryId\": 9, \"orderNumber\": \"VF2604110001\", \"previousStatus\": \"ASSIGNED\"}','MEDIUM',0,NULL,10,'DELIVERY_STATUS_UPDATED:CUSTOMER:4:10:PICKED_UP','2026-04-17 06:00:29','2026-04-17 06:00:29'),(47,'CUSTOMER',4,'CUSTOMER','DELIVERY_STATUS_UPDATED','Order #VF2604110001','Your order is on the way.','{\"status\": \"IN_TRANSIT\", \"orderId\": 10, \"deliveryId\": 9, \"orderNumber\": \"VF2604110001\", \"previousStatus\": \"PICKED_UP\"}','MEDIUM',0,NULL,10,'DELIVERY_STATUS_UPDATED:CUSTOMER:4:10:IN_TRANSIT','2026-04-17 06:00:30','2026-04-17 06:00:30'),(48,'CUSTOMER',4,'CUSTOMER','DELIVERY_STATUS_UPDATED','Order #VF2604110001','Your order has been delivered.','{\"status\": \"DELIVERED\", \"orderId\": 10, \"deliveryId\": 9, \"orderNumber\": \"VF2604110001\", \"previousStatus\": \"IN_TRANSIT\"}','HIGH',0,NULL,10,'DELIVERY_STATUS_UPDATED:CUSTOMER:4:10:DELIVERED','2026-04-17 06:00:31','2026-04-17 06:00:31');
/*!40000 ALTER TABLE `app_notification` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `category`
--

DROP TABLE IF EXISTS `category`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `category` (
  `category_id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `display_order` int NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`category_id`),
  UNIQUE KEY `uk_name` (`name`),
  KEY `idx_active_order` (`is_active`,`display_order`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `category`
--

LOCK TABLES `category` WRITE;
/*!40000 ALTER TABLE `category` DISABLE KEYS */;
INSERT INTO `category` VALUES (1,'Burgers','Sink your teeth into our delicious range of burgers, crafted with juicy chicken, fresh veggies, and rich sauces, all packed inside soft, toasted buns for the perfect bite.','https://res.cloudinary.com/dtfiyk6vx/image/upload/v1776327286/voleena/category/20250523-sea-thickandjuicycheeseburgers-lorenamasso-hero-685-1776327285451-c3c83fef.jpg',0,1,'2026-04-05 11:30:08','2026-04-18 13:49:14'),(2,'Kottu','Street-food favorites made with bold flavors, stir-fried with vegetables, eggs, and your choice of meat.','https://res.cloudinary.com/dtfiyk6vx/image/upload/v1776327243/voleena/category/slk1-1776327242242-68940ac5.webp',0,1,'2026-04-16 08:14:05','2026-04-18 13:47:24'),(3,'Fried Rice','Street-food favorites made with bold flavors, stir-fried with vegetables, eggs, and your choice of meat.','https://res.cloudinary.com/dtfiyk6vx/image/upload/v1776519946/voleena/category/20220904015448-veg-20fried-20rice-1776230301901-3ce8fc91-1776519943245-c933985a.webp',0,1,'2026-04-18 13:45:53','2026-04-18 13:45:53'),(4,'Rice & Curry','Traditional Sri Lankan rice and curry meals, freshly prepared with rich spices, vegetables, and protein options. Perfect for a complete and satisfying meal.','https://res.cloudinary.com/dtfiyk6vx/image/upload/v1776520188/voleena/category/a7c96da4df74439f92e41ee94c6885d2-1776230171983-e337b80b-1776520186359-e38b5e11.jpg',0,1,'2026-04-18 13:49:49','2026-04-18 13:49:49'),(5,'Beverages','Refreshing drinks to complement your meal, from soft drinks to fresh juices.','https://res.cloudinary.com/dtfiyk6vx/image/upload/v1776520207/voleena/category/571b3ecb0e3c4b0ab1d6723d72df48c0_1080w-1776230395185-dba1444-1776520205275-7fec0c18.webp',0,1,'2026-04-18 13:50:08','2026-04-18 13:50:08');
/*!40000 ALTER TABLE `category` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `combo_pack`
--

DROP TABLE IF EXISTS `combo_pack`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `combo_pack` (
  `combo_id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `price` decimal(10,2) NOT NULL,
  `discount_type` enum('PERCENTAGE','FIXED_PRICE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'FIXED_PRICE',
  `discount_value` decimal(10,2) DEFAULT NULL,
  `image_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `schedule_start_date` date DEFAULT NULL,
  `schedule_end_date` date DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_by` int unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`combo_id`),
  KEY `idx_active_schedule` (`is_active`,`schedule_start_date`,`schedule_end_date`),
  KEY `idx_created_by` (`created_by`),
  CONSTRAINT `fk_combo_created_by` FOREIGN KEY (`created_by`) REFERENCES `staff` (`staff_id`) ON DELETE SET NULL,
  CONSTRAINT `chk_combo_dates` CHECK ((`schedule_end_date` >= `schedule_start_date`)),
  CONSTRAINT `chk_combo_price` CHECK ((`price` > 0))
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `combo_pack`
--

LOCK TABLES `combo_pack` WRITE;
/*!40000 ALTER TABLE `combo_pack` DISABLE KEYS */;
INSERT INTO `combo_pack` VALUES (1,'Chicken Kottu with a Fresh Lime Juice','Spicy and satisfying chopped roti mixed with chicken and vegetables, served hot with a cool fresh lime juice on the side.',765.00,'FIXED_PRICE',NULL,'https://res.cloudinary.com/dtfiyk6vx/image/upload/v1776521592/voleena/combo/sri_lankan_chicken_202604151115-1776231932597-2bdc21ed-1776521589027-85a28877.jpg','2026-04-18','2026-04-23',1,1,'2026-04-18 14:13:12','2026-04-18 14:13:12'),(2,'Chicken Rice & Curry with a Fresh Lime Juice','A classic Sri Lankan meal with flavorful chicken curry, served with steamed rice and sides, paired with a refreshing chilled lime juice.',540.00,'FIXED_PRICE',NULL,'https://res.cloudinary.com/dtfiyk6vx/image/upload/v1776521645/voleena/combo/authentic_sri_lankan_202604151115-1776231943777-8c23ca9d-1776521642483-388a7d82.jpg','2026-04-18','2026-04-25',1,1,'2026-04-18 14:14:05','2026-04-18 14:14:05');
/*!40000 ALTER TABLE `combo_pack` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `combo_pack_item`
--

DROP TABLE IF EXISTS `combo_pack_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `combo_pack_item` (
  `combo_pack_item_id` int unsigned NOT NULL AUTO_INCREMENT,
  `combo_id` int unsigned NOT NULL,
  `menu_item_id` int unsigned NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`combo_pack_item_id`),
  UNIQUE KEY `uk_combo_menu_item` (`combo_id`,`menu_item_id`),
  KEY `idx_menu_item` (`menu_item_id`),
  CONSTRAINT `fk_combo_item_combo` FOREIGN KEY (`combo_id`) REFERENCES `combo_pack` (`combo_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_combo_item_menu` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_item` (`menu_item_id`) ON DELETE CASCADE,
  CONSTRAINT `chk_quantity_positive` CHECK ((`quantity` > 0))
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `combo_pack_item`
--

LOCK TABLES `combo_pack_item` WRITE;
/*!40000 ALTER TABLE `combo_pack_item` DISABLE KEYS */;
INSERT INTO `combo_pack_item` VALUES (1,1,5,1),(2,1,2,1),(3,2,4,1),(4,2,5,1);
/*!40000 ALTER TABLE `combo_pack_item` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer`
--

DROP TABLE IF EXISTS `customer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer` (
  `customer_id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `profile_image_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_email_verified` tinyint(1) NOT NULL DEFAULT '0',
  `is_phone_verified` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `account_status` enum('ACTIVE','INACTIVE','BLOCKED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `preferred_notification` enum('EMAIL','SMS','BOTH') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'BOTH',
  `internal_notes` text COLLATE utf8mb4_unicode_ci,
  `created_by` int unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`customer_id`),
  UNIQUE KEY `uk_customer_email` (`email`),
  KEY `idx_customer_phone` (`phone`),
  KEY `idx_customer_account_status` (`account_status`),
  KEY `idx_customer_created_by` (`created_by`),
  CONSTRAINT `fk_customer_created_by` FOREIGN KEY (`created_by`) REFERENCES `staff` (`staff_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer`
--

LOCK TABLES `customer` WRITE;
/*!40000 ALTER TABLE `customer` DISABLE KEYS */;
INSERT INTO `customer` VALUES (1,'Walk-in Customer',NULL,'7000000000','90cc17501c9c0cba6d4c0697e63e5881c9e63a6d362aa7dda62c6646a5d584ec',NULL,0,0,1,'ACTIVE','SMS','System-generated guest profile for cashier walk-in orders',NULL,'2026-04-03 18:22:24','2026-04-03 18:22:24'),(2,'Chanuka','chanuka@gmail.com','0770000000','$2a$10$/hIYODbZcm7tNyek7reJS.sdfhASZtKDybieqB.UjPlQUvLxc9HUu',NULL,1,1,1,'ACTIVE','BOTH',NULL,NULL,'2026-04-03 18:25:45','2026-04-03 18:29:31'),(3,'Test User','test@example.com','0712345678','$2a$10$hWF5yTjJgvfA4qARcw4VQOAxCLIBC0YrwsTf0S.DveTP/6XH8FZEm',NULL,0,0,1,'ACTIVE','BOTH',NULL,NULL,'2026-04-05 11:03:21','2026-04-05 11:03:21'),(4,'Sanjani','malanherath4@gmail.com','0719888260','$2a$10$QcVmqNOUv9bp69KVnj.4deL16y.e2KpFvTWL0yytivwXfKvQTEVZu',NULL,1,0,1,'ACTIVE','BOTH',NULL,NULL,'2026-04-07 08:30:59','2026-04-11 06:50:01'),(5,'Senitha','chanukaherathbbc@gmail.com','0728886245','$2a$10$JJd2YqFLWRb0SP/qoyqVCeFXamQKCKJ6PLgIjEySXcvg.lw22MBLa',NULL,0,0,1,'ACTIVE','BOTH',NULL,NULL,'2026-04-18 05:09:52','2026-04-18 05:09:52');
/*!40000 ALTER TABLE `customer` ENABLE KEYS */;
UNLOCK TABLES;

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
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `daily_stock`
--

LOCK TABLES `daily_stock` WRITE;
/*!40000 ALTER TABLE `daily_stock` DISABLE KEYS */;
INSERT INTO `daily_stock` (`stock_id`, `menu_item_id`, `stock_date`, `opening_quantity`, `sold_quantity`, `adjusted_quantity`, `version`, `updated_by`, `last_updated`) VALUES (1,1,'2026-04-05',12,3,0,1,NULL,'2026-04-05 11:43:53'),(2,1,'2026-04-07',12,3,0,11,NULL,'2026-04-07 11:27:43'),(3,1,'2026-04-08',12,1,0,1,NULL,'2026-04-08 17:41:19'),(4,1,'2026-04-10',12,0,0,0,1,'2026-04-10 18:47:33'),(5,1,'2026-04-11',12,1,0,1,NULL,'2026-04-11 06:50:01'),(6,1,'2026-04-16',12,1,0,1,NULL,'2026-04-16 18:50:00'),(7,2,'2026-04-16',12,2,0,2,NULL,'2026-04-16 18:50:01'),(8,1,'2026-04-17',12,6,0,12,NULL,'2026-04-17 10:45:26'),(9,2,'2026-04-17',12,1,0,1,NULL,'2026-04-17 06:22:07'),(10,2,'2026-04-18',9,0,3,0,3,'2026-04-18 05:01:35'),(11,1,'2026-04-18',8,1,3,1,NULL,'2026-04-18 05:03:57'),(12,5,'2026-04-18',12,0,0,0,1,'2026-04-18 14:50:06'),(13,3,'2026-04-18',12,0,0,0,1,'2026-04-18 14:50:08'),(14,4,'2026-04-18',12,0,0,0,1,'2026-04-18 14:50:10');
/*!40000 ALTER TABLE `daily_stock` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `delivery`
--

DROP TABLE IF EXISTS `delivery`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `delivery` (
  `delivery_id` int unsigned NOT NULL AUTO_INCREMENT,
  `order_id` int unsigned NOT NULL,
  `delivery_staff_id` int unsigned DEFAULT NULL,
  `address_id` int unsigned NOT NULL,
  `status` enum('PENDING','ASSIGNED','PICKED_UP','IN_TRANSIT','DELIVERED','FAILED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `assigned_at` timestamp NULL DEFAULT NULL,
  `picked_up_at` timestamp NULL DEFAULT NULL,
  `delivered_at` timestamp NULL DEFAULT NULL,
  `estimated_delivery_time` datetime DEFAULT NULL,
  `delivery_proof` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_notes` text COLLATE utf8mb4_unicode_ci,
  `failure_reason` text COLLATE utf8mb4_unicode_ci,
  `distance_km` decimal(5,2) DEFAULT NULL,
  `current_latitude` decimal(10,8) DEFAULT NULL,
  `current_longitude` decimal(11,8) DEFAULT NULL,
  `last_location_update` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`delivery_id`),
  UNIQUE KEY `uk_order` (`order_id`),
  KEY `idx_staff` (`delivery_staff_id`),
  KEY `idx_address` (`address_id`),
  KEY `idx_status` (`status`),
  KEY `idx_assigned_at` (`assigned_at`),
  KEY `idx_delivery_staff_status` (`delivery_staff_id`,`status`,`assigned_at`),
  KEY `idx_delivery_location_update` (`last_location_update` DESC),
  CONSTRAINT `fk_delivery_address` FOREIGN KEY (`address_id`) REFERENCES `address` (`address_id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_delivery_order` FOREIGN KEY (`order_id`) REFERENCES `order` (`order_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_delivery_staff` FOREIGN KEY (`delivery_staff_id`) REFERENCES `staff` (`staff_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `delivery`
--

LOCK TABLES `delivery` WRITE;
/*!40000 ALTER TABLE `delivery` DISABLE KEYS */;
INSERT INTO `delivery` VALUES (1,2,NULL,3,'PENDING',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1.29,NULL,NULL,NULL,'2026-04-07 09:14:53','2026-04-07 09:14:53'),(2,3,NULL,4,'PENDING',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1.29,NULL,NULL,NULL,'2026-04-07 10:05:35','2026-04-07 10:05:35'),(3,4,NULL,5,'PENDING',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1.29,NULL,NULL,NULL,'2026-04-07 10:15:02','2026-04-07 10:15:02'),(4,5,NULL,6,'PENDING',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1.29,NULL,NULL,NULL,'2026-04-07 10:17:04','2026-04-07 10:17:04'),(5,6,NULL,7,'PENDING',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1.29,NULL,NULL,NULL,'2026-04-07 10:25:23','2026-04-07 10:25:23'),(6,7,4,8,'DELIVERED','2026-04-07 11:06:50','2026-04-07 11:07:52','2026-04-07 11:08:53','2026-04-07 16:38:53',NULL,NULL,NULL,1.29,7.12704372,80.05916595,'2026-04-07 16:38:51','2026-04-07 10:32:42','2026-04-07 11:08:53'),(7,8,4,9,'DELIVERED','2026-04-07 11:28:38','2026-04-07 11:29:04','2026-04-07 11:29:06','2026-04-07 16:59:06',NULL,NULL,NULL,1.29,7.12704372,80.05916595,'2026-04-07 16:58:46','2026-04-07 11:27:43','2026-04-07 11:29:06'),(8,9,4,10,'DELIVERED','2026-04-10 18:47:00','2026-04-11 06:41:22','2026-04-14 05:29:19','2026-04-11 12:24:38',NULL,NULL,NULL,1.29,7.12704372,80.05916595,'2026-04-14 10:59:14','2026-04-08 17:41:19','2026-04-14 05:29:19'),(9,10,5,11,'DELIVERED','2026-04-11 06:51:21','2026-04-17 06:00:29','2026-04-17 06:00:31','2026-04-17 11:34:30',NULL,NULL,NULL,1.29,7.12704372,80.05916595,'2026-04-17 11:30:25','2026-04-11 06:50:01','2026-04-17 06:00:31'),(10,11,NULL,12,'PENDING',NULL,NULL,NULL,'2026-04-16 22:42:58',NULL,NULL,NULL,1.29,NULL,NULL,NULL,'2026-04-16 17:08:58','2026-04-16 17:08:58'),(11,12,NULL,12,'PENDING',NULL,NULL,NULL,'2026-04-16 23:20:52',NULL,NULL,NULL,1.29,NULL,NULL,NULL,'2026-04-16 17:46:52','2026-04-16 17:46:52'),(12,13,5,12,'DELIVERED','2026-04-17 06:11:31','2026-04-17 06:11:52','2026-04-17 06:11:54','2026-04-17 11:45:53',NULL,NULL,NULL,1.29,7.12704372,80.05916595,'2026-04-17 11:41:53','2026-04-16 18:29:06','2026-04-17 06:11:54'),(13,14,4,12,'DELIVERED','2026-04-17 06:11:30','2026-04-17 06:11:39','2026-04-17 06:11:42','2026-04-17 11:45:40',NULL,NULL,NULL,1.29,7.12704372,80.05916595,'2026-04-17 11:41:41','2026-04-16 18:43:24','2026-04-17 06:11:42'),(14,15,4,12,'DELIVERED','2026-04-16 18:46:01','2026-04-17 05:45:27','2026-04-17 05:46:48','2026-04-17 11:20:41',NULL,NULL,NULL,1.29,7.12704372,80.05916595,'2026-04-17 11:16:45','2026-04-16 18:45:36','2026-04-17 05:46:48'),(15,16,NULL,12,'PENDING',NULL,NULL,NULL,'2026-04-17 11:24:12',NULL,NULL,NULL,1.29,NULL,NULL,NULL,'2026-04-17 05:35:12','2026-04-17 05:35:12'),(16,17,NULL,12,'PENDING',NULL,NULL,NULL,'2026-04-17 11:25:01',NULL,NULL,NULL,1.29,NULL,NULL,NULL,'2026-04-17 05:36:01','2026-04-17 05:36:01'),(17,18,NULL,12,'PENDING',NULL,NULL,NULL,'2026-04-17 11:25:29',NULL,NULL,NULL,1.29,NULL,NULL,NULL,'2026-04-17 05:36:29','2026-04-17 05:36:29'),(18,19,NULL,12,'PENDING',NULL,NULL,NULL,'2026-04-17 11:25:39',NULL,NULL,NULL,1.29,NULL,NULL,NULL,'2026-04-17 05:36:39','2026-04-17 05:36:39'),(19,20,NULL,12,'PENDING',NULL,NULL,NULL,'2026-04-17 11:31:03',NULL,NULL,NULL,1.29,NULL,NULL,NULL,'2026-04-17 05:42:03','2026-04-17 05:42:03'),(20,21,4,12,'DELIVERED','2026-04-17 06:22:00','2026-04-17 06:22:41','2026-04-17 06:22:43','2026-04-17 11:56:42',NULL,NULL,NULL,1.29,7.12704372,80.05916595,'2026-04-17 11:52:42','2026-04-17 05:43:01','2026-04-17 06:22:43'),(21,22,4,12,'DELIVERED','2026-04-17 06:12:29','2026-04-17 06:12:50','2026-04-17 06:12:53','2026-04-17 11:46:52',NULL,NULL,NULL,1.29,7.12704372,80.05916595,'2026-04-17 11:42:52','2026-04-17 06:12:13','2026-04-17 06:12:53'),(22,23,5,12,'DELIVERED','2026-04-17 06:22:18','2026-04-17 06:22:27','2026-04-17 06:22:33','2026-04-17 11:56:30',NULL,NULL,NULL,1.29,7.12704372,80.05916595,'2026-04-17 11:52:31','2026-04-17 06:22:07','2026-04-17 06:22:33'),(23,24,4,12,'DELIVERED','2026-04-17 10:46:12','2026-04-17 10:46:47','2026-04-17 10:46:55','2026-04-17 16:20:54',NULL,NULL,NULL,1.29,7.12704372,80.05916595,'2026-04-17 16:16:54','2026-04-17 10:45:26','2026-04-17 10:46:55'),(24,25,NULL,12,'PENDING',NULL,NULL,NULL,'2026-04-18 11:02:57',NULL,NULL,NULL,4.63,NULL,NULL,NULL,'2026-04-18 05:03:57','2026-04-18 05:03:57');
/*!40000 ALTER TABLE `delivery` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `delivery_assignment_log`
--

DROP TABLE IF EXISTS `delivery_assignment_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `delivery_assignment_log` (
  `assignment_id` int unsigned NOT NULL AUTO_INCREMENT,
  `order_id` int unsigned NOT NULL,
  `assigned_staff_id` int unsigned NOT NULL,
  `reason` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `active_deliveries` int DEFAULT '0',
  `completion_time` decimal(10,2) DEFAULT '0.00',
  `assigned_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`assignment_id`),
  KEY `idx_order` (`order_id`),
  KEY `idx_staff` (`assigned_staff_id`),
  KEY `idx_assigned_at` (`assigned_at`),
  CONSTRAINT `fk_assignment_order` FOREIGN KEY (`order_id`) REFERENCES `order` (`order_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_assignment_staff` FOREIGN KEY (`assigned_staff_id`) REFERENCES `staff` (`staff_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `delivery_assignment_log`
--

LOCK TABLES `delivery_assignment_log` WRITE;
/*!40000 ALTER TABLE `delivery_assignment_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `delivery_assignment_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `delivery_staff_availability`
--

DROP TABLE IF EXISTS `delivery_staff_availability`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `delivery_staff_availability` (
  `availability_id` int unsigned NOT NULL AUTO_INCREMENT,
  `delivery_staff_id` int unsigned NOT NULL,
  `is_available` tinyint(1) NOT NULL DEFAULT '1',
  `current_order_id` int unsigned DEFAULT NULL,
  `last_updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`availability_id`),
  UNIQUE KEY `uk_staff` (`delivery_staff_id`),
  KEY `idx_available` (`is_available`),
  KEY `idx_current_order` (`current_order_id`),
  CONSTRAINT `fk_availability_order` FOREIGN KEY (`current_order_id`) REFERENCES `order` (`order_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_availability_staff` FOREIGN KEY (`delivery_staff_id`) REFERENCES `staff` (`staff_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `delivery_staff_availability`
--

LOCK TABLES `delivery_staff_availability` WRITE;
/*!40000 ALTER TABLE `delivery_staff_availability` DISABLE KEYS */;
INSERT INTO `delivery_staff_availability` VALUES (1,4,1,NULL,'2026-04-17 10:46:55'),(8,5,1,NULL,'2026-04-17 06:22:33');
/*!40000 ALTER TABLE `delivery_staff_availability` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `email_verification_token`
--

DROP TABLE IF EXISTS `email_verification_token`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `email_verification_token` (
  `email_verification_token_id` int unsigned NOT NULL AUTO_INCREMENT,
  `customer_id` int unsigned NOT NULL,
  `token_hash` char(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` datetime NOT NULL,
  `used_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`email_verification_token_id`),
  UNIQUE KEY `uk_email_verification_token_hash` (`token_hash`),
  KEY `idx_email_verification_customer` (`customer_id`,`used_at`,`created_at`),
  KEY `idx_email_verification_expiry` (`expires_at`),
  CONSTRAINT `fk_email_verification_customer` FOREIGN KEY (`customer_id`) REFERENCES `customer` (`customer_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `email_verification_token`
--

LOCK TABLES `email_verification_token` WRITE;
/*!40000 ALTER TABLE `email_verification_token` DISABLE KEYS */;
/*!40000 ALTER TABLE `email_verification_token` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `feedback`
--

DROP TABLE IF EXISTS `feedback`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `feedback` (
  `feedback_id` int unsigned NOT NULL AUTO_INCREMENT,
  `rating` int NOT NULL,
  `comment` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customer_id` int unsigned DEFAULT NULL,
  `order_id` int unsigned DEFAULT NULL,
  `feedback_type` enum('ORDER','DELIVERY','GENERAL') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ORDER',
  `admin_response` text COLLATE utf8mb4_unicode_ci,
  `responded_at` timestamp NULL DEFAULT NULL,
  `responded_by` int unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`feedback_id`),
  KEY `idx_customer` (`customer_id`),
  KEY `idx_order` (`order_id`),
  KEY `idx_rating` (`rating`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_responded_by` (`responded_by`),
  KEY `idx_feedback_created_at` (`created_at`),
  CONSTRAINT `fk_feedback_customer` FOREIGN KEY (`customer_id`) REFERENCES `customer` (`customer_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_feedback_order` FOREIGN KEY (`order_id`) REFERENCES `order` (`order_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_feedback_responded_by` FOREIGN KEY (`responded_by`) REFERENCES `staff` (`staff_id`) ON DELETE SET NULL,
  CONSTRAINT `chk_rating_range` CHECK ((`rating` between 1 and 5))
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `feedback`
--

LOCK TABLES `feedback` WRITE;
/*!40000 ALTER TABLE `feedback` DISABLE KEYS */;
INSERT INTO `feedback` VALUES (1,3,'{\"comment\":\"\",\"positiveTags\":[\"Good taste\"],\"issueTags\":[]}',4,8,'ORDER',NULL,NULL,NULL,'2026-04-07 11:45:03');
/*!40000 ALTER TABLE `feedback` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `menu_item`
--

DROP TABLE IF EXISTS `menu_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `menu_item` (
  `menu_item_id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `price` decimal(10,2) NOT NULL,
  `image_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category_id` int unsigned NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `is_available` tinyint(1) NOT NULL DEFAULT '1',
  `created_by` int unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`menu_item_id`),
  KEY `idx_category` (`category_id`),
  KEY `idx_active_available` (`is_active`,`is_available`),
  KEY `idx_created_by` (`created_by`),
  CONSTRAINT `fk_menu_item_category` FOREIGN KEY (`category_id`) REFERENCES `category` (`category_id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_menu_item_created_by` FOREIGN KEY (`created_by`) REFERENCES `staff` (`staff_id`) ON DELETE SET NULL,
  CONSTRAINT `chk_price_positive` CHECK ((`price` > 0))
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `menu_item`
--

LOCK TABLES `menu_item` WRITE;
/*!40000 ALTER TABLE `menu_item` DISABLE KEYS */;
INSERT INTO `menu_item` VALUES (1,'Chicken Burger','Juicy, perfectly seasoned chicken patty grilled to golden perfection, layered with crisp lettuce, fresh tomatoes, and creamy mayo, all tucked inside a soft toasted bun. A timeless favorite that never disappoints.',500.00,'https://res.cloudinary.com/dtfiyk6vx/image/upload/v1776327319/voleena/menu/shutterstock_574607542-1776327317958-9abccc66.jpg',1,1,1,1,'2026-04-05 11:30:24','2026-04-18 15:45:00'),(2,'Chicken Kottu','Chopped godamba roti stir-fried with chicken, vegetables, egg, and spices.',700.00,'https://res.cloudinary.com/dtfiyk6vx/image/upload/v1776327335/voleena/menu/slk1-1776327334768-d26c7a0d.webp',2,1,1,1,'2026-04-16 08:15:37','2026-04-18 15:45:00'),(3,'Seafood Fried Rice','Flavorful rice stir-fried with prawns, cuttlefish, vegetables, and soy sauce.',800.00,'https://res.cloudinary.com/dtfiyk6vx/image/upload/v1776520330/voleena/menu/buttery_seafood_fried_rice_recipe_tiffy_chen-1776230994252-c-1776520326957-4f06901c.jpg',3,1,1,1,'2026-04-18 13:52:10','2026-04-18 15:45:00'),(4,'Chicken Rice & Curry','Steamed rice served with spicy chicken curry, dhal, vegetable curry, and sambol.',450.00,'https://res.cloudinary.com/dtfiyk6vx/image/upload/v1776520367/voleena/menu/ricecurry-chicken-1776230654606-eba822a1-1776520364493-b5bd8fef.png',4,1,1,1,'2026-04-18 13:52:47','2026-04-18 15:45:00'),(5,'Fresh Lime Juice','Chilled lime juice with a hint of sugar and salt.',150.00,'https://res.cloudinary.com/dtfiyk6vx/image/upload/v1776520395/voleena/menu/lime-juice-fresh-1-1776231097016-e08f56b8-1776520392657-3a2979e1.png',5,1,1,1,'2026-04-18 13:53:19','2026-04-18 15:45:00');
/*!40000 ALTER TABLE `menu_item` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification`
--

DROP TABLE IF EXISTS `notification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification` (
  `notification_id` int unsigned NOT NULL AUTO_INCREMENT,
  `recipient_type` enum('CUSTOMER','STAFF') COLLATE utf8mb4_unicode_ci NOT NULL,
  `recipient_id` int unsigned NOT NULL,
  `notification_type` enum('EMAIL','SMS','PUSH') COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('PENDING','SENT','FAILED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `sent_at` timestamp NULL DEFAULT NULL,
  `error_message` text COLLATE utf8mb4_unicode_ci,
  `related_order_id` int unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`notification_id`),
  KEY `idx_recipient` (`recipient_type`,`recipient_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_related_order` (`related_order_id`),
  CONSTRAINT `fk_notification_order` FOREIGN KEY (`related_order_id`) REFERENCES `order` (`order_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification`
--

LOCK TABLES `notification` WRITE;
/*!40000 ALTER TABLE `notification` DISABLE KEYS */;
/*!40000 ALTER TABLE `notification` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order`
--

DROP TABLE IF EXISTS `order`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order` (
  `order_id` int unsigned NOT NULL AUTO_INCREMENT,
  `order_number` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_id` int unsigned DEFAULT NULL,
  `contact_phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `verified_profile_phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `promotion_id` int unsigned DEFAULT NULL,
  `discount_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `delivery_fee` decimal(10,2) NOT NULL DEFAULT '0.00',
  `final_amount` decimal(10,2) GENERATED ALWAYS AS (greatest(((`total_amount` - `discount_amount`) + `delivery_fee`),0)) STORED,
  `status` enum('PENDING','CONFIRMED','PREPARING','READY','OUT_FOR_DELIVERY','DELIVERED','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `order_type` enum('ONLINE','DELIVERY','TAKEAWAY','WALK_IN') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ONLINE',
  `special_instructions` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cancellation_reason` text COLLATE utf8mb4_unicode_ci,
  `cancelled_by` enum('CUSTOMER','ADMIN','CASHIER','SYSTEM') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `confirmed_at` timestamp NULL DEFAULT NULL,
  `preparing_at` timestamp NULL DEFAULT NULL,
  `ready_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `cancelled_at` timestamp NULL DEFAULT NULL,
  `confirmed_by` int unsigned DEFAULT NULL,
  `updated_by` int unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`order_id`),
  UNIQUE KEY `uk_order_number` (`order_number`),
  KEY `idx_customer` (`customer_id`),
  KEY `idx_status_type` (`status`,`order_type`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_promotion` (`promotion_id`),
  KEY `idx_confirmed_by` (`confirmed_by`),
  KEY `idx_updated_by` (`updated_by`),
  KEY `idx_order_status_created` (`status`,`created_at` DESC),
  KEY `idx_order_customer_status` (`customer_id`,`status`,`created_at`),
  KEY `idx_order_status_type_created` (`status`,`order_type`,`created_at`),
  CONSTRAINT `fk_order_confirmed_by` FOREIGN KEY (`confirmed_by`) REFERENCES `staff` (`staff_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_order_customer` FOREIGN KEY (`customer_id`) REFERENCES `customer` (`customer_id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_order_promotion` FOREIGN KEY (`promotion_id`) REFERENCES `promotion` (`promotion_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_order_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `staff` (`staff_id`) ON DELETE SET NULL,
  CONSTRAINT `chk_total_positive` CHECK ((`total_amount` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order`
--

LOCK TABLES `order` WRITE;
/*!40000 ALTER TABLE `order` DISABLE KEYS */;
INSERT INTO `order` (`order_id`, `order_number`, `customer_id`, `contact_phone`, `verified_profile_phone`, `total_amount`, `promotion_id`, `discount_amount`, `delivery_fee`, `status`, `order_type`, `special_instructions`, `cancellation_reason`, `cancelled_by`, `confirmed_at`, `preparing_at`, `ready_at`, `completed_at`, `cancelled_at`, `confirmed_by`, `updated_by`, `created_at`, `updated_at`) VALUES (1,'VF2604050001',2,NULL,NULL,500.00,NULL,0.00,0.00,'CANCELLED','TAKEAWAY',NULL,NULL,NULL,'2026-04-05 11:39:29','2026-04-05 11:43:41','2026-04-05 11:43:53',NULL,'2026-04-07 09:08:54',NULL,1,'2026-04-05 11:39:29','2026-04-07 09:08:54'),(2,'VF2604070001',4,NULL,NULL,500.00,NULL,0.00,100.00,'CANCELLED','DELIVERY',NULL,NULL,NULL,'2026-04-07 09:14:52',NULL,NULL,NULL,'2026-04-07 10:04:59',NULL,1,'2026-04-07 09:14:52','2026-04-07 10:04:59'),(3,'VF2604070002',4,NULL,NULL,500.00,NULL,0.00,100.00,'CANCELLED','DELIVERY',NULL,'Cancelled by customer','CUSTOMER','2026-04-07 10:05:35',NULL,NULL,NULL,'2026-04-07 10:08:04',NULL,NULL,'2026-04-07 10:05:35','2026-04-07 10:08:04'),(4,'VF2604070003',4,NULL,NULL,500.00,NULL,0.00,100.00,'CANCELLED','DELIVERY',NULL,'Cancelled by customer','CUSTOMER','2026-04-07 10:15:02',NULL,NULL,NULL,'2026-04-07 10:34:28',NULL,NULL,'2026-04-07 10:15:02','2026-04-07 10:34:28'),(5,'VF2604070004',4,NULL,NULL,500.00,NULL,0.00,100.00,'CANCELLED','DELIVERY',NULL,'Cancelled by customer','CUSTOMER','2026-04-07 10:17:04',NULL,NULL,NULL,'2026-04-07 10:22:05',NULL,NULL,'2026-04-07 10:17:04','2026-04-07 10:22:05'),(6,'VF2604070005',4,NULL,NULL,500.00,NULL,0.00,100.00,'CANCELLED','DELIVERY',NULL,'Cancelled by customer','CUSTOMER','2026-04-07 10:25:23',NULL,NULL,NULL,'2026-04-07 10:28:09',NULL,NULL,'2026-04-07 10:25:23','2026-04-07 10:28:09'),(7,'VF2604070006',4,NULL,NULL,500.00,NULL,0.00,100.00,'DELIVERED','DELIVERY',NULL,NULL,NULL,'2026-04-07 10:32:42','2026-04-07 10:37:16','2026-04-07 11:06:50','2026-04-07 11:08:53',NULL,NULL,3,'2026-04-07 10:32:42','2026-04-07 11:08:53'),(8,'VF2604070007',4,NULL,NULL,500.00,NULL,0.00,100.00,'DELIVERED','DELIVERY',NULL,NULL,NULL,'2026-04-07 11:27:43','2026-04-07 11:28:37','2026-04-07 11:28:38','2026-04-07 11:29:06',NULL,NULL,3,'2026-04-07 11:27:43','2026-04-07 11:29:06'),(9,'VF2604080001',4,NULL,NULL,500.00,NULL,0.00,100.00,'DELIVERED','DELIVERY',NULL,NULL,NULL,'2026-04-08 17:41:19','2026-04-10 18:46:56','2026-04-10 18:47:00','2026-04-14 05:29:19',NULL,NULL,3,'2026-04-08 17:41:19','2026-04-14 05:29:19'),(10,'VF2604110001',4,NULL,NULL,500.00,NULL,0.00,100.00,'DELIVERED','DELIVERY',NULL,NULL,NULL,'2026-04-11 06:50:01','2026-04-11 06:51:20','2026-04-11 06:51:21','2026-04-17 06:00:31',NULL,NULL,1,'2026-04-11 06:50:01','2026-04-17 06:00:31'),(11,'ORD2604160001',2,NULL,NULL,1200.00,NULL,0.00,150.00,'CANCELLED','DELIVERY',NULL,'Auto-cancelled after 30 minutes without confirmation','SYSTEM',NULL,NULL,NULL,NULL,'2026-04-16 17:50:00',NULL,NULL,'2026-04-16 17:08:58','2026-04-16 17:50:00'),(12,'ORD2604160002',2,NULL,NULL,700.00,NULL,0.00,150.00,'CANCELLED','DELIVERY',NULL,'Auto-cancelled after 30 minutes without confirmation','SYSTEM',NULL,NULL,NULL,NULL,'2026-04-16 18:20:00',NULL,NULL,'2026-04-16 17:46:52','2026-04-16 18:20:00'),(13,'ORD2604160003',2,NULL,NULL,500.00,NULL,0.00,150.00,'DELIVERED','DELIVERY',NULL,NULL,NULL,'2026-04-16 18:50:00','2026-04-17 06:11:28','2026-04-17 06:11:31','2026-04-17 06:11:54',NULL,NULL,3,'2026-04-16 18:29:06','2026-04-17 06:11:54'),(14,'ORD2604170001',2,NULL,NULL,700.00,NULL,0.00,150.00,'DELIVERED','DELIVERY',NULL,NULL,NULL,'2026-04-16 18:50:01','2026-04-17 06:11:26','2026-04-17 06:11:30','2026-04-17 06:11:42',NULL,NULL,3,'2026-04-16 18:43:24','2026-04-17 06:11:42'),(15,'ORD2604170002',2,NULL,NULL,700.00,NULL,0.00,150.00,'DELIVERED','DELIVERY',NULL,NULL,NULL,'2026-04-16 18:45:36','2026-04-16 18:46:00','2026-04-16 18:46:01','2026-04-17 05:46:48',NULL,NULL,3,'2026-04-16 18:45:36','2026-04-17 05:46:48'),(16,'ORD2604170003',2,NULL,NULL,500.00,NULL,0.00,150.00,'CANCELLED','DELIVERY',NULL,'Payment initialization failed: Online payments are not configured','SYSTEM','2026-04-17 05:35:12',NULL,NULL,NULL,'2026-04-17 05:35:14',NULL,NULL,'2026-04-17 05:35:12','2026-04-17 05:35:14'),(17,'ORD2604170004',2,NULL,NULL,500.00,NULL,0.00,150.00,'CANCELLED','DELIVERY',NULL,'Payment initialization failed: Online payments are not configured','SYSTEM','2026-04-17 05:36:01',NULL,NULL,NULL,'2026-04-17 05:36:02',NULL,NULL,'2026-04-17 05:36:01','2026-04-17 05:36:02'),(18,'ORD2604170005',2,NULL,NULL,500.00,NULL,0.00,150.00,'CONFIRMED','DELIVERY',NULL,NULL,NULL,'2026-04-17 05:36:29',NULL,NULL,NULL,NULL,NULL,NULL,'2026-04-17 05:36:29','2026-04-17 05:36:29'),(19,'ORD2604170006',2,NULL,NULL,500.00,NULL,0.00,150.00,'CANCELLED','DELIVERY',NULL,'Payment initialization failed: Online payments are not configured','SYSTEM','2026-04-17 05:36:39',NULL,NULL,NULL,'2026-04-17 05:36:40',NULL,NULL,'2026-04-17 05:36:39','2026-04-17 05:36:40'),(20,'ORD2604170007',2,NULL,NULL,500.00,NULL,0.00,150.00,'CONFIRMED','DELIVERY',NULL,NULL,NULL,'2026-04-17 05:42:03',NULL,NULL,NULL,NULL,NULL,NULL,'2026-04-17 05:42:03','2026-04-17 05:42:03'),(21,'ORD2604170008',2,NULL,NULL,500.00,NULL,0.00,150.00,'DELIVERED','DELIVERY',NULL,NULL,NULL,'2026-04-17 05:43:01','2026-04-17 05:43:32','2026-04-17 05:43:36','2026-04-17 06:22:43',NULL,NULL,3,'2026-04-17 05:43:01','2026-04-17 06:22:43'),(22,'ORD2604170009',2,NULL,NULL,500.00,NULL,0.00,150.00,'DELIVERED','DELIVERY',NULL,NULL,NULL,'2026-04-17 06:12:13','2026-04-17 06:12:25','2026-04-17 06:12:29','2026-04-17 06:12:53',NULL,NULL,3,'2026-04-17 06:12:13','2026-04-17 06:12:53'),(23,'ORD2604170010',2,NULL,NULL,1200.00,NULL,0.00,150.00,'DELIVERED','DELIVERY',NULL,NULL,NULL,'2026-04-17 06:22:07','2026-04-17 06:22:16','2026-04-17 06:22:18','2026-04-17 06:22:33',NULL,NULL,3,'2026-04-17 06:22:07','2026-04-17 06:22:33'),(24,'ORD2604170011',2,NULL,NULL,500.00,NULL,0.00,150.00,'DELIVERED','DELIVERY',NULL,NULL,NULL,'2026-04-17 10:45:26','2026-04-17 10:46:08','2026-04-17 10:46:12','2026-04-17 10:46:55',NULL,NULL,3,'2026-04-17 10:45:26','2026-04-17 10:46:55'),(25,'ORD2604180001',2,NULL,NULL,500.00,NULL,0.00,190.00,'CONFIRMED','DELIVERY',NULL,NULL,NULL,'2026-04-18 05:03:57',NULL,NULL,NULL,NULL,NULL,NULL,'2026-04-18 05:03:57','2026-04-18 05:03:57');
/*!40000 ALTER TABLE `order` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_item`
--

DROP TABLE IF EXISTS `order_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_item` (
  `order_item_id` int unsigned NOT NULL AUTO_INCREMENT,
  `order_id` int unsigned NOT NULL,
  `menu_item_id` int unsigned DEFAULT NULL,
  `combo_id` int unsigned DEFAULT NULL,
  `quantity` int NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) GENERATED ALWAYS AS ((`quantity` * `unit_price`)) STORED,
  `item_notes` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`order_item_id`),
  KEY `idx_order` (`order_id`),
  KEY `idx_menu_item` (`menu_item_id`),
  KEY `idx_combo` (`combo_id`),
  CONSTRAINT `fk_order_item_combo` FOREIGN KEY (`combo_id`) REFERENCES `combo_pack` (`combo_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_order_item_menu` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_item` (`menu_item_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_order_item_order` FOREIGN KEY (`order_id`) REFERENCES `order` (`order_id`) ON DELETE CASCADE,
  CONSTRAINT `chk_item_quantity` CHECK ((`quantity` > 0)),
  CONSTRAINT `chk_unit_price` CHECK ((`unit_price` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_item`
--

LOCK TABLES `order_item` WRITE;
/*!40000 ALTER TABLE `order_item` DISABLE KEYS */;
INSERT INTO `order_item` (`order_item_id`, `order_id`, `menu_item_id`, `combo_id`, `quantity`, `unit_price`, `item_notes`) VALUES (1,1,1,NULL,1,500.00,NULL),(2,2,1,NULL,1,500.00,NULL),(3,3,1,NULL,1,500.00,NULL),(4,4,1,NULL,1,500.00,NULL),(5,5,1,NULL,1,500.00,NULL),(6,6,1,NULL,1,500.00,NULL),(7,7,1,NULL,1,500.00,NULL),(8,8,1,NULL,1,500.00,NULL),(9,9,1,NULL,1,500.00,NULL),(10,10,1,NULL,1,500.00,NULL),(11,11,2,NULL,1,700.00,NULL),(12,11,1,NULL,1,500.00,NULL),(13,12,2,NULL,1,700.00,NULL),(14,13,1,NULL,1,500.00,NULL),(15,14,2,NULL,1,700.00,NULL),(16,15,2,NULL,1,700.00,NULL),(17,16,1,NULL,1,500.00,NULL),(18,17,1,NULL,1,500.00,NULL),(19,18,1,NULL,1,500.00,NULL),(20,19,1,NULL,1,500.00,NULL),(21,20,1,NULL,1,500.00,NULL),(22,21,1,NULL,1,500.00,NULL),(23,22,1,NULL,1,500.00,NULL),(24,23,2,NULL,1,700.00,NULL),(25,23,1,NULL,1,500.00,NULL),(26,24,1,NULL,1,500.00,NULL),(27,25,1,NULL,1,500.00,NULL);
/*!40000 ALTER TABLE `order_item` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_item_preorder_backup`
--

DROP TABLE IF EXISTS `order_item_preorder_backup`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_item_preorder_backup` (
  `order_item_id` int unsigned NOT NULL AUTO_INCREMENT,
  `order_id` int unsigned NOT NULL,
  `menu_item_id` int unsigned DEFAULT NULL,
  `combo_id` int unsigned DEFAULT NULL,
  `quantity` int NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) GENERATED ALWAYS AS ((`quantity` * `unit_price`)) STORED,
  `item_notes` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`order_item_id`),
  KEY `idx_order` (`order_id`),
  KEY `idx_menu_item` (`menu_item_id`),
  KEY `idx_combo` (`combo_id`),
  CONSTRAINT `order_item_preorder_backup_chk_1` CHECK ((`quantity` > 0)),
  CONSTRAINT `order_item_preorder_backup_chk_2` CHECK ((`unit_price` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_item_preorder_backup`
--

LOCK TABLES `order_item_preorder_backup` WRITE;
/*!40000 ALTER TABLE `order_item_preorder_backup` DISABLE KEYS */;
INSERT INTO `order_item_preorder_backup` (`order_item_id`, `order_id`, `menu_item_id`, `combo_id`, `quantity`, `unit_price`, `item_notes`) VALUES (1,1,1,NULL,1,500.00,NULL),(2,2,1,NULL,1,500.00,NULL),(3,3,1,NULL,1,500.00,NULL),(4,4,1,NULL,1,500.00,NULL),(5,5,1,NULL,1,500.00,NULL),(6,6,1,NULL,1,500.00,NULL),(7,7,1,NULL,1,500.00,NULL),(8,8,1,NULL,1,500.00,NULL),(9,9,1,NULL,1,500.00,NULL),(10,10,1,NULL,1,500.00,NULL),(11,11,2,NULL,1,700.00,NULL),(12,11,1,NULL,1,500.00,NULL),(13,12,2,NULL,1,700.00,NULL),(14,13,1,NULL,1,500.00,NULL),(15,14,2,NULL,1,700.00,NULL),(16,15,2,NULL,1,700.00,NULL),(17,16,1,NULL,1,500.00,NULL),(18,17,1,NULL,1,500.00,NULL),(19,18,1,NULL,1,500.00,NULL),(20,19,1,NULL,1,500.00,NULL),(21,20,1,NULL,1,500.00,NULL),(22,21,1,NULL,1,500.00,NULL),(23,22,1,NULL,1,500.00,NULL),(24,23,2,NULL,1,700.00,NULL),(25,23,1,NULL,1,500.00,NULL),(26,24,1,NULL,1,500.00,NULL),(27,25,1,NULL,1,500.00,NULL);
/*!40000 ALTER TABLE `order_item_preorder_backup` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_preorder_backup`
--

DROP TABLE IF EXISTS `order_preorder_backup`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_preorder_backup` (
  `order_id` int unsigned NOT NULL AUTO_INCREMENT,
  `order_number` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_id` int unsigned DEFAULT NULL,
  `contact_phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `verified_profile_phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `promotion_id` int unsigned DEFAULT NULL,
  `discount_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `delivery_fee` decimal(10,2) NOT NULL DEFAULT '0.00',
  `final_amount` decimal(10,2) GENERATED ALWAYS AS (greatest(((`total_amount` - `discount_amount`) + `delivery_fee`),0)) STORED,
  `status` enum('PENDING','CONFIRMED','PREPARING','READY','OUT_FOR_DELIVERY','DELIVERED','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `order_type` enum('ONLINE','DELIVERY','TAKEAWAY','WALK_IN') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ONLINE',
  `special_instructions` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cancellation_reason` text COLLATE utf8mb4_unicode_ci,
  `cancelled_by` enum('CUSTOMER','ADMIN','CASHIER','SYSTEM') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `confirmed_at` timestamp NULL DEFAULT NULL,
  `preparing_at` timestamp NULL DEFAULT NULL,
  `ready_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `cancelled_at` timestamp NULL DEFAULT NULL,
  `confirmed_by` int unsigned DEFAULT NULL,
  `updated_by` int unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`order_id`),
  UNIQUE KEY `uk_order_number` (`order_number`),
  KEY `idx_customer` (`customer_id`),
  KEY `idx_status_type` (`status`,`order_type`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_promotion` (`promotion_id`),
  KEY `idx_confirmed_by` (`confirmed_by`),
  KEY `idx_updated_by` (`updated_by`),
  KEY `idx_order_status_created` (`status`,`created_at` DESC),
  KEY `idx_order_customer_status` (`customer_id`,`status`,`created_at`),
  KEY `idx_order_status_type_created` (`status`,`order_type`,`created_at`),
  CONSTRAINT `order_preorder_backup_chk_1` CHECK ((`total_amount` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_preorder_backup`
--

LOCK TABLES `order_preorder_backup` WRITE;
/*!40000 ALTER TABLE `order_preorder_backup` DISABLE KEYS */;
INSERT INTO `order_preorder_backup` (`order_id`, `order_number`, `customer_id`, `contact_phone`, `verified_profile_phone`, `total_amount`, `promotion_id`, `discount_amount`, `delivery_fee`, `status`, `order_type`, `special_instructions`, `cancellation_reason`, `cancelled_by`, `confirmed_at`, `preparing_at`, `ready_at`, `completed_at`, `cancelled_at`, `confirmed_by`, `updated_by`, `created_at`, `updated_at`) VALUES (1,'VF2604050001',2,NULL,NULL,500.00,NULL,0.00,0.00,'CANCELLED','TAKEAWAY',NULL,NULL,NULL,'2026-04-05 11:39:29','2026-04-05 11:43:41','2026-04-05 11:43:53',NULL,'2026-04-07 09:08:54',NULL,1,'2026-04-18 15:52:31','2026-04-18 15:52:31'),(2,'VF2604070001',4,NULL,NULL,500.00,NULL,0.00,100.00,'CANCELLED','DELIVERY',NULL,NULL,NULL,'2026-04-07 09:14:52',NULL,NULL,NULL,'2026-04-07 10:04:59',NULL,1,'2026-04-18 15:52:31','2026-04-18 15:52:31'),(3,'VF2604070002',4,NULL,NULL,500.00,NULL,0.00,100.00,'CANCELLED','DELIVERY',NULL,'Cancelled by customer','CUSTOMER','2026-04-07 10:05:35',NULL,NULL,NULL,'2026-04-07 10:08:04',NULL,NULL,'2026-04-18 15:52:31','2026-04-18 15:52:31'),(4,'VF2604070003',4,NULL,NULL,500.00,NULL,0.00,100.00,'CANCELLED','DELIVERY',NULL,'Cancelled by customer','CUSTOMER','2026-04-07 10:15:02',NULL,NULL,NULL,'2026-04-07 10:34:28',NULL,NULL,'2026-04-18 15:52:31','2026-04-18 15:52:31'),(5,'VF2604070004',4,NULL,NULL,500.00,NULL,0.00,100.00,'CANCELLED','DELIVERY',NULL,'Cancelled by customer','CUSTOMER','2026-04-07 10:17:04',NULL,NULL,NULL,'2026-04-07 10:22:05',NULL,NULL,'2026-04-18 15:52:31','2026-04-18 15:52:31'),(6,'VF2604070005',4,NULL,NULL,500.00,NULL,0.00,100.00,'CANCELLED','DELIVERY',NULL,'Cancelled by customer','CUSTOMER','2026-04-07 10:25:23',NULL,NULL,NULL,'2026-04-07 10:28:09',NULL,NULL,'2026-04-18 15:52:31','2026-04-18 15:52:31'),(7,'VF2604070006',4,NULL,NULL,500.00,NULL,0.00,100.00,'DELIVERED','DELIVERY',NULL,NULL,NULL,'2026-04-07 10:32:42','2026-04-07 10:37:16','2026-04-07 11:06:50','2026-04-07 11:08:53',NULL,NULL,3,'2026-04-18 15:52:31','2026-04-18 15:52:31'),(8,'VF2604070007',4,NULL,NULL,500.00,NULL,0.00,100.00,'DELIVERED','DELIVERY',NULL,NULL,NULL,'2026-04-07 11:27:43','2026-04-07 11:28:37','2026-04-07 11:28:38','2026-04-07 11:29:06',NULL,NULL,3,'2026-04-18 15:52:31','2026-04-18 15:52:31'),(9,'VF2604080001',4,NULL,NULL,500.00,NULL,0.00,100.00,'DELIVERED','DELIVERY',NULL,NULL,NULL,'2026-04-08 17:41:19','2026-04-10 18:46:56','2026-04-10 18:47:00','2026-04-14 05:29:19',NULL,NULL,3,'2026-04-18 15:52:31','2026-04-18 15:52:31'),(10,'VF2604110001',4,NULL,NULL,500.00,NULL,0.00,100.00,'DELIVERED','DELIVERY',NULL,NULL,NULL,'2026-04-11 06:50:01','2026-04-11 06:51:20','2026-04-11 06:51:21','2026-04-17 06:00:31',NULL,NULL,1,'2026-04-18 15:52:31','2026-04-18 15:52:31'),(11,'ORD2604160001',2,NULL,NULL,1200.00,NULL,0.00,150.00,'CANCELLED','DELIVERY',NULL,'Auto-cancelled after 30 minutes without confirmation','SYSTEM',NULL,NULL,NULL,NULL,'2026-04-16 17:50:00',NULL,NULL,'2026-04-18 15:52:31','2026-04-18 15:52:31'),(12,'ORD2604160002',2,NULL,NULL,700.00,NULL,0.00,150.00,'CANCELLED','DELIVERY',NULL,'Auto-cancelled after 30 minutes without confirmation','SYSTEM',NULL,NULL,NULL,NULL,'2026-04-16 18:20:00',NULL,NULL,'2026-04-18 15:52:31','2026-04-18 15:52:31'),(13,'ORD2604160003',2,NULL,NULL,500.00,NULL,0.00,150.00,'DELIVERED','DELIVERY',NULL,NULL,NULL,'2026-04-16 18:50:00','2026-04-17 06:11:28','2026-04-17 06:11:31','2026-04-17 06:11:54',NULL,NULL,3,'2026-04-18 15:52:31','2026-04-18 15:52:31'),(14,'ORD2604170001',2,NULL,NULL,700.00,NULL,0.00,150.00,'DELIVERED','DELIVERY',NULL,NULL,NULL,'2026-04-16 18:50:01','2026-04-17 06:11:26','2026-04-17 06:11:30','2026-04-17 06:11:42',NULL,NULL,3,'2026-04-18 15:52:31','2026-04-18 15:52:31'),(15,'ORD2604170002',2,NULL,NULL,700.00,NULL,0.00,150.00,'DELIVERED','DELIVERY',NULL,NULL,NULL,'2026-04-16 18:45:36','2026-04-16 18:46:00','2026-04-16 18:46:01','2026-04-17 05:46:48',NULL,NULL,3,'2026-04-18 15:52:31','2026-04-18 15:52:31'),(16,'ORD2604170003',2,NULL,NULL,500.00,NULL,0.00,150.00,'CANCELLED','DELIVERY',NULL,'Payment initialization failed: Online payments are not configured','SYSTEM','2026-04-17 05:35:12',NULL,NULL,NULL,'2026-04-17 05:35:14',NULL,NULL,'2026-04-18 15:52:31','2026-04-18 15:52:31'),(17,'ORD2604170004',2,NULL,NULL,500.00,NULL,0.00,150.00,'CANCELLED','DELIVERY',NULL,'Payment initialization failed: Online payments are not configured','SYSTEM','2026-04-17 05:36:01',NULL,NULL,NULL,'2026-04-17 05:36:02',NULL,NULL,'2026-04-18 15:52:31','2026-04-18 15:52:31'),(18,'ORD2604170005',2,NULL,NULL,500.00,NULL,0.00,150.00,'CONFIRMED','DELIVERY',NULL,NULL,NULL,'2026-04-17 05:36:29',NULL,NULL,NULL,NULL,NULL,NULL,'2026-04-18 15:52:31','2026-04-18 15:52:31'),(19,'ORD2604170006',2,NULL,NULL,500.00,NULL,0.00,150.00,'CANCELLED','DELIVERY',NULL,'Payment initialization failed: Online payments are not configured','SYSTEM','2026-04-17 05:36:39',NULL,NULL,NULL,'2026-04-17 05:36:40',NULL,NULL,'2026-04-18 15:52:31','2026-04-18 15:52:31'),(20,'ORD2604170007',2,NULL,NULL,500.00,NULL,0.00,150.00,'CONFIRMED','DELIVERY',NULL,NULL,NULL,'2026-04-17 05:42:03',NULL,NULL,NULL,NULL,NULL,NULL,'2026-04-18 15:52:31','2026-04-18 15:52:31'),(21,'ORD2604170008',2,NULL,NULL,500.00,NULL,0.00,150.00,'DELIVERED','DELIVERY',NULL,NULL,NULL,'2026-04-17 05:43:01','2026-04-17 05:43:32','2026-04-17 05:43:36','2026-04-17 06:22:43',NULL,NULL,3,'2026-04-18 15:52:31','2026-04-18 15:52:31'),(22,'ORD2604170009',2,NULL,NULL,500.00,NULL,0.00,150.00,'DELIVERED','DELIVERY',NULL,NULL,NULL,'2026-04-17 06:12:13','2026-04-17 06:12:25','2026-04-17 06:12:29','2026-04-17 06:12:53',NULL,NULL,3,'2026-04-18 15:52:31','2026-04-18 15:52:31'),(23,'ORD2604170010',2,NULL,NULL,1200.00,NULL,0.00,150.00,'DELIVERED','DELIVERY',NULL,NULL,NULL,'2026-04-17 06:22:07','2026-04-17 06:22:16','2026-04-17 06:22:18','2026-04-17 06:22:33',NULL,NULL,3,'2026-04-18 15:52:31','2026-04-18 15:52:31'),(24,'ORD2604170011',2,NULL,NULL,500.00,NULL,0.00,150.00,'DELIVERED','DELIVERY',NULL,NULL,NULL,'2026-04-17 10:45:26','2026-04-17 10:46:08','2026-04-17 10:46:12','2026-04-17 10:46:55',NULL,NULL,3,'2026-04-18 15:52:31','2026-04-18 15:52:31'),(25,'ORD2604180001',2,NULL,NULL,500.00,NULL,0.00,190.00,'CONFIRMED','DELIVERY',NULL,NULL,NULL,'2026-04-18 05:03:57',NULL,NULL,NULL,NULL,NULL,NULL,'2026-04-18 15:52:31','2026-04-18 15:52:31');
/*!40000 ALTER TABLE `order_preorder_backup` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_status_history`
--

DROP TABLE IF EXISTS `order_status_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_status_history` (
  `history_id` int unsigned NOT NULL AUTO_INCREMENT,
  `order_id` int unsigned NOT NULL,
  `old_status` enum('PENDING','CONFIRMED','PREPARING','READY','OUT_FOR_DELIVERY','DELIVERED','CANCELLED') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `new_status` enum('PENDING','CONFIRMED','PREPARING','READY','OUT_FOR_DELIVERY','DELIVERED','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `changed_by` int unsigned DEFAULT NULL,
  `changed_by_type` enum('CUSTOMER','STAFF','SYSTEM') COLLATE utf8mb4_unicode_ci NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`history_id`),
  KEY `idx_order` (`order_id`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_changed_by` (`changed_by`),
  CONSTRAINT `fk_history_changed_by` FOREIGN KEY (`changed_by`) REFERENCES `staff` (`staff_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_history_order` FOREIGN KEY (`order_id`) REFERENCES `order` (`order_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=100 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_status_history`
--

LOCK TABLES `order_status_history` WRITE;
/*!40000 ALTER TABLE `order_status_history` DISABLE KEYS */;
INSERT INTO `order_status_history` VALUES (1,1,NULL,'CONFIRMED',NULL,'SYSTEM','Order created and auto-confirmed','2026-04-05 11:39:29'),(2,1,'CONFIRMED','PREPARING',3,'STAFF','Status updated by kitchen staff','2026-04-05 11:43:41'),(3,1,'CONFIRMED','PREPARING',3,'STAFF','Status updated by kitchen staff','2026-04-05 11:43:41'),(4,1,'PREPARING','READY',3,'STAFF','Status updated by kitchen staff','2026-04-05 11:43:53'),(5,1,'PREPARING','READY',3,'STAFF','Status updated by kitchen staff','2026-04-05 11:43:53'),(6,1,'READY','CANCELLED',1,'STAFF',NULL,'2026-04-07 09:08:54'),(7,1,'READY','CANCELLED',1,'STAFF',NULL,'2026-04-07 09:08:54'),(8,2,NULL,'CONFIRMED',NULL,'SYSTEM','Order created and auto-confirmed','2026-04-07 09:14:53'),(9,2,'CONFIRMED','CANCELLED',1,'STAFF',NULL,'2026-04-07 10:04:59'),(10,3,NULL,'CONFIRMED',NULL,'SYSTEM','Order created and auto-confirmed','2026-04-07 10:05:35'),(11,3,'CONFIRMED','CANCELLED',4,'CUSTOMER','Cancelled by customer','2026-04-07 10:08:04'),(12,4,NULL,'CONFIRMED',NULL,'SYSTEM','Order created and auto-confirmed','2026-04-07 10:15:02'),(13,5,NULL,'CONFIRMED',NULL,'SYSTEM','Order created and auto-confirmed','2026-04-07 10:17:04'),(14,5,'CONFIRMED','CANCELLED',4,'CUSTOMER','Cancelled by customer','2026-04-07 10:22:05'),(15,6,NULL,'CONFIRMED',NULL,'SYSTEM','Order created and auto-confirmed','2026-04-07 10:25:23'),(16,6,'CONFIRMED','CANCELLED',4,'CUSTOMER','Cancelled by customer','2026-04-07 10:28:09'),(17,7,NULL,'CONFIRMED',NULL,'SYSTEM','Order created and auto-confirmed','2026-04-07 10:32:42'),(18,4,'CONFIRMED','CANCELLED',4,'CUSTOMER','Cancelled by customer','2026-04-07 10:34:28'),(19,7,'CONFIRMED','PREPARING',3,'STAFF','Status updated by kitchen staff','2026-04-07 10:37:16'),(20,7,'PREPARING','READY',3,'STAFF','Status updated by kitchen staff','2026-04-07 11:06:50'),(21,7,'READY','OUT_FOR_DELIVERY',4,'STAFF','Delivery status updated to PICKED_UP','2026-04-07 11:07:52'),(22,7,'OUT_FOR_DELIVERY','OUT_FOR_DELIVERY',4,'STAFF','Delivery status updated to IN_TRANSIT','2026-04-07 11:08:19'),(23,7,'OUT_FOR_DELIVERY','DELIVERED',4,'STAFF','Delivery status updated to DELIVERED','2026-04-07 11:08:53'),(24,8,NULL,'CONFIRMED',NULL,'SYSTEM','Order created and auto-confirmed','2026-04-07 11:27:43'),(25,8,'CONFIRMED','PREPARING',3,'STAFF','Status updated by kitchen staff','2026-04-07 11:28:37'),(26,8,'PREPARING','READY',3,'STAFF','Status updated by kitchen staff','2026-04-07 11:28:38'),(27,8,'READY','OUT_FOR_DELIVERY',4,'STAFF','Delivery status updated to PICKED_UP','2026-04-07 11:29:04'),(28,8,'OUT_FOR_DELIVERY','OUT_FOR_DELIVERY',4,'STAFF','Delivery status updated to IN_TRANSIT','2026-04-07 11:29:05'),(29,8,'OUT_FOR_DELIVERY','DELIVERED',4,'STAFF','Delivery status updated to DELIVERED','2026-04-07 11:29:06'),(30,9,NULL,'CONFIRMED',NULL,'SYSTEM','Order created and auto-confirmed','2026-04-08 17:41:19'),(31,9,'CONFIRMED','PREPARING',3,'STAFF','Status updated by kitchen staff','2026-04-10 18:46:56'),(32,9,'PREPARING','READY',3,'STAFF','Status updated by kitchen staff','2026-04-10 18:47:00'),(33,9,'READY','OUT_FOR_DELIVERY',4,'STAFF','Delivery status updated to PICKED_UP','2026-04-11 06:41:22'),(34,10,NULL,'CONFIRMED',NULL,'SYSTEM','Order created and auto-confirmed','2026-04-11 06:50:01'),(35,9,'OUT_FOR_DELIVERY','OUT_FOR_DELIVERY',4,'STAFF','Delivery status updated to IN_TRANSIT','2026-04-11 06:50:38'),(36,10,'CONFIRMED','PREPARING',3,'STAFF','Status updated by kitchen staff','2026-04-11 06:51:20'),(37,10,'PREPARING','READY',3,'STAFF','Status updated by kitchen staff','2026-04-11 06:51:21'),(38,9,'OUT_FOR_DELIVERY','DELIVERED',4,'STAFF','Delivery status updated to DELIVERED','2026-04-14 05:29:19'),(39,11,NULL,'PENDING',NULL,'SYSTEM','Order created and pending staff confirmation','2026-04-16 17:08:58'),(40,10,'READY','DELIVERED',1,'STAFF',NULL,'2026-04-16 17:45:03'),(41,12,NULL,'PENDING',NULL,'SYSTEM','Order created and pending staff confirmation','2026-04-16 17:46:52'),(42,11,'PENDING','CANCELLED',NULL,'SYSTEM','Auto-cancelled due to timeout','2026-04-16 17:50:00'),(43,12,'PENDING','CANCELLED',NULL,'SYSTEM','Auto-cancelled due to timeout','2026-04-16 18:20:00'),(44,13,NULL,'PENDING',NULL,'SYSTEM','Order created and pending staff confirmation','2026-04-16 18:29:06'),(45,14,NULL,'PENDING',NULL,'SYSTEM','Order created and pending staff confirmation','2026-04-16 18:43:24'),(46,15,NULL,'CONFIRMED',NULL,'SYSTEM','Order created and auto-confirmed','2026-04-16 18:45:36'),(47,15,'CONFIRMED','PREPARING',3,'STAFF','Status updated by kitchen staff','2026-04-16 18:46:00'),(48,15,'PREPARING','READY',3,'STAFF','Status updated by kitchen staff','2026-04-16 18:46:01'),(49,13,'PENDING','CONFIRMED',NULL,'STAFF','Order confirmed by staff','2026-04-16 18:50:00'),(50,14,'PENDING','CONFIRMED',NULL,'STAFF','Order confirmed by staff','2026-04-16 18:50:01'),(51,16,NULL,'CONFIRMED',NULL,'SYSTEM','Order created and auto-confirmed','2026-04-17 05:35:12'),(52,16,'CONFIRMED','CANCELLED',NULL,'SYSTEM','Payment initialization failed: Online payments are not configured','2026-04-17 05:35:14'),(53,17,NULL,'CONFIRMED',NULL,'SYSTEM','Order created and auto-confirmed','2026-04-17 05:36:01'),(54,17,'CONFIRMED','CANCELLED',NULL,'SYSTEM','Payment initialization failed: Online payments are not configured','2026-04-17 05:36:02'),(55,18,NULL,'CONFIRMED',NULL,'SYSTEM','Order created and auto-confirmed','2026-04-17 05:36:29'),(56,19,NULL,'CONFIRMED',NULL,'SYSTEM','Order created and auto-confirmed','2026-04-17 05:36:39'),(57,19,'CONFIRMED','CANCELLED',NULL,'SYSTEM','Payment initialization failed: Online payments are not configured','2026-04-17 05:36:40'),(58,20,NULL,'CONFIRMED',NULL,'SYSTEM','Order created and auto-confirmed','2026-04-17 05:42:03'),(59,21,NULL,'CONFIRMED',NULL,'SYSTEM','Order created and auto-confirmed','2026-04-17 05:43:01'),(60,21,'CONFIRMED','PREPARING',3,'STAFF','Status updated by kitchen staff','2026-04-17 05:43:32'),(61,21,'PREPARING','READY',3,'STAFF','Status updated by kitchen staff','2026-04-17 05:43:36'),(62,15,'READY','OUT_FOR_DELIVERY',4,'STAFF','Delivery status updated to PICKED_UP','2026-04-17 05:45:27'),(63,15,'OUT_FOR_DELIVERY','OUT_FOR_DELIVERY',4,'STAFF','Delivery status updated to IN_TRANSIT','2026-04-17 05:46:41'),(64,15,'OUT_FOR_DELIVERY','DELIVERED',4,'STAFF','Delivery status updated to DELIVERED','2026-04-17 05:46:48'),(65,10,'DELIVERED','OUT_FOR_DELIVERY',5,'STAFF','Delivery status updated to PICKED_UP','2026-04-17 06:00:29'),(66,10,'OUT_FOR_DELIVERY','OUT_FOR_DELIVERY',5,'STAFF','Delivery status updated to IN_TRANSIT','2026-04-17 06:00:30'),(67,10,'OUT_FOR_DELIVERY','DELIVERED',5,'STAFF','Delivery status updated to DELIVERED','2026-04-17 06:00:31'),(68,14,'CONFIRMED','PREPARING',3,'STAFF','Status updated by kitchen staff','2026-04-17 06:11:26'),(69,13,'CONFIRMED','PREPARING',3,'STAFF','Status updated by kitchen staff','2026-04-17 06:11:28'),(70,14,'PREPARING','READY',3,'STAFF','Status updated by kitchen staff','2026-04-17 06:11:30'),(71,13,'PREPARING','READY',3,'STAFF','Status updated by kitchen staff','2026-04-17 06:11:31'),(72,14,'READY','OUT_FOR_DELIVERY',4,'STAFF','Delivery status updated to PICKED_UP','2026-04-17 06:11:39'),(73,14,'OUT_FOR_DELIVERY','OUT_FOR_DELIVERY',4,'STAFF','Delivery status updated to IN_TRANSIT','2026-04-17 06:11:40'),(74,14,'OUT_FOR_DELIVERY','DELIVERED',4,'STAFF','Delivery status updated to DELIVERED','2026-04-17 06:11:42'),(75,13,'READY','OUT_FOR_DELIVERY',5,'STAFF','Delivery status updated to PICKED_UP','2026-04-17 06:11:52'),(76,13,'OUT_FOR_DELIVERY','OUT_FOR_DELIVERY',5,'STAFF','Delivery status updated to IN_TRANSIT','2026-04-17 06:11:53'),(77,13,'OUT_FOR_DELIVERY','DELIVERED',5,'STAFF','Delivery status updated to DELIVERED','2026-04-17 06:11:55'),(78,22,NULL,'CONFIRMED',NULL,'SYSTEM','Order created and auto-confirmed','2026-04-17 06:12:13'),(79,22,'CONFIRMED','PREPARING',3,'STAFF','Status updated by kitchen staff','2026-04-17 06:12:25'),(80,22,'PREPARING','READY',3,'STAFF','Status updated by kitchen staff','2026-04-17 06:12:29'),(81,22,'READY','OUT_FOR_DELIVERY',4,'STAFF','Delivery status updated to PICKED_UP','2026-04-17 06:12:50'),(82,22,'OUT_FOR_DELIVERY','OUT_FOR_DELIVERY',4,'STAFF','Delivery status updated to IN_TRANSIT','2026-04-17 06:12:52'),(83,22,'OUT_FOR_DELIVERY','DELIVERED',4,'STAFF','Delivery status updated to DELIVERED','2026-04-17 06:12:53'),(84,23,NULL,'CONFIRMED',NULL,'SYSTEM','Order created and auto-confirmed','2026-04-17 06:22:07'),(85,23,'CONFIRMED','PREPARING',3,'STAFF','Status updated by kitchen staff','2026-04-17 06:22:16'),(86,23,'PREPARING','READY',3,'STAFF','Status updated by kitchen staff','2026-04-17 06:22:18'),(87,23,'READY','OUT_FOR_DELIVERY',5,'STAFF','Delivery status updated to PICKED_UP','2026-04-17 06:22:27'),(88,23,'OUT_FOR_DELIVERY','OUT_FOR_DELIVERY',5,'STAFF','Delivery status updated to IN_TRANSIT','2026-04-17 06:22:30'),(89,23,'OUT_FOR_DELIVERY','DELIVERED',5,'STAFF','Delivery status updated to DELIVERED','2026-04-17 06:22:33'),(90,21,'READY','OUT_FOR_DELIVERY',4,'STAFF','Delivery status updated to PICKED_UP','2026-04-17 06:22:41'),(91,21,'OUT_FOR_DELIVERY','OUT_FOR_DELIVERY',4,'STAFF','Delivery status updated to IN_TRANSIT','2026-04-17 06:22:42'),(92,21,'OUT_FOR_DELIVERY','DELIVERED',4,'STAFF','Delivery status updated to DELIVERED','2026-04-17 06:22:43'),(93,24,NULL,'CONFIRMED',NULL,'SYSTEM','Order created and auto-confirmed','2026-04-17 10:45:26'),(94,24,'CONFIRMED','PREPARING',3,'STAFF','Status updated by kitchen staff','2026-04-17 10:46:08'),(95,24,'PREPARING','READY',3,'STAFF','Status updated by kitchen staff','2026-04-17 10:46:12'),(96,24,'READY','OUT_FOR_DELIVERY',4,'STAFF','Delivery status updated to PICKED_UP','2026-04-17 10:46:47'),(97,24,'OUT_FOR_DELIVERY','OUT_FOR_DELIVERY',4,'STAFF','Delivery status updated to IN_TRANSIT','2026-04-17 10:46:54'),(98,24,'OUT_FOR_DELIVERY','DELIVERED',4,'STAFF','Delivery status updated to DELIVERED','2026-04-17 10:46:55'),(99,25,NULL,'CONFIRMED',NULL,'SYSTEM','Order created and auto-confirmed','2026-04-18 05:03:57');
/*!40000 ALTER TABLE `order_status_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_status_history_preorder_backup`
--

DROP TABLE IF EXISTS `order_status_history_preorder_backup`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_status_history_preorder_backup` (
  `history_id` int unsigned NOT NULL AUTO_INCREMENT,
  `order_id` int unsigned NOT NULL,
  `old_status` enum('PENDING','CONFIRMED','PREPARING','READY','OUT_FOR_DELIVERY','DELIVERED','CANCELLED') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `new_status` enum('PENDING','CONFIRMED','PREPARING','READY','OUT_FOR_DELIVERY','DELIVERED','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `changed_by` int unsigned DEFAULT NULL,
  `changed_by_type` enum('CUSTOMER','STAFF','SYSTEM') COLLATE utf8mb4_unicode_ci NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`history_id`),
  KEY `idx_order` (`order_id`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_changed_by` (`changed_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_status_history_preorder_backup`
--

LOCK TABLES `order_status_history_preorder_backup` WRITE;
/*!40000 ALTER TABLE `order_status_history_preorder_backup` DISABLE KEYS */;
/*!40000 ALTER TABLE `order_status_history_preorder_backup` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `otp_verification`
--

DROP TABLE IF EXISTS `otp_verification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `otp_verification` (
  `otp_id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_type` enum('CUSTOMER','STAFF') COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` int unsigned NOT NULL,
  `otp_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `purpose` enum('EMAIL_VERIFICATION','PHONE_VERIFICATION','PASSWORD_RESET','LOGIN') COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` datetime NOT NULL,
  `is_used` tinyint(1) NOT NULL DEFAULT '0',
  `attempts` int NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `used_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`otp_id`),
  KEY `idx_user` (`user_type`,`user_id`),
  KEY `idx_expires` (`expires_at`),
  KEY `idx_purpose` (`purpose`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `otp_verification`
--

LOCK TABLES `otp_verification` WRITE;
/*!40000 ALTER TABLE `otp_verification` DISABLE KEYS */;
/*!40000 ALTER TABLE `otp_verification` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset`
--

DROP TABLE IF EXISTS `password_reset`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset` (
  `reset_id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_type` enum('CUSTOMER','STAFF') COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` int unsigned NOT NULL,
  `reset_token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` datetime NOT NULL,
  `is_used` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `used_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`reset_id`),
  KEY `idx_token` (`reset_token`),
  KEY `idx_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset`
--

LOCK TABLES `password_reset` WRITE;
/*!40000 ALTER TABLE `password_reset` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_reset` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment`
--

DROP TABLE IF EXISTS `payment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment` (
  `payment_id` int unsigned NOT NULL AUTO_INCREMENT,
  `order_id` int unsigned NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `method` enum('CASH','CARD','ONLINE','WALLET') COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('PENDING','PAID','FAILED','REFUNDED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `transaction_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gateway_status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `paid_at` timestamp NULL DEFAULT NULL,
  `refunded_at` timestamp NULL DEFAULT NULL,
  `refund_reason` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`payment_id`),
  UNIQUE KEY `uk_transaction_id` (`transaction_id`),
  KEY `idx_order` (`order_id`),
  KEY `idx_status` (`status`),
  KEY `idx_payment_transaction_id` (`transaction_id`),
  KEY `idx_payment_created_at` (`created_at`),
  CONSTRAINT `fk_payment_order` FOREIGN KEY (`order_id`) REFERENCES `order` (`order_id`) ON DELETE CASCADE,
  CONSTRAINT `chk_amount_positive` CHECK ((`amount` > 0))
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment`
--

LOCK TABLES `payment` WRITE;
/*!40000 ALTER TABLE `payment` DISABLE KEYS */;
INSERT INTO `payment` VALUES (1,4,600.00,'CARD','PENDING','pi_3TJWewCp4XuCJFA91pc4jPzT',NULL,NULL,NULL,NULL,'2026-04-07 10:15:02','2026-04-07 10:15:03'),(2,5,600.00,'CARD','PAID','pi_3TJWgvCp4XuCJFA91Op34btM','SUCCESS','2026-04-07 10:20:39',NULL,NULL,'2026-04-07 10:17:04','2026-04-07 10:20:39'),(3,6,600.00,'CARD','PAID','pi_3TJWoxCp4XuCJFA91yp3w3m1','SUCCESS','2026-04-07 10:25:39',NULL,NULL,'2026-04-07 10:25:23','2026-04-07 10:25:39'),(4,7,600.00,'CARD','PAID','pi_3TJWw3Cp4XuCJFA90gPFZl7J','SUCCESS','2026-04-07 10:33:12',NULL,NULL,'2026-04-07 10:32:42','2026-04-07 10:33:12'),(5,8,600.00,'CARD','PAID','pi_3TJXnHCp4XuCJFA90bdANnrf','SUCCESS','2026-04-07 11:28:10',NULL,NULL,'2026-04-07 11:27:43','2026-04-07 11:28:10'),(6,9,600.00,'CARD','PAID','pi_3TK06NCp4XuCJFA911bEF2ui','SUCCESS','2026-04-08 17:41:35','2026-04-08 17:41:48','Cancelled by customer','2026-04-08 17:41:19','2026-04-10 18:47:00'),(7,10,600.00,'CASH','PENDING',NULL,'PAY_ON_DELIVERY',NULL,NULL,NULL,'2026-04-11 06:50:01','2026-04-11 06:50:01'),(8,11,1350.00,'CASH','PENDING',NULL,'PAY_ON_DELIVERY',NULL,NULL,NULL,'2026-04-16 17:08:58','2026-04-16 17:08:58'),(9,12,850.00,'CASH','PENDING',NULL,'PAY_ON_DELIVERY',NULL,NULL,NULL,'2026-04-16 17:46:52','2026-04-16 17:46:52'),(10,13,650.00,'CASH','PENDING',NULL,'PAY_ON_DELIVERY',NULL,NULL,NULL,'2026-04-16 18:29:06','2026-04-16 18:29:06'),(11,14,850.00,'CASH','PENDING',NULL,'PAY_ON_DELIVERY',NULL,NULL,NULL,'2026-04-16 18:43:24','2026-04-16 18:43:24'),(12,15,850.00,'CASH','PENDING',NULL,'PAY_ON_DELIVERY',NULL,NULL,NULL,'2026-04-16 18:45:36','2026-04-16 18:45:36'),(13,16,650.00,'ONLINE','FAILED',NULL,'INIT_FAILED_ONLINE',NULL,NULL,NULL,'2026-04-17 05:35:12','2026-04-17 05:35:14'),(14,17,650.00,'ONLINE','FAILED',NULL,'INIT_FAILED_ONLINE',NULL,NULL,NULL,'2026-04-17 05:36:01','2026-04-17 05:36:02'),(15,18,650.00,'CARD','PENDING','pi_3TN54tCp4XuCJFA91CObMqaK','PENDING',NULL,NULL,NULL,'2026-04-17 05:36:29','2026-04-17 05:36:31'),(16,19,650.00,'ONLINE','FAILED',NULL,'INIT_FAILED_ONLINE',NULL,NULL,NULL,'2026-04-17 05:36:39','2026-04-17 05:36:40'),(17,20,650.00,'ONLINE','PENDING',NULL,'PENDING',NULL,NULL,NULL,'2026-04-17 05:42:03','2026-04-17 05:42:03'),(18,21,650.00,'CASH','PENDING',NULL,'PAY_ON_DELIVERY',NULL,NULL,NULL,'2026-04-17 05:43:01','2026-04-17 05:43:01'),(19,22,650.00,'CASH','PENDING',NULL,'PAY_ON_DELIVERY',NULL,NULL,NULL,'2026-04-17 06:12:13','2026-04-17 06:12:13'),(20,23,1350.00,'CASH','PENDING',NULL,'PAY_ON_DELIVERY',NULL,NULL,NULL,'2026-04-17 06:22:07','2026-04-17 06:22:07'),(21,24,650.00,'CASH','PENDING',NULL,'PAY_ON_DELIVERY',NULL,NULL,NULL,'2026-04-17 10:45:26','2026-04-17 10:45:26'),(22,25,690.00,'CASH','PENDING',NULL,'PAY_ON_DELIVERY',NULL,NULL,NULL,'2026-04-18 05:03:57','2026-04-18 05:03:57');
/*!40000 ALTER TABLE `payment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `promotion`
--

DROP TABLE IF EXISTS `promotion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `promotion` (
  `promotion_id` int unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `discount_type` enum('PERCENTAGE','FIXED_AMOUNT') COLLATE utf8mb4_unicode_ci NOT NULL,
  `discount_value` decimal(10,2) NOT NULL,
  `min_order_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `max_discount_amount` decimal(10,2) DEFAULT NULL,
  `valid_from` datetime NOT NULL,
  `valid_until` datetime NOT NULL,
  `usage_limit` int DEFAULT NULL,
  `usage_count` int NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_by` int unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`promotion_id`),
  UNIQUE KEY `uk_code` (`code`),
  KEY `idx_active_dates` (`is_active`,`valid_from`,`valid_until`),
  KEY `idx_created_by` (`created_by`),
  CONSTRAINT `fk_promotion_created_by` FOREIGN KEY (`created_by`) REFERENCES `staff` (`staff_id`) ON DELETE SET NULL,
  CONSTRAINT `chk_discount_positive` CHECK ((`discount_value` > 0)),
  CONSTRAINT `chk_promo_dates` CHECK ((`valid_until` >= `valid_from`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `promotion`
--

LOCK TABLES `promotion` WRITE;
/*!40000 ALTER TABLE `promotion` DISABLE KEYS */;
/*!40000 ALTER TABLE `promotion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role`
--

DROP TABLE IF EXISTS `role`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role` (
  `role_id` int unsigned NOT NULL AUTO_INCREMENT,
  `role_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`role_id`),
  UNIQUE KEY `uk_role_name` (`role_name`),
  KEY `idx_role_name` (`role_name`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role`
--

LOCK TABLES `role` WRITE;
/*!40000 ALTER TABLE `role` DISABLE KEYS */;
INSERT INTO `role` VALUES (2,'Admin','Administrator with full system access','2026-04-03 18:22:21'),(3,'Cashier','Cashier for order management','2026-04-03 18:22:21'),(4,'Kitchen','Kitchen staff for order preparation','2026-04-03 18:22:21'),(5,'Delivery','Delivery staff for order delivery','2026-04-03 18:22:21');
/*!40000 ALTER TABLE `role` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `staff`
--

DROP TABLE IF EXISTS `staff`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `staff` (
  `staff_id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role_id` int unsigned NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `profile_image_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`staff_id`),
  UNIQUE KEY `uk_staff_email` (`email`),
  KEY `idx_staff_role` (`role_id`),
  KEY `idx_staff_active` (`is_active`),
  CONSTRAINT `fk_staff_role` FOREIGN KEY (`role_id`) REFERENCES `role` (`role_id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `staff`
--

LOCK TABLES `staff` WRITE;
/*!40000 ALTER TABLE `staff` DISABLE KEYS */;
INSERT INTO `staff` VALUES (1,'Admin User',2,'admin@gmail.com','0771234567','$2a$10$RS8rv9E.fUjR8G3vvFtfYOTgC0h3A9zffCdQzAA68gRxbUU0OS0pO',1,NULL,'2026-04-03 18:22:35','2026-04-03 18:22:35'),(2,'Cashier User',3,'cashier@gmail.com','0771234568','$2a$10$mIJgBi1qwwJIhey0qcwP1eGMq5mctK9DemMofOojy.ZgyRJvhH7Pu',1,NULL,'2026-04-03 18:22:35','2026-04-03 18:22:35'),(3,'Kitchen User',4,'kitchen@gmail.com','0771234569','$2a$10$CNXR6gN7jKHlWqilxn.Qneqw7YkyKSkB1CWn1Vcn.i6sOMcnZ.S96',1,NULL,'2026-04-03 18:22:35','2026-04-03 18:22:35'),(4,'Delivery User',5,'delivery@gmail.com','0771234570','$2a$10$MvH5QvgsK7fruS.fCRSoXO27U/OlPAApxLEPiiGJXMwTF.A93Ojhe',1,NULL,'2026-04-03 18:22:35','2026-04-03 18:22:35'),(5,'Delivery2',5,'delivery2@gmail.com','0719882360','$2a$10$RX6mLa7XceCkUuINZn76heaHSrjsQ2SMOhrTuI4Pdy7MGEl.4Le2u',1,NULL,'2026-04-07 12:29:50','2026-04-07 12:29:50');
/*!40000 ALTER TABLE `staff` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_movement`
--

DROP TABLE IF EXISTS `stock_movement`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_movement` (
  `movement_id` int unsigned NOT NULL AUTO_INCREMENT,
  `menu_item_id` int unsigned NOT NULL,
  `stock_date` date NOT NULL,
  `change_type` enum('OPENING','SALE','ADJUSTMENT','RETURN') COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity_change` int NOT NULL,
  `reference_id` int unsigned DEFAULT NULL,
  `reference_type` enum('ORDER','MANUAL','SYSTEM') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by` int unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`movement_id`),
  KEY `idx_menu_item` (`menu_item_id`),
  KEY `idx_stock_date` (`stock_date`),
  KEY `idx_change_type` (`change_type`),
  KEY `idx_created_by` (`created_by`),
  CONSTRAINT `fk_movement_created_by` FOREIGN KEY (`created_by`) REFERENCES `staff` (`staff_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_movement_menu_item` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_item` (`menu_item_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=50 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_movement`
--

LOCK TABLES `stock_movement` WRITE;
/*!40000 ALTER TABLE `stock_movement` DISABLE KEYS */;
INSERT INTO `stock_movement` VALUES (1,1,'2026-04-05','OPENING',12,NULL,'MANUAL','Opening stock set',1,'2026-04-05 11:30:39'),(2,1,'2026-04-05','SALE',-1,1,'ORDER','Order #1',NULL,'2026-04-05 11:39:29'),(3,1,'2026-04-07','OPENING',12,NULL,'MANUAL','Opening stock set',3,'2026-04-07 09:05:06'),(4,1,'2026-04-07','SALE',-1,2,'ORDER','Order #2',NULL,'2026-04-07 09:14:53'),(5,1,'2026-04-07','SALE',-1,3,'ORDER','Order #3',NULL,'2026-04-07 10:05:35'),(6,1,'2026-04-07','RETURN',1,3,'ORDER','Order #3 cancelled - stock returned',4,'2026-04-07 10:08:04'),(7,1,'2026-04-07','SALE',-1,4,'ORDER','Order #4',NULL,'2026-04-07 10:15:02'),(8,1,'2026-04-07','SALE',-1,5,'ORDER','Order #5',NULL,'2026-04-07 10:17:04'),(9,1,'2026-04-07','RETURN',1,5,'ORDER','Order #5 cancelled - stock returned',4,'2026-04-07 10:21:12'),(10,1,'2026-04-07','SALE',-1,6,'ORDER','Order #6',NULL,'2026-04-07 10:25:23'),(11,1,'2026-04-07','RETURN',1,6,'ORDER','Order #6 cancelled - stock returned',4,'2026-04-07 10:27:18'),(12,1,'2026-04-07','SALE',-1,7,'ORDER','Order #7',NULL,'2026-04-07 10:32:42'),(13,1,'2026-04-07','RETURN',1,4,'ORDER','Order #4 cancelled - stock returned',4,'2026-04-07 10:34:28'),(14,1,'2026-04-07','SALE',-1,8,'ORDER','Order #8',NULL,'2026-04-07 11:27:43'),(15,1,'2026-04-08','OPENING',12,NULL,'MANUAL','Opening stock set',3,'2026-04-08 17:40:40'),(16,1,'2026-04-08','SALE',-1,9,'ORDER','Order #9',NULL,'2026-04-08 17:41:19'),(18,1,'2026-04-10','OPENING',12,NULL,'MANUAL','Opening stock set',1,'2026-04-10 18:47:33'),(19,1,'2026-04-11','OPENING',12,NULL,'MANUAL','Opening stock set',3,'2026-04-11 06:49:16'),(20,1,'2026-04-11','SALE',-1,10,'ORDER','Order #10',NULL,'2026-04-11 06:50:01'),(21,1,'2026-04-16','OPENING',12,NULL,'MANUAL','Opening stock set',1,'2026-04-16 08:06:22'),(22,2,'2026-04-16','OPENING',12,NULL,'MANUAL','Opening stock set',1,'2026-04-16 09:07:06'),(23,2,'2026-04-16','SALE',-1,15,'ORDER','Order #15',NULL,'2026-04-16 18:45:36'),(24,1,'2026-04-16','SALE',-1,13,'ORDER','Order #13',NULL,'2026-04-16 18:50:00'),(25,2,'2026-04-16','SALE',-1,14,'ORDER','Order #14',NULL,'2026-04-16 18:50:01'),(26,1,'2026-04-17','SALE',-1,16,'ORDER','Order #16',NULL,'2026-04-17 05:35:12'),(27,1,'2026-04-17','RETURN',1,16,'ORDER','Order #16 cancelled - stock returned',NULL,'2026-04-17 05:35:14'),(28,1,'2026-04-17','SALE',-1,17,'ORDER','Order #17',NULL,'2026-04-17 05:36:01'),(29,1,'2026-04-17','RETURN',1,17,'ORDER','Order #17 cancelled - stock returned',NULL,'2026-04-17 05:36:02'),(30,1,'2026-04-17','SALE',-1,18,'ORDER','Order #18',NULL,'2026-04-17 05:36:29'),(31,1,'2026-04-17','SALE',-1,19,'ORDER','Order #19',NULL,'2026-04-17 05:36:39'),(32,1,'2026-04-17','RETURN',1,19,'ORDER','Order #19 cancelled - stock returned',NULL,'2026-04-17 05:36:40'),(33,1,'2026-04-17','SALE',-1,20,'ORDER','Order #20',NULL,'2026-04-17 05:42:03'),(34,1,'2026-04-17','SALE',-1,21,'ORDER','Order #21',NULL,'2026-04-17 05:43:01'),(35,1,'2026-04-17','SALE',-1,22,'ORDER','Order #22',NULL,'2026-04-17 06:12:13'),(36,2,'2026-04-17','SALE',-1,23,'ORDER','Order #23',NULL,'2026-04-17 06:22:07'),(37,1,'2026-04-17','SALE',-1,23,'ORDER','Order #23',NULL,'2026-04-17 06:22:07'),(38,1,'2026-04-17','SALE',-1,24,'ORDER','Order #24',NULL,'2026-04-17 10:45:26'),(39,2,'2026-04-18','OPENING',5,NULL,'MANUAL','Opening stock set',3,'2026-04-18 04:57:23'),(40,1,'2026-04-18','OPENING',5,NULL,'MANUAL','Opening stock set',3,'2026-04-18 04:57:26'),(41,2,'2026-04-18','ADJUSTMENT',3,NULL,'MANUAL','Manual adjustment: done (Qty: 5 → 8)',3,'2026-04-18 04:57:41'),(42,1,'2026-04-18','ADJUSTMENT',3,NULL,'MANUAL','Manual adjustment: done (Qty: 5 → 8)',3,'2026-04-18 04:57:49'),(43,2,'2026-04-18','ADJUSTMENT',3,NULL,'MANUAL','Opening quantity changed from 5 to 8 by admin',3,'2026-04-18 04:58:00'),(44,1,'2026-04-18','ADJUSTMENT',3,NULL,'MANUAL','Opening quantity changed from 5 to 8 by admin',3,'2026-04-18 04:58:02'),(45,2,'2026-04-18','ADJUSTMENT',1,NULL,'MANUAL','Opening quantity changed from 8 to 9 by admin',3,'2026-04-18 05:01:35'),(46,1,'2026-04-18','SALE',-1,25,'ORDER','Order #25',NULL,'2026-04-18 05:03:57'),(47,5,'2026-04-18','OPENING',12,NULL,'MANUAL','Opening stock set',1,'2026-04-18 14:50:06'),(48,3,'2026-04-18','OPENING',12,NULL,'MANUAL','Opening stock set',1,'2026-04-18 14:50:08'),(49,4,'2026-04-18','OPENING',12,NULL,'MANUAL','Opening stock set',1,'2026-04-18 14:50:10');
/*!40000 ALTER TABLE `stock_movement` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `system_settings`
--

DROP TABLE IF EXISTS `system_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_settings` (
  `setting_id` int unsigned NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `setting_value` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_by` int unsigned DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`setting_id`),
  UNIQUE KEY `uk_setting_key` (`setting_key`),
  KEY `idx_updated_by` (`updated_by`),
  CONSTRAINT `fk_settings_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `staff` (`staff_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_settings`
--

LOCK TABLES `system_settings` WRITE;
/*!40000 ALTER TABLE `system_settings` DISABLE KEYS */;
INSERT INTO `system_settings` VALUES (1,'max_delivery_distance_km','15','Maximum delivery distance in kilometers',NULL,'2026-04-03 18:22:24'),(2,'restaurant_latitude','7.0000000','Restaurant location latitude',NULL,'2026-04-03 18:22:24'),(3,'restaurant_longitude','80.0000000','Restaurant location longitude',NULL,'2026-04-03 18:22:24'),(4,'order_auto_cancel_minutes','30','Auto-cancel unconfirmed orders after minutes',NULL,'2026-04-03 18:22:24'),(5,'session_timeout_minutes','30','User session timeout in minutes',NULL,'2026-04-03 18:22:24'),(6,'min_order_amount','500','Minimum order amount in LKR',NULL,'2026-04-03 18:22:24'),(7,'delivery_fee','150','Standard delivery fee in LKR',NULL,'2026-04-03 18:22:24'),(8,'tax_percentage','0','Tax percentage on orders',NULL,'2026-04-03 18:22:24'),(9,'otp_expiry_minutes','10','OTP expiry time in minutes',NULL,'2026-04-03 18:22:24'),(10,'max_otp_attempts','3','Maximum OTP verification attempts',NULL,'2026-04-03 18:22:24'),(11,'admin_settings_payload_v1','{\"restaurantName\":\"Voleena Foods\",\"email\":\"contact@voleenafoods.com\",\"phone\":\"+94 11 234 5678\",\"address\":\"123 Main Street, Colombo, Sri Lanka\",\"timezone\":\"Asia/Colombo\",\"currency\":\"LKR\",\"businessHours\":{\"monday\":{\"open\":\"09:00\",\"close\":\"22:00\",\"closed\":false},\"tuesday\":{\"open\":\"09:00\",\"close\":\"22:00\",\"closed\":false},\"wednesday\":{\"open\":\"09:00\",\"close\":\"22:00\",\"closed\":false},\"thursday\":{\"open\":\"09:00\",\"close\":\"22:00\",\"closed\":false},\"friday\":{\"open\":\"09:00\",\"close\":\"22:00\",\"closed\":false},\"saturday\":{\"open\":\"09:00\",\"close\":\"23:00\",\"closed\":false},\"sunday\":{\"open\":\"10:00\",\"close\":\"22:00\",\"closed\":false}},\"orderPrefix\":\"ORD\",\"minOrderAmount\":100,\"maxOrderAmount\":50000,\"orderTimeout\":30,\"autoConfirmOrders\":true,\"deliveryFee\":150,\"freeDeliveryThreshold\":2500,\"maxDeliveryDistance\":15,\"estimatedDeliveryTime\":45,\"emailNotifications\":true,\"smsNotifications\":true,\"orderConfirmation\":true,\"orderStatusUpdates\":true,\"promotionalEmails\":false,\"cashOnDelivery\":true,\"onlinePayment\":true,\"cardPayment\":true,\"minimumCashChange\":100}','Admin system settings payload (JSON)',1,'2026-04-18 05:03:54');
/*!40000 ALTER TABLE `system_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `token_blacklist`
--

DROP TABLE IF EXISTS `token_blacklist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `token_blacklist` (
  `blacklist_id` int unsigned NOT NULL AUTO_INCREMENT,
  `token_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_type` enum('CUSTOMER','STAFF') COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` int unsigned NOT NULL,
  `expires_at` datetime NOT NULL,
  `reason` enum('LOGOUT','PASSWORD_CHANGE','SECURITY','ADMIN_REVOKE') COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`blacklist_id`),
  UNIQUE KEY `uk_token_hash` (`token_hash`),
  KEY `idx_expires` (`expires_at`),
  KEY `idx_user` (`user_type`,`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=81 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `token_blacklist`
--

LOCK TABLES `token_blacklist` WRITE;
/*!40000 ALTER TABLE `token_blacklist` DISABLE KEYS */;
INSERT INTO `token_blacklist` VALUES (69,'1496d7d5843a1a64bc4c8f573b841a8860941f7869512f6b4be582515157e106','CUSTOMER',2,'2026-04-18 14:39:16','LOGOUT','2026-04-18 09:04:17'),(70,'ac8bfdd7769b5d61bd49f40b8b06256a0e52a8c6eff46e44f6e3aca8d4afb5df','STAFF',1,'2026-04-18 19:39:32','LOGOUT','2026-04-18 13:42:31'),(71,'ebe99114512fa7b437c1535e719018251b1ef5f80d8b6c84e764930e73f53e5c','CUSTOMER',2,'2026-04-18 19:42:48','LOGOUT','2026-04-18 13:56:05'),(72,'6e8b93fa963b985a39d94678f68d94fdd989ed4ad1c65c0b64ff32577168ffb8','CUSTOMER',2,'2026-04-18 20:11:40','LOGOUT','2026-04-18 14:11:56'),(73,'00098cecbdd6d013ed1287f2015535e1ecb94860b3eb372e8ef40763d2a6952c','STAFF',1,'2026-04-18 20:12:00','LOGOUT','2026-04-18 14:14:14'),(74,'dfda398c1727a5531d8c5848153cfb07f272ebfb69de6b18468a29d893899209','CUSTOMER',2,'2026-04-18 20:14:17','LOGOUT','2026-04-18 14:39:17'),(75,'848198d5b220ed49a37ddd561766e2ad6d95c4c217ac8943366c14111832cf37','STAFF',1,'2026-04-18 20:47:07','LOGOUT','2026-04-18 14:47:08'),(76,'9430c396c646f0d54a053bc130fb5e190722f4b5d60ad021c2472b4e9f0aba42','CUSTOMER',2,'2026-04-18 20:47:10','LOGOUT','2026-04-18 14:49:56'),(77,'5e8f28754be9a711584d67e11764e5cec2b245d2751ec48c12ed1c205dd24669','STAFF',1,'2026-04-18 20:49:59','LOGOUT','2026-04-18 14:50:11'),(78,'472fb6d9d45680327d9b680f306b2fc9e45883da24b4520a0026f9f571a2c1ee','CUSTOMER',2,'2026-04-18 20:50:15','LOGOUT','2026-04-18 15:15:32'),(79,'87aecee13dfd7e979eff1886a8c612f11fa461a8e305409d8e2fcf1eab467833','CUSTOMER',2,'2026-04-18 21:21:34','LOGOUT','2026-04-18 15:35:39'),(80,'9d722872e4aa1f1af0a5e1dd60ff13f0cff5ccaabd61ab2679c6a8e7be415357','STAFF',1,'2026-04-18 21:35:43','LOGOUT','2026-04-18 15:41:51');
/*!40000 ALTER TABLE `token_blacklist` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `v_active_orders`
--

DROP TABLE IF EXISTS `v_active_orders`;
/*!50001 DROP VIEW IF EXISTS `v_active_orders`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_active_orders` AS SELECT 
 1 AS `order_id`,
 1 AS `order_number`,
 1 AS `customer_id`,
 1 AS `customer_name`,
 1 AS `customer_phone`,
 1 AS `status`,
 1 AS `order_type`,
 1 AS `final_amount`,
 1 AS `created_at`,
 1 AS `delivery_staff_id`,
 1 AS `delivery_staff_name`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_daily_sales`
--

DROP TABLE IF EXISTS `v_daily_sales`;
/*!50001 DROP VIEW IF EXISTS `v_daily_sales`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_daily_sales` AS SELECT 
 1 AS `sale_date`,
 1 AS `total_orders`,
 1 AS `total_revenue`,
 1 AS `avg_order_value`,
 1 AS `delivery_orders`,
 1 AS `non_delivery_orders`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_menu_availability`
--

DROP TABLE IF EXISTS `v_menu_availability`;
/*!50001 DROP VIEW IF EXISTS `v_menu_availability`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_menu_availability` AS SELECT 
 1 AS `menu_item_id`,
 1 AS `name`,
 1 AS `price`,
 1 AS `category_name`,
 1 AS `is_active`,
 1 AS `is_available`,
 1 AS `current_stock`*/;
SET character_set_client = @saved_cs_client;

--
-- Final view structure for view `v_active_orders`
--

/*!50001 DROP VIEW IF EXISTS `v_active_orders`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_active_orders` AS select `o`.`order_id` AS `order_id`,`o`.`order_number` AS `order_number`,`o`.`customer_id` AS `customer_id`,`c`.`name` AS `customer_name`,`c`.`phone` AS `customer_phone`,`o`.`status` AS `status`,`o`.`order_type` AS `order_type`,`o`.`final_amount` AS `final_amount`,`o`.`created_at` AS `created_at`,`d`.`delivery_staff_id` AS `delivery_staff_id`,`s`.`name` AS `delivery_staff_name` from (((`order` `o` left join `customer` `c` on((`o`.`customer_id` = `c`.`customer_id`))) left join `delivery` `d` on((`o`.`order_id` = `d`.`order_id`))) left join `staff` `s` on((`d`.`delivery_staff_id` = `s`.`staff_id`))) where (`o`.`status` not in ('DELIVERED','CANCELLED')) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_daily_sales`
--

/*!50001 DROP VIEW IF EXISTS `v_daily_sales`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_daily_sales` AS select cast(`order`.`created_at` as date) AS `sale_date`,count(0) AS `total_orders`,sum(`order`.`final_amount`) AS `total_revenue`,avg(`order`.`final_amount`) AS `avg_order_value`,sum((case when (`order`.`order_type` = 'DELIVERY') then 1 else 0 end)) AS `delivery_orders`,sum((case when ((`order`.`order_type` = 'TAKEAWAY') or (`order`.`order_type` = 'WALK_IN') or (`order`.`order_type` = 'ONLINE')) then 1 else 0 end)) AS `non_delivery_orders` from `order` where (`order`.`status` = 'DELIVERED') group by cast(`order`.`created_at` as date) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_menu_availability`
--

/*!50001 DROP VIEW IF EXISTS `v_menu_availability`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_menu_availability` AS select `mi`.`menu_item_id` AS `menu_item_id`,`mi`.`name` AS `name`,`mi`.`price` AS `price`,`c`.`name` AS `category_name`,`mi`.`is_active` AS `is_active`,`mi`.`is_available` AS `is_available`,coalesce(`ds`.`closing_quantity`,0) AS `current_stock` from ((`menu_item` `mi` left join `category` `c` on((`mi`.`category_id` = `c`.`category_id`))) left join `daily_stock` `ds` on(((`mi`.`menu_item_id` = `ds`.`menu_item_id`) and (`ds`.`stock_date` = curdate())))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-18 21:24:00
