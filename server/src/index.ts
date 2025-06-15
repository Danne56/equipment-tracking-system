import { Hono } from 'hono';
import { cors } from 'hono/cors';
import toolRoutes from './routes/tool.routes';
import borrowRoutes from './routes/borrow.routes';
import notificationRoutes from './routes/notification.routes';

const app = new Hono();

// Middleware
app.use(cors());

// Root and Hello Endpoints
app.get('/', (c) => {
    return c.text('Workshop Tool Tracking System');
});

app.get('/hello', async (c) => {
    const data = {
        message: "Hello Workshop Tool Tracking System!",
        success: true
    };
    return c.json(data, { status: 200 });
});

// API Routes
app.route('/api/tools', toolRoutes);
app.route('/api/borrow-records', borrowRoutes);
app.route('/api/notifications', notificationRoutes);

// Legacy backward compatibility routes
app.post('/api/borrow', async (c) => {
    // Forward to the borrow controller
    const { borrowToolController } = await import('./controllers/borrow.controllers');
    return borrowToolController(c);
});

app.post('/api/return', async (c) => {
    // Forward to the return controller  
    const { returnToolController } = await import('./controllers/borrow.controllers');
    return returnToolController(c);
});

// Global Error Handler
app.onError((err, c) => {
    console.error('Unhandled error:', err);
    return c.json({
        success: false,
        message: 'An unexpected error occurred',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    }, 500);
});

export default app;