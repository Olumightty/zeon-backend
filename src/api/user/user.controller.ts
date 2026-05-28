import type { Request, Response } from "express";


export const getUserProfile = async (req: Request, res: Response) => {
  
};

export const updateUserProfile = async (req: Request, res: Response) => {
  
};

export const getNotificationSettings = async (req: Request, res: Response) => {
  
};

export const updateNotificationSettings = async (req: Request, res: Response) => {
  
};

export const getWebhooks = async (_req: Request, res: Response) => {
  return res.status(501).json({ message: "User-scoped webhooks are not implemented in the current MVP." });
};

export const createWebhook = async (_req: Request, res: Response) => {
  return res.status(501).json({ message: "User-scoped webhooks are not implemented in the current MVP." });
};

export const updateWebhook = async (_req: Request, res: Response) => {
  return res.status(501).json({ message: "User-scoped webhooks are not implemented in the current MVP." });
};

export const deleteWebhook = async (_req: Request, res: Response) => {
  return res.status(501).json({ message: "User-scoped webhooks are not implemented in the current MVP." });
};
