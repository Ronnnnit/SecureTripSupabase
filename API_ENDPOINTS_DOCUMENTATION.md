# SecureTrip API Endpoints Documentation

## Base URL: http://localhost:3000

## Authentication

### Register User
**Endpoint:** `POST /api/register`

**Request:**
```
POST /api/register?name=John%20Doe&email=john@example.com&password=password123
```

**Response:**
```json
{
  "message": "User created successfully",
  "userId": "92002d1f-d0bc-44ea-8563-89a4fc3ed98e",
  "user": {
    "id": "92002d1f-d0bc-44ea-8563-89a4fc3ed98e",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### Login User
**Endpoint:** `POST /api/login`

**Request:**
```
POST /api/login?email=john@example.com&password=password123
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "92002d1f-d0bc-44ea-8563-89a4fc3ed98e",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### Get User ID from Email
**Endpoint:** `GET /api/auth/user-id`

**Request:**
```
GET /api/auth/user-id?email=john@example.com
```

**Response:**
```json
{
  "success": true,
  "message": "User ID found successfully",
  "userId": "92002d1f-d0bc-44ea-8563-89a4fc3ed98e",
  "user": {
    "id": "92002d1f-d0bc-44ea-8563-89a4fc3ed98e",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

## Bookings

### Create Booking
**Endpoint:** `POST /api/bookings`

**Request:**
```
POST /api/bookings?userId=92002d1f-d0bc-44ea-8563-89a4fc3ed98e&packages=[{"id":"pkg_1","name":"European Adventure","price":1500,"quantity":1}]&total=1500&pickup_location=Mumbai%20Airport&transport_mode=Flight&stay_option=Hotel&room_type=Deluxe&guests=2&payment_status=Pending&status=Confirmed
```

**Response:**
```json
{
  "message": "Booking created successfully",
  "bookingId": "b1234567-89ab-cdef-0123-456789abcdef",
  "booking": {
    "id": "b1234567-89ab-cdef-0123-456789abcdef",
    "user_id": "92002d1f-d0bc-44ea-8563-89a4fc3ed98e",
    "total": 1500,
    "payment_status": "Pending",
    "status": "Confirmed"
  }
}
```

### Get User Bookings
**Endpoint:** `GET /api/bookings`

**Request:**
```
GET /api/bookings?userId=92002d1f-d0bc-44ea-8563-89a4fc3ed98e
```

**Response:**
```json
[
  {
    "id": "b1234567-89ab-cdef-0123-456789abcdef",
    "user_id": "92002d1f-d0bc-44ea-8563-89a4fc3ed98e",
    "packages": "[{\"id\":\"pkg_1\",\"name\":\"European Adventure\",\"price\":1500,\"quantity\":1}]",
    "total": 1500,
    "pickup_location": "Mumbai Airport",
    "transport_mode": "Flight",
    "stay_option": "Hotel",
    "room_type": "Deluxe",
    "guests": 2,
    "date": "2025-01-15",
    "payment_status": "Pending",
    "status": "Confirmed"
  }
]
```

### Get All Bookings (Admin)
**Endpoint:** `GET /api/bookings/all`

**Request:**
```
GET /api/bookings/all
```

**Response:**
```json
[
  {
    "id": "b1234567-89ab-cdef-0123-456789abcdef",
    "user_id": "92002d1f-d0bc-44ea-8563-89a4fc3ed98e",
    "packages": "[{\"id\":\"pkg_1\",\"name\":\"European Adventure\",\"price\":1500,\"quantity\":1}]",
    "total": 1500,
    "date": "2025-01-15",
    "payment_status": "Pending",
    "status": "Confirmed"
  }
]
```

### Cancel Booking
**Endpoint:** `DELETE /api/bookings/:bookingId`

**Request:**
```
DELETE /api/bookings/b1234567-89ab-cdef-0123-456789abcdef?userId=92002d1f-d0bc-44ea-8563-89a4fc3ed98e
```

Or with userId in headers:
```
DELETE /api/bookings/b1234567-89ab-cdef-0123-456789abcdef
Headers: userId: 92002d1f-d0bc-44ea-8563-89a4fc3ed98e
```

**Parameters:**
- `bookingId` (path): The ID of the booking to cancel
- `userId` (query or header): The user ID of the person requesting the cancellation

**Response:**
```json
{
  "message": "Booking cancelled successfully"
}
```

**Error Responses:**
```json
{
  "error": "Booking not found"
}
```

```json
{
  "error": "Access denied - booking does not belong to you"
}
```

```json
{
  "error": "Valid user ID is required"
}
```

## Payments

### Card Payment
**Endpoint:** `POST /api/payments/card`

**Request:**
```
POST /api/payments/card?userId=92002d1f-d0bc-44ea-8563-89a4fc3ed98e&bookingId=b1234567-89ab-cdef-0123-456789abcdef&amount=1500&otp=12345
```

**Response:**
```json
{
  "success": true,
  "message": "Payment successful",
  "paymentId": "p1234567-89ab-cdef-0123-456789abcdef",
  "transactionId": "TXN123456789",
  "amount": 1500,
  "status": "completed"
}
```

### UPI Payment - Generate QR
**Endpoint:** `POST /api/payments/upi`

**Request:**
```
POST /api/payments/upi?userId=92002d1f-d0bc-44ea-8563-89a4fc3ed98e&bookingId=b1234567-89ab-cdef-0123-456789abcdef&amount=1500&upiId=user@paytm
```

**Response:**
```json
{
  "success": true,
  "qrCode": "upi://pay?pa=merchant@paytm&pn=Merchant&tr=TXN123456789&am=1500",
  "transactionId": "TXN123456789",
  "amount": 1500
}
```

### UPI Payment - Confirm
**Endpoint:** `POST /api/payments/upi/confirm`

**Request:**
```
POST /api/payments/upi/confirm?userId=92002d1f-d0bc-44ea-8563-89a4fc3ed98e&bookingId=b1234567-89ab-cdef-0123-456789abcdef&transactionId=TXN123456789&upiId=user@paytm
```

**Response:**
```json
{
  "success": true,
  "message": "UPI payment confirmed successfully",
  "paymentId": "p1234567-89ab-cdef-0123-456789abcdef",
  "transactionId": "TXN123456789",
  "amount": 1500,
  "status": "completed"
}
```

## Data

### Get User History
**Endpoint:** `GET /api/history`

**Request:**
```
GET /api/history?userId=92002d1f-d0bc-44ea-8563-89a4fc3ed98e
```

**Response:**
```json
[
  {
    "id": "b1234567-89ab-cdef-0123-456789abcdef",
    "user_id": "92002d1f-d0bc-44ea-8563-89a4fc3ed98e",
    "packages": "[{\"id\":\"pkg_1\",\"name\":\"European Adventure\",\"price\":1500,\"quantity\":1}]",
    "total": 1500,
    "payment_status": "Paid",
    "payment_method": "Card",
    "paid_at": "2025-01-15T10:30:00Z",
    "payments": [
      {
        "id": "p1234567-89ab-cdef-0123-456789abcdef",
        "booking_id": "b1234567-89ab-cdef-0123-456789abcdef",
        "amount": 1500,
        "method": "Card",
        "status": "completed",
        "transaction_id": "TXN123456789"
      }
    ]
  }
]
```

### Get User Cart
**Endpoint:** `GET /api/cart`

**Request:**
```
GET /api/cart?userId=92002d1f-d0bc-44ea-8563-89a4fc3ed98e
```

**Response:**
```json
{
  "userId": "92002d1f-d0bc-44ea-8563-89a4fc3ed98e",
  "items": [
    {
      "id": "pkg_1",
      "name": "European Adventure",
      "price": 1500,
      "quantity": 1
    }
  ],
  "total": 1500
}
```

### Get All Packages
**Endpoint:** `GET /api/packages`

**Request:**
```
GET /api/packages
```

**Response:**
```json
[
  {
    "id": "pkg_1",
    "title": "European Adventure",
    "location": "Europe",
    "description": "Amazing European tour...",
    "price": 1500,
    "image": "https://example.com/image.jpg",
    "duration": 7,
    "theme": "general",
    "rating": 4.5,
    "review_count": 25,
    "is_trending": true
  }
]
```

## Utility

### Health Check
**Endpoint:** `GET /health`

**Request:**
```
GET /health
```

**Response:**
```json
{
  "status": "OK",
  "message": "Server is running"
}
```

### API Health Check
**Endpoint:** `GET /api/health`

**Request:**
```
GET /api/health
```

**Response:**
```json
{
  "status": "OK",
  "message": "All systems operational",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "uptime": 3600,
  "version": "1.0.0"
}
```

### Generate DevRev Token
**Endpoint:** `POST /generate-token`

**Request:**
```
POST /generate-token?email=john@example.com&display_name=John%20Doe
```

**Response:**
```json
{
  "session_token": "eyJhbGciOiJSUzI1NiIsImlzcyI6Imh0dHBzOi8vYXV0aC10b2tlbi5kZXZyZXYuYWkvIiwia2lkIjoic3RzX2tpZF9yc2EiLCJ0eXAiOiJKV1QifQ...",
  "expires_in": 3600,
  "token_type": "bearer"
}
```

## Important Notes
- All requests use query parameters
- User ID can be UUID or email
- OTP for testing: "12345"
- Arrays should be JSON-encoded strings
- URL encode special characters in query parameters
