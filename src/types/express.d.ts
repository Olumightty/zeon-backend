import { SessionAuthObject } from '@clerk/express';

declare global {
  namespace Express {
    interface Request {
      user?: SessionAuthObject;
    }
  }
}