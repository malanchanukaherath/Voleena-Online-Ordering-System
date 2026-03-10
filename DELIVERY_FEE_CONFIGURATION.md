# Delivery Fee Configuration Guide

## Overview

The Voleena Online Ordering System now implements a **dynamic distance-based delivery fee calculation** system. This replaces the previous fixed delivery fee and provides fair, transparent pricing based on actual delivery distance.

**Key Changes:**

- ✅ **Removed**: Fixed LKR 150 delivery fee
- ✅ **Removed**: 8% tax calculation (business decision)
- ✅ **Added**: Distance-based delivery fee with tiered pricing
- ✅ **Added**: Transparent fee breakdown shown to customers

---

## Delivery Fee Structure

The delivery fee is calculated dynamically based on distance using the following formula:

```
Base Fee (within free range) = BASE_DELIVERY_FEE
Additional Fee (beyond free range) = (Distance - FREE_DELIVERY_DISTANCE_KM) × DELIVERY_FEE_PER_KM
Total Delivery Fee = min(Base Fee + Additional Fee, MAX_DELIVERY_FEE)
```

### Configuration Variables

All delivery fee settings can be customized via environment variables in the `server/.env` file:

| Variable                    | Description                                 | Default Value | Example |
| --------------------------- | ------------------------------------------- | ------------- | ------- |
| `BASE_DELIVERY_FEE`         | Base fee applied to all deliveries          | 100 LKR       | 100     |
| `FREE_DELIVERY_DISTANCE_KM` | Distance within which only base fee applies | 3 km          | 3       |
| `DELIVERY_FEE_PER_KM`       | Additional cost per km beyond free range    | 20 LKR/km     | 20      |
| `MAX_DELIVERY_FEE`          | Maximum delivery fee cap                    | 300 LKR       | 300     |

---

## Examples

### Example 1: Delivery within Free Range (≤3 km)

**Distance:** 2.5 km  
**Calculation:**

- Base Fee: LKR 100
- Distance Fee: LKR 0 (within free range)
- **Total: LKR 100**

### Example 2: Delivery Beyond Free Range

**Distance:** 7 km  
**Calculation:**

- Base Fee: LKR 100
- Extra Distance: 7 - 3 = 4 km
- Distance Fee: 4 × 20 = LKR 80
- **Total: LKR 180**

### Example 3: Delivery at Maximum Distance

**Distance:** 14 km  
**Calculation:**

- Base Fee: LKR 100
- Extra Distance: 14 - 3 = 11 km
- Distance Fee: 11 × 20 = LKR 220
- Subtotal: LKR 320
- **Total: LKR 300** (capped at MAX_DELIVERY_FEE)

---

## How to Configure

### Option 1: Using Environment Variables (Recommended)

1. Open `server/.env` file
2. Update the delivery fee variables:

```env
# Dynamic Delivery Fee Configuration
BASE_DELIVERY_FEE=100
FREE_DELIVERY_DISTANCE_KM=3
DELIVERY_FEE_PER_KM=20
MAX_DELIVERY_FEE=300
```

3. Restart the server:

```bash
cd server
npm start
```

### Option 2: System Administrator Dashboard (Future Enhancement)

A future update will include an admin dashboard where you can adjust these settings without editing environment files.

---

## Customer Experience

### At Checkout

1. **Address Entry:** Customer enters delivery address or uses GPS location
2. **Distance Validation:** System validates address is within service area (≤15 km)
3. **Fee Calculation:** Dynamic delivery fee calculated based on actual distance
4. **Transparent Breakdown:** Customer sees:
   - Distance (e.g., "7.2 km")
   - Fee breakdown (e.g., "LKR 100 (base) + 80 (4 km × 20)")
   - Total delivery fee

### Order Summary Display

```
Subtotal:     LKR 600.00
Delivery Fee: LKR 180.00
              7.2 km - LKR 100 (base) + 80 (4 km × 20)
─────────────────────────
Total:        LKR 780.00
```

---

## Business Benefits

### 1. **Fair Pricing**

- Customers pay based on actual delivery distance
- No overcharging for nearby deliveries
- No undercharging for distant deliveries

### 2. **Transparency**

- Clear breakdown of fees
- Customers understand what they're paying for
- Reduces support inquiries

### 3. **Flexibility**

- Easy to adjust pricing strategy via configuration
- No code changes required
- Can test different pricing models

### 4. **Revenue Optimization**

- Better cost recovery for long-distance deliveries
- Competitive pricing for nearby customers
- Fee cap prevents excessive charges

---

## Technical Implementation

### Backend

- **Utility:** `server/utils/deliveryFeeCalculator.js`
- **API Endpoints:**
  - `GET /api/v1/delivery/fee-config` - Get current fee structure
  - `POST /api/v1/delivery/calculate-fee` - Calculate fee for specific distance
- **Order Service:** Integrated into order creation with distance validation

### Frontend

- **Real-time Calculation:** Fee updated as customer enters address
- **GPS Support:** Automatic calculation using current location
- **Visual Feedback:** Fee breakdown displayed in order summary

---

## API Reference

### Get Delivery Fee Configuration

```http
GET /api/v1/delivery/fee-config
```

**Response:**

```json
{
  "success": true,
  "data": {
    "baseFee": 100,
    "freeDeliveryDistance": 3,
    "feePerKm": 20,
    "maxFee": 300,
    "description": "Base fee of LKR 100 applies. Free delivery within 3km. Additional LKR 20 per km beyond that, capped at LKR 300."
  }
}
```

### Calculate Delivery Fee

```http
POST /api/v1/delivery/calculate-fee
Content-Type: application/json

{
  "distanceKm": 7.5
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "distanceKm": 7.5,
    "baseFee": 100,
    "distanceFee": 100,
    "totalFee": 200,
    "breakdown": "100 (base) + 100 (5 km × 20)",
    "isFreeRange": false,
    "isCapped": false
  }
}
```

---

## Best Practices

### Recommended Pricing Strategy

1. **Start Conservative:** Use default values and monitor customer feedback
2. **Adjust Gradually:** Make small incremental changes
3. **Test Locally:** Validate changes in development environment first
4. **Monitor Metrics:** Track average delivery fee and order completion rates

### Configuration Tips

- **Base Fee:** Should cover minimum delivery costs (fuel, time)
- **Free Range:** Set to encourage nearby customers (typically 2-5 km)
- **Per KM Rate:** Should reflect actual delivery cost increase
- **Max Fee:** Prevent excessive charges while maintaining profitability

---

## Troubleshooting

### Issue: Delivery fee not updating

**Solution:** Check that:

1. Environment variables are properly set in `.env`
2. Server has been restarted after changes
3. Frontend is fetching latest fee configuration

### Issue: Fee calculation errors

**Solution:** Verify:

1. GOOGLE_MAPS_API_KEY is configured for distance validation
2. RESTAURANT_LATITUDE and RESTAURANT_LONGITUDE are set correctly
3. Distance validation is working (check server logs)

### Issue: Customer sees old pricing

**Solution:**

1. Clear browser cache
2. Restart frontend dev server
3. Check browser console for API errors

---

## Future Enhancements

### Planned Features

- [ ] Admin dashboard for real-time fee configuration
- [ ] Time-based pricing (peak hours surcharge)
- [ ] Zone-based pricing (different rates for different areas)
- [ ] Promotional free delivery campaigns
- [ ] Bulk order discounts
- [ ] Subscription-based delivery plans

---

## Support

For technical assistance or business inquiries:

- **Technical Issues:** Check server logs at `server/logs/app.log`
- **Configuration Questions:** Review this documentation
- **Feature Requests:** Contact development team

---

## Version History

| Version | Date       | Changes                                    |
| ------- | ---------- | ------------------------------------------ |
| 1.0     | March 2026 | Initial distance-based delivery fee system |

---

**Note:** This system replaces the previous fixed delivery fee and tax calculation. All existing orders will continue to use their original pricing, while new orders will use the dynamic system.
