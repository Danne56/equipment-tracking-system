import { Hono } from 'hono';
import {
    getAllToolsController,
    createToolController,
    getToolByQrIdController
} from '../controllers/tool.controllers';

const toolRoutes = new Hono();

// Get all tools
toolRoutes.get('/', getAllToolsController);

// Create a new tool
toolRoutes.post('/', createToolController);

// Get tool by QR code
toolRoutes.get('/qr/:qrId', getToolByQrIdController);

export default toolRoutes;