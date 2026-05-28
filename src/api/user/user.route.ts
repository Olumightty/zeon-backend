import { Router } from "express";
import {
  createWebhook,
  deleteWebhook,
  getNotificationSettings,
  getUserProfile,
  getWebhooks,
  updateNotificationSettings,
  updateWebhook,
  updateUserProfile,
} from "./user.controller";
import {
  updateNotificationSettingsValidator,
  updateUserProfileValidator,
} from "./user.validator";
const router = Router();

//business facing API

// get user profile (only the user can see their own profile)
router.get("/", getUserProfile);

// update user profile (only the user can update their own profile)
router.patch("/", updateUserProfileValidator, updateUserProfile);

// get notification settings for the user (only the user can see their own notification settings)
router.get("/settings/notifications", getNotificationSettings);

// update notification settings for the user (only the user can update their own notification settings)
router.patch("/settings/notifications", updateNotificationSettingsValidator, updateNotificationSettings);

// // get webhooks for the user (only the user can see their own webhooks)
// router.get('/settings/webhooks', getWebhooks);

// // create a new webhook for the user (only the user can create a webhook for their own account)
// router.post('/settings/webhooks', createWebhook);

// // update a specific webhook by id for the user (only the user can update their own webhooks)
// router.patch('/settings/webhooks/:id', updateWebhook);

// // delete a specific webhook by id for the user (only the user can delete their own webhooks)
// router.delete('/settings/webhooks/:id', deleteWebhook);

export default router;
