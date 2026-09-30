import { Router } from 'express';
import { InvoiceController } from '../controllers/invoiceController.js';

const router = Router();

router.post('/invoices', InvoiceController.requestInvoice);
router.get('/invoices/:id/status', InvoiceController.checkStatus);

export default router;
