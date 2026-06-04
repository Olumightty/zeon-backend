import { body, param, query, validationResult } from "express-validator";
import type { NextFunction, Request, Response } from "express";

const conversationStatuses = [
  "OPEN",
  "CLOSED",
  "ARCHIVED",
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

export const conversationIdValidator = [
  param("id").trim().notEmpty().escape(),
  validateRequest,
];

export const getConversationsValidator = [
  query("status").optional().trim().toUpperCase().isIn(conversationStatuses),
  query("storeId").optional().trim().notEmpty().escape(),
  query("productId").optional().trim().notEmpty().escape(),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  validateRequest,
];

export const createConversationValidator = [
  body("storeId").trim().notEmpty().escape(),
  body("productId").optional({ nullable: true }).trim().notEmpty().escape(),
  body("subject").trim().isLength({ min: 1, max: 180 }).escape(),
  body("body").trim().isLength({ min: 1, max: 5000 }).escape(),
  validateRequest,
];

export const getMessagesValidator = [
  param("id").trim().notEmpty().escape(),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  validateRequest,
];

export const sendMessageValidator = [
  param("id").trim().notEmpty().escape(),
  body("body").trim().isLength({ min: 1, max: 5000 }).escape(),
  validateRequest,
];
