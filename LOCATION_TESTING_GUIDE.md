# Real-Time Location Testing Guide

## Quick Start Testing

### Prerequisites
- Ensure the server is running on http://localhost:3001
- Ensure the client is running on http://localhost:5173
- Google Maps API key is configured in server/.env
- Browser with geolocation support (Chrome, Firefox, Safari, Edge)

## Test Scenarios

### 1. Test Checkout Page Location Access

#### Steps:
1. Navigate to http://localhost:5173/checkout
2. Add items to cart if needed
3. Select "Delivery" as order type
4. Click "Use My Location" button
5. Allow location permission when browser prompts

#### Expected Results:
- ✅ Browser location permission dialog appears
- ✅ Green checkmark shows "Using your current GPS location"
- ✅ GPS coordinates display (lat, lng)
- ✅ Distance validation runs automatically
- ✅ Green box shows "Within service area" if valid
- ✅ Red box shows "Outside service area" if too far
- ✅ Distance is shown in kilometers
- ✅ Validation method is displayed (Google Maps or straight-line)

#### Test Cases:
- **TC1:** Grant location permission → Should show location and validate
- **TC2:** Deny location permission → Should show error message
- **TC3:** Location within 15km → Should allow order placement
- **TC4:** Location beyond 15km → Should prevent order placement
- **TC5:** Manual address entry still works → Type address and validate

### 2. Test Order Tracking (Customer Dashboard)

#### Steps:
1. Place a delivery order with GPS location
2. Note the order ID
3. Navigate to order tracking page: http://localhost:5173/order-tracking/[ORDER_ID]
4. Change order status to "OUT_FOR_DELIVERY" via admin panel
5. Refresh the order tracking page

#### Expected Results:
- ✅ Order details load correctly
- ✅ Status timeline shows progress
- ✅ "Live Delivery Tracking" section appears when OUT_FOR_DELIVERY
- ✅ Delivery destination shows GPS coordinates
- ✅ "Open in Google Maps" button appears
- ✅ Delivery person info displays (if assigned)
- ✅ Last updated timestamp shows
- ✅ Page auto-refreshes every 30 seconds

#### Test Cases:
- **TC6:** Order status PENDING → No live tracking shown
- **TC7:** Order status PREPARING → No live tracking shown
- **TC8:** Order status OUT_FOR_DELIVERY → Live tracking section appears
- **TC9:** Click Google Maps link → Opens Google Maps with destination
- **TC10:** Wait 30 seconds → Page refreshes automatically

### 3. Test Delivery Dashboard

#### Steps:
1. Login as delivery staff user
2. Navigate to delivery dashboard: http://localhost:5173/delivery-dashboard
3. Allow location permission when prompted

#### Expected Results:
- ✅ Location status indicator appears in header
- ✅ Shows "Location Active" in green when granted
- ✅ GPS coordinates display next to status
- ✅ Active deliveries list shows assigned deliveries
- ✅ Stats cards show current numbers
- ✅ Location updates every 60 seconds
- ✅ Dashboard refreshes every 30 seconds

#### Test Cases:
- **TC11:** Grant location → Status shows green "Location Active"
- **TC12:** Deny location → Status shows red "Location Denied"
- **TC13:** No geolocation support → Status shows gray "Location Unavailable"
- **TC14:** Wait 60 seconds → Location coordinates update
- **TC15:** Accept new delivery → Appears in active deliveries list

### 4. Test Delivery Map Page

#### Steps:
1. Login as delivery staff
2. Navigate to http://localhost:5173/delivery/map
3. Allow location permission

#### Expected Results:
- ✅ Map loads with restaurant marker
- ✅ Delivery locations show as markers
- ✅ Current location shows as blue marker
- ✅ Click markers to see delivery details
- ✅ Routes can be drawn between locations

#### Test Cases:
- **TC16:** Map centers on restaurant location
- **TC17:** Active deliveries show as markers
- **TC18:** Current location marker appears
- **TC19:** Click delivery marker → Info window opens
- **TC20:** Multiple deliveries → All markers visible

## Manual Testing Checklist

### Checkout Page
- [ ] Location button visible and functional
- [ ] Permission prompt appears on click
- [ ] Location coordinates display when granted
- [ ] Distance validation runs automatically
- [ ] Valid location allows order placement
- [ ] Invalid location blocks order placement
- [ ] Error messages display clearly
- [ ] Manual address entry still works
- [ ] GPS coordinates saved with address

### Order Tracking
- [ ] Order details load correctly
- [ ] Status updates automatically (30s)
- [ ] Live tracking appears when OUT_FOR_DELIVERY
- [ ] GPS coordinates display in address
- [ ] Google Maps link works
- [ ] Delivery person info shows
- [ ] Last updated timestamp displays
- [ ] No tracking shown for TAKEAWAY orders

### Delivery Dashboard
- [ ] Location indicator in header
- [ ] Status shows grant/deny state
- [ ] GPS coordinates display
- [ ] Updates every 60 seconds
- [ ] Active deliveries list populates
- [ ] Stats cards show correct numbers
- [ ] Dashboard refreshes automatically
- [ ] Quick action buttons work

### Delivery Map
- [ ] Map loads successfully
- [ ] Restaurant marker visible
- [ ] Delivery markers show
- [ ] Current location marker appears
- [ ] Info windows open on click
- [ ] Routes display correctly
- [ ] Map controls functional
- [ ] Real-time updates work

## Browser Testing

Test on multiple browsers to ensure compatibility:

### Desktop Browsers
- [ ] Google Chrome (latest)
- [ ] Mozilla Firefox (latest)
- [ ] Microsoft Edge (latest)
- [ ] Safari (macOS)

### Mobile Browsers
- [ ] Chrome Mobile (Android)
- [ ] Safari Mobile (iOS)
- [ ] Samsung Internet

## Network Testing

### Test Different Network Conditions:
- [ ] Fast WiFi → Should work smoothly
- [ ] Slow 3G → Should handle timeouts gracefully
- [ ] Offline → Should show appropriate errors
- [ ] VPN → Should still access location
- [ ] Mobile Data → Should work on cellular

## Permission Testing

### Test Permission States:
- [ ] Not yet prompted → "Enable Location" shown
- [ ] Permission granted → "Location Active" shown
- [ ] Permission denied → "Location Denied" shown
- [ ] Geolocation unavailable → "Location Unavailable" shown
- [ ] Reset permission → Can re-prompt

## Error Testing

### Test Error Scenarios:
- [ ] Location timeout → Shows timeout error
- [ ] Location unavailable → Shows unavailable error
- [ ] Network failure → Shows network error
- [ ] API key missing → Falls back to approximation
- [ ] Invalid coordinates → Shows validation error

## Performance Testing

### Monitor Performance:
- [ ] Location request < 10 seconds
- [ ] Distance validation < 5 seconds
- [ ] Page auto-refresh smooth
- [ ] No memory leaks on long sessions
- [ ] Smooth animations and transitions

## Security Testing

### Verify Security:
- [ ] HTTPS required in production
- [ ] Permissions-Policy header set
- [ ] Location data not logged unnecessarily
- [ ] No location tracking without permission
- [ ] API keys not exposed to client

## Integration Testing

### End-to-End Flows:
1. **Complete Order Flow:**
   - Add items to cart
   - Go to checkout
   - Use location
   - Validate distance
   - Place order
   - Track order
   - Verify location saved

2. **Delivery Flow:**
   - Login as delivery staff
   - View dashboard
   - Accept delivery
   - Open map
   - Navigate to location
   - Update status
   - Complete delivery

## Debugging Tips

### If location not working:
1. Check browser console for errors
2. Verify HTTPS (or localhost)
3. Check browser location settings
4. Clear browser cache
5. Check Permissions-Policy header
6. Verify device has location services enabled

### If validation fails:
1. Check Google Maps API key
2. Verify API key has Distance Matrix API enabled
3. Check network connectivity
4. Review server logs
5. Test with known coordinates

### If updates not happening:
1. Check network requests in DevTools
2. Verify polling intervals
3. Check for JavaScript errors
4. Verify WebSocket connections
5. Review server-side logs

## Test Data

### Valid Test Coordinates (within 15km of restaurant):
- Restaurant: 7.120035696626918, 80.05250172082567 (Voleena Foods, Kalagedihena)
- Test Location 1: 7.1300, 80.0625 (close - ~1.5km)
- Test Location 2: 7.1400, 80.0725 (medium - ~3km)
- Test Location 3: 7.1500, 80.0825 (far but valid - ~5km)

### Invalid Test Coordinates (beyond 15km):
- Test Location 4: 6.8000, 80.7000 (too far)
- Test Location 5: 7.1000, 80.9000 (too far)

## Reporting Issues

When reporting bugs, include:
- Browser and version
- Operating system
- Permission state
- Console errors
- Network request details
- Steps to reproduce
- Expected vs actual behavior

## Notes
- All geolocation features require HTTPS in production
- Development (localhost) works without HTTPS
- First time users will see permission prompt
- Location updates may take a few seconds
- Distance validation uses Google Maps when available
- Fallback to straight-line distance if API unavailable
