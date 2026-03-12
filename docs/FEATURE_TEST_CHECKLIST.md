# Feature Testing Checklist

## Authentication
- [ ] Register a customer with valid details
- [ ] Reject registration with duplicate email or phone
- [ ] Reject customer login before email verification
- [ ] Verify access token and logout successfully
- [ ] Request, verify, and complete password reset

## Customer Profile
- [ ] Staff creates a new customer manually
- [ ] Staff sees duplicate customer match instead of a duplicate insert
- [ ] Customer reads profile and address list
- [ ] Customer creates an address with direct coordinates
- [ ] Customer creates an address that requires geocoding

## Catalog
- [ ] Public menu listing returns active items
- [ ] Authorized users fetch menu item detail
- [ ] Admin or kitchen creates and updates a menu item
- [ ] Admin creates, updates, and deactivates categories
- [ ] Admin creates and updates combo packs
- [ ] Admin uploads menu and combo images

## Cart And Orders
- [ ] Public cart validation rejects invalid payloads
- [ ] Public cart summary calculates totals correctly
- [ ] Customer places takeaway order
- [ ] Customer places delivery order with address
- [ ] Customer retrieves own orders only
- [ ] Cashier confirms an order
- [ ] Staff updates order status
- [ ] Customer cancels an eligible order

## Payments
- [ ] Customer initiates card payment for own order
- [ ] Reject payment initiation for foreign or cancelled orders
- [ ] Reject duplicate pending or paid payment creation
- [ ] Validate PayHere webhook signature and amount
- [ ] Reject Stripe webhook when configuration is missing or invalid

## Delivery
- [ ] Public delivery distance validation works with GPS coordinates
- [ ] Public delivery distance validation works with address geocoding
- [ ] Public fee calculation rejects invalid distance
- [ ] Delivery staff reads dashboard and assigned deliveries
- [ ] Delivery staff updates availability
- [ ] Delivery staff tracks live location
- [ ] Customer reads own delivery location
- [ ] Admin lists available delivery staff

## Operations
- [ ] Admin dashboard and reports load
- [ ] Admin staff CRUD works
- [ ] Admin assigns delivery staff to an order
- [ ] Kitchen dashboard, queue, and stock endpoints load
- [ ] Cashier dashboard, orders, and customer management endpoints load
- [ ] Stock update, adjustment, movement, and legacy endpoints are accessible to admin/kitchen roles
