import { body, validationResult } from "express-validator";
import type { NextFunction, Request, Response } from "express";

export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Invalid request parameters",
      status: false,
      errors: errors.array(),
    });
  }
  next();
};

export const updateUserProfileValidator = [
  body("firstName").optional({ nullable: true }).trim().isLength({ min: 1, max: 80 }).escape(),
  body("lastName").optional({ nullable: true }).trim().isLength({ min: 1, max: 80 }).escape(),
  body("phone").optional({ nullable: true }).trim().isLength({ min: 5, max: 30 }).escape(),
  body("profileImageUrl").optional({ nullable: true }).trim().isURL(),
  validateRequest,
];

export const updateNotificationSettingsValidator = [
  body("notifyEmail").optional().isBoolean().toBoolean().escape(),
  body("notifySms").optional().isBoolean().toBoolean().escape(),
  body("notifyCustomsHold").optional().isBoolean().toBoolean().escape(),
  body("notifyManifestReady").optional().isBoolean().toBoolean().escape(),
  validateRequest,
];
