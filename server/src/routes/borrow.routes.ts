import { Hono } from 'hono';
import {
    borrowToolController,
    returnToolController,
    getAllBorrowRecordsController,
    getActiveBorrowRecordsController
} from '../controllers/borrow.controllers';

const borrowRoutes = new Hono();

// Borrow a tool
borrowRoutes.post('/', borrowToolController);

// Return a tool
borrowRoutes.post('/return', returnToolController);

// Get all borrow records
borrowRoutes.get('/', getAllBorrowRecordsController);

// Get active borrows
borrowRoutes.get('/active', getActiveBorrowRecordsController);

export default borrowRoutes;