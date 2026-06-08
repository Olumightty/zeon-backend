import { body, param, query, validationResult } from "express-validator";
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

const pricingUnits = [
  "UNIT",
  "METER",
  "KILOGRAM",
  "LITER",
  "TON",
  "SHEET",
  "SLOT",
  "CONTAINER",
  "CARTON",
  "PACK",
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

export const cargoAllocationIdValidator = [
  param("id").trim().notEmpty().escape(),
  validateRequest,
];

export const getCargoAllocationsValidator = [
  query("status").optional().trim().toUpperCase().isIn(shipmentStatuses),
  query("storeId").optional().trim().notEmpty().escape(),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  validateRequest,
];

export const createCargoAllocationValidator = [
  body("storeId").trim().notEmpty().escape(),
  body("currencyCode").optional().trim().toUpperCase().isLength({ min: 3, max: 3 }),
  body("deliveryAddress")
    .optional({nullable: true})
    .custom((value, { req }) => {
        if (value !== undefined && (typeof value !== "object" || Array.isArray(value))) {
          throw new Error("deliveryAddress must be an object.");
        }
  
        if(!value.country || !value.city || !value.street || !value.postalCode || !value.fullAddress) {
          throw new Error("deliveryAddress must include country, city, street, postalCode, and fullAddress");
        }
  
        return true;
    }),
  body("items").isArray({ min: 1 }),
  body("items.*.productId").trim().notEmpty().escape(),
  body("items.*.quantity").isFloat({ gt: 0 }).toFloat(),
  body("items.*.quantityUnit").optional().trim().toUpperCase().isIn(pricingUnits),
  validateRequest,
];

export const updateCargoAllocationValidator = [
  param("id").trim().notEmpty().escape(),
  body("storeId").optional().trim().notEmpty().escape(),
  body("currencyCode").optional().trim().toUpperCase().isLength({ min: 3, max: 3 }),
  body("deliveryAddress")
    .optional({nullable: true})
    .custom((value, { req }) => {
        if (value !== undefined && (typeof value !== "object" || Array.isArray(value))) {
          throw new Error("deliveryAddress must be an object.");
        }
  
        if(!value.country || !value.city || !value.street || !value.postalCode || !value.fullAddress) {
          throw new Error("deliveryAddress must include country, city, street, postalCode, and fullAddress.");
        }
  
        return true;
    }),
  body("items").optional().isArray({ min: 1 }),
  body("items.*.productId").optional().trim().notEmpty().escape(),
  body("items.*.quantity").optional().isFloat({ gt: 0 }).toFloat(),
  body("items.*.quantityUnit").optional().trim().toUpperCase().isIn(pricingUnits),
  validateRequest,
];

export const checkoutCargoAllocationValidator = [
  body("deliveryAddress")
    .custom((value, { req }) => {
        if (value !== undefined && (typeof value !== "object" || Array.isArray(value))) {
          throw new Error("deliveryAddress must be an object.");
        }
  
        if(!value.country || !value.city || !value.street || !value.postalCode || !value.fullAddress) {
          throw new Error("deliveryAddress must include country, city, street, postalCode, and fullAddress");
        }
  
        return true;
    }),
  body("allocationId").trim().notEmpty().escape(),
  body("tariffRateBps").optional().isInt({ min: 0, max: 10000 }).toInt(),
  body("customsFeeMinor").optional().isInt({ min: 0 }).toInt(),
  body("vatRateBps").optional().isInt({ min: 0, max: 10000 }).toInt(),
  body("otherFeeMinor").optional().isInt({ min: 0 }).toInt(),
  validateRequest,
];
