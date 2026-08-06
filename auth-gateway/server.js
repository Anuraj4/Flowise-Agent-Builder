const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware, responseInterceptor } = require('http-proxy-middleware');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const FLOWISE_TARGET = process.env.FLOWISE_TARGET_URL || 'http://flowise:3000';
const FLOWISE_ADMIN_USER = process.env.FLOWISE_USERNAME || 'admin@flowise.local';
const FLOWISE_ADMIN_PASS = process.env.FLOWISE_PASSWORD || 'FlowiseAdmin123!';

// Setup SQLite Database
const dbDir = path.join(__dirname, 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const dbPath = path.join(dbDir, 'users.db');
const db = new sqlite3.Database(dbPath);

// Initialize DB schema
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

// Rate Limiters for Auth Endpoints (Brute-Force Protection)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // limit each IP to 15 login requests per windowMs
  message: { success: false, message: 'Too many login attempts. Please try again in 15 minutes.' }
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 registration requests per hour
  message: { success: false, message: 'Too many accounts created from this IP. Please try again later.' }
});

// Middleware for static files, body parsing, and sessions
app.use(express.static(path.join(__dirname, 'public'), { index: false }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(session({
  secret: process.env.SESSION_SECRET || 'flowise_auth_gateway_secret_9988',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000, httpOnly: true } // Default 24 hours
}));

// Health Diagnostic Endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Page Routes
app.get('/register', (req, res) => {
  if (req.session && req.session.user) {
    return res.redirect('/');
  }
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/login', (req, res) => {
  if (req.session && req.session.user) {
    return res.redirect('/');
  }
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/register');
  });
});

// Auth API Endpoints with Rate Limiting
app.post('/api/auth/register', registerLimiter, async (req, res) => {
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  db.get('SELECT id FROM users WHERE email = ?', [normalizedEmail], async (err, row) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Database error.' });
    }
    if (row) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    try {
      const passwordHash = await bcrypt.hash(password, 10);
      db.run(
        'INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)',
        [fullName, normalizedEmail, passwordHash],
        function (insertErr) {
          if (insertErr) {
            return res.status(500).json({ success: false, message: 'Failed to create user.' });
          }
          
          req.session.user = {
            id: this.lastID,
            fullName,
            email: normalizedEmail
          };

          res.json({ success: true, message: 'Account registered successfully.' });
        }
      );
    } catch (hashErr) {
      res.status(500).json({ success: false, message: 'Error processing password.' });
    }
  });
});

app.post('/api/auth/login', loginLimiter, (req, res) => {
  const { email, password, rememberMe } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  db.get('SELECT * FROM users WHERE email = ?', [normalizedEmail], async (err, user) => {
    if (err || !user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Handle "Remember Me" extended session (30 days)
    if (rememberMe) {
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
    }

    req.session.user = {
      id: user.id,
      fullName: user.full_name,
      email: user.email
    };

    res.json({ success: true, message: 'Logged in successfully.' });
  });
});

app.get('/api/auth/me', (req, res) => {
  if (req.session && req.session.user) {
    res.json({ authenticated: true, user: req.session.user });
  } else {
    res.status(401).json({ authenticated: false });
  }
});

// Basic Auth header generator for internal Flowise container proxying
const basicAuthHeader = 'Basic ' + Buffer.from(`${FLOWISE_ADMIN_USER}:${FLOWISE_ADMIN_PASS}`).toString('base64');

// Reverse Proxy Middleware to Flowise Canvas with Injected Auth Header Bar
const flowiseProxy = createProxyMiddleware({
  target: FLOWISE_TARGET,
  changeOrigin: true,
  ws: true,
  selfHandleResponse: true,
  on: {
    proxyReq: (proxyReq, req, res) => {
      proxyReq.setHeader('Authorization', basicAuthHeader);
    },
    proxyRes: responseInterceptor(async (responseBuffer, proxyRes, req, res) => {
      const contentType = proxyRes.headers['content-type'] || '';
      if (contentType.includes('text/html') && req.session && req.session.user) {
        const originalHtml = responseBuffer.toString('utf8');
        const userJson = JSON.stringify(req.session.user);
        const injectedScript = `
        <script>
          (function() {
            if (document.getElementById('flowise-auth-bar')) return;
            const user = ${userJson};
            const nav = document.createElement('div');
            nav.id = 'flowise-auth-bar';
            nav.style.cssText = 'position:fixed;top:12px;right:20px;z-index:999999;display:flex;align-items:center;gap:10px;background:rgba(15,23,42,0.85);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.15);padding:6px 14px;border-radius:30px;color:#f8fafc;font-family:sans-serif;font-size:13px;box-shadow:0 4px 15px rgba(0,0,0,0.3);';
            nav.innerHTML = '<span style="display:flex;align-items:center;gap:6px;font-weight:500;">👤 ' + (user.fullName || user.email) + '</span><a href="/logout" style="background:#ef4444;color:#fff;text-decoration:none;padding:4px 10px;border-radius:15px;font-weight:600;font-size:11px;transition:background 0.2s;" onmouseover="this.style.background=\\'#dc2626\\'" onmouseout="this.style.background=\\'#ef4444\\'">Logout</a>';
            document.body.appendChild(nav);
          })();
        </script>
        `;
        return originalHtml.replace('</body>', injectedScript + '</body>');
      }
      return responseBuffer;
    })
  }
});

// Authentication Guard & Flowise Proxy Route Handler
app.use((req, res, next) => {
  // Allow public static assets, health route, and auth API calls
  if (req.path.startsWith('/style.css') || req.path.startsWith('/api/auth') || req.path === '/health' || req.path === '/register' || req.path === '/login') {
    return next();
  }

  // Check user session
  if (req.session && req.session.user) {
    return flowiseProxy(req, res, next);
  }

  // Unauthenticated user
  if (req.accepts('html')) {
    return res.redirect('/register');
  } else {
    return res.status(401).json({ error: 'Unauthorized. Please register or login.' });
  }
});

app.listen(PORT, () => {
  console.log(`Auth Gateway v1.1.0 running on http://localhost:${PORT}`);
  console.log(`Proxying authenticated traffic to Flowise engine at ${FLOWISE_TARGET}`);
});
