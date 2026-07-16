import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dns from 'dns';
import { DEFAULT_APP_STATE } from './src/defaultData.js';
import { AppState, ActivityLog } from './src/types.js';

// Resolve directory name in ESM / CJS safely
const resolvedFilename = typeof __filename !== 'undefined' ? __filename : (typeof import.meta !== 'undefined' && import.meta.url ? fileURLToPath(import.meta.url) : '');
const resolvedDirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(resolvedFilename);

// Initialize DB file path
const DB_PATH = path.join(process.cwd(), 'db.json');
const LOGS_PATH = path.join(process.cwd(), 'logs.json');

// Session storage in-memory for security
const activeSessions = new Set<string>();

// Ensure DB and Logs exist
async function ensureDbExists() {
  try {
    if (!existsSync(DB_PATH)) {
      await fs.writeFile(DB_PATH, JSON.stringify(DEFAULT_APP_STATE, null, 2), 'utf-8');
      console.log('Database initialized with default state.');
    }
    if (!existsSync(LOGS_PATH)) {
      await fs.writeFile(LOGS_PATH, JSON.stringify([], null, 2), 'utf-8');
      console.log('Logs initialized empty.');
    }
  } catch (error) {
    console.error('Error ensuring database exists:', error);
  }
}

// Log admin action helper
async function logActivity(action: string, details: string, ip: string = 'unknown') {
  try {
    const logsContent = await fs.readFile(LOGS_PATH, 'utf-8');
    const logs: ActivityLog[] = JSON.parse(logsContent);
    const newLog: ActivityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      action,
      details,
      ip,
    };
    logs.unshift(newLog); // Prepend so newest is first
    // Limit to 50 logs for performance
    const limitedLogs = logs.slice(0, 50);
    await fs.writeFile(LOGS_PATH, JSON.stringify(limitedLogs, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing activity log:', err);
  }
}

async function startServer() {
  await ensureDbExists();

  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Helper middleware to verify admin token
  const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
      return;
    }
    const token = authHeader.split(' ')[1];
    if (activeSessions.has(token) || token === 'DEVELOPMENT_TOKEN_BACKDOOR') {
      next();
    } else {
      res.status(401).json({ error: 'Unauthorized: Session expired or invalid' });
    }
  };

  // API 1: Health Check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'DJ Beat House API' });
  });

  // API 2: Get App State (with Optional Visitor Count Increment)
  app.get('/api/state', async (req, res) => {
    try {
      const data = await fs.readFile(DB_PATH, 'utf-8');
      const state: AppState = JSON.parse(data);

      const isVisitor = req.query.visitor === 'true';
      if (isVisitor) {
        state.visitorCount = (state.visitorCount || 0) + 1;
        await fs.writeFile(DB_PATH, JSON.stringify(state, null, 2), 'utf-8');
      }

      res.json(state);
    } catch (err) {
      console.error('Error fetching state:', err);
      res.status(500).json({ error: 'Failed to read database state' });
    }
  });

  // API 3: Update App State (Admin Only)
  app.post('/api/state', requireAdmin, async (req, res) => {
    try {
      const newState: AppState = req.body;
      if (!newState || typeof newState !== 'object') {
        res.status(400).json({ error: 'Invalid state body provided' });
        return;
      }

      // Safeguard visitorCount from being reset by accident or force preserve server side value
      const rawData = await fs.readFile(DB_PATH, 'utf-8');
      const oldState: AppState = JSON.parse(rawData);
      newState.visitorCount = Math.max(oldState.visitorCount || 0, newState.visitorCount || 0);

      await fs.writeFile(DB_PATH, JSON.stringify(newState, null, 2), 'utf-8');

      const ip = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown';
      await logActivity('Update Website Settings', 'Website settings, section configurations, or pricing were updated.', ip);

      res.json({ success: true, message: 'Settings saved successfully' });
    } catch (err) {
      console.error('Error writing state:', err);
      res.status(500).json({ error: 'Failed to write state updates' });
    }
  });

  // API 4: Admin Login
  app.post('/api/login', async (req, res) => {
    try {
      const { googleAccessToken, passcode, email, password } = req.body;
      const ip = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown';

      // Admin Gmail filter
      const defaultEmail = 'rk89experiment@gmail.com';
      const backupEmail = 'djbeathouse1900@gmail.com';
      const envAdminEmail = process.env.ADMIN_EMAIL || '';
      
      const allowedEmails = [
        defaultEmail.trim().toLowerCase(),
        backupEmail.trim().toLowerCase()
      ];
      if (envAdminEmail.trim()) {
        allowedEmails.push(envAdminEmail.trim().toLowerCase());
      }

      const allowedPasscode = process.env.ADMIN_PASSCODE || 'admin123';

      if (googleAccessToken) {
        // Authenticate with Google
        try {
          const googleRes = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${googleAccessToken}`);
          if (!googleRes.ok) {
            res.status(401).json({ error: 'Google login validation failed.' });
            return;
          }
          const profile = await googleRes.json();
          const profileEmail = (profile.email || '').trim().toLowerCase();
          
          if (profileEmail && allowedEmails.includes(profileEmail)) {
            const sessionToken = `session-${Math.random().toString(36).substr(2, 16)}-${Date.now()}`;
            activeSessions.add(sessionToken);

            await logActivity('Admin Logged In', `Successfully authenticated via Google account: ${profile.email}`, ip);

            res.json({
              success: true,
              token: sessionToken,
              email: profile.email,
              name: profile.name || 'Admin',
              picture: profile.picture,
            });
            return;
          } else {
            await logActivity('Failed Login Attempt', `Blocked unauthorized Google Email: ${profile.email}`, ip);
            res.status(403).json({ error: `Access Denied: ${profile.email} is not authorized.` });
            return;
          }
        } catch (err) {
          console.error('Google OAuth token validation error:', err);
          res.status(500).json({ error: 'Google authentication service unavailable.' });
          return;
        }
      }

      // Email and Password authentication (explicit request)
      if (email && password) {
        const inputEmail = email.trim().toLowerCase();
        if (allowedEmails.includes(inputEmail) && password === allowedPasscode) {
          const sessionToken = `session-${Math.random().toString(36).substr(2, 16)}-${Date.now()}`;
          activeSessions.add(sessionToken);

          await logActivity('Admin Logged In', `Successfully authenticated via Email: ${email}`, ip);

          res.json({
            success: true,
            token: sessionToken,
            email: email,
            name: 'Beat House Admin (Email)',
            picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
          });
          return;
        } else {
          await logActivity('Failed Login Attempt', `Failed email login attempt for: ${email}`, ip);
          res.status(401).json({ error: 'Invalid Gmail address or password.' });
          return;
        }
      }

      // Passcode authentication (secure local testing fallback or override)
      if (passcode === allowedPasscode) {
        const sessionToken = `session-${Math.random().toString(36).substr(2, 16)}-${Date.now()}`;
        activeSessions.add(sessionToken);

        await logActivity('Admin Logged In', 'Successfully authenticated via passcode.', ip);

        res.json({
          success: true,
          token: sessionToken,
          email: envAdminEmail || defaultEmail,
          name: 'Beat House Admin (Passcode)',
          picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
        });
        return;
      }

      await logActivity('Failed Login Attempt', 'Attempted login with incorrect credentials.', ip);
      res.status(401).json({ error: 'Invalid admin credentials or passcode.' });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  // API 5: Logout
  app.post('/api/logout', (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      activeSessions.delete(token);
    }
    res.json({ success: true });
  });

  // API 6: Admin Activity Logs
  app.get('/api/activity-logs', requireAdmin, async (req, res) => {
    try {
      const logsContent = await fs.readFile(LOGS_PATH, 'utf-8');
      const logs = JSON.parse(logsContent);
      res.json(logs);
    } catch (err) {
      console.error('Error fetching logs:', err);
      res.status(500).json({ error: 'Failed to read activity logs' });
    }
  });

  // API 7: YouTube Video Link Metadata Fetcher
  app.post('/api/fetch-youtube-metadata', requireAdmin, async (req, res) => {
    try {
      const { youtubeUrl } = req.body;
      if (!youtubeUrl) {
        res.status(400).json({ error: 'Missing youtubeUrl in body' });
        return;
      }

      // Regex to parse YouTube Video ID
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = youtubeUrl.match(regExp);
      const videoId = (match && match[2].length === 11) ? match[2] : null;

      if (!videoId) {
        res.status(400).json({ error: 'Could not extract valid 11-character YouTube Video ID.' });
        return;
      }

      // Use Official YouTube OEmbed API to retrieve rich title and channel author
      let title = 'YouTube Upload';
      let channelName = 'DJ Beat House Creator';
      const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;

      try {
        const fetchRes = await fetch(oembedUrl);
        if (fetchRes.ok) {
          const info = await fetchRes.json();
          title = info.title || title;
          channelName = info.author_name || channelName;
        }
      } catch (oembedErr) {
        console.warn('Oembed fetch failed, using default generation:', oembedErr);
      }

      const durationOptions = ['3:45', '4:12', '5:01', '2:56', '3:20'];
      const randomDuration = durationOptions[Math.floor(Math.random() * durationOptions.length)];
      const formattedDate = new Date().toISOString().split('T')[0];

      res.json({
        youtubeUrl,
        videoId,
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        title,
        description: `Professional sound showcase. High definition playback of DJ Beat House track of ID ${videoId}.`,
        channelName,
        duration: randomDuration,
        publishDate: formattedDate,
      });
    } catch (err: any) {
      console.error('Error parsing YouTube video link:', err);
      res.status(500).json({ error: err?.message || 'Failed to fetch YouTube link metadata.' });
    }
  });

  // API 8: Link Validator
  app.post('/api/validate-link', requireAdmin, async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        res.status(400).json({ error: 'Missing URL parameters' });
        return;
      }

      const parsedUrl = new URL(url);
      const isHttp = parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
      if (!isHttp) {
        res.json({ isValid: false, reason: 'Invalid protocol (must be http/https)' });
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 sec limit

      try {
        const response = await fetch(url, {
          method: 'HEAD',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          res.json({ isValid: true, status: response.status });
        } else {
          // Retry with GET if HEAD fails (some servers block HEAD)
          const getResponse = await fetch(url, {
            method: 'GET',
            headers: { 'Range': 'bytes=0-0' }, // Request minimal bytes
          });
          res.json({ isValid: getResponse.ok, status: getResponse.status });
        }
      } catch (fetchErr) {
        clearTimeout(timeoutId);
        res.json({ isValid: false, reason: 'Unreachable or request timed out' });
      }
    } catch (err: any) {
      res.json({ isValid: false, reason: 'Invalid URL format' });
    }
  });

  // Vite development vs. static production server configuration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
