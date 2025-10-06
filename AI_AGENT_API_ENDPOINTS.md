# AI Agent API Endpoints - SecureTrip

## Base URL: http://localhost:3000

## Authentication

**Register User**
- Endpoint: `POST /api/register`
- Request: `name, email, password`

**Login User**
- Endpoint: `POST /api/login`
- Request: `email, password`

**Get User ID from Email**
- Endpoint: `GET /api/auth/user-id`
- Request: `email`

## Bookings

**Create Booking**
- Endpoint: `POST /api/bookings`
- Request: `userId, packages, total, pickup_location, transport_mode, stay_option, room_type, guests, payment_status, status`

**Get User Bookings**
- Endpoint: `GET /api/bookings`
- Request: `userId` (or `email`)

**Get All Bookings**
- Endpoint: `GET /api/bookings/all`
- Request: (none)

**Cancel Booking**
- Endpoint: `DELETE /api/bookings/:bookingId`
- Request: `userId`

## Payments

**Card Payment**
- Endpoint: `POST /api/payments/card`
- Request: `userId, bookingId, amount, cardDetails, otp`

**UPI Payment - Generate QR**
- Endpoint: `POST /api/payments/upi`
- Request: `userId, bookingId, amount, upiId`

**UPI Payment - Confirm**
- Endpoint: `POST /api/payments/upi/confirm`
- Request: `userId, bookingId, transactionId, upiId`

## Data

**Get User History**
- Endpoint: `GET /api/history`
- Request: `userId`

**Get User Cart**
- Endpoint: `GET /api/cart`
- Request: `userId`

**Get All Packages**
- Endpoint: `GET /api/packages`
- Request: (none)

## Utility

**Health Check**
- Endpoint: `GET /health`
- Request: (none)

**API Health Check**
- Endpoint: `GET /api/health`
- Request: (none)

**Generate DevRev Token**
- Endpoint: `POST /generate-token`
- Request: `email, display_name`

## Notes
- All requests use query parameters
- User ID can be UUID or email
- OTP for testing: "12345"
