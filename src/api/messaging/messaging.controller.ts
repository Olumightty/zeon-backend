import type { Request, Response } from "express";
import {
  canUseOrganizationMessaging,
  closeConversationService,
  createConversationService,
  findConversationById,
  getConversationMessagesService,
  getConversationsService,
  sendMessageService,
} from "./messaging.service";

const jsonSafe = (data: unknown) => {
  return JSON.parse(
    JSON.stringify(data, (_key, value) => (typeof value === "bigint" ? value.toString() : value)),
  );
};

const getAuthUser = (req: Request) => {
  const userId = req.user?.userId;
  if (!userId) {
    return null;
  }

  const orgId = req.user?.orgId;

  return {
    userId,
    orgId,
  };
};

const getParam = (req: Request, key: string) => {
  const value = req.params[key];
  return Array.isArray(value) ? value[0] || "" : value || "";
};

const ensureOrgMessagingAccess = async (auth: { userId: string; orgId?: string | undefined }) => {
  if (!auth.orgId) {
    return true;
  }

  return await canUseOrganizationMessaging(auth.userId, auth.orgId);
};

export const getConversations = async (req: Request, res: Response) => {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return res.status(401).json({ message: "Unauthorized", status: false });
    }

    const canUseMessaging = await ensureOrgMessagingAccess(auth);
    if (!canUseMessaging) {
      return res.status(403).json({ message: "You cannot access messaging for this organization", status: false });
    }

    const result = await getConversationsService(auth, {
      status: req.query.status as string,
      storeId: req.query.storeId as string,
      productId: req.query.productId as string,
      page: Number(req.query.page) as number,
      limit: Number(req.query.limit) as number,
    });

    return res.status(200).json({
      message: "Conversations fetched successfully",
      status: true,
      data: jsonSafe(result),
    });
  } catch (error) {
    console.error("Get conversations error:", error);
    return res.status(500).json({ message: "Unable to process request", status: false });
  }
};

export const createConversation = async (req: Request, res: Response) => {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return res.status(401).json({ message: "Unauthorized", status: false });
    }

    const canUseMessaging = await ensureOrgMessagingAccess(auth);
    if (!canUseMessaging) {
      return res.status(403).json({ message: "You cannot access messaging for this organization", status: false });
    }

    const result = await createConversationService(auth, {
      storeId: req.body.storeId,
      productId: req.body.productId || null,
      subject: req.body.subject,
      body: req.body.body,
    });

    if (!result) {
      return res.status(404).json({ message: "Store not found", status: false });
    }

    if (result === "PRODUCT_NOT_FOUND") {
      return res.status(404).json({ message: "Product not found in this store", status: false });
    }

    if (result === "STORE_OWNER_NOT_FOUND") {
      return res.status(400).json({ message: "Store does not have a messaging recipient", status: false });
    }

    if (result === "OWN_STORE") {
      return res.status(400).json({ message: "You cannot start a conversation with your own store", status: false });
    }

    return res.status(201).json({
      message: "Conversation created successfully",
      status: true,
      data: jsonSafe(result),
    });
  } catch (error) {
    console.error("Create conversation error:", error);
    return res.status(500).json({ message: "Unable to process request", status: false });
  }
};

export const getConversationById = async (req: Request, res: Response) => {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return res.status(401).json({ message: "Unauthorized", status: false });
    }

    const canUseMessaging = await ensureOrgMessagingAccess(auth);
    if (!canUseMessaging) {
      return res.status(403).json({ message: "You cannot access messaging for this organization", status: false });
    }

    const conversation = await findConversationById(getParam(req, "id"), auth);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found", status: false });
    }

    return res.status(200).json({
      message: "Conversation fetched successfully",
      status: true,
      data: jsonSafe(conversation),
    });
  } catch (error) {
    console.error("Get conversation error:", error);
    return res.status(500).json({ message: "Unable to process request", status: false });
  }
};

export const getConversationMessages = async (req: Request, res: Response) => {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return res.status(401).json({ message: "Unauthorized", status: false });
    }

    const canUseMessaging = await ensureOrgMessagingAccess(auth);
    if (!canUseMessaging) {
      return res.status(403).json({ message: "You cannot access messaging for this organization", status: false });
    }

    const result = await getConversationMessagesService(getParam(req, "id"), auth, {
      page: Number(req.query.page) as number,
      limit: Number(req.query.limit) as number,
    });

    if (!result) {
      return res.status(404).json({ message: "Conversation not found", status: false });
    }

    return res.status(200).json({
      message: "Messages fetched successfully",
      status: true,
      data: jsonSafe(result),
    });
  } catch (error) {
    console.error("Get messages error:", error);
    return res.status(500).json({ message: "Unable to process request", status: false });
  }
};

export const sendConversationMessage = async (req: Request, res: Response) => {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return res.status(401).json({ message: "Unauthorized", status: false });
    }

    const canUseMessaging = await ensureOrgMessagingAccess(auth);
    if (!canUseMessaging) {
      return res.status(403).json({ message: "You cannot access messaging for this organization", status: false });
    }

    const result = await sendMessageService(getParam(req, "id"), auth, {
      body: req.body.body,
    });

    if (!result) {
      return res.status(404).json({ message: "Conversation not found", status: false });
    }

    if (result === "CONVERSATION_CLOSED") {
      return res.status(400).json({ message: "Conversation is closed", status: false });
    }

    return res.status(201).json({
      message: "Message sent successfully",
      status: true,
      data: jsonSafe(result),
    });
  } catch (error) {
    console.error("Send message error:", error);
    return res.status(500).json({ message: "Unable to process request", status: false });
  }
};

export const closeConversation = async (req: Request, res: Response) => {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return res.status(401).json({ message: "Unauthorized", status: false });
    }

    const canUseMessaging = await ensureOrgMessagingAccess(auth);
    if (!canUseMessaging) {
      return res.status(403).json({ message: "You cannot access messaging for this organization", status: false });
    }

    const result = await closeConversationService(getParam(req, "id"), auth);
    if (!result) {
      return res.status(404).json({ message: "Conversation not found", status: false });
    }

    return res.status(200).json({
      message: "Conversation closed successfully",
      status: true,
      data: jsonSafe(result),
    });
  } catch (error) {
    console.error("Close conversation error:", error);
    return res.status(500).json({ message: "Unable to process request", status: false });
  }
};
