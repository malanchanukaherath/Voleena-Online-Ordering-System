# Google Maps Integration Guide - Voleena Foods

## Overview
The Delivery Tracking Map provides real-time visualization of delivery locations, routes, and order status tracking using Google Maps API.

## Features
- ✅ Real-time delivery location tracking
- ✅ Restaurant location display (Kalagedihena)
- ✅ Delivery route visualization
- ✅ Status-based marker colors
- ✅ Distance and estimated time display
- ✅ Direct customer contact via map
- ✅ Auto-refresh every 30 seconds

## Installation & Setup

### 1. Get Google Maps API Key

#### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Create Project"
3. Name: "Voleena Foods Delivery"
4. Click "Create"

#### Step 2: Enable Required APIs
1. In the console, search for and enable:
   - **Maps JavaScript API** - For map display
   - **Distance Matrix API** - For distance calculation
   - **Geocoding API** - For address conversion
   - **Directions API** - For route optimization (optional)

#### Step 3: Create API Key
1. Go to "Credentials" in the left sidebar
2. Click "Create Credentials" → "API Key"
3. Copy your API key
4. *(Recommended for production)* Restrict key to:
   - Application restrictions: HTTP referrers
   - Add your domain: `yourdomain.com`
   - API restrictions: Above 3 APIs only

### 2. Configure Environment Variables

#### Frontend (.env.local)
```bash
VITE_GOOGLE_MAPS_API_KEY=YOUR_API_KEY_HERE
VITE_API_BASE_URL=http://localhost:3001
```

#### Backend (.env)
```bash
GOOGLE_MAPS_API_KEY=YOUR_API_KEY_HERE
RESTAURANT_LATITUDE=7.120035696626918
RESTAURANT_LONGITUDE=80.05250172082567
MAX_DELIVERY_DISTANCE_KM=15
```

### 3. Install Dependencies
```bash
# Already installed in your project
# But if needed:
npm install @react-google-maps/api
```

## Restaurant Location - Kalagedihena

**Plus Code:** 4392+WXG

**Coordinates:**
- **Latitude:** 7.120035696626918°N
- **Longitude:** 80.05250172082567°E
- **Location:** Voleena Foods, Kalagedihena

**Address:** Kalagedihena, Sri Lanka

## Map Features

### Delivery Map Component (`client/src/pages/DeliveryMap.jsx`)

#### Marker Colors
| Color | Status | Meaning |
|-------|--------|---------|
| 🔴 Red | - | Restaurant |
| 🟡 Yellow | ASSIGNED | Order picked from kitchen |
| 🟠 Orange | PICKED_UP | Delivery staff has order |
| 🔵 Blue | IN_TRANSIT | On the way to customer |
| 🟢 Green | DELIVERED | Order delivered |

#### Panel Sections
1. **Interactive Map** (Left side)
   - Pan, zoom, fullscreen controls
   - Click markers to view details
   - Route lines showing delivery paths

2. **Active Deliveries** (Right side)
   - List of in-transit deliveries
   - Click to highlight on map
   - Quick call button
   - Distance and time estimates

3. **Restaurant Info**
   - Location details
   - Reference point for all deliveries

### API Endpoints Used

```
GET /api/v1/delivery/deliveries?status=IN_TRANSIT
- Fetches active deliveries with location data
- Response includes: coordinates, distance, customer info
```

## Distance Validation (Backend)

All deliveries are validated against 15km radius using:

1. **Google Maps Distance Matrix API** - Driving distance
2. **Fallback Haversine Formula** - If API fails

```javascript
// Backend validation in server/controllers/deliveryController.js
POST /api/v1/delivery/validate-distance
```

## Testing the Integration

### Without Google Maps API Key
- Map displays with fallback view
- Uses demo coordinates (Colombo center)
- Full functionality except actual map rendering

### With Valid API Key
1. Start both frontend and backend
2. Login as delivery staff
3. Navigate to **Delivery Dashboard** → **View Map**
4. See your active deliveries on the map

### Test Deliveries
Use these test coordinates for Colombo area:
```javascript
// Near Restaurant
{ lat: 7.120035696626918, lng: 80.05250172082567 }

// Sample Delivery Point 1
{ lat: 6.8600, lng: 80.7800 }

// Sample Delivery Point 2
{ lat: 6.8450, lng: 80.7700 }
```

## Troubleshooting

### Map Not Displaying
- [ ] Check Google Maps API key in `.env.local`
- [ ] Verify API key has Maps JavaScript API enabled
- [ ] Check browser console for errors
- [ ] Ensure CORS is properly configured

### Markers Not Showing
- [ ] Delivery data exists in database
- [ ] Coordinates are valid (lat: -90 to 90, lng: -180 to 180)
- [ ] Check network tab for delivery API response

### Distance Calculations Wrong
- [ ] Check restaurant coordinates in backend `.env`
- [ ] Verify Distance Matrix API is enabled
- [ ] Check daily API quota not exceeded

### High API Costs
Reduce costs by:
- Caching distance results for 1 hour
- Using Haversine fallback for UI estimates
- Limiting API calls to customer submissions only

## Performance Optimization

### Current Implementation
- Auto-refresh: 30 seconds (adjustable)
- Max deliveries loaded: All (can be limited)
- Map zoom: 14 (optimal for city-wide view)

### To Optimize:
```javascript
// In DeliveryMap.jsx line 73
// Change interval (milliseconds)
const interval = setInterval(fetchDeliveries, 60000); // 60 seconds

// Add pagination if many deliveries
const [page, setPage] = useState(1);
const [limit] = useState(20);
const response = await deliveryService.getMyDeliveries(
  'IN_TRANSIT', 
  limit, 
  page * limit
);
```

## Security Considerations

1. **API Key Protection:**
   - Never commit `.env` files
   - Use `.env.local` for local development
   - Rotate keys periodically

2. **Data Privacy:**
   - Delivery addresses are displayed on map
   - Only visible to delivery staff (protected route)
   - GPS data not logged permanently

3. **Rate Limiting:**
   - Backend already has rate limiters
   - Google Maps API has daily quotas
   - Monitor usage in Cloud Console

## Future Enhancements

- [ ] Real-time driver location tracking
- [ ] Customer notification on delivery arrival
- [ ] Live chat with driver
- [ ] Estimated arrival countdown timer
- [ ] Multiple route optimization
- [ ] Weather overlay integration
- [ ] Traffic condition alerts
- [ ] Proof of delivery (photo capture)

## Support & Resources

- [Google Maps API Documentation](https://developers.google.com/maps/documentation)
- [React Google Maps Library](https://react-google-maps-api-docs.netlify.app/)
- [Distance Matrix API Guide](https://developers.google.com/maps/documentation/distance-matrix)
- [Pricing Calculator](https://cloud.google.com/products/calculator)

---

**Last Updated:** March 2, 2026
**Status:** ✅ Production Ready
