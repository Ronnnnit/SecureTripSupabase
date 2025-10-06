# Fairbnb - Integrated Frontend & Backend

This project now serves both the frontend and backend from a single Node.js server, eliminating the need to run separate servers.

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the server:**
   ```bash
   node server.js
   ```

3. **Access the application:**
   - **Frontend**: http://localhost:3000/
   - **API**: http://localhost:3000/api/*

## 📁 Project Structure

```
├── server.js              # Main server file (serves both frontend & API)
├── FiaibnbDemo/          # Frontend files
│   ├── index.html        # Home page
│   ├── packages.html     # Travel packages
│   ├── cart.html         # Shopping cart
│   ├── history.html      # Booking history
│   ├── signin.html       # User sign in
│   ├── register.html     # User registration
│   └── assets/           # CSS, JS, images
├── node_modules/         # Dependencies
└── package.json          # Project configuration
```

## 🌐 Available Routes

### Frontend Pages
- **Home**: `/` → `index.html`
- **Packages**: `/packages` → `packages.html`
- **Cart**: `/cart` → `cart.html`
- **History**: `/history` → `history.html`
- **Sign In**: `/signin` → `signin.html`
- **Register**: `/register` → `register.html`

### API Endpoints
- **GET** `/api/bookings` - Fetch user bookings
- **POST** `/api/bookings` - Create new booking
- **DELETE** `/api/bookings/:id` - Cancel booking
- **POST** `/api/login` - User login
- **POST** `/api/register` - User registration
- **GET** `/api/data` - Fetch all data
- **POST** `/generate-token` - Generate DevRev token

## 🔧 How It Works

1. **Static File Serving**: The server serves all frontend files (HTML, CSS, JS) from the `FiaibnbDemo` directory
2. **API Routes**: All API endpoints are prefixed with `/api/`
3. **Frontend Routing**: Any non-API route serves the main `index.html` file, enabling client-side routing
4. **Integrated**: No need for CORS issues or separate servers - everything runs on port 3000

## 📱 Features


- **User Authentication**: Login/Registration system
- **Travel Packages**: Browse and book travel packages
- **Shopping Cart**: Add packages to cart
- **Booking History**: View and manage past bookings
- **Responsive Design**: Works on all device sizes
- **MongoDB Integration**: Persistent data storage

## 🛠️ Development

- **Frontend**: HTML, CSS, JavaScript (vanilla)
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: bcrypt for password hashing

## 🚨 Important Notes

- All frontend JavaScript files now use relative URLs (e.g., `/api/bookings` instead of `http://localhost:3000/api/bookings`)
- The server automatically handles MIME types for different file types
- Frontend routing is handled by the catch-all route that serves `index.html`
- API routes are protected from serving HTML files

## 🔍 Troubleshooting

- **Port already in use**: Change the port in `server.js` or kill the process using port 3000
- **Files not loading**: Ensure the `FiaibnbDemo` directory exists and contains all frontend files
- **API errors**: Check the console logs for detailed error information
- **MongoDB connection**: Ensure MongoDB is running and the connection string is correct

## 📝 Logging

The server provides comprehensive logging:
- 📄 Frontend file serving
- 📊 API requests and responses
- ✅ Successful operations
- ❌ Errors and failures
- 🔐 Authentication attempts

Run `node server.js` and watch the console for real-time information about what's happening on your server!
