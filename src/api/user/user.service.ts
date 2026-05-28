import { prisma } from "../../lib/prisma";

export const findUserById = async (id: string) => {
  return await prisma.user.findUnique({
    where: {
      id,
    },
    include: {
      memberships: {
        include: {
          organization: true,
        },
      },
      stores: {
        orderBy: {
          createdAt: "desc",
        },
      },
      notificationPreference: true,
    },
  });
};

export const updateUser = async (
  id: string,
  data: {
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
    profileImageUrl?: string | null;
  },
) => {
  return await prisma.user.update({
    where: {
      id,
    },
    data,
  });
};

export const findUserNotificationSettings = async (userId: string) => {
  return await prisma.notificationPreference.findUnique({
    where: {
      userId,
    },
  });
};

export const createUserNotificationSettings = async (userId: string) => {
  return await prisma.notificationPreference.create({
    data: {
      userId,
      notifyEmail: true,
      notifySms: false,
      notifyCustomsHold: true,
      notifyManifestReady: true,
    },
  });
};

export const updateUserNotificationSettings = async (
  userId: string,
  data: {
    notifyEmail?: boolean;
    notifySms?: boolean;
    notifyCustomsHold?: boolean;
    notifyManifestReady?: boolean;
  },
) => {
  return await prisma.notificationPreference.upsert({
    where: {
      userId,
    },
    update: data,
    create: {
      userId,
      notifyEmail: data.notifyEmail ?? true,
      notifySms: data.notifySms ?? false,
      notifyCustomsHold: data.notifyCustomsHold ?? true,
      notifyManifestReady: data.notifyManifestReady ?? true,
    },
  });
};
