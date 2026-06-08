import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import morgan from 'morgan';
import * as messagingRoute from './api/messaging/messaging.route';
import * as shipmentRoute from './api/shipment/shipment.route';
// import * as trackingWebhook from './webhooks/tracking.webhook';
import * as koraWebhook from './webhooks/kora.webhook';
import * as userRoute from './api/user/user.route';
import * as cargoRoute from './api/cargo/cargo.route';
import * as carrierRoute from './api/carrier/carrier.route';
import * as marketplaceRoute from './api/marketplace/marketplace.route';
import * as paymentRoute from './api/payment/payment.route';
import * as clerkWebhook from './webhooks/clerk.webhook';
import { clerkMiddleware} from '@clerk/express'
import { authGuard } from './api/guard/auth.guard';
import cors from 'cors'

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors(
//   {
//   credentials: true,
//   origin: [process.env.WEB_CLIENT_URL!, 'http://localhost:3000', 'http://localhost:3001'],
//   methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
//   allowedHeaders: [
//     "Content-Type", 
//     "Authorization", 
//     'x-korapay-signature', 
//     'svix-signature', 
//     'svix-timestamp', 
//     'svix-id',
//   ],
// }
))

app.use(morgan('dev')); // Log HTTP requests in development mode
app.set('trust proxy', 1);

//needs raw body for verification, so mount it before express.json()
app.use('/clerk', clerkWebhook.default);

app.use(express.json());

app.use('/kora', koraWebhook.default);

app.use(clerkMiddleware())


// A simple health-check route
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Hello from Zeon Systems' });
});

app.options("*any", (req, res) => res.sendStatus(204));

app.use('/api/user', authGuard, userRoute.default);
app.use('/api/marketplace', authGuard, marketplaceRoute.default);
app.use('/api/cargo', authGuard, cargoRoute.default)
app.use('/api/payment', authGuard, paymentRoute.default);
app.use('/api/carrier', authGuard, carrierRoute.default);
app.use('/api/shipment', authGuard, shipmentRoute.default);
app.use('/api/messaging', authGuard, messagingRoute.default);
// app.use('/tracking', trackingWebhook.default);


app.listen(PORT, () => {
  console.log(`⚡️[server]: Server is running on port ${PORT}`);
});
