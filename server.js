const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const app = express();
const bcrypt = require('bcrypt');
const port = 3000;

// Supabase configuration
const supabaseUrl = 'https://ywgozakiubuqvlofhwna.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3Z296YWtpdWJ1cXZsb2Zod25hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMjMxNDIsImV4cCI6MjA3NDY5OTE0Mn0.jaFnVY-vCGoIxGOsJCWqE44jvyQvZHxioMrdbTAOBjg';
const supabase = createClient(supabaseUrl, supabaseKey);

// Import package data
const packagesData = require('./FiaibnbDemo/assets/js/data.js');

// --- Supabase Connection Test ---
supabase.from('users').select('count').then(({ data, error }) => {
  if (error) {
    console.error('❌ Supabase connection error:', error);
  } else {
    console.log('✅ Connected to Supabase');
  }
});

// --- Supabase Database Helper Functions ---
function handleSupabaseError(error, res) {
  console.error('Supabase error:', error);
  res.status(500).json({ message: 'Database error' });
}

function isValidUUID(uuid) {
  // More lenient UUID regex that accepts different UUID versions
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Helper function to generate a proper UUID v4
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Helper function to handle user ID resolution (UUID, email, or legacy formats)
function resolveUserId(inputId) {
  if (!inputId) return null;
  
  // If it's already a valid UUID, return it
  if (isValidUUID(inputId)) {
    return inputId;
  }
  
  // If it's an email address, return null (will be handled by the calling function)
  if (typeof inputId === 'string' && inputId.includes('@')) {
    return null;
  }
  
  // For any other format, return null (caller should handle lookup)
  return null;
}

// --- API Logs Storage (In-Memory) ---
const apiLogs = [];
const MAX_LOGS = 1000;

// --- API Logging Middleware ---
const apiLogger = (req, res, next) => {
  const functionalApiRoutes = [
    '/api/bookings', '/api/history', '/api/login', '/api/register', '/api/auth',
    '/api/data', '/api/users', '/api/packages', '/api/cart', '/api/payments',
    '/api/alerts', '/api/group-bookings', '/api/share', '/api/gift', '/generate-token'
  ];

  const isFunctionalApiRequest = functionalApiRoutes.some(route => {
    if (route === '/api/bookings' || route === '/api/users' || route === '/api/packages' || 
        route === '/api/cart' || route === '/api/payments' || route === '/api/alerts' ||
        route === '/api/group-bookings' || route === '/api/share' || route === '/api/gift' ||
        route === '/api/auth') {
      return req.originalUrl.startsWith(route);
    }
    return req.originalUrl === route;
  });

  if (!isFunctionalApiRequest) {
    return next();
  }

  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  const requestLog = {
    id: Date.now() + Math.random(),
    method: req.method,
    url: req.originalUrl,
    timestamp: timestamp,
    source: req.originalUrl === '/generate-token' ? 'DevRev API' : 'Fairbnb server.js',
    statusCode: null,
    responseTime: null,
    userAgent: req.get('User-Agent') || 'Unknown',
    ip: req.ip || req.connection.remoteAddress || 'Unknown'
  };

  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const endTime = Date.now();
    requestLog.statusCode = res.statusCode;
    requestLog.responseTime = endTime - startTime;
    
    apiLogs.push(requestLog);
    
    if (apiLogs.length > MAX_LOGS) {
      apiLogs.splice(0, apiLogs.length - MAX_LOGS);
    }
    
    originalEnd.call(this, chunk, encoding);
  };

  next();
};

// --- Array to Text Conversion Utilities ---
function convertArrayToText(arr) {
  if (Array.isArray(arr)) {
    return arr.map(item => {
      if (typeof item === 'object' && item !== null) {
        return item.name || item.title || JSON.stringify(item);
      }
      return item;
    }).join(', ');
  }
  if (typeof arr === 'string' && arr.includes(',')) {
    return arr;
  }
  return arr;
}

function convertTextToArray(text) {
  if (typeof text === 'string' && text.trim()) {
    return text.split(',').map(item => item.trim()).filter(item => item);
  }
  if (Array.isArray(text)) {
    return text;
  }
  return [];
}

const arrayToTextMiddleware = (req, res, next) => {
  if (req.body) {
    if (req.body.preferences) {
      if (req.body.preferences.destination_types) {
        req.body.preferences.destination_types = convertArrayToText(req.body.preferences.destination_types);
      }
      if (req.body.preferences.interests) {
        req.body.preferences.interests = convertArrayToText(req.body.preferences.interests);
      }
    }
    
    if (req.body.packages) {
      req.body.packages = convertArrayToText(req.body.packages);
    }
    
    if (req.body.items) {
      req.body.items = convertArrayToText(req.body.items);
    }
    
    if (req.body.members) {
      req.body.members = convertArrayToText(req.body.members);
    }
    
    if (req.body.shared_with_emails) {
      req.body.shared_with_emails = convertArrayToText(req.body.shared_with_emails);
    }
  }
  next();
};

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(arrayToTextMiddleware);
app.use(apiLogger);

// Serve static files from the FiaibnbDemo directory
app.use(express.static('FiaibnbDemo'));

// Serve static assets with proper MIME types
app.use('/assets', express.static('FiaibnbDemo/assets'));

// Ensure CSS files are served with correct MIME type
app.get('*.css', (req, res) => {
    res.setHeader('Content-Type', 'text/css');
    res.sendFile(__dirname + '/FiaibnbDemo' + req.path);
});

// Serve JavaScript files with correct MIME type
app.get('*.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(__dirname + '/FiaibnbDemo' + req.path);
});

// Serve HTML pages
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/FiaibnbDemo/index.html');
});

// Handle all static files with proper headers
app.use((req, res, next) => {
    if (req.path.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
    next();
});

// Fallback route for static files
app.get('/assets/*', (req, res) => {
    res.sendFile(__dirname + '/FiaibnbDemo' + req.path);
});

app.get('/packages', (req, res) => {
    res.sendFile(__dirname + '/FiaibnbDemo/packages.html');
});

app.get('/cart', (req, res) => {
    res.sendFile(__dirname + '/FiaibnbDemo/cart.html');
});

app.get('/checkout', (req, res) => {
    res.sendFile(__dirname + '/FiaibnbDemo/checkout.html');
});

app.get('/confirmation', (req, res) => {
    res.sendFile(__dirname + '/FiaibnbDemo/confirmation.html');
});

app.get('/history', (req, res) => {
    res.sendFile(__dirname + '/FiaibnbDemo/history.html');
});

app.get('/signin', (req, res) => {
    res.sendFile(__dirname + '/FiaibnbDemo/signin.html');
});

app.get('/register', (req, res) => {
    res.sendFile(__dirname + '/FiaibnbDemo/register.html');
});

app.get('/api-debug', (req, res) => {
    res.sendFile(__dirname + '/FiaibnbDemo/api-debug.html');
});

app.get('/test-widget', (req, res) => {
    res.sendFile(__dirname + '/FiaibnbDemo/test-widget.html');
});

// --- DevRev API Token Generation ---
const DEVREV_AAT = 'eyJhbGciOiJSUzI1NiIsImlzcyI6Imh0dHBzOi8vYXV0aC10b2tlbi5kZXZyZXYuYWkvIiwia2lkIjoic3RzX2tpZF9yc2EiLCJ0eXAiOiJKV1QifQ.eyJhdWQiOlsiamFudXMiXSwiYXpwIjoiZG9uOmlkZW50aXR5OmR2cnYtaW4tMTpkZXZvLzJPSkJ0bFN3a2s6ZGV2dS8xNiIsImV4cCI6MTg1MzgxNzE4NSwiaHR0cDovL2RldnJldi5haS9jbGllbnRpZCI6ImRvbjppZGVudGl0eTpkdnJ2LWluLTE6ZGV2by8yT0pCdGxTd2trOnN2Y2FjYy8zMzMiLCJodHRwOi8vZGV2cmV2LmFpL2Rldm9fZG9uIjoiZG9uOmlkZW50aXR5OmR2cnYtaW4tMTpkZXZvLzJPSkJ0bFN3a2siLCJodHRwOi8vZGV2cmV2LmFpL2Rldm9pZCI6IkRFVi0yT0pCdGxTd2trIiwiaHR0cDovL2RldnJldi5haS9zdmNhY2MiOiJkb246aWRlbnRpdHk6ZHZydi1pbi0xOmRldm8vMk9KQnRsU3drazpzdmNhY2MvMzMzIiwiaHR0cDovL2RldnJldi5haS90b2tlbnR5cGUiOiJ1cm46ZGV2cmV2OnBhcmFtczpvYXV0aDp0b2tlbi10eXBlOmFhdCIsImlhdCI6MTc1OTIwOTE4NSwiaXNzIjoiaHR0cHM6Ly9hdXRoLXRva2VuLmRldnJldi5haS8iLCJqdGkiOiJkb246aWRlbnRpdHk6ZHZydi1pbi0xOmRldm8vMk9KQnRsU3drazp0b2tlbi8xOUNRTXBBVUQiLCJzY29wZSI6InVybjpkZXZyZXY6cGFyYW1zOm9hdXRoOnRva2VuLXR5cGU6c2Vzc2lvbjpyZXYiLCJzdWIiOiJkb246aWRlbnRpdHk6ZHZydi1pbi0xOmRldm8vMk9KQnRsU3drazpzdmNhY2MvMzMzIn0.lAL6C9M5N2Wio_4aA48zr4x99ATYOF2nJTvysr3y36iqcjbIe5oPbcbgYd39r8ZE92-Z7eJGolnak-XUYawA0W_4n3drdJGBAjmZOBx-DWVBomFju3ys8yMvx_z81D30OYQBVrjmj8-1c7GU53qKxDvTmQrro8P4kigw02IHWntuWQd7wTq2cZr5P1fIb8lk7_wiNTkYdCk4aJODcTGGbAZiev-oh2bJdlu8--_eUMaPdd3QYBor2_husngEOpUcicNTFHVrVEuXWID3dNSm43F9HeDDq1-ovWMEd4ptuIFRND0T7CRjoFfIYK6GqF_YV5S4z5IZzrVTmEW_xsjoig';

app.post('/generate-token', async (req, res) => {
  const { email, display_name } = req.body;

  try {
    const payload = {
      rev_info: {
        user_ref: email,
        account_ref: "sk.com",
        workspace_ref: "devrev-workspace",
        user_traits: {
          email: email,
          display_name: display_name
        },
        workspace_traits: {
          display_name: "Devrev Workspace",
        },
        account_traits: {
          display_name: "Securekloud Infosolutions",
          domains: ["Securekloudinfosolutions.com"]
        }
      }
    };
    
    const response = await axios.post('https://api.devrev.ai/auth-tokens.create', payload, {
      headers: {
        'accept': 'application/json, text/plain, */*',
        'authorization': `Bearer ${DEVREV_AAT}`,
        'content-type': 'application/json'
      }
    });
    console.log("Full Response from DevRev:", response.data);
    res.json({ session_token: response.data.access_token });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: 'Token generation failed' });
  }
});

// --- User Registration ---
app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;
  console.log("Received registration data:", req.body);
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generate a proper UUID for the user
    const userId = generateUUID();
    
    const { data, error } = await supabase
      .from('users')
      .insert([{ id: userId, name, email, password: hashedPassword }])
      .select();
    
    if (error) {
      if (error.code === '23505') {
      res.status(400).json({ message: 'Email already exists' });
    } else {
        console.error("Registration failed:", error);
      res.status(500).json({ message: 'Something went wrong' });
    }
      return;
    }
    
    res.status(201).json({ 
      message: 'User created successfully',
      userId: userId,
      user: {
        id: userId,
        name: name,
        email: email
      }
    });
  } catch (err) {
    console.error("Registration failed:", err);
    res.status(500).json({ message: 'Something went wrong' });
  }
});

// --- User Login ---
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, password')
      .eq('email', email)
      .single();
    
    if (error || !user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    res.status(200).json({
      message: 'Login successful',
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// --- Get Current User ID ---
app.get('/api/auth/me', async (req, res) => {
  try {
    const { userId, email } = req.query;
    
    let user = null;

    if (userId) {
      if (!isValidUUID(userId)) {
        return res.status(400).json({ 
          message: 'Invalid user ID format',
          error: 'INVALID_USER_ID_FORMAT'
        });
      }

      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, created_at, preferences')
        .eq('id', userId)
        .single();
      
      if (error) {
        return res.status(404).json({ 
          message: 'User not found',
          error: 'USER_NOT_FOUND'
        });
      }
      user = data;
    }
    else if (email) {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, created_at, preferences')
        .eq('email', email)
        .single();
      
      if (error) {
        return res.status(404).json({ 
          message: 'User not found',
          error: 'USER_NOT_FOUND'
        });
      }
      user = data;
    }
    else {
      return res.status(400).json({ 
        message: 'Either userId or email is required',
        error: 'MISSING_IDENTIFIER'
      });
    }
    
    if (!user) {
      return res.status(404).json({ 
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User found successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.created_at,
        preferences: user.preferences
      }
    });

  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ 
      message: 'Server error',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
});

// --- Get User ID by Email ---
app.get('/api/auth/user-id', async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ 
        message: 'Email is required',
        error: 'MISSING_EMAIL'
      });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('email', email)
      .single();
    
    if (error || !user) {
      return res.status(404).json({ 
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User ID found successfully',
      userId: user.id,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });

  } catch (err) {
    console.error('Error fetching user ID:', err);
    res.status(500).json({ 
      message: 'Server error',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
});

// --- Bookings API Routes ---
app.get('/api/bookings', async (req, res) => {
  const { userId, email } = req.query;
  
  try {
    let actualUserId = userId;

    // If userId is not provided but email is, find user by email
    if (!userId && email) {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();
      
      if (userError || !user) {
        return res.status(404).json({ 
          error: 'User not found',
          message: 'No user found with the provided email address'
        });
      }
      
      actualUserId = user.id;
    }

    // If no userId or email provided
    if (!actualUserId) {
      return res.status(400).json({ 
        error: 'Missing user identifier',
        message: 'Either userId or email is required'
      });
    }

    const resolvedUserId = resolveUserId(actualUserId);
    
    // If resolution returns null (email was passed), use the actualUserId from database lookup
    const finalUserId = resolvedUserId || actualUserId;

    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', finalUserId);
    
    if (error) {
      console.error('Error fetching bookings:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
    
    const responseBookings = bookings.map(booking => {
      const responseBooking = { ...booking };
      if (responseBooking.packages) {
        responseBooking.packages = convertArrayToText(responseBooking.packages);
      }
      return responseBooking;
    });
    
    res.json(responseBookings);
  } catch (err) {
    console.error('Error fetching bookings:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.get('/api/bookings/all', async (req, res) => {
  try {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*');
    
    if (error) {
      console.error('Error fetching all bookings:', error);
      return res.status(500).json({ message: 'Error fetching all bookings' });
    }
    
    const responseBookings = bookings.map(booking => {
      const responseBooking = { ...booking };
      if (responseBooking.packages) {
        responseBooking.packages = convertArrayToText(responseBooking.packages);
      }
      return responseBooking;
    });
    
    res.json(responseBookings);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching all bookings' });
  }
});

// POST route to save a booking
app.post('/api/bookings', async (req, res) => {
  let bookingData = req.body;
  
  if (!bookingData || Object.keys(bookingData).length === 0) {
    bookingData = {
      userId: req.query.userId,
      packages: req.query.packages,
      total: req.query.total ? Number(req.query.total) : undefined,
      pickup_location: req.query.pickup_location,
      transport_mode: req.query.transport_mode,
      stay_option: req.query.stay_option,
      room_type: req.query.room_type,
      guests: req.query.guests ? Number(req.query.guests) : undefined,
      id: req.query.id,
      title: req.query.title,
      location: req.query.location,
      price: req.query.price ? Number(req.query.price) : undefined,
      image: req.query.image,
      quantity: req.query.quantity ? Number(req.query.quantity) : undefined,
      payment_status: req.query.payment_status,
      paid_at: req.query.paid_at,
      payment_method: req.query.payment_method,
      status: req.query.status
    };
  }

  const { 
    userId, 
    packages, 
    total, 
    pickup_location, 
    transport_mode, 
    stay_option, 
    room_type, 
    guests,
    id: singleId,
    title: singleTitle,
    location: singleLocation,
    price: singlePrice,
    image: singleImage,
    quantity: singleQuantity,
    payment_status: inputPaymentStatus,
    paid_at: inputPaidAt,
    payment_method: inputPaymentMethod,
    status: inputStatus
  } = bookingData;

  let computedPackages = packages;
  if (!computedPackages && (singleId || singleTitle || singlePrice)) {
    if (!singleTitle || !singlePrice) {
      return res.status(400).json({ error: 'Invalid booking data: title and price are required when using single item fields' });
    }
    computedPackages = [{
      id: String(singleId ?? `pkg_${Date.now()}`),
      name: singleTitle,
      title: singleTitle,
      location: singleLocation,
      price: Number(singlePrice),
      quantity: Number(singleQuantity || 1),
      image: singleImage
    }];
  }

  let finalTotal = total;
  if ((finalTotal === undefined || isNaN(finalTotal)) && computedPackages) {
    try {
      let pkgArray = computedPackages;
      if (typeof pkgArray === 'string') {
        try { pkgArray = JSON.parse(pkgArray); } catch { /* will handle below */ }
      }
      if (typeof pkgArray === 'string') {
        const names = convertTextToArray(pkgArray);
        pkgArray = names.map((name, index) => ({ id: `pkg_${Date.now()}_${index}`, name: name.trim(), price: 0, quantity: 1 }));
      }
      finalTotal = pkgArray.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 1)), 0);
    } catch {
      // ignore, will validate below
    }
  }

  if (!userId || !computedPackages || finalTotal === undefined || isNaN(finalTotal)) {
    return res.status(400).json({ error: 'Invalid booking data' });
  }

  try {
    let processedPackages = computedPackages;
    if (typeof processedPackages === 'string') {
      try {
        processedPackages = JSON.parse(processedPackages);
      } catch {
        const packageNames = convertTextToArray(processedPackages);
        processedPackages = packageNames.map((name, index) => ({
          id: `pkg_${Date.now()}_${index}`,
          name: name.trim(),
          price: 0,
          quantity: 1
        }));
      }
    }

    // Resolve user ID (handle UUID, email, or legacy formats)
    let resolvedUserId = resolveUserId(userId);
    
    // If userId is an email, look up the user
    if (!resolvedUserId && userId && userId.includes('@')) {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', userId)
        .single();
      
      if (userError || !user) {
        return res.status(404).json({ 
          error: 'User not found',
          message: 'No user found with the provided email address'
        });
      }
      
      resolvedUserId = user.id;
    }
    
    if (!resolvedUserId) {
      return res.status(400).json({ 
        error: 'Invalid user identifier',
        message: 'Please provide a valid user ID or email'
      });
    }

    console.log('Original userId:', userId);
    console.log('Resolved userId:', resolvedUserId);
    console.log('Processed packages:', JSON.stringify(processedPackages, null, 2));

    const { data, error } = await supabase
      .from('bookings')
      .insert([{
        user_id: resolvedUserId,
        packages: processedPackages,
        total: finalTotal,
        pickup_location,
        transport_mode,
        stay_option,
        room_type,
        guests,
        payment_status: inputPaymentStatus || 'Pending',
        paid_at: inputPaidAt ? new Date(inputPaidAt) : null,
        payment_method: inputPaymentMethod,
        status: inputStatus || 'Active'
      }])
      .select();
    
    if (error) {
      console.error('Detailed error saving booking:', JSON.stringify(error, null, 2));
      return res.status(500).json({ error: 'Failed to save booking', details: error.message });
    }

    const savedBooking = data[0];
    const responseBooking = { ...savedBooking };
    responseBooking.packages = convertArrayToText(responseBooking.packages);
    
    res.status(201).json({ message: 'Booking saved', bookingId: savedBooking.id, booking: responseBooking });
  } catch (err) {
    console.error('Error saving booking:', err);
    res.status(500).json({ error: 'Failed to save booking' });
  }
});

// --- Delete Booking ---
app.delete('/api/bookings/:bookingId', async (req, res) => {
  const { bookingId } = req.params;
  const { userId } = req.query;
  
  // Also check for userId in headers if not provided in query
  const userIdFromHeaders = req.headers.userid || req.headers.userId;
  const finalUserId = userId || userIdFromHeaders;

  if (!bookingId) {
    return res.status(400).json({ error: 'Booking ID is required' });
  }

  try {
    // Resolve user ID (handle UUID, email, or legacy formats)
    let resolvedUserId = resolveUserId(finalUserId);
    if (!resolvedUserId && finalUserId && finalUserId.includes('@')) {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', finalUserId)
        .single();
      if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }
      resolvedUserId = user.id;
    }

    if (!resolvedUserId) {
      return res.status(400).json({ error: 'Valid user ID is required' });
    }

    // First, check if booking exists at all
    const { data: bookingExists, error: bookingExistsError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingExistsError || !bookingExists) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if booking belongs to the user
    if (bookingExists.user_id !== resolvedUserId) {
      return res.status(403).json({ error: 'Access denied - booking does not belong to you' });
    }

    const booking = bookingExists;

    // Delete the booking
    const { error: deleteError } = await supabase
      .from('bookings')
      .delete()
      .eq('id', bookingId)
      .eq('user_id', resolvedUserId);

    if (deleteError) {
      console.error('Error deleting booking:', deleteError);
      return res.status(500).json({ error: 'Failed to delete booking' });
    }

    res.json({ message: 'Booking cancelled successfully' });
  } catch (err) {
    console.error('Error cancelling booking:', err);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

// --- Packages API Routes ---
app.post('/api/packages/populate', async (req, res) => {
  try {
    const packagesToInsert = packagesData.map(pkg => ({
      id: pkg.id,
      title: pkg.title,
      location: pkg.location,
      description: pkg.description,
      price: pkg.price,
      image: pkg.image,
      duration: 7,
      theme: 'general',
      rating: 4.5,
      review_count: Math.floor(Math.random() * 100),
      is_trending: Math.random() > 0.7
    }));
    
    const { data, error } = await supabase
      .from('packages')
      .insert(packagesToInsert);
    
    if (error) {
      console.error('Error populating packages:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    
    res.status(201).json({ 
      message: `Successfully populated ${packagesToInsert.length} packages`,
      count: packagesToInsert.length,
      packages: data
    });
  } catch (error) {
    console.error('Error populating packages:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/packages', async (req, res) => {
  try {
    const { data: packages, error } = await supabase
      .from('packages')
      .select('*')
      .order('id', { ascending: true });
    
    if (error) {
    console.error('Error fetching packages:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    
    res.json({
      success: true,
      count: packages.length,
      packages: packages
    });
  } catch (error) {
    console.error('Error fetching packages:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- Payment API Routes ---
// POST /api/payments/card - Card payment with OTP validation
app.post('/api/payments/card', async (req, res) => {
  let paymentData = req.body;
  
  // If no body data, try to get from query parameters
  if (!paymentData || Object.keys(paymentData).length === 0) {
    paymentData = {
      userId: req.query.userId,
      bookingId: req.query.bookingId,
      amount: req.query.amount ? Number(req.query.amount) : undefined,
      cardDetails: req.query.cardDetails,
      otp: req.query.otp
    };
  }

  const { userId, bookingId, amount, cardDetails, otp } = paymentData;

  try {
    // Validate required fields
    if (!userId || !bookingId || !amount || !otp) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, bookingId, amount, and otp are required' 
      });
    }

    // Validate OTP (always 12345)
    if (otp !== '12345') {
      return res.status(400).json({ 
        error: 'Invalid OTP. Please enter the correct OTP.',
        success: false
      });
    }

    // Check if booking exists
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();
    
    if (bookingError || !booking) {
      return res.status(404).json({ 
        error: 'Booking not found',
        success: false
      });
    }

    // Resolve user ID for payment
    let resolvedUserId = resolveUserId(userId);
    if (!resolvedUserId && userId && userId.includes('@')) {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', userId)
        .single();
      
      if (userError || !user) {
        return res.status(404).json({ 
          error: 'User not found',
          message: 'No user found with the provided email address'
        });
      }
      
      resolvedUserId = user.id;
    }

    // Check if booking belongs to the user
    if (booking.user_id !== resolvedUserId) {
      return res.status(403).json({ 
        error: 'Unauthorized: This booking does not belong to you',
        success: false
      });
    }

    // Check if booking is already paid
    if (booking.payment_status === 'Paid') {
      return res.status(400).json({ 
        error: 'This booking has already been paid',
        success: false
      });
    }

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert([{
      booking_id: bookingId,
        user_id: resolvedUserId,
      amount: amount,
      payment_method: 'Card',
      status: 'Completed',
      transaction_id: 'CARD_TXN_' + Date.now(),
      completed_at: new Date()
      }])
      .select()
      .single();

    if (paymentError) {
      console.error('Payment creation error:', paymentError);
      return res.status(500).json({ 
        error: 'Payment processing failed. Please try again.',
        success: false
      });
    }

    // Update booking payment status
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ 
      payment_status: 'Paid', 
      paid_at: new Date(),
      payment_method: 'Card'
      })
      .eq('id', bookingId);

    if (updateError) {
      console.error('Booking update error:', updateError);
    }

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Payment successful! Your booking has been confirmed.',
      payment: {
        paymentId: payment.id,
        transactionId: payment.transaction_id,
        amount: payment.amount,
        status: payment.status,
        paymentMethod: 'Card',
        completedAt: payment.completed_at
      },
      booking: {
        bookingId: bookingId,
        status: 'Confirmed',
        paymentStatus: 'Paid'
      }
    });

  } catch (error) {
    console.error('Card payment error:', error);
    res.status(500).json({ 
      error: 'Payment processing failed. Please try again.',
      success: false
    });
  }
});

// POST /api/payments/upi - Generate UPI QR code for payment
app.post('/api/payments/upi', async (req, res) => {
  let paymentData = req.body;
  
  // If no body data, try to get from query parameters
  if (!paymentData || Object.keys(paymentData).length === 0) {
    paymentData = {
      userId: req.query.userId,
      bookingId: req.query.bookingId
    };
  }

  const { userId, bookingId } = paymentData;

  try {
    // Validate required fields
    if (!userId || !bookingId) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId and bookingId are required' 
      });
    }

    // Check if booking exists
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();
    
    if (bookingError || !booking) {
      return res.status(404).json({ 
        error: 'Booking not found',
        success: false
      });
    }

    // Resolve user ID
    let resolvedUserId = resolveUserId(userId);
    if (!resolvedUserId && userId && userId.includes('@')) {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', userId)
        .single();
      
      if (userError || !user) {
        return res.status(404).json({ 
          error: 'User not found',
          message: 'No user found with the provided email address'
        });
      }
      
      resolvedUserId = user.id;
    }

    // Check if booking belongs to the user
    if (booking.user_id !== resolvedUserId) {
      return res.status(403).json({ 
        error: 'Unauthorized: This booking does not belong to you',
        success: false
      });
    }

    // Check if booking is already paid
    if (booking.payment_status === 'Paid') {
      return res.status(400).json({ 
        error: 'This booking has already been paid',
        success: false
      });
    }

    // Create pending payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert([{
      booking_id: bookingId,
        user_id: resolvedUserId,
      amount: booking.total,
      payment_method: 'UPI',
      status: 'Pending',
      transaction_id: 'UPI_TXN_' + Date.now()
      }])
      .select()
      .single();

    if (paymentError) {
      console.error('Payment creation error:', paymentError);
      return res.status(500).json({ 
        error: 'Failed to generate UPI QR code. Please try again.',
        success: false
      });
    }

    // Generate UPI QR code data
    const upiId = 'fairbnb@paytm'; // Your UPI ID
    const merchantName = 'Fairbnb Travel';
    const transactionNote = `Payment for booking ${bookingId}`;
    const amount = booking.total;
    
    // Create UPI payment URL
    const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(transactionNote)}&tr=${payment.transaction_id}`;
    
    // Generate QR code using a simple API
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUrl)}`;

    // Return QR code response
    res.status(200).json({
      success: true,
      message: 'UPI QR Code generated. Please scan to complete payment.',
      payment: {
        paymentId: payment.id,
        transactionId: payment.transaction_id,
        amount: payment.amount,
        status: 'Pending',
        paymentMethod: 'UPI'
      },
      qrCode: {
        url: qrCodeUrl,
        upiUrl: upiUrl,
        upiId: upiId,
        merchantName: merchantName,
        amount: amount,
        currency: 'INR',
        note: transactionNote
      },
      booking: {
        bookingId: bookingId,
        status: 'Payment Pending',
        paymentStatus: 'Pending'
      },
      instructions: [
        '1. Open your UPI app (Paytm, PhonePe, Google Pay, etc.)',
        '2. Scan the QR code displayed above',
        '3. Verify the payment details',
        '4. Complete the payment',
        '5. Payment will be automatically confirmed'
      ]
    });

  } catch (error) {
    console.error('UPI QR generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate UPI QR code. Please try again.',
      success: false
    });
  }
});

// POST /api/payments/upi/confirm - Confirm UPI payment after scanning QR
app.post('/api/payments/upi/confirm', async (req, res) => {
  let paymentData = req.body;
  
  // If no body data, try to get from query parameters
  if (!paymentData || Object.keys(paymentData).length === 0) {
    paymentData = {
      userId: req.query.userId,
      bookingId: req.query.bookingId,
      paymentId: req.query.paymentId
    };
  }

  const { userId, bookingId, paymentId } = paymentData;

  try {
    // Validate required fields
    if (!userId || !bookingId || !paymentId) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, bookingId, and paymentId are required' 
      });
    }

    // Find the payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();
    
    if (paymentError || !payment) {
      return res.status(404).json({ 
        error: 'Payment not found',
        success: false
      });
    }

    // Resolve user ID
    let resolvedUserId = resolveUserId(userId);
    if (!resolvedUserId && userId && userId.includes('@')) {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', userId)
        .single();
      
      if (userError || !user) {
        return res.status(404).json({ 
          error: 'User not found',
          message: 'No user found with the provided email address'
        });
      }
      
      resolvedUserId = user.id;
    }

    // Check if payment belongs to the user and booking
    if (payment.user_id !== resolvedUserId || payment.booking_id !== bookingId) {
      return res.status(403).json({ 
        error: 'Unauthorized: This payment does not belong to you',
        success: false
      });
    }

    // Check if payment is already completed
    if (payment.status === 'Completed') {
      return res.status(400).json({ 
        error: 'This payment has already been completed',
        success: false
      });
    }

    // Update payment status to completed
    const { error: updatePaymentError } = await supabase
      .from('payments')
      .update({ 
      status: 'Completed', 
      completed_at: new Date()
      })
      .eq('id', paymentId);

    if (updatePaymentError) {
      console.error('Payment update error:', updatePaymentError);
      return res.status(500).json({ 
        error: 'Failed to confirm payment',
        success: false
      });
    }

    // Update booking payment status
    const { error: updateBookingError } = await supabase
      .from('bookings')
      .update({ 
      payment_status: 'Paid', 
      paid_at: new Date(),
      payment_method: 'UPI'
      })
      .eq('id', bookingId);

    if (updateBookingError) {
      console.error('Booking update error:', updateBookingError);
    }

    // Return success response
    res.status(200).json({
      success: true,
      message: 'UPI Payment confirmed! Your booking has been confirmed.',
      payment: {
        paymentId: paymentId,
        transactionId: payment.transaction_id,
        amount: payment.amount,
        status: 'Completed',
        paymentMethod: 'UPI',
        completedAt: new Date()
      },
      booking: {
        bookingId: bookingId,
        status: 'Confirmed',
        paymentStatus: 'Paid'
      }
    });

  } catch (error) {
    console.error('UPI payment confirmation error:', error);
    res.status(500).json({ 
      error: 'Failed to confirm UPI payment. Please try again.',
      success: false
    });
  }
});

// --- History API Routes ---
app.get('/api/history', async (req, res) => {
  const { userId, email } = req.query;

  try {
    let actualUserId = userId;

    // If userId is not provided but email is, find user by email
    if (!userId && email) {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();
      
      if (userError || !user) {
        return res.status(404).json({ 
          error: 'User not found',
          message: 'No user found with the provided email address'
        });
      }
      
      actualUserId = user.id;
    }

    // If no userId or email provided
    if (!actualUserId) {
      return res.status(400).json({ 
        error: 'Missing user identifier',
        message: 'Either userId or email is required'
      });
    }

    // Resolve user ID (handle UUID, email, or legacy formats)
    let resolvedUserId = resolveUserId(actualUserId);
    if (!resolvedUserId && actualUserId && actualUserId.includes('@')) {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', actualUserId)
        .single();
      if (userError || !user) {
        return res.status(404).json({ error: 'User not found' });
      }
      resolvedUserId = user.id;
    }

    // Fetch user's bookings with payment information
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        *,
        payments (
          id,
          amount,
          payment_method,
          status,
          transaction_id,
          completed_at
        )
      `)
      .eq('user_id', resolvedUserId)
      .order('date', { ascending: false });

    if (bookingsError) {
      console.error('Error fetching booking history:', bookingsError);
      return res.status(500).json({ 
        error: 'Internal Server Error',
        message: 'Failed to fetch booking history'
      });
    }

    // Transform the data for frontend compatibility
    const history = bookings.map(booking => {
      const bookingData = { ...booking };
      
      // Convert packages array back to text format if needed
      if (bookingData.packages && Array.isArray(bookingData.packages)) {
        bookingData.packages = convertArrayToText(bookingData.packages);
      }

      // Add payment information
      if (bookingData.payments && bookingData.payments.length > 0) {
        const payment = bookingData.payments[0];
        bookingData.payment = {
          paymentId: payment.id,
          amount: payment.amount,
          method: payment.payment_method,
          status: payment.status,
          transactionId: payment.transaction_id,
          completedAt: payment.completed_at
        };
      } else {
        bookingData.payment = null;
      }

      // Remove the nested payments array
      delete bookingData.payments;

      return bookingData;
    });

    res.status(200).json({
      success: true,
      message: 'Booking history retrieved successfully',
      history: history,
      totalBookings: history.length,
      userId: resolvedUserId
    });

  } catch (error) {
    console.error('History API error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to retrieve booking history'
    });
  }
});

// --- Cart API Routes ---
app.get('/api/cart', async (req, res) => {
  const { userId } = req.query;

  try {
    // Resolve user ID (handle UUID, email, or legacy formats)
    let resolvedUserId = resolveUserId(userId);
    
    // If userId is an email, look up the user
    if (!resolvedUserId && userId && userId.includes('@')) {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', userId)
        .single();
      
      if (userError || !user) {
        return res.status(404).json({ 
          error: 'User not found',
          message: 'No user found with the provided email address'
        });
      }
      
      resolvedUserId = user.id;
    }
    
    if (!resolvedUserId) {
      return res.status(400).json({ 
        error: 'Invalid user identifier',
        message: 'Please provide a valid user ID or email'
      });
    }

    let { data: cart, error } = await supabase
      .from('cart')
      .select('*')
      .eq('user_id', resolvedUserId)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error fetching cart:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    
    if (!cart) {
      const { data: newCart, error: insertError } = await supabase
        .from('cart')
        .insert([{ user_id: resolvedUserId, items: [], total: 0 }])
        .select()
        .single();
      
      if (insertError) {
        console.error('Error creating cart:', insertError);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
      cart = newCart;
    }
    
    const responseCart = { ...cart };
    if (responseCart.items) {
      responseCart.items = convertArrayToText(responseCart.items);
    }
    
    res.json(responseCart);
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- Data endpoint for compatibility ---
app.get('/api/data', async (req, res) => {
  try {
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');
    
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('*');
    
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*');

    if (usersError || transactionsError || bookingsError) {
      console.error('Error fetching combined data:', { usersError, transactionsError, bookingsError });
      return res.status(500).json({ message: 'Internal Server Error' });
    }

  res.json({
      users,
      transactions,
      bookings
  });
  } catch (err) {
    console.error('Error fetching combined data:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// --- API Logs Endpoint ---
app.get('/api/logs', (req, res) => {
  try {
    const sortedLogs = [...apiLogs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    res.json({
      success: true,
      totalLogs: sortedLogs.length,
      logs: sortedLogs
    });
  } catch (error) {
    console.error('Error fetching API logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch API logs'
    });
  }
});

// --- Clear API Logs Endpoint ---
app.delete('/api/logs', (req, res) => {
  try {
    apiLogs.length = 0;
    res.json({
      success: true,
      message: 'API logs cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing API logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear API logs'
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// API Health check endpoint for monitoring
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'All systems operational',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
