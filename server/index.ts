import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import * as trpcExpress from '@trpc/server/adapters/express';
import { appRouter } from './api/router.js';
import { createContext } from './api/trpc.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 8000;

app.use(cors());
app.use(helmet({
  contentSecurityPolicy: false, // Disable for demo to allow external assets
}));
app.use(compression());
app.use(express.json());

// tRPC API
app.use(
  '/trpc',
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../client/dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  // Simple landing page for development
  app.get('/', (req, res) => {
    res.send(`
      <html>
        <head>
          <title>FarmSense Unified Platform</title>
          <style>
            body { font-family: sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 2rem; background: #f4f7f6; }
            .card { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            h1 { color: #2c3e50; }
            .status { display: inline-block; padding: 0.25rem 0.5rem; border-radius: 4px; background: #e8f5e9; color: #2e7d32; font-weight: bold; }
            .api-list { margin-top: 2rem; }
            code { background: #eee; padding: 0.2rem 0.4rem; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>FarmSense Unified Platform</h1>
            <p>Status: <span class="status">ONLINE</span></p>
            <p>Welcome to the FarmSense Unified Platform. The tRPC API is available at <code>/trpc</code>.</p>
            
            <div class="api-list">
              <h3>Available API Endpoints:</h3>
              <ul>
                <li><code>GET /health</code> - System health check</li>
                <li><code>POST /trpc/domains.listAll</code> - List available domain engines</li>
                <li><code>POST /trpc/farms.list</code> - List farms</li>
              </ul>
            </div>
            
            <p>For more information, refer to the documentation in the source package.</p>
          </div>
        </body>
      </html>
    `);
  });
}

app.listen(port, () => {
  console.log(`FarmSense Unified Platform running on port ${port}`);
});
