import { param, query, validationResult } from "express-validator";
import type { NextFunction, Request, Response } from "express";

const shipmentStatuses = [
  "DRAFT",
  "PENDING_POOLING",
  "POOLED",
  "BOOKED",
  "AWAITING_PAYMENT",
  "ESCROW_HELD",
  "DEPARTED_ORIGIN",
  "IN_TRANSIT",
  "ARRIVED_DESTINATION",
  "CUSTOMS_HOLD",
  "CUSTOMS_RELEASED",
  "DELIVERED",
  "CANCELLED",
];

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

export const shipmentIdValidator = [
  param("id").trim().notEmpty().escape(),
  validateRequest,
];

export const getShipmentsValidator = [
  query("status").optional().trim().toUpperCase().isIn(shipmentStatuses),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  validateRequest,
];
