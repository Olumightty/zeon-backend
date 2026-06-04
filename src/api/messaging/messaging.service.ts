import { prisma } from "../../lib/prisma";
import type { Prisma } from "../../generated/prisma/client";

type AuthUser = {
  userId: string;
  orgId?: string | undefined;
};

type ListInput = {
  status?: string;
  storeId?: string;
  productId?: string;
  page?: number;
  limit?: number;
};

const participantInclude = {
  user: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      profileImageUrl: true,
    },
  },
  organization: true,
};

const conversationInclude = {
  store: true,
  product: true,
  participants: {
    include: participantInclude,
    orderBy: {
      createdAt: "asc" as const,
    },
  },
  messages: {
    include: {
      senderUser: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          profileImageUrl: true,
        },
      },
    },
    orderBy: {
      sentAt: "desc" as const,
    },
    take: 1,
  },
};

const messageInclude = {
  senderUser: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      profileImageUrl: true,
    },
  },
};

const getParticipantAccessWhere = (auth: AuthUser): Prisma.ConversationParticipantWhereInput => {
  if (auth.orgId) {
    return {
      OR: [
        {
          userId: auth.userId,
        },
        {
          organizationId: auth.orgId,
        },
      ],
    };
  }

  return {
    userId: auth.userId,
  };
};

const getConversationAccessWhere = (auth: AuthUser): Prisma.ConversationWhereInput => {
  return {
    participants: {
      some: getParticipantAccessWhere(auth),
    },
  };
};

const getRequesterParticipant = (auth: AuthUser) => {
  if (auth.orgId) {
    return {
      organizationId: auth.orgId,
      role: "REQUESTER" as const,
    };
  }

  return {
    userId: auth.userId,
    role: "REQUESTER" as const,
  };
};

const getResponderParticipant = (store: { userId: string | null; organizationId: string | null }) => {
  if (store.organizationId) {
    return {
      organizationId: store.organizationId,
      role: "RESPONDER" as const,
    };
  }

  return {
    userId: store.userId!,
    role: "RESPONDER" as const,
  };
};

export const findUserById = async (id: string) => {
  return await prisma.user.findUnique({
    where: {
      id,
    },
  });
};

export const findMembership = async (userId: string, organizationId: string) => {
  return await prisma.membership.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId,
      },
    },
  });
};

export const canUseOrganizationMessaging = async (userId: string, organizationId: string) => {
  const membership = await findMembership(userId, organizationId);
  return membership?.role === "OWNER" || membership?.role === "ADMIN" || membership?.role === "OPS_MANAGER";
};

export const findStoreForConversation = async (id: string) => {
  return await prisma.store.findFirst({
    where: {
      id,
      isActive: true,
    },
  });
};

export const findProductForConversation = async (storeId: string, productId: string) => {
  return await prisma.product.findFirst({
    where: {
      id: productId,
      storeId,
      isActive: true,
    },
  });
};

export const getConversationsService = async (auth: AuthUser, input: ListInput) => {
  const page = input.page || 1;
  const limit = input.limit || 20;
  const skip = (page - 1) * limit;
  const where: Prisma.ConversationWhereInput = {
    ...getConversationAccessWhere(auth),
    ...(input.status && { status: input.status as Prisma.EnumConversationStatusFilter<"Conversation"> }),
    ...(input.storeId && { storeId: input.storeId }),
    ...(input.productId && { productId: input.productId }),
  };

  const conversations = await prisma.conversation.findMany({
    where,
    include: conversationInclude,
    skip,
    take: limit,
    orderBy: [
      {
        lastMessageAt: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
  });

  const total = await prisma.conversation.count({
    where,
  });

  return {
    conversations,
    total,
    page,
    limit,
  };
};

export const findConversationById = async (id: string, auth: AuthUser) => {
  return await prisma.conversation.findFirst({
    where: {
      id,
      ...getConversationAccessWhere(auth),
    },
    include: conversationInclude,
  });
};

export const createConversationService = async (
  auth: AuthUser,
  data: {
    storeId: string;
    productId?: string | null;
    subject: string;
    body: string;
  },
) => {
  const now = new Date();
  const store = await findStoreForConversation(data.storeId);
  if (!store) {
    return null;
  }

  if (data.productId) {
    const product = await findProductForConversation(data.storeId, data.productId);
    if (!product) {
      return "PRODUCT_NOT_FOUND" as const;
    }
  }

  if (!store.userId && !store.organizationId) {
    return "STORE_OWNER_NOT_FOUND" as const;
  }

  if (!auth.orgId && store.userId === auth.userId) {
    return "OWN_STORE" as const;
  }

  if (auth.orgId && store.organizationId === auth.orgId) {
    return "OWN_STORE" as const;
  }

  const requesterParticipant = getRequesterParticipant(auth);
  const responderParticipant = getResponderParticipant(store);

  return await prisma.conversation.create({
    data: {
      storeId: data.storeId,
      productId: data.productId || null,
      subject: data.subject,
      lastMessageAt: now,
      participants: {
        create: [
          requesterParticipant,
          responderParticipant,
        ],
      },
      messages: {
        create: [
          {
            senderType: "SYSTEM",
            direction: "SYSTEM",
            body: "Conversation started.",
            sentAt: now,
          },
          {
            senderType: "USER",
            senderUserId: auth.userId,
            direction: "OUTBOUND",
            body: data.body,
            sentAt: now,
          },
        ],
      },
    },
    include: conversationInclude,
  });
};

export const getConversationMessagesService = async (
  conversationId: string,
  auth: AuthUser,
  input: {
    page?: number;
    limit?: number;
  },
) => {
  const conversation = await findConversationById(conversationId, auth);
  if (!conversation) {
    return null;
  }

  const page = input.page || 1;
  const limit = input.limit || 50;
  const skip = (page - 1) * limit;
  const where: Prisma.MessageWhereInput = {
    conversationId,
  };

  const messages = await prisma.message.findMany({
    where,
    include: messageInclude,
    skip,
    take: limit,
    orderBy: {
      sentAt: "asc",
    },
  });

  const total = await prisma.message.count({
    where,
  });

  await markConversationRead(conversationId, auth);

  return {
    messages,
    total,
    page,
    limit,
  };
};

export const sendMessageService = async (
  conversationId: string,
  auth: AuthUser,
  data: {
    body: string;
  },
) => {
  const conversation = await findConversationById(conversationId, auth);
  if (!conversation) {
    return null;
  }

  if (conversation.status !== "OPEN") {
    return "CONVERSATION_CLOSED" as const;
  }

  const now = new Date();

  return await prisma.$transaction(async (tx) => {
    const message = await tx.message.create({
      data: {
        conversationId,
        senderType: "USER",
        senderUserId: auth.userId,
        direction: "OUTBOUND",
        body: data.body,
        sentAt: now,
      },
      include: messageInclude,
    });

    await tx.conversation.update({
      where: {
        id: conversationId,
      },
      data: {
        lastMessageAt: now,
      },
    });

    await tx.conversationParticipant.updateMany({
      where: {
        conversationId,
        ...getParticipantAccessWhere(auth),
      },
      data: {
        lastReadAt: now,
      },
    });

    return message;
  });
};

export const closeConversationService = async (conversationId: string, auth: AuthUser) => {
  const conversation = await findConversationById(conversationId, auth);
  if (!conversation) {
    return null;
  }

  if (conversation.status === "CLOSED") {
    return conversation;
  }

  return await prisma.conversation.update({
    where: {
      id: conversationId,
    },
    data: {
      status: "CLOSED",
    },
    include: conversationInclude,
  });
};

export const markConversationRead = async (conversationId: string, auth: AuthUser) => {
  return await prisma.conversationParticipant.updateMany({
    where: {
      conversationId,
      ...getParticipantAccessWhere(auth),
    },
    data: {
      lastReadAt: new Date(),
    },
  });
};
