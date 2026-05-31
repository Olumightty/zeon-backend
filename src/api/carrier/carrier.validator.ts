import { param, query, validationResult } from "express-validator";
import type { NextFunction, Request, Response } from "express";

const vesselTypes = [
  "SHIP",
  "PLANE",
  "TRUCK",
  "TRAIN",
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

export const vesselIdValidator = [
  param("id").trim().notEmpty().escape(),
  validateRequest,
];

export const getVesselsValidator = [
  query("search").optional().trim().escape(),
  query("type").optional().trim().toUpperCase().isIn(vesselTypes),
  query("carrierId").optional().trim().notEmpty().escape(),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  validateRequest,
];

export const getPortsValidator = [
  query("search").optional().trim().escape(),
  query("countryCode").optional().trim().toUpperCase().isLength({ min: 2, max: 2 }),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  validateRequest,
];
