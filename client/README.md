# Voleena Foods - Online Ordering System

A modern, responsive food ordering web application built with React, Vite, and TailwindCSS.

## 🚀 Features

- **Responsive Design**: Mobile-first approach with TailwindCSS
- **Authentication**: User registration and login with JWT tokens
- **Menu Management**: Browse and search through food items by category
- **Shopping Cart**: Add, remove, and update items with persistent storage
- **Order Management**: Complete checkout flow with delivery/pickup options
- **Order Tracking**: Real-time order status updates
- **Order History**: View past orders and reorder functionality
- **Admin Dashboard**: Manage orders and update status (admin only)
- **Mock API**: Complete mock backend for development

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite
- **Styling**: TailwindCSS
- **Routing**: React Router DOM
- **State Management**: React Context + useReducer
- **HTTP Client**: Axios
- **Authentication**: JWT (stored in localStorage)

## 📁 Project Structure

```
voleena-frontend/
├── public/
├── src/
│   ├── assets/
│   │   └── mock/
│   │       └── menu.json          # Mock menu data
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.jsx         # Navigation header
│   │   │   └── Footer.jsx         # Footer component
│   │   ├── menu/
│   │   │   └── MenuItem.jsx       # Menu item card
│   │   └── ui/
│   │       ├── Button.jsx         # Reusable button
│   │       ├── Input.jsx          # Form input
│   │       ├── Card.jsx           # Card container
│   │       ├── Modal.jsx          # Modal dialog
│   │       └── Toast.jsx          # Toast notifications
│   ├── contexts/
│   │   ├── AuthContext.jsx        # Authentication state
│   │   └── CartContext.jsx        # Shopping cart state
│   ├── pages/
│   │   ├── Home.jsx               # Landing page
│   │   ├── Menu.jsx               # Menu listing
│   │   ├── Cart.jsx               # Shopping cart
│   │   ├── Checkout.jsx           # Checkout process
│   │   ├── OrderConfirmation.jsx  # Order confirmation
│   │   ├── OrderTracking.jsx      # Track orders
│   │   ├── OrderHistory.jsx       # Order history
│   │   ├── Login.jsx              # User login
│   │   ├── Register.jsx           # User registration
│   │   └── AdminDashboard.jsx     # Admin panel
│   ├── routes/
│   │   ├── AppRoutes.jsx          # Route definitions
│   │   └── ProtectedRoute.jsx     # Route protection
│   ├── services/
│   │   ├── api.js                 # API service layer
│   │   └── authService.js         # Authentication service
│   ├── utils/
│   │   └── helpers.js             # Utility functions
│   ├── App.jsx                    # Main app component
│   ├── main.jsx                   # App entry point
│   └── index.css                  # Global styles
├── package.json
├── tailwind.config.js
├── postcss.config.js
├── vite.config.js
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd voleena-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🎯 Usage

### For Customers

1. **Browse Menu**: Visit the menu page to see available items
2. **Add to Cart**: Click "Add to Cart" on any item
3. **View Cart**: Click the cart icon to review your order
4. **Checkout**: Proceed to checkout and fill in delivery details
5. **Track Order**: Use the order tracking page to monitor your order status

### For Admins

1. **Login**: Use admin credentials to access the dashboard
2. **Manage Orders**: View all orders and update their status
3. **Monitor**: Track order statistics and customer information

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:4000/api
VITE_APP_NAME=Voleena Foods
```

### Mock Data

The application uses mock data located in `src/assets/mock/menu.json`. You can modify this file to add or update menu items.

## 🎨 Customization

### Styling

The app uses TailwindCSS with custom configuration in `tailwind.config.js`. You can:

- Modify color schemes in the theme configuration
- Add custom components in `src/index.css`
- Update component styles in individual files

### Adding New Features

1. **New Pages**: Add routes in `src/routes/AppRoutes.jsx`
2. **New Components**: Create reusable components in `src/components/`
3. **API Integration**: Update services in `src/services/`

## 🔒 Authentication

The app includes a complete authentication system:

- **Registration**: Users can create new accounts
- **Login**: Secure login with JWT tokens
- **Protected Routes**: Certain pages require authentication
- **Admin Access**: Special admin routes for management

### Demo Credentials

For testing purposes, you can use any email and password combination to login (demo mode).

## 📱 Responsive Design

The application is fully responsive and optimized for:

- **Mobile**: 320px and up
- **Tablet**: 768px and up
- **Desktop**: 1024px and up
- **Large Desktop**: 1280px and up

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Deploy to Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow the prompts

### Deploy to Netlify

1. Build the project: `npm run build`
2. Drag and drop the `dist` folder to Netlify

## 🔄 API Integration

The app is designed to work with a backend API. To connect to a real backend:

1. Update the API base URL in `src/services/api.js`
2. Replace mock API calls with real endpoints
3. Update authentication flow if needed

### API Endpoints

The app expects these endpoints:

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/menu
GET    /api/menu/:id
POST   /api/orders
GET    /api/orders/:id
GET    /api/users/:userId/orders
PATCH  /api/admin/orders/:id/status
```

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use**: Change the port in `vite.config.js`
2. **Build errors**: Check for TypeScript errors and fix them
3. **Styling issues**: Ensure TailwindCSS is properly configured

### Getting Help

If you encounter any issues:

1. Check the browser console for errors
2. Verify all dependencies are installed
3. Ensure Node.js version is compatible

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For support or questions, please contact the development team.

---

**Voleena Foods** - Delivering delicious food with modern technology! 🍕🍔🍜

## 🖼️ Images (menu & logo)

You can add images to the app in three ways:

- Public assets (recommended for app-owned images):
   - Put files in the `public/` folder, e.g. `public/logo.png` or `public/images/pizza.jpg`.
   - Reference them in the menu item `image` field as `/images/pizza.jpg` or use `/logo.png` inside `Header.jsx`.

- Remote URLs:
   - Paste a full URL (https://...) into the Image URL field in Admin → Menu Management. The string is saved in localStorage and rendered.

- Client-side uploads (added):
   - Admins can upload an image file when creating/editing items or combos. The image is automatically converted to a DataURL (Base64), optionally downscaled in the browser, and saved into the mock API (localStorage key `voleena_menu`).
   - This requires no backend and will persist across reloads, but keep images small (see limitations below).

Quick test
1. Start the dev server: `npm run dev`.
2. Put `logo.png` in `public/` and open the app — the header will show `/logo.png`.
3. Open Admin → Manage Menu → Add Item. Either paste an image URL or upload a small image file. Save and confirm the thumbnail appears in the listing.

Notes & limitations
- Images saved as DataURLs increase localStorage usage; browsers typically limit localStorage to about 5-10MB per origin. Avoid uploading large photos. If you need many images or large originals, use a backend or cloud storage and save hosted URLs in the menu item.
- I included a client-side downscale routine to reduce large images; you can tune `maxWidth`, `maxHeight` and `quality` in `src/pages/MenuManagement.jsx`.

