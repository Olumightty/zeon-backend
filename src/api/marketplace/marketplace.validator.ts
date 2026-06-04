import { body, param, query, validationResult } from "express-validator";
import type { NextFunction, Request, Response } from "express";

const storeCategories = [
  "ELECTRONICS",
  "APPAREL",
  "MACHINERY",
  "ECO_GOODS",
  "FOOD_AND_AG",
  "AUTOMOTIVE",
  "DECOR",
  "COSMETICS",
  "LOGISTICS",
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

const tradePartnerRoles = [
  "IMPORT_MANAGER",
  "EXPORT_MANAGER",
  "TRADE_COORDINATOR",
  "WAREHOUSE_MANAGER",
  "SALES_REP",
];

const verificationBadges = [
  "TOP_VERIFIED",
  "ECO_CERTIFIED",
  "PREMIUM_QUALITY",
  "ISO_COMPLIANT",
  "TIER_1_SUPPLY",
];

const bankAccountTypes = [
  "SAVINGS",
  "CURRENT",
  "CHECKING",
];

const accountHolderTypes = [
  "INDIVIDUAL",
  "BUSINESS",
];

const validateRoutingMetadata = (value: unknown, countryCode?: string) => {
  const metadata = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};

  if (countryCode === "US") {
    const routingNumber = metadata.routing_number;
    if (typeof routingNumber !== "string" || !/^\d{9}$/.test(routingNumber)) {
      throw new Error("US bank accounts require a valid 9-digit ACH routing_number.");
    }
  }

  if (countryCode === "NG") {
    const bankCode = metadata.bank_code;
    if (typeof bankCode !== "string" || !/^\d{3}$/.test(bankCode)) {
      throw new Error("Nigerian accounts require a valid 3-digit bank_code.");
    }
  }

  if (countryCode === "DE" || countryCode === "FR") {
    const iban = metadata.iban;
    if (typeof iban !== "string" || iban.trim().length === 0) {
      throw new Error("European Union bank records require an iban value string.");
    }
  }

  return true;
};

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

export const storeIdValidator = [
  param("id").trim().notEmpty().escape(),
  validateRequest,
];

export const productIdValidator = [
  param("id").trim().notEmpty().escape(),
  param("pid").trim().notEmpty().escape(),
  validateRequest,
];

export const tradePartnerIdValidator = [
  param("id").trim().notEmpty().escape(),
  param("tpid").trim().notEmpty().escape(),
  validateRequest,
];

export const bankAccountIdValidator = [
  param("id").trim().notEmpty().escape(),
  param("baid").trim().notEmpty().escape(),
  validateRequest,
];

export const getStoresValidator = [
  query("search").optional().trim().escape(),
  query("category").optional().trim().toUpperCase().isIn(storeCategories),
  query("countryCode").optional().trim().toUpperCase().isLength({ min: 2, max: 2 }),
  query("city").optional().trim().escape(),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  query("mine").optional().isBoolean().toBoolean(),
  validateRequest,
];

export const createStoreValidator = [
  body("name").trim().isLength({ min: 1, max: 120 }).escape(),
  body("slug").optional().trim().isLength({ min: 1, max: 140 }).escape(),
  body("countryCode").trim().toUpperCase().isLength({ min: 2, max: 2 }),
  body("city").trim().isLength({ min: 1, max: 120 }).escape(),
  body("category").trim().toUpperCase().isIn(storeCategories),
  body("logoUrl").optional({ nullable: true }).trim().isURL(),
  body("verificationBadge").optional({ nullable: true }).trim().toUpperCase().isIn(verificationBadges),
  body("reliabilityScore").optional({ nullable: true }).isFloat({ min: 0, max: 100 }).toFloat(),
  body("minimumOrderAmountMinor").optional({ nullable: true }).isInt({ min: 0 }).toInt(),
  body("currencyCode").trim().toUpperCase().isLength({ min: 3, max: 3 }),
  validateRequest,
];

export const updateStoreValidator = [
  param("id").trim().notEmpty().escape(),
  body("name").optional().trim().isLength({ min: 1, max: 120 }).escape(),
  body("slug").optional().trim().isLength({ min: 1, max: 140 }).escape(),
  body("countryCode").optional().trim().toUpperCase().isLength({ min: 2, max: 2 }),
  body("city").optional().trim().isLength({ min: 1, max: 120 }).escape(),
  body("category").optional().trim().toUpperCase().isIn(storeCategories),
  body("logoUrl").optional({ nullable: true }).trim().isURL(),
  body("verificationBadge").optional({ nullable: true }).trim().toUpperCase().isIn(verificationBadges),
  body("reliabilityScore").optional({ nullable: true }).isFloat({ min: 0, max: 100 }).toFloat(),
  body("minimumOrderAmountMinor").optional({ nullable: true }).isInt({ min: 0 }).toInt(),
  body("currencyCode").optional().trim().toUpperCase().isLength({ min: 3, max: 3 }),
  body("isActive").optional().isBoolean().toBoolean(),
  validateRequest,
];

export const getProductsValidator = [
  param("id").trim().notEmpty().escape(),
  query("search").optional().trim().escape(),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  validateRequest,
];

export const createProductValidator = [
  param("id").trim().notEmpty().escape(),
  body("name").trim().isLength({ min: 1, max: 160 }).escape(),
  body("description").optional({ nullable: true }).trim().isLength({ max: 5000 }).escape(),
  body("sku").optional({ nullable: true }).trim().isLength({ max: 100 }).escape(),
  body("priceAmountMinor").isInt({ min: 0 }).toInt(),
  body("currencyCode").trim().toUpperCase().isLength({ min: 3, max: 3 }),
  body("pricingUnit").trim().toUpperCase().isIn(pricingUnits),
  body("moqValue").isFloat({ min: 0 }).toFloat(),
  body("moqUnit").trim().toUpperCase().isIn(pricingUnits),
  body("imageUrl").optional({ nullable: true }).trim().isURL(),
  validateRequest,
];

export const updateProductValidator = [
  param("id").trim().notEmpty().escape(),
  param("pid").trim().notEmpty().escape(),
  body("name").optional().trim().isLength({ min: 1, max: 160 }).escape(),
  body("description").optional({ nullable: true }).trim().isLength({ max: 5000 }).escape(),
  body("sku").optional({ nullable: true }).trim().isLength({ max: 100 }).escape(),
  body("priceAmountMinor").optional().isInt({ min: 0 }).toInt(),
  body("currencyCode").optional().trim().toUpperCase().isLength({ min: 3, max: 3 }),
  body("pricingUnit").optional().trim().toUpperCase().isIn(pricingUnits),
  body("moqValue").optional().isFloat({ min: 0 }).toFloat(),
  body("moqUnit").optional().trim().toUpperCase().isIn(pricingUnits),
  body("imageUrl").optional({ nullable: true }).trim().isURL(),
  body("isActive").optional().isBoolean().toBoolean(),
  validateRequest,
];

export const createTradePartnerValidator = [
  param("id").trim().notEmpty().escape(),
  body("fullName").trim().isLength({ min: 1, max: 160 }).escape(),
  body("email").trim().isEmail().normalizeEmail(),
  body("phone").optional({ nullable: true }).trim().isLength({ min: 5, max: 30 }).escape(),
  body("jobTitle").optional({ nullable: true }).trim().isLength({ max: 120 }).escape(),
  body("role").optional({ nullable: true }).trim().toUpperCase().isIn(tradePartnerRoles),
  body("isPrimary").optional().isBoolean().toBoolean(),
  body("handlesImports").optional().isBoolean().toBoolean(),
  body("handlesExports").optional().isBoolean().toBoolean(),
  validateRequest,
];

export const updateTradePartnerValidator = [
  param("id").trim().notEmpty().escape(),
  param("tpid").trim().notEmpty().escape(),
  body("fullName").optional().trim().isLength({ min: 1, max: 160 }).escape(),
  body("email").optional().trim().isEmail().normalizeEmail(),
  body("phone").optional({ nullable: true }).trim().isLength({ min: 5, max: 30 }).escape(),
  body("jobTitle").optional({ nullable: true }).trim().isLength({ max: 120 }).escape(),
  body("role").optional({ nullable: true }).trim().toUpperCase().isIn(tradePartnerRoles),
  body("isPrimary").optional().isBoolean().toBoolean(),
  body("handlesImports").optional().isBoolean().toBoolean(),
  body("handlesExports").optional().isBoolean().toBoolean(),
  body("isActive").optional().isBoolean().toBoolean(),
  validateRequest,
];

export const createBankAccountValidator = [
  param("id").trim().notEmpty().escape(),
  body("accountNumber").trim().isLength({ min: 3, max: 80 }),
  body("accountName").trim().isLength({ min: 1, max: 180 }).escape(),
  body("accountType").trim().toUpperCase().isIn(bankAccountTypes),
  body("holderType").trim().toUpperCase().isIn(accountHolderTypes),
  body("bankName").trim().isLength({ min: 1, max: 180 }).escape(),
  body("bankCode").trim().isLength({ min: 1, max: 40 }).escape(),
  body("swiftBic").trim().isLength({ min: 8, max: 11 }).escape(),
  body("countryCode").trim().toUpperCase().isLength({ min: 2, max: 2 }),
  body("currencyCode").trim().toUpperCase().isLength({ min: 3, max: 3 }),
  body("routingMetadata")
    .optional({ nullable: true })
    .custom((value, { req }) => {
      if (value !== undefined && (typeof value !== "object" || Array.isArray(value))) {
        throw new Error("routingMetadata must be an object.");
      }

      return validateRoutingMetadata(value || {}, req.body.countryCode);
    }),
  validateRequest,
];

export const updateBankAccountValidator = [
  param("id").trim().notEmpty().escape(),
  param("baid").trim().notEmpty().escape(),
  body("accountNumber").optional().trim().isLength({ min: 3, max: 80 }),
  body("accountName").optional().trim().isLength({ min: 1, max: 180 }).escape(),
  body("accountType").optional().trim().toUpperCase().isIn(bankAccountTypes),
  body("holderType").optional().trim().toUpperCase().isIn(accountHolderTypes),
  body("bankName").optional().trim().isLength({ min: 1, max: 180 }).escape(),
  body("bankCode").optional({ nullable: true }).trim().isLength({ min: 1, max: 40 }).escape(),
  body("swiftBic").optional({ nullable: true }).trim().isLength({ min: 8, max: 11 }).escape(),
  body("countryCode").optional().trim().toUpperCase().isLength({ min: 2, max: 2 }),
  body("currencyCode").optional().trim().toUpperCase().isLength({ min: 3, max: 3 }),
  body("routingMetadata")
    .optional()
    .custom((value, { req }) => {
      if (value !== undefined && (typeof value !== "object" || Array.isArray(value))) {
        throw new Error("routingMetadata must be an object.");
      }

      if (!req.body.countryCode) return true;
      return validateRoutingMetadata(value || {}, req.body.countryCode);
    }),
  body("isActive").optional().isBoolean().toBoolean(),
  validateRequest,
];
