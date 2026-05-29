import { prisma } from "../../lib/prisma";
import type { Prisma } from "../../generated/prisma/client";

type AuthUser = {
  userId: string;
  orgId?: string | undefined;
};

type ListInput = {
  search?: string;
  category?: string;
  countryCode?: string;
  city?: string;
  page?: number;
  limit?: number;
  mine?: boolean;
};

const storeInclude = {
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
  products: {
    where: {
      isActive: true,
    },
    take: 5,
    orderBy: {
      createdAt: "desc" as const,
    },
  },
  tradePartners: {
    where: {
      isActive: true,
    },
    orderBy: [
      {
        isPrimary: "desc" as const,
      },
      {
        createdAt: "desc" as const,
      },
    ],
  },
};

const productInclude = {
  store: true,
};

const tradePartnerInclude = {
  store: true,
};

const slugify = (value: string) => {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
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

export const canManageOrganization = async (userId: string, organizationId: string) => {
  const membership = await findMembership(userId, organizationId);
  return membership?.role === "OWNER" || membership?.role === "ADMIN";
};

export const findUniqueStoreSlug = async (name: string, currentStoreId?: string) => {
  const baseSlug = slugify(name);
  let slug = baseSlug;
  let count = 1;

  while (true) {
    const store = await prisma.store.findFirst({
      where: {
        slug,
        ...(currentStoreId && {
          id: {
            not: currentStoreId,
          },
        }),
      },
    });

    if (!store) {
      return slug;
    }

    count += 1;
    slug = `${baseSlug}-${count}`;
  }
};

export const getStoreOwnerCanManage = async (storeId: string, auth: AuthUser) => {
  const store = await prisma.store.findUnique({
    where: {
      id: storeId,
    },
  });

  if (!store) {
    return false;
  }

  if (store.userId && store.userId === auth.userId) {
    return true;
  }

  if (store.organizationId && auth.orgId && store.organizationId === auth.orgId) {
    return await canManageOrganization(auth.userId, store.organizationId);
  }

  return false;
};

export const getStoresService = async (input: ListInput, auth: AuthUser) => {
  const page = input.page || 1;
  const limit = input.limit || 20;
  const skip = (page - 1) * limit;
  const where: Prisma.StoreWhereInput = {
    isActive: true,
  };

  if (input.search) {
    where.OR = [
      {
        name: {
          contains: input.search,
          mode: "insensitive",
        },
      },
      {
        city: {
          contains: input.search,
          mode: "insensitive",
        },
      },
    ];
  }

  if (input.category) where.category = input.category as Prisma.EnumStoreCategoryFilter<"Store">;
  if (input.countryCode) where.countryCode = input.countryCode;
  if (input.city) where.city = { contains: input.city, mode: "insensitive" };
  if (input.mine && auth.orgId) where.organizationId = auth.orgId;
  if (input.mine && !auth.orgId) where.userId = auth.userId;

  const stores = await prisma.store.findMany({
    where,
    include: storeInclude,
    skip,
    take: limit,
    orderBy: {
      createdAt: "desc",
    },
  });

  const total = await prisma.store.count({
    where,
  });

  return {
    stores,
    total,
    page,
    limit,
  };
};

export const createStoreService = async (auth: AuthUser, data: Prisma.StoreUncheckedCreateInput) => {
  return await prisma.store.create({
    data,
    include: storeInclude,
  });
};

export const findStoreById = async (id: string) => {
  return await prisma.store.findFirst({
    where: {
      id,
      isActive: true,
    },
    include: storeInclude,
  });
};

export const updateStoreService = async (id: string, data: Prisma.StoreUncheckedUpdateInput) => {
  return await prisma.store.update({
    where: {
      id,
    },
    data,
    include: storeInclude,
  });
};

export const deleteStoreService = async (id: string) => {
  return await prisma.store.update({
    where: {
      id,
    },
    data: {
      isActive: false,
    },
  });
};

export const getProductsByStoreIdService = async (storeId: string, input: ListInput) => {
  const page = input.page || 1;
  const limit = input.limit || 20;
  const skip = (page - 1) * limit;
  const where: Prisma.ProductWhereInput = {
    storeId,
    isActive: true,
  };

  if (input.search) {
    where.OR = [
      {
        name: {
          contains: input.search,
          mode: "insensitive",
        },
      },
      {
        sku: {
          contains: input.search,
          mode: "insensitive",
        },
      },
    ];
  }

  const products = await prisma.product.findMany({
    where,
    include: productInclude,
    skip,
    take: limit,
    orderBy: {
      createdAt: "desc",
    },
  });

  const total = await prisma.product.count({
    where,
  });

  return {
    products,
    total,
    page,
    limit,
  };
};

export const createProductService = async (data: Prisma.ProductUncheckedCreateInput) => {
  return await prisma.product.create({
    data,
    include: productInclude,
  });
};

export const findProductById = async (storeId: string, id: string) => {
  return await prisma.product.findFirst({
    where: {
      id,
      storeId,
      isActive: true,
    },
    include: productInclude,
  });
};

export const updateProductService = async (id: string, data: Prisma.ProductUncheckedUpdateInput) => {
  return await prisma.product.update({
    where: {
      id,
    },
    data,
    include: productInclude,
  });
};

export const deleteProductService = async (id: string) => {
  return await prisma.product.update({
    where: {
      id,
    },
    data: {
      isActive: false,
    },
  });
};

export const getTradePartnersByStoreIdService = async (storeId: string) => {
  return await prisma.tradePartner.findMany({
    where: {
      storeId,
      isActive: true,
    },
    include: tradePartnerInclude,
    orderBy: [
      {
        isPrimary: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
  });
};

export const createTradePartnerService = async (data: Prisma.TradePartnerUncheckedCreateInput) => {
  if (data.isPrimary) {
    await prisma.tradePartner.updateMany({
      where: {
        storeId: data.storeId,
      },
      data: {
        isPrimary: false,
      },
    });
  }

  return await prisma.tradePartner.create({
    data,
    include: tradePartnerInclude,
  });
};

export const findTradePartnerById = async (storeId: string, id: string) => {
  return await prisma.tradePartner.findFirst({
    where: {
      id,
      storeId,
      isActive: true,
    },
    include: tradePartnerInclude,
  });
};

export const updateTradePartnerService = async (
  storeId: string,
  id: string,
  data: Prisma.TradePartnerUncheckedUpdateInput,
) => {
  if (data.isPrimary === true) {
    await prisma.tradePartner.updateMany({
      where: {
        storeId,
      },
      data: {
        isPrimary: false,
      },
    });
  }

  return await prisma.tradePartner.update({
    where: {
      id,
    },
    data,
    include: tradePartnerInclude,
  });
};

export const deleteTradePartnerService = async (id: string) => {
  return await prisma.tradePartner.update({
    where: {
      id,
    },
    data: {
      isActive: false,
      isPrimary: false,
    },
  });
};
