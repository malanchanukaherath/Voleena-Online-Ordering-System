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

-- Dump completed on 2026-04-07 10:36:43
