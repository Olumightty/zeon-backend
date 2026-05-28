import { getAuth } from "@clerk/express";
import crypto from "crypto";
import type { NextFunction, Request, Response } from "express";

export const authGuard = (req: Request, res: Response, next: NextFunction) => {
    const user = getAuth(req); 
    if (!user || !user.isAuthenticated) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    req.user = user; // Attach user info to the request object for downstream use
    next();
};

export const isFromKora = (req: Request, res: Response, next: NextFunction) => {
//   const ip = getIp(req);
//   const deviceInfo = getDeviceInfo(req);
  const data = req.body.data || '';
  const hash = crypto.createHmac('sha256', process.env.KORA_SECRET_KEY!).update(JSON.stringify(data)).digest('hex');

   if (hash === req.headers['x-korapay-signature']) {
     // Continue with the request functionality
     next();
   } else {
     // Don’t do anything, the request is not from us.
    //  universalLogger.warn('Request is not from Kora.', {
    //    ip,
    //    deviceInfo,
    //    data,
    //    signature: req.headers['x-korapay-signature'],
    //  });
     console.warn('Request is not from Kora.');
   }
};