# 1.1 Introduction {#introduction .Heading4}

This chapter provides an overview of Voleena Foods, its current business
processes, and the proposed Web-Based Online Food Ordering System. It
highlights the challenges of the existing manual approach, such as order
errors, inefficient tracking, and limited customer engagement. The aims
and objectives of the proposed solution are presented along with its
defined scope, showing how the system is expected to modernize and
streamline operations. Finally, the chapter outlines the structure of
the report to guide readers through the subsequent sections.

# 1.2 Description of the Business {#description-of-the-business .Heading4}

**\
Voleena Foods** is a catering and food court service located in
**Kalagedihena, Gampaha District, Sri Lanka**. The business is
well-known for providing a variety of traditional Sri Lankan meals,
combo packs, and catering services for special events. Their **Sunday
and special-day combo offers** are highly popular among customers.

At present, all orders are handled **manually via phone calls**. Staff
members record customer orders by hand, often identifying customers by
only the last few digits of their phone numbers. Deliveries are carried
out by an in-house delivery team using motorcycles. While the business
has gained a loyal customer base, the absence of a digital system limits
efficiency, scalability, and customer convenience.

# 1.3 Business Process {#business-process .Heading4}

Currently, all major processes at Voleena Foods are handled manually.
Orders are placed through phone calls, promotions are communicated
verbally or displayed physically in-store, and customer records are not
digitized. The main processes that will be improved through the proposed
system include:

1.  **Customer Registration and Profile Management**\
    Customers provide details over the phone, and records are maintained
    manually. This increases the chances of errors and slows down
    customer onboarding.

2.  **Order Placement and Tracking**\
    Orders are recorded by hand, and there is no automated tracking
    system. This can result in delays, missed orders, or
    miscommunication between staff and customers.

3.  **Promotion Management**\
    Sunday and special-day combo packs are advertised only on-site or
    through conversations with staff, reducing visibility and
    effectiveness.

4.  **Delivery Management**\
    Orders are delivered without real-time tracking. Customers cannot
    monitor delivery status, which reduces transparency and convenience.

5.  **Reporting and Sales Analysis**\
    Reports on sales, order trends, and customer behavior are compiled
    manually, which is slow, error-prone, and lacks insight for
    decision-making.

# 1.4 Existing System -- Problems and Weaknesses {#existing-system-problems-and-weaknesses .Heading4}

The current manual system suffers from several weaknesses:

- **Time-Consuming:** Order taking, recording, and reporting require
  extra time due to manual processes.

- **Risk of Human Error:** Handwritten records may lead to mistakes,
  such as incorrect orders or missed details.

- **Lack of Order Tracking:** Customers cannot track their order status
  or delivery progress.

- **Limited Communication:** Promotions are not effectively advertised,
  and customers rely only on phone interactions.

- **Lack of Accessibility:** Customers have no direct access to past
  order records or personalized services.

- **Weak Reporting:** Sales and performance reports are generated
  manually, often late and prone to errors.

# 1.5 Aims and Objectives {#aims-and-objectives .Heading4}

**\
Aim**

The aim of this project is to design and develop a **web-based online
food ordering system** for Voleena Foods, enabling customers to place
orders conveniently while helping the business improve efficiency in
order management, delivery tracking, and promotions.

**Objectives**

1.  **Automate Order Management**\
    Allow customers to place takeaway and delivery orders online, with
    instant reflection in the backend dashboard.

2.  **Efficient Delivery Coordination**\
    Enable real-time assignment of orders to kitchen and delivery staff,
    while allowing customers to track their delivery status.

3.  **Promotion and Combo Pack Management**\
    Provide automated scheduling and display of Sunday and special-day
    combo offers to increase visibility.

4.  **Customer Engagement**\
    Facilitate customer profile management, order history, and feedback
    submission to improve customer relationships.

5.  **Sales Reporting and Analytics**\
    Automatically generate reports on sales, popular items, and customer
    behavior to support decision-making.

6.  **Scalability for Future Growth**\
    Ensure the system can handle more customers, menu items, and
    deliveries as the business expands.

# 1.6 Scope of the Project {#scope-of-the-project .Heading4}

The project scope includes the following features:

1.  **Customer Portal** -- Registration, login, profile management, menu
    browsing, online ordering, order history, and feedback.

2.  **Admin and Staff Dashboard** -- Staff login, role-based access,
    order management, delivery assignment, promotions/coupons
    management, and report generation.

3.  **System Features** -- Order ID generation, automated notifications,
    secure payment integration, sales analytics, and database
    management.

4.  **Delivery Management** -- Assigning orders to delivery staff,
    tracking delivery progress, and confirmation of completed orders.

Out of scope: Development of a mobile app, multi-branch management, and
advanced AI-based analytics (can be added in future).

# 1.7 Project Feasibility {#project-feasibility .Heading4}

**Technical Feasibility**\
The system can be developed using common web technologies such as
**React, Node.js/PHP, and MySQL**. APIs like Google Maps (for delivery
location validation) and Twilio (for SMS notifications) will be
integrated. Staff will require minimal training to use the user-friendly
dashboards.

**Economic Feasibility**\
The system is cost-effective for a medium-scale food business. Expenses
include system development, hosting, and basic maintenance. Long-term
savings will result from reduced manual effort, fewer errors, and better
operational efficiency.

**Legal Feasibility**\
The system will comply with Sri Lankan ICT and data privacy regulations.
Sensitive customer data will be encrypted and accessed only by
authorized staff. Future online payment features will comply with
PCI-DSS standards.

# 3.2.1 Functional Requirements  {#functional-requirements .Heading4}

+----+------------------------------------------------------------------+
| ID | Functional Requirement                                           |
+====+==================================================================+
| FR | Customers shall be able to create an account through sign-up and |
| 01 | sign in to the system using valid credentials.                   |
+----+------------------------------------------------------------------+
| FR | Admin and Cashier staff shall be able to register new customers  |
| 02 | manually.                                                        |
+----+------------------------------------------------------------------+
| ER | The system shall allow the Admin to create staff accounts by     |
| 03 | entering required staff details and assigning one predefined     |
|    | role (Admin, Cashier, Kitchen Staff, or Delivery Staff) to       |
|    | control system access and permissions.                           |
+----+------------------------------------------------------------------+
| FR | Customers shall be able to update their profile information      |
| 04 | (name, phone number, address and profile photo).                 |
+----+------------------------------------------------------------------+
| FR | Cashier staff shall be able to update limited customer details,  |
| 05 | including name, phone number, and address, when required.        |
+----+------------------------------------------------------------------+
| FR | The system shall allow the Admin to update and manage customer   |
|    | profile details, including customer name, phone number, email    |
| 06 | address, delivery addresses, and account status (activate,       |
|    | deactivate, or block). The Admin shall also be able to reset     |
|    | customer passwords upon request, add internal customer notes,    |
|    | verify or correct duplicate customer accounts, and view customer |
|    | order history for auditing purposes.                             |
+----+------------------------------------------------------------------+
| FR | Customers shall be able to browse the menu and view daily/weekly |
| 07 | combo packs.                                                     |
+----+------------------------------------------------------------------+
| FR | Customers shall be able to place food orders through the system. |
| 08 |                                                                  |
+----+------------------------------------------------------------------+
| FR | The system shall validate delivery locations by calculating the  |
| 09 | road travel distance between the restaurant's registered         |
|    | location and the customer's delivery address using the Google    |
|    | Maps Distance Matrix API for delivery orders only. Delivery      |
|    | orders shall be accepted only if the calculated driving distance |
|    | is less than or equal to 15 km.                                  |
+----+------------------------------------------------------------------+
| FR | The system shall allow Admin, cashier staff, kitchen staff, and  |
| 10 | delivery staff to view incoming customer orders relevant to      |
|    | their assigned roles.                                            |
+----+------------------------------------------------------------------+
| FR | The system shall allow Admin and cashier staff to accept or      |
| 11 | reject incoming customer orders before order preparation         |
|    | begins**.**                                                      |
+----+------------------------------------------------------------------+
| FR | The system shall allow kitchen staff to update order status to   |
| 12 | "Preparing" and "Ready for Delivery".                            |
+----+------------------------------------------------------------------+
| FR | The system shall allow delivery staff to update order status to  |
| 13 | "Out for Delivery" and "Delivered".                              |
+----+------------------------------------------------------------------+
| FR | The system shall allow Admin to cancel orders at any stage, and  |
| 14 | cashier staff to cancel orders only before preparation has       |
|    | begun.                                                           |
+----+------------------------------------------------------------------+
| FR | The system shall notify customers about order confirmation and   |
| 15 | status updates via email.                                        |
+----+------------------------------------------------------------------+
| FR | Admin shall be able to generate operational reports, including   |
| 16 | monthly sales and best-selling items.                            |
+----+------------------------------------------------------------------+
| FR | The system shall allow only the Admin to create, edit, and       |
| 17 | schedule combo pack promotions, which shall be automatically     |
|    | displayed on the customer portal during the defined promotion    |
|    | period.                                                          |
+----+------------------------------------------------------------------+
| FR | The system shall automatically calculate combo pack prices using |
| 18 | either percentage-based discounts or fixed pricing values        |
|    | configured by the Admin.                                         |
+----+------------------------------------------------------------------+
| FR | The system shall automatically enable or disable combo packs     |
|    | based on their configured start and end dates.                   |
| 19 |                                                                  |
+----+------------------------------------------------------------------+
| FR | The system shall allow customers to cancel orders before kitchen |
| 20 | staff begin order preparation.                                   |
+----+------------------------------------------------------------------+
| FR | The system shall automatically initiate refunds for prepaid      |
| 21 | orders upon successful order cancellation.                       |
+----+------------------------------------------------------------------+
| FR | The system shall maintain a Daily_Stock record for each menu     |
| 22 | item, representing the number of portions available for sale on  |
|    | a given day, and shall prevent order confirmation when the       |
|    | requested quantity exceeds the available Daily_Stock.            |
+----+------------------------------------------------------------------+
| FR | The system shall allow the Admin and kitchen staff to update     |
| 23 | Daily_Stock quantities for menu items through a dedicated user   |
|    | interface.                                                       |
+----+------------------------------------------------------------------+
| FR | The system shall validate item availability at checkout and      |
| 24 | notify customers if any selected menu items are out of stock,    |
|    | preventing order confirmation until the issue is resolved.       |
+----+------------------------------------------------------------------+
| FR | The system shall automatically disable menu items when stock     |
| 25 | quantity reaches zero.                                           |
+----+------------------------------------------------------------------+
| FR | The system shall automatically assign delivery orders to         |
| 26 | available delivery staff when such staff are available;          |
|    | otherwise, the order shall remain in a pending delivery          |
|    | assignment state until a delivery staff member becomes           |
|    | available.                                                       |
+----+------------------------------------------------------------------+
| FR | The system shall allow users to reset forgotten passwords via    |
| 27 | email or SMS verification.                                       |
+----+------------------------------------------------------------------+
| FR | The system shall verify new user accounts using OTP-based        |
| 28 | confirmation.                                                    |
+----+------------------------------------------------------------------+
| FR | The system shall automatically log out authenticated users after |
| 29 | a predefined period of inactivity.                               |
+----+------------------------------------------------------------------+
| FR | The system shall support online payments using third-party       |
| 30 | payment gateways such as PayHere or Stripe.                      |
+----+------------------------------------------------------------------+
| FR | The system shall notify customers and allow retry when a payment |
| 31 | transaction fails.                                               |
+----+------------------------------------------------------------------+

: Table 19 Selected BSO Functional Requirements

# 3.2.2 Non-Functional Requirements  {#non-functional-requirements .Heading4}

  -----------------------------------------------------------------------
  ID      Non-Functional Requirement
  ------- ---------------------------------------------------------------
  NFR 01  The system shall provide a responsive GUI.

  NFR 02  The system shall implement role-based access control (Customer,
          Staff, Admin).

  NFR 03  The system shall process order placement and confirmation
          within 5 seconds.

  NFR 04  The system shall support at least 100 concurrent users without
          performance issues.

  NFR 05  The system shall be accessible via modern web browsers (Chrome,
          Firefox, Safari, Edge).

  NFR 06  The system shall ensure secure login and data protection
          (encrypted passwords).

  NFR 07  The system should automatically back up data daily and allow
          restoration within 1 hour.

  NFR 08  Customers should be able to view their past orders (order
          history).

  NFR 09  The system should be scalable to handle increased users, menu
          items, and order volumes in the future.

  NFR 10  The system shall provide basic analytics for decision-making
          (e.g., best-selling items, income trends).

  NFR 11  The system shall store all customers and order details securely
          in a database.
  -----------------------------------------------------------------------

  : Table 20 Selected BSO Non-Functional Requirements
