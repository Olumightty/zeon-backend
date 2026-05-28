import type { Request, Response } from "express";
import {
  createUserNotificationSettings,
  findUserById,
  findUserNotificationSettings,
  updateUser,
  updateUserNotificationSettings,
} from "./user.service";

const getAuthUserId = (req: Request) => {
  const userId = req.user?.userId;
  if (!userId) {
    return null;
  }
  return userId;
};

export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized", status: false });
    }

    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User profile not found",
        status: false,
      });
    }

    return res.status(200).json({
      message: "User profile fetched successfully",
      status: true,
      data: user,
    });
  } catch (error) {
    console.error("Get user profile error:", error);
    return res.status(500).json({ message: "Unable to process request", status: false });
  }
};

export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized", status: false });
    }

    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User profile not found",
        status: false,
      });
    }

    const { firstName, lastName, phone, profileImageUrl } = req.body;

    if (
      firstName === undefined &&
      lastName === undefined &&
      phone === undefined &&
      profileImageUrl === undefined
    ) {
      return res.status(400).json({
        message: "Invalid request parameters",
        status: false,
      });
    }

    const updatedUser = await updateUser(userId, {
      ...(firstName !== undefined && { firstName }),
      ...(lastName !== undefined && { lastName }),
      ...(phone !== undefined && { phone }),
      ...(profileImageUrl !== undefined && { profileImageUrl }),
    });

    return res.status(200).json({
      message: "User profile updated successfully",
      status: true,
      data: updatedUser,
    });
  } catch (error) {
    console.error("Update user profile error:", error);
    return res.status(500).json({ message: "Unable to process request", status: false });
  }
};

export const getNotificationSettings = async (req: Request, res: Response) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized", status: false });
    }

    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User profile not found",
        status: false,
      });
    }

    const settings =
      (await findUserNotificationSettings(userId)) ||
      (await createUserNotificationSettings(userId));

    return res.status(200).json({
      message: "Notification settings fetched successfully",
      status: true,
      data: settings,
    });
  } catch (error) {
    console.error("Get notification settings error:", error);
    return res.status(500).json({ message: "Unable to process request", status: false });
  }
};

export const updateNotificationSettings = async (req: Request, res: Response) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized", status: false });
    }

    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User profile not found",
        status: false,
      });
    }

    const { notifyEmail, notifySms, notifyCustomsHold, notifyManifestReady } = req.body;

    if (
      notifyEmail === undefined &&
      notifySms === undefined &&
      notifyCustomsHold === undefined &&
      notifyManifestReady === undefined
    ) {
      return res.status(400).json({
        message: "Invalid request parameters",
        status: false,
      });
    }

    const settings = await updateUserNotificationSettings(userId, {
      ...(notifyEmail !== undefined && { notifyEmail }),
      ...(notifySms !== undefined && { notifySms }),
      ...(notifyCustomsHold !== undefined && { notifyCustomsHold }),
      ...(notifyManifestReady !== undefined && { notifyManifestReady }),
    });

    return res.status(200).json({
      message: "Notification settings updated successfully",
      status: true,
      data: settings,
    });
  } catch (error) {
    console.error("Update notification settings error:", error);
    return res.status(500).json({ message: "Unable to process request", status: false });
  }
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
