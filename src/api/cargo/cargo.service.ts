import { prisma } from "../../lib/prisma";
import type { Prisma } from "../../generated/prisma/client";

type AuthUser = {
  userId: string;
  orgId?: string | undefined;
};

type CargoItemInput = {
  productId: string;
  quantity: number;
  quantityUnit?: string;
};

type ListInput = {
  status?: string;
  storeId?: string;
  page?: number;
  limit?: number;
};

const cargoAllocationInclude = {
  store: true,
  cargoPool: {
    include: {
      departurePort: true,
      arrivalPort: true,
      vessel: true,
    },
  },
  items: {
    include: {
      product: true,
    },
    orderBy: {
      createdAt: "desc" as const,
    },
  },
  landedCostBreakdown: true,
  paymentIntents: {
    orderBy: {
      createdAt: "desc" as const,
    },
  },
  manifestDocuments: {
    orderBy: {
      createdAt: "desc" as const,
    },
  },
};

const getScopedAllocationWhere = (id: string, auth: AuthUser): Prisma.CargoAllocationWhereInput => {
  return {
    id,
    ...(auth.orgId ? { organizationId: auth.orgId } : { createdByUserId: auth.userId }),
  };
};

const getAllocationScopeWhere = (auth: AuthUser): Prisma.CargoAllocationWhereInput => {
  return auth.orgId ? { organizationId: auth.orgId } : { createdByUserId: auth.userId };
};

const getQuantityUnit = (item: CargoItemInput, productUnit: string) => {
  return (item.quantityUnit || productUnit) as Prisma.CargoAllocationItemUncheckedCreateInput["quantityUnit"];
};

export const findUserById = async (id: string) => {
  return await prisma.user.findUnique({
    where: {
      id,
    },
  });
};

export const findStoreById = async (id: string) => {
  return await prisma.store.findFirst({
    where: {
      id,
      isActive: true,
    },
  });
};

export const findProductsForStore = async (storeId: string, productIds: string[]) => {
  return await prisma.product.findMany({
    where: {
      id: {
        in: productIds,
      },
      storeId,
      isActive: true,
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

export const canCreateOrganizationCargo = async (userId: string, organizationId: string) => {
  const membership = await findMembership(userId, organizationId);
  return membership?.role === "OWNER" || membership?.role === "ADMIN" || membership?.role === "OPS_MANAGER";
};

export const getCargoAllocationsService = async (auth: AuthUser, input: ListInput) => {
  const page = input.page || 1;
  const limit = input.limit || 20;
  const skip = (page - 1) * limit;
  const where: Prisma.CargoAllocationWhereInput = {
    ...getAllocationScopeWhere(auth),
    ...(input.status && { status: input.status as Prisma.EnumShipmentStatusFilter<"CargoAllocation"> }),
    ...(input.storeId && { storeId: input.storeId }),
  };

  const cargoAllocations = await prisma.cargoAllocation.findMany({
    where,
    include: cargoAllocationInclude,
    skip,
    take: limit,
    orderBy: {
      createdAt: "desc",
    },
  });

  const total = await prisma.cargoAllocation.count({
    where,
  });

  return {
    cargoAllocations,
    total,
    page,
    limit,
  };
};

export const findCargoAllocationById = async (id: string, auth: AuthUser) => {
  return await prisma.cargoAllocation.findFirst({
    where: getScopedAllocationWhere(id, auth),
    include: cargoAllocationInclude,
  });
};

export const createCargoAllocationService = async (
  auth: AuthUser,
  data: {
    storeId: string;
    currencyCode: string;
    items: CargoItemInput[];
  },
) => {
  const productIds = data.items.map((item) => item.productId);
  const products = await findProductsForStore(data.storeId, productIds);
  const productById = new Map(products.map((product) => [product.id, product]));

  return await prisma.$transaction(async (tx) => {
    const cargoAllocation = await tx.cargoAllocation.create({
      data: {
        organizationId: auth.orgId || null,
        createdByUserId: auth.userId,
        storeId: data.storeId,
        status: "DRAFT",
        currencyCode: data.currencyCode,
        items: {
          create: data.items.map((item) => {
            const product = productById.get(item.productId);
            return {
              productId: item.productId,
              quantity: item.quantity,
              quantityUnit: getQuantityUnit(item, product?.pricingUnit || "UNIT"),
            };
          }),
        },
      },
      include: cargoAllocationInclude,
    });

    return cargoAllocation;
  });
};

export const updateCargoAllocationService = async (
  id: string,
  auth: AuthUser,
  data: {
    storeId?: string;
    currencyCode?: string;
    items?: CargoItemInput[];
  },
) => {
  const existingAllocation = await findCargoAllocationById(id, auth);
  if (!existingAllocation) {
    return null;
  }

  if (existingAllocation.status !== "DRAFT") {
    return "INVALID_STATUS" as const;
  }

  if (existingAllocation.cargoPool && existingAllocation.cargoPool.status !== "DRAFT") {
    return "POOL_LOCKED" as const;
  }

  const storeId = data.storeId || existingAllocation.storeId;
  const products = data.items ? await findProductsForStore(storeId, data.items.map((item) => item.productId)) : [];
  const productById = new Map(products.map((product) => [product.id, product]));

  return await prisma.$transaction(async (tx) => {
    if (data.items) {
      await tx.cargoAllocationItem.deleteMany({
        where: {
          cargoAllocationId: id,
        },
      });
    }

    return await tx.cargoAllocation.update({
      where: {
        id,
      },
      data: {
        ...(data.storeId !== undefined && { storeId: data.storeId }),
        ...(data.currencyCode !== undefined && { currencyCode: data.currencyCode }),
        ...(data.items && {
          items: {
            create: data.items.map((item) => {
              const product = productById.get(item.productId);
              return {
                productId: item.productId,
                quantity: item.quantity,
                quantityUnit: getQuantityUnit(item, product?.pricingUnit || "UNIT"),
              };
            }),
          },
        }),
      },
      include: cargoAllocationInclude,
    });
  });
};

export const cancelCargoAllocationService = async (id: string, auth: AuthUser) => {
  const allocation = await findCargoAllocationById(id, auth);
  if (!allocation) {
    return null;
  }

  if (allocation.cargoPool?.status === "CLOSED") {
    return "POOL_CLOSED" as const;
  }

  const paymentIntentIds = allocation.paymentIntents.map((intent) => intent.id);

  return await prisma.$transaction(async (tx) => {
    await tx.paymentIntent.updateMany({
      where: {
        cargoAllocationId: id,
        status: {
          in: ["PENDING", "AUTHORIZED"],
        },
      },
      data: {
        status: "CANCELLED",
      },
    });

    await tx.paymentIntent.updateMany({
      where: {
        cargoAllocationId: id,
        status: "PAID",
      },
      data: {
        status: "REFUNDED",
      },
    });

    //automate refund to user here

    if (paymentIntentIds.length > 0) {
      await tx.escrowRecord.updateMany({
        where: {
          paymentIntentId: {
            in: paymentIntentIds,
          },
          status: {
            in: ["NOT_STARTED", "HOLDING", "DISPUTED"],
          },
        },
        data: {
          status: "REFUNDED",
        },
      });
    }

    return await tx.cargoAllocation.update({
      where: {
        id,
      },
      data: {
        status: "CANCELLED",
      },
      include: cargoAllocationInclude,
    });
  });
};
