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
  `LogID` int NOT NULL AUTO_INCREMENT,
  `UserType` enum('CUSTOMER','STAFF','SYSTEM') COLLATE utf8mb4_unicode_ci NOT NULL,
  `UserID` int DEFAULT NULL,
  `Action` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `EntityType` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `EntityID` int DEFAULT NULL,
  `Details` text COLLATE utf8mb4_unicode_ci,
  `IPAddress` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `UserAgent` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`LogID`),
  KEY `idx_user` (`UserType`,`UserID`),
  KEY `idx_entity` (`EntityType`,`EntityID`),
  KEY `idx_created` (`CreatedAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity_log`
--

LOCK TABLES `activity_log` WRITE;
/*!40000 ALTER TABLE `activity_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `activity_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `address`
--

DROP TABLE IF EXISTS `address`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `address` (
  `AddressID` int NOT NULL AUTO_INCREMENT,
  `CustomerID` int NOT NULL,
  `AddressLine1` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `AddressLine2` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `City` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `PostalCode` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `District` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Latitude` decimal(10,8) DEFAULT NULL,
  `Longitude` decimal(11,8) DEFAULT NULL,
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`AddressID`),
  KEY `idx_customer` (`CustomerID`),
  CONSTRAINT `address_ibfk_1` FOREIGN KEY (`CustomerID`) REFERENCES `customer` (`CustomerID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `address`
--

LOCK TABLES `address` WRITE;
/*!40000 ALTER TABLE `address` DISABLE KEYS */;
/*!40000 ALTER TABLE `address` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `category`
--

DROP TABLE IF EXISTS `category`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `category` (
  `CategoryID` int NOT NULL AUTO_INCREMENT,
  `Name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ImageURL` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`CategoryID`),
  UNIQUE KEY `Name` (`Name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `category`
--

LOCK TABLES `category` WRITE;
/*!40000 ALTER TABLE `category` DISABLE KEYS */;
/*!40000 ALTER TABLE `category` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `combopack`
--

DROP TABLE IF EXISTS `combopack`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `combopack` (
  `ComboID` int NOT NULL AUTO_INCREMENT,
  `Name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Description` text COLLATE utf8mb4_unicode_ci,
  `Price` decimal(10,2) NOT NULL,
  `DiscountType` enum('PERCENTAGE','FIXED_PRICE') COLLATE utf8mb4_unicode_ci DEFAULT 'FIXED_PRICE',
  `DiscountValue` decimal(10,2) DEFAULT NULL,
  `ImageURL` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ScheduleStartDate` date DEFAULT NULL,
  `ScheduleEndDate` date DEFAULT NULL,
  `IsActive` tinyint(1) DEFAULT '1',
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `CreatedBy` int DEFAULT NULL,
  PRIMARY KEY (`ComboID`),
  KEY `CreatedBy` (`CreatedBy`),
  KEY `idx_active_schedule` (`IsActive`,`ScheduleStartDate`,`ScheduleEndDate`),
  CONSTRAINT `combopack_ibfk_1` FOREIGN KEY (`CreatedBy`) REFERENCES `staff` (`StaffID`) ON DELETE SET NULL,
  CONSTRAINT `chk_combo_dates` CHECK ((`ScheduleEndDate` >= `ScheduleStartDate`)),
  CONSTRAINT `combopack_chk_1` CHECK ((`Price` > 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `combopack`
--

LOCK TABLES `combopack` WRITE;
/*!40000 ALTER TABLE `combopack` DISABLE KEYS */;
/*!40000 ALTER TABLE `combopack` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `combopackitem`
--

DROP TABLE IF EXISTS `combopackitem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `combopackitem` (
  `ComboPackItemID` int NOT NULL AUTO_INCREMENT,
  `ComboID` int NOT NULL,
  `MenuItemID` int NOT NULL,
  `Quantity` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`ComboPackItemID`),
  UNIQUE KEY `unique_combo_item` (`ComboID`,`MenuItemID`),
  KEY `MenuItemID` (`MenuItemID`),
  KEY `idx_combo` (`ComboID`),
  CONSTRAINT `combopackitem_ibfk_1` FOREIGN KEY (`ComboID`) REFERENCES `combopack` (`ComboID`) ON DELETE CASCADE,
  CONSTRAINT `combopackitem_ibfk_2` FOREIGN KEY (`MenuItemID`) REFERENCES `menu_item` (`MenuItemID`) ON DELETE CASCADE,
  CONSTRAINT `combopackitem_chk_1` CHECK ((`Quantity` > 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `combopackitem`
--

LOCK TABLES `combopackitem` WRITE;
/*!40000 ALTER TABLE `combopackitem` DISABLE KEYS */;
/*!40000 ALTER TABLE `combopackitem` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer`
--

DROP TABLE IF EXISTS `customer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer` (
  `CustomerID` int NOT NULL AUTO_INCREMENT,
  `Name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Phone` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ProfileImageURL` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `IsEmailVerified` tinyint(1) DEFAULT '0',
  `IsPhoneVerified` tinyint(1) DEFAULT '0',
  `IsActive` tinyint(1) DEFAULT '1',
  `AccountStatus` enum('ACTIVE','INACTIVE','BLOCKED') COLLATE utf8mb4_unicode_ci DEFAULT 'ACTIVE',
  `PreferredNotification` enum('EMAIL','SMS','BOTH') COLLATE utf8mb4_unicode_ci DEFAULT 'BOTH',
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`CustomerID`),
  UNIQUE KEY `Email` (`Email`),
  KEY `idx_email` (`Email`),
  KEY `idx_phone` (`Phone`),
  KEY `idx_status` (`AccountStatus`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer`
--

LOCK TABLES `customer` WRITE;
/*!40000 ALTER TABLE `customer` DISABLE KEYS */;
INSERT INTO `customer` VALUES (1,'Customer Test User','customer@test.com','0775555555','$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhQy',NULL,1,1,1,'ACTIVE','BOTH','2026-01-27 10:18:02','2026-01-27 10:18:02');
/*!40000 ALTER TABLE `customer` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `daily_stock`
--

DROP TABLE IF EXISTS `daily_stock`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `daily_stock` (
  `StockID` int NOT NULL AUTO_INCREMENT,
  `MenuItemID` int NOT NULL,
  `StockDate` date NOT NULL,
  `OpeningQuantity` int NOT NULL DEFAULT '0',
  `SoldQuantity` int NOT NULL DEFAULT '0',
  `AdjustedQuantity` int NOT NULL DEFAULT '0',
  `ClosingQuantity` int GENERATED ALWAYS AS (((`OpeningQuantity` - `SoldQuantity`) + `AdjustedQuantity`)) STORED,
  `LastUpdated` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `UpdatedBy` int DEFAULT NULL,
  PRIMARY KEY (`StockID`),
  UNIQUE KEY `unique_item_day` (`MenuItemID`,`StockDate`),
  KEY `UpdatedBy` (`UpdatedBy`),
  KEY `idx_stock_date` (`StockDate`),
  KEY `idx_closing_qty` (`ClosingQuantity`),
  KEY `idx_item_date` (`MenuItemID`,`StockDate`),
  CONSTRAINT `daily_stock_ibfk_1` FOREIGN KEY (`MenuItemID`) REFERENCES `menu_item` (`MenuItemID`) ON DELETE CASCADE,
  CONSTRAINT `daily_stock_ibfk_2` FOREIGN KEY (`UpdatedBy`) REFERENCES `staff` (`StaffID`) ON DELETE SET NULL,
  CONSTRAINT `chk_stock_valid` CHECK ((`ClosingQuantity` >= 0)),
  CONSTRAINT `daily_stock_chk_1` CHECK ((`OpeningQuantity` >= 0)),
  CONSTRAINT `daily_stock_chk_2` CHECK ((`SoldQuantity` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `daily_stock`
--

LOCK TABLES `daily_stock` WRITE;
/*!40000 ALTER TABLE `daily_stock` DISABLE KEYS */;
/*!40000 ALTER TABLE `daily_stock` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `delivery`
--

DROP TABLE IF EXISTS `delivery`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `delivery` (
  `DeliveryID` int NOT NULL AUTO_INCREMENT,
  `OrderID` int NOT NULL,
  `DeliveryStaffID` int DEFAULT NULL,
  `AddressID` int NOT NULL,
  `Status` enum('PENDING','ASSIGNED','PICKED_UP','IN_TRANSIT','DELIVERED','FAILED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `AssignedAt` timestamp NULL DEFAULT NULL,
  `PickedUpAt` timestamp NULL DEFAULT NULL,
  `DeliveredAt` timestamp NULL DEFAULT NULL,
  `EstimatedDeliveryTime` datetime DEFAULT NULL,
  `DeliveryProof` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `DeliveryNotes` text COLLATE utf8mb4_unicode_ci,
  `Distance` decimal(5,2) DEFAULT NULL,
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`DeliveryID`),
  UNIQUE KEY `OrderID` (`OrderID`),
  KEY `AddressID` (`AddressID`),
  KEY `idx_staff` (`DeliveryStaffID`),
  KEY `idx_status` (`Status`),
  KEY `idx_assigned_date` (`AssignedAt`),
  CONSTRAINT `delivery_ibfk_1` FOREIGN KEY (`OrderID`) REFERENCES `order` (`OrderID`) ON DELETE CASCADE,
  CONSTRAINT `delivery_ibfk_2` FOREIGN KEY (`DeliveryStaffID`) REFERENCES `staff` (`StaffID`) ON DELETE SET NULL,
  CONSTRAINT `delivery_ibfk_3` FOREIGN KEY (`AddressID`) REFERENCES `address` (`AddressID`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `delivery`
--

LOCK TABLES `delivery` WRITE;
/*!40000 ALTER TABLE `delivery` DISABLE KEYS */;
/*!40000 ALTER TABLE `delivery` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `delivery_staff_availability`
--

DROP TABLE IF EXISTS `delivery_staff_availability`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `delivery_staff_availability` (
  `AvailabilityID` int NOT NULL AUTO_INCREMENT,
  `DeliveryStaffID` int NOT NULL,
  `IsAvailable` tinyint(1) DEFAULT '1',
  `CurrentOrderID` int DEFAULT NULL,
  `LastUpdated` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`AvailabilityID`),
  UNIQUE KEY `unique_staff` (`DeliveryStaffID`),
  KEY `CurrentOrderID` (`CurrentOrderID`),
  KEY `idx_available` (`IsAvailable`),
  CONSTRAINT `delivery_staff_availability_ibfk_1` FOREIGN KEY (`DeliveryStaffID`) REFERENCES `staff` (`StaffID`) ON DELETE CASCADE,
  CONSTRAINT `delivery_staff_availability_ibfk_2` FOREIGN KEY (`CurrentOrderID`) REFERENCES `order` (`OrderID`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `delivery_staff_availability`
--

LOCK TABLES `delivery_staff_availability` WRITE;
/*!40000 ALTER TABLE `delivery_staff_availability` DISABLE KEYS */;
/*!40000 ALTER TABLE `delivery_staff_availability` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `feedback`
--

DROP TABLE IF EXISTS `feedback`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `feedback` (
  `FeedbackID` int NOT NULL AUTO_INCREMENT,
  `Rating` int NOT NULL,
  `Comment` text COLLATE utf8mb4_unicode_ci,
  `CustomerID` int NOT NULL,
  `OrderID` int DEFAULT NULL,
  `FeedbackType` enum('ORDER','DELIVERY','GENERAL') COLLATE utf8mb4_unicode_ci DEFAULT 'ORDER',
  `AdminResponse` text COLLATE utf8mb4_unicode_ci,
  `RespondedAt` timestamp NULL DEFAULT NULL,
  `RespondedBy` int DEFAULT NULL,
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`FeedbackID`),
  KEY `RespondedBy` (`RespondedBy`),
  KEY `idx_customer` (`CustomerID`),
  KEY `idx_order` (`OrderID`),
  KEY `idx_rating` (`Rating`),
  KEY `idx_created` (`CreatedAt`),
  CONSTRAINT `feedback_ibfk_1` FOREIGN KEY (`CustomerID`) REFERENCES `customer` (`CustomerID`) ON DELETE CASCADE,
  CONSTRAINT `feedback_ibfk_2` FOREIGN KEY (`OrderID`) REFERENCES `order` (`OrderID`) ON DELETE CASCADE,
  CONSTRAINT `feedback_ibfk_3` FOREIGN KEY (`RespondedBy`) REFERENCES `staff` (`StaffID`) ON DELETE SET NULL,
  CONSTRAINT `feedback_chk_1` CHECK ((`Rating` between 1 and 5))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `feedback`
--

LOCK TABLES `feedback` WRITE;
/*!40000 ALTER TABLE `feedback` DISABLE KEYS */;
/*!40000 ALTER TABLE `feedback` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `menu_item`
--

DROP TABLE IF EXISTS `menu_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `menu_item` (
  `MenuItemID` int NOT NULL AUTO_INCREMENT,
  `Name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Description` text COLLATE utf8mb4_unicode_ci,
  `Price` decimal(10,2) NOT NULL,
  `ImageURL` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `CategoryID` int NOT NULL,
  `IsActive` tinyint(1) DEFAULT '1',
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `CreatedBy` int DEFAULT NULL,
  PRIMARY KEY (`MenuItemID`),
  KEY `CreatedBy` (`CreatedBy`),
  KEY `idx_category` (`CategoryID`),
  KEY `idx_active` (`IsActive`),
  CONSTRAINT `menu_item_ibfk_1` FOREIGN KEY (`CategoryID`) REFERENCES `category` (`CategoryID`) ON DELETE RESTRICT,
  CONSTRAINT `menu_item_ibfk_2` FOREIGN KEY (`CreatedBy`) REFERENCES `staff` (`StaffID`) ON DELETE SET NULL,
  CONSTRAINT `menu_item_chk_1` CHECK ((`Price` > 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `menu_item`
--

LOCK TABLES `menu_item` WRITE;
/*!40000 ALTER TABLE `menu_item` DISABLE KEYS */;
/*!40000 ALTER TABLE `menu_item` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification`
--

DROP TABLE IF EXISTS `notification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification` (
  `NotificationID` int NOT NULL AUTO_INCREMENT,
  `RecipientType` enum('CUSTOMER','STAFF') COLLATE utf8mb4_unicode_ci NOT NULL,
  `RecipientID` int NOT NULL,
  `NotificationType` enum('EMAIL','SMS','PUSH') COLLATE utf8mb4_unicode_ci NOT NULL,
  `Subject` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `Status` enum('PENDING','SENT','FAILED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `SentAt` timestamp NULL DEFAULT NULL,
  `ErrorMessage` text COLLATE utf8mb4_unicode_ci,
  `RelatedOrderID` int DEFAULT NULL,
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`NotificationID`),
  KEY `RelatedOrderID` (`RelatedOrderID`),
  KEY `idx_recipient` (`RecipientType`,`RecipientID`),
  KEY `idx_status` (`Status`),
  KEY `idx_created` (`CreatedAt`),
  CONSTRAINT `notification_ibfk_1` FOREIGN KEY (`RelatedOrderID`) REFERENCES `order` (`OrderID`) ON DELETE CASCADE
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
  `OrderID` int NOT NULL AUTO_INCREMENT,
  `OrderNumber` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `CustomerID` int DEFAULT NULL,
  `TotalAmount` decimal(10,2) NOT NULL,
  `PromotionID` int DEFAULT NULL,
  `DiscountAmount` decimal(10,2) DEFAULT '0.00',
  `FinalAmount` decimal(10,2) GENERATED ALWAYS AS (greatest((`TotalAmount` - `DiscountAmount`),0)) STORED,
  `Status` enum('PENDING','CONFIRMED','PREPARING','READY','OUT_FOR_DELIVERY','DELIVERED','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `OrderType` enum('DELIVERY','TAKEAWAY') COLLATE utf8mb4_unicode_ci NOT NULL,
  `SpecialInstructions` text COLLATE utf8mb4_unicode_ci,
  `CancellationReason` text COLLATE utf8mb4_unicode_ci,
  `CancelledBy` enum('CUSTOMER','ADMIN','CASHIER','SYSTEM') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `ConfirmedAt` timestamp NULL DEFAULT NULL,
  `PreparingAt` timestamp NULL DEFAULT NULL,
  `ReadyAt` timestamp NULL DEFAULT NULL,
  `CompletedAt` timestamp NULL DEFAULT NULL,
  `CancelledAt` timestamp NULL DEFAULT NULL,
  `ConfirmedBy` int DEFAULT NULL,
  PRIMARY KEY (`OrderID`),
  UNIQUE KEY `OrderNumber` (`OrderNumber`),
  KEY `PromotionID` (`PromotionID`),
  KEY `ConfirmedBy` (`ConfirmedBy`),
  KEY `idx_order_number` (`OrderNumber`),
  KEY `idx_customer` (`CustomerID`),
  KEY `idx_status` (`Status`),
  KEY `idx_created` (`CreatedAt`),
  KEY `idx_order_type` (`OrderType`),
  CONSTRAINT `order_ibfk_1` FOREIGN KEY (`CustomerID`) REFERENCES `customer` (`CustomerID`) ON DELETE SET NULL,
  CONSTRAINT `order_ibfk_2` FOREIGN KEY (`PromotionID`) REFERENCES `promotion` (`PromotionID`) ON DELETE SET NULL,
  CONSTRAINT `order_ibfk_3` FOREIGN KEY (`ConfirmedBy`) REFERENCES `staff` (`StaffID`) ON DELETE SET NULL,
  CONSTRAINT `order_chk_1` CHECK ((`TotalAmount` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order`
--

LOCK TABLES `order` WRITE;
/*!40000 ALTER TABLE `order` DISABLE KEYS */;
/*!40000 ALTER TABLE `order` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_item`
--

DROP TABLE IF EXISTS `order_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_item` (
  `OrderItemID` int NOT NULL AUTO_INCREMENT,
  `OrderID` int NOT NULL,
  `MenuItemID` int DEFAULT NULL,
  `ComboID` int DEFAULT NULL,
  `Quantity` int NOT NULL,
  `UnitPrice` decimal(10,2) NOT NULL,
  `Subtotal` decimal(10,2) GENERATED ALWAYS AS ((`Quantity` * `UnitPrice`)) STORED,
  `ItemNotes` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`OrderItemID`),
  KEY `idx_order` (`OrderID`),
  KEY `idx_menu` (`MenuItemID`),
  KEY `idx_combo` (`ComboID`),
  CONSTRAINT `order_item_ibfk_1` FOREIGN KEY (`OrderID`) REFERENCES `order` (`OrderID`) ON DELETE CASCADE,
  CONSTRAINT `order_item_ibfk_2` FOREIGN KEY (`MenuItemID`) REFERENCES `menu_item` (`MenuItemID`) ON DELETE SET NULL,
  CONSTRAINT `order_item_ibfk_3` FOREIGN KEY (`ComboID`) REFERENCES `combopack` (`ComboID`) ON DELETE SET NULL,
  CONSTRAINT `order_item_chk_1` CHECK ((`Quantity` > 0)),
  CONSTRAINT `order_item_chk_2` CHECK ((`UnitPrice` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_item`
--

LOCK TABLES `order_item` WRITE;
/*!40000 ALTER TABLE `order_item` DISABLE KEYS */;
/*!40000 ALTER TABLE `order_item` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_status_history`
--

DROP TABLE IF EXISTS `order_status_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_status_history` (
  `HistoryID` int NOT NULL AUTO_INCREMENT,
  `OrderID` int NOT NULL,
  `OldStatus` enum('PENDING','CONFIRMED','PREPARING','READY','OUT_FOR_DELIVERY','DELIVERED','CANCELLED') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `NewStatus` enum('PENDING','CONFIRMED','PREPARING','READY','OUT_FOR_DELIVERY','DELIVERED','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `ChangedBy` int DEFAULT NULL,
  `ChangedByType` enum('CUSTOMER','STAFF','SYSTEM') COLLATE utf8mb4_unicode_ci NOT NULL,
  `Notes` text COLLATE utf8mb4_unicode_ci,
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`HistoryID`),
  KEY `ChangedBy` (`ChangedBy`),
  KEY `idx_order` (`OrderID`),
  KEY `idx_created` (`CreatedAt`),
  CONSTRAINT `order_status_history_ibfk_1` FOREIGN KEY (`OrderID`) REFERENCES `order` (`OrderID`) ON DELETE CASCADE,
  CONSTRAINT `order_status_history_ibfk_2` FOREIGN KEY (`ChangedBy`) REFERENCES `staff` (`StaffID`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_status_history`
--

LOCK TABLES `order_status_history` WRITE;
/*!40000 ALTER TABLE `order_status_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `order_status_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `otp_verification`
--

DROP TABLE IF EXISTS `otp_verification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `otp_verification` (
  `OTPID` int NOT NULL AUTO_INCREMENT,
  `UserType` enum('CUSTOMER','STAFF') COLLATE utf8mb4_unicode_ci NOT NULL,
  `UserID` int NOT NULL,
  `OTPCode` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Purpose` enum('EMAIL_VERIFICATION','PHONE_VERIFICATION','PASSWORD_RESET','LOGIN') COLLATE utf8mb4_unicode_ci NOT NULL,
  `ExpiresAt` datetime NOT NULL,
  `IsUsed` tinyint(1) DEFAULT '0',
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `UsedAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`OTPID`),
  KEY `idx_user` (`UserType`,`UserID`),
  KEY `idx_expires` (`ExpiresAt`)
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
  `ResetID` int NOT NULL AUTO_INCREMENT,
  `UserType` enum('CUSTOMER','STAFF') COLLATE utf8mb4_unicode_ci NOT NULL,
  `UserID` int NOT NULL,
  `ResetToken` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ExpiresAt` datetime NOT NULL,
  `IsUsed` tinyint(1) DEFAULT '0',
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `UsedAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`ResetID`),
  KEY `idx_token` (`ResetToken`),
  KEY `idx_expires` (`ExpiresAt`)
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
  `PaymentID` int NOT NULL AUTO_INCREMENT,
  `OrderID` int NOT NULL,
  `Amount` decimal(10,2) NOT NULL,
  `Method` enum('CASH','CARD','ONLINE','WALLET') COLLATE utf8mb4_unicode_ci NOT NULL,
  `Status` enum('PENDING','PAID','FAILED','REFUNDED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `TransactionID` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `PaymentGatewayResponse` text COLLATE utf8mb4_unicode_ci,
  `PaidAt` timestamp NULL DEFAULT NULL,
  `RefundedAt` timestamp NULL DEFAULT NULL,
  `RefundReason` text COLLATE utf8mb4_unicode_ci,
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`PaymentID`),
  UNIQUE KEY `TransactionID` (`TransactionID`),
  KEY `idx_order` (`OrderID`),
  KEY `idx_status` (`Status`),
  KEY `idx_transaction` (`TransactionID`),
  CONSTRAINT `payment_ibfk_1` FOREIGN KEY (`OrderID`) REFERENCES `order` (`OrderID`) ON DELETE CASCADE,
  CONSTRAINT `payment_chk_1` CHECK ((`Amount` > 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment`
--

LOCK TABLES `payment` WRITE;
/*!40000 ALTER TABLE `payment` DISABLE KEYS */;
/*!40000 ALTER TABLE `payment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `promotion`
--

DROP TABLE IF EXISTS `promotion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `promotion` (
  `PromotionID` int NOT NULL AUTO_INCREMENT,
  `Code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Description` text COLLATE utf8mb4_unicode_ci,
  `DiscountType` enum('PERCENTAGE','FIXED_AMOUNT') COLLATE utf8mb4_unicode_ci NOT NULL,
  `DiscountValue` decimal(10,2) NOT NULL,
  `MinOrderAmount` decimal(10,2) DEFAULT '0.00',
  `MaxDiscountAmount` decimal(10,2) DEFAULT NULL,
  `ValidFrom` datetime NOT NULL,
  `ValidUntil` datetime NOT NULL,
  `UsageLimit` int DEFAULT NULL,
  `UsageCount` int DEFAULT '0',
  `IsActive` tinyint(1) DEFAULT '1',
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `CreatedBy` int DEFAULT NULL,
  PRIMARY KEY (`PromotionID`),
  UNIQUE KEY `Code` (`Code`),
  KEY `CreatedBy` (`CreatedBy`),
  KEY `idx_code` (`Code`),
  KEY `idx_active_dates` (`IsActive`,`ValidFrom`,`ValidUntil`),
  CONSTRAINT `promotion_ibfk_1` FOREIGN KEY (`CreatedBy`) REFERENCES `staff` (`StaffID`) ON DELETE SET NULL,
  CONSTRAINT `chk_promo_dates` CHECK ((`ValidUntil` >= `ValidFrom`)),
  CONSTRAINT `promotion_chk_1` CHECK ((`DiscountValue` > 0))
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
  `RoleID` int NOT NULL AUTO_INCREMENT,
  `RoleName` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`RoleID`),
  UNIQUE KEY `RoleName` (`RoleName`),
  KEY `idx_rolename` (`RoleName`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role`
--

LOCK TABLES `role` WRITE;
/*!40000 ALTER TABLE `role` DISABLE KEYS */;
INSERT INTO `role` VALUES (1,'Admin','2026-01-27 04:25:29'),(2,'Cashier','2026-01-27 04:25:29'),(3,'Kitchen','2026-01-27 04:25:29'),(4,'Delivery','2026-01-27 04:25:29'),(5,'Customer','2026-01-27 10:06:28');
/*!40000 ALTER TABLE `role` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `staff`
--

DROP TABLE IF EXISTS `staff`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `staff` (
  `StaffID` int NOT NULL AUTO_INCREMENT,
  `Name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `RoleID` int NOT NULL,
  `Email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Phone` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `IsActive` tinyint(1) DEFAULT '1',
  `ProfileImageURL` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`StaffID`),
  UNIQUE KEY `Email` (`Email`),
  KEY `idx_role` (`RoleID`),
  KEY `idx_email` (`Email`),
  KEY `idx_active` (`IsActive`),
  CONSTRAINT `staff_ibfk_1` FOREIGN KEY (`RoleID`) REFERENCES `role` (`RoleID`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `staff`
--

LOCK TABLES `staff` WRITE;
/*!40000 ALTER TABLE `staff` DISABLE KEYS */;
INSERT INTO `staff` VALUES (1,'Admin Test User',1,'admin@test.com','0771111111','$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhQy',1,NULL,'2026-01-27 10:18:02','2026-01-27 10:18:02'),(2,'Cashier Test User',2,'cashier@test.com','0772222222','$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhQy',1,NULL,'2026-01-27 10:18:02','2026-01-27 10:18:02'),(3,'Kitchen Test User',3,'kitchen@test.com','0773333333','$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhQy',1,NULL,'2026-01-27 10:18:02','2026-01-27 10:18:02'),(4,'Delivery Test User',4,'delivery@test.com','0774444444','$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhQy',1,NULL,'2026-01-27 10:18:02','2026-01-27 10:18:02');
/*!40000 ALTER TABLE `staff` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_movement`
--

DROP TABLE IF EXISTS `stock_movement`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_movement` (
  `MovementID` int NOT NULL AUTO_INCREMENT,
  `MenuItemID` int NOT NULL,
  `StockDate` date NOT NULL,
  `ChangeType` enum('OPENING','SALE','ADJUSTMENT','RETURN') COLLATE utf8mb4_unicode_ci NOT NULL,
  `QuantityChange` int NOT NULL,
  `ReferenceID` int DEFAULT NULL,
  `ReferenceType` enum('ORDER','MANUAL','SYSTEM') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Notes` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `CreatedBy` int DEFAULT NULL,
  PRIMARY KEY (`MovementID`),
  KEY `CreatedBy` (`CreatedBy`),
  KEY `idx_stock_movement_date` (`StockDate`),
  KEY `idx_stock_movement_item` (`MenuItemID`),
  KEY `idx_change_type` (`ChangeType`),
  CONSTRAINT `stock_movement_ibfk_1` FOREIGN KEY (`MenuItemID`) REFERENCES `menu_item` (`MenuItemID`) ON DELETE CASCADE,
  CONSTRAINT `stock_movement_ibfk_2` FOREIGN KEY (`CreatedBy`) REFERENCES `staff` (`StaffID`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_movement`
--

LOCK TABLES `stock_movement` WRITE;
/*!40000 ALTER TABLE `stock_movement` DISABLE KEYS */;
/*!40000 ALTER TABLE `stock_movement` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `system_settings`
--

DROP TABLE IF EXISTS `system_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_settings` (
  `SettingID` int NOT NULL AUTO_INCREMENT,
  `SettingKey` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `SettingValue` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `Description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `UpdatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `UpdatedBy` int DEFAULT NULL,
  PRIMARY KEY (`SettingID`),
  UNIQUE KEY `SettingKey` (`SettingKey`),
  KEY `UpdatedBy` (`UpdatedBy`),
  KEY `idx_key` (`SettingKey`),
  CONSTRAINT `system_settings_ibfk_1` FOREIGN KEY (`UpdatedBy`) REFERENCES `staff` (`StaffID`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_settings`
--

LOCK TABLES `system_settings` WRITE;
/*!40000 ALTER TABLE `system_settings` DISABLE KEYS */;
INSERT INTO `system_settings` VALUES (1,'max_delivery_distance_km','15','Maximum delivery distance in kilometers','2026-01-27 04:25:32',NULL),(2,'restaurant_latitude','7.0000000','Restaurant location latitude','2026-01-27 04:25:32',NULL),(3,'restaurant_longitude','80.0000000','Restaurant location longitude','2026-01-27 04:25:32',NULL),(4,'order_auto_cancel_minutes','30','Auto-cancel unconfirmed orders after minutes','2026-01-27 04:25:32',NULL),(5,'session_timeout_minutes','30','User session timeout in minutes','2026-01-27 04:25:32',NULL),(6,'min_order_amount','500','Minimum order amount in LKR','2026-01-27 04:25:32',NULL),(7,'delivery_fee','150','Standard delivery fee in LKR','2026-01-27 04:25:32',NULL),(8,'tax_percentage','0','Tax percentage on orders','2026-01-27 04:25:32',NULL);
/*!40000 ALTER TABLE `system_settings` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-01-27 16:31:05
