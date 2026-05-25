import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import morgan from 'morgan';
import * as authRoute from './api/auth/auth.route';
import * as messagingRoute from './api/messaging/messaging.route';
import * as shipmentRoute from './api/shipment/shipment.route';
import * as trackingWebhook from './webhooks/tracking.webhook';
import * as koraWebhook from './webhooks/kora.webhook';
import * as organizationRoute from './api/organization/organization.route';
import * as cargoRoute from './api/cargo/cargo.route';
import * as carrierRoute from './api/carrier/carrier.route';
import * as marketplaceRoute from './api/marketplace/marketplace.route';
import * as paymentRoute from './api/payment/payment.route';

const app = express();
const PORT = process.env.PORT || 8000;

app.use(morgan('dev')); // Middleware to parse JSON payloads
app.use(express.json());

// A simple health-check route
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Hello from Zeon Systems' });
});

app.use('/api/auth', authRoute.default);
app.use('/api/messaging', messagingRoute.default);
app.use('/api/shipment', shipmentRoute.default);
app.use('/tracking', trackingWebhook.default);
app.use('/kora', koraWebhook.default);
app.use('/api/organization', organizationRoute.default);
app.use('/api/cargo', cargoRoute.default);
app.use('/api/carrier', carrierRoute.default);
app.use('/api/marketplace', marketplaceRoute.default);
app.use('/api/payment', paymentRoute.default);

app.listen(PORT, () => {
  console.log(`⚡️[server]: Server is running on port ${PORT}`);
});