import { param, validationResult } from "express-validator";
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

export const paymentIntentIdValidator = [
  param("id").trim().notEmpty().escape(),
  validateRequest,
];

export const escrowIntentIdValidator = [
  param("intentId").trim().notEmpty().escape(),
  validateRequest,
];
