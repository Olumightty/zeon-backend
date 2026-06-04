import { prisma } from "../../lib/prisma";
import { createPayIn } from "./payment.provider";

type AuthUser = {
  userId: string;
  orgId?: string | undefined;
};

type CheckoutCostInput = {
  tariffRateBps?: number;
  customsFeeMinor?: number;
  vatRateBps?: number;
  otherFeeMinor?: number;
};

type UpdateCostBreakdownInput = {
  baseCostMinor?: number;
  tariffRateBps?: number;
  customsFeeMinor?: number;
  vatRateBps?: number;
  otherFeeMinor?: number;
};

const paymentIntentInclude = {
  cargoAllocation: {
    include: {
      store: true,
      landedCostBreakdown: true,
      items: {
        include: {
          product: true,
        },
      },
      cargoPool: true,
    },
  },
  escrowRecord: true,
  user: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  },
  organization: true,
};

const getPaymentIntentScopeWhere = (id: string, auth: AuthUser) => {
  return {
    id,
    cargoAllocation: auth.orgId ? { organizationId: auth.orgId } : { createdByUserId: auth.userId },
  };
};

const minorFromBps = (amountMinor: bigint, bps: number) => {
  return (amountMinor * BigInt(bps)) / 10000n;
};

const getPayerName = (user: { firstName: string | null; lastName: string | null; email: string }) => {
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return name || user.email;
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

export const canManageStoreCostBreakdown = async (
  auth: AuthUser,
  store: {
    userId: string | null;
    organizationId: string | null;
  },
) => {
  if (store.userId && store.userId === auth.userId) {
    return true;
  }

  if (store.organizationId && auth.orgId && store.organizationId === auth.orgId) {
    const membership = await findMembership(auth.userId, store.organizationId);
    return membership?.role === "OWNER" || membership?.role === "ADMIN" || membership?.role === "FINANCE";
  }

  return false;
};

export const findCargoAllocationForCostBreakdown = async (id: string) => {
  return await prisma.cargoAllocation.findUnique({
    where: {
      id,
    },
    include: {
      store: true,
      landedCostBreakdown: true,
      paymentIntents: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });
};

export const createLandedCostBreakdownService = async (
  cargoAllocation: {
    id: string;
    currencyCode: string;
    items: {
      quantity: unknown;
      product: {
        priceAmountMinor: bigint;
      };
    }[];
  },
  input: CheckoutCostInput,
) => {
  const tariffRateBps = input.tariffRateBps ?? 500;
  const customsFeeMinor = BigInt(input.customsFeeMinor ?? 150000);
  const vatRateBps = input.vatRateBps ?? 750;
  const otherFeeMinor = BigInt(input.otherFeeMinor ?? 0);
  const baseCostMinor = cargoAllocation.items.reduce((total, item) => {
    const quantity = Number(item.quantity);
    return total + BigInt(Math.round(Number(item.product.priceAmountMinor) * quantity));
  }, 0n);
  const tariffAmountMinor = minorFromBps(baseCostMinor, tariffRateBps);
  const vatAmountMinor = minorFromBps(baseCostMinor + tariffAmountMinor + customsFeeMinor + otherFeeMinor, vatRateBps);
  const totalAmountMinor = baseCostMinor + tariffAmountMinor + customsFeeMinor + vatAmountMinor + otherFeeMinor;

  return await prisma.landedCostBreakdown.upsert({
    where: {
      cargoAllocationId: cargoAllocation.id,
    },
    update: {
      baseCostMinor,
      tariffRateBps,
      tariffAmountMinor,
      customsFeeMinor,
      vatRateBps,
      vatAmountMinor,
      otherFeeMinor,
      totalAmountMinor,
      currencyCode: cargoAllocation.currencyCode,
    },
    create: {
      cargoAllocationId: cargoAllocation.id,
      baseCostMinor,
      tariffRateBps,
      tariffAmountMinor,
      customsFeeMinor,
      vatRateBps,
      vatAmountMinor,
      otherFeeMinor,
      totalAmountMinor,
      currencyCode: cargoAllocation.currencyCode,
    },
  });
};

export const updateCostBreakdownService = async (
  cargoAllocationId: string,
  auth: AuthUser,
  input: UpdateCostBreakdownInput,
) => {
  const cargoAllocation = await findCargoAllocationForCostBreakdown(cargoAllocationId);
  if (!cargoAllocation) {
    return null;
  }

  const canManageBreakdown = await canManageStoreCostBreakdown(auth, cargoAllocation.store);
  if (!canManageBreakdown) {
    return "FORBIDDEN" as const;
  }

  if (cargoAllocation.status !== "DRAFT") {
    return "INVALID_STATUS" as const;
  }

  if (!cargoAllocation.landedCostBreakdown) {
    return "BREAKDOWN_NOT_FOUND" as const;
  }

  const baseCostMinor = BigInt(input.baseCostMinor ?? Number(cargoAllocation.landedCostBreakdown.baseCostMinor));
  const tariffRateBps = input.tariffRateBps ?? cargoAllocation.landedCostBreakdown.tariffRateBps;
  const customsFeeMinor = BigInt(input.customsFeeMinor ?? Number(cargoAllocation.landedCostBreakdown.customsFeeMinor));
  const vatRateBps = input.vatRateBps ?? cargoAllocation.landedCostBreakdown.vatRateBps;
  const otherFeeMinor = BigInt(input.otherFeeMinor ?? Number(cargoAllocation.landedCostBreakdown.otherFeeMinor));
  const tariffAmountMinor = minorFromBps(baseCostMinor, tariffRateBps);
  const vatAmountMinor = minorFromBps(baseCostMinor + tariffAmountMinor + customsFeeMinor + otherFeeMinor, vatRateBps);
  const totalAmountMinor = baseCostMinor + tariffAmountMinor + customsFeeMinor + vatAmountMinor + otherFeeMinor;

  return await prisma.landedCostBreakdown.update({
    where: {
      cargoAllocationId,
    },
    data: {
      baseCostMinor,
      tariffRateBps,
      tariffAmountMinor,
      customsFeeMinor,
      vatRateBps,
      vatAmountMinor,
      otherFeeMinor,
      totalAmountMinor,
    },
  });
};

export const createPaymentIntentService = async (
  auth: AuthUser,
  data: {
    cargoAllocationId: string;
    amountMinor: bigint;
    currencyCode: string;
    description: string;
  },
) => {
  const user = await findUserById(auth.userId);
  if (!user) {
    return "USER_NOT_FOUND" as const;
  }

  const payIn = await createPayIn({
    amount: Number(data.amountMinor) / 100,
    description: data.description,
    payerName: getPayerName(user),
    payerEmail: user.email,
  });

  if (!payIn) {
    return "PROVIDER_FAILED" as const;
  }

  return await prisma.$transaction(async (tx) => {
    await tx.paymentIntent.updateMany({
      where: {
        cargoAllocationId: data.cargoAllocationId,
        status: "PENDING",
      },
      data: {
        status: "CANCELLED",
      },
    });

    const paymentIntent = await tx.paymentIntent.create({
      data: {
        userId: auth.orgId ? null : auth.userId,
        organizationId: auth.orgId || null,
        cargoAllocationId: data.cargoAllocationId,
        provider: "KORA",
        providerReference: payIn.data.reference,
        amountMinor: data.amountMinor,
        currencyCode: data.currencyCode,
        checkoutUrl: payIn.data.checkout_url,
        status: "PENDING",
      },
      include: paymentIntentInclude,
    });

    await tx.cargoAllocation.update({
      where: {
        id: data.cargoAllocationId,
      },
      data: {
        status: "AWAITING_PAYMENT",
        quotedAmountMinor: data.amountMinor,
        finalAmountMinor: data.amountMinor,
      },
    });

    return paymentIntent;
  });
};

export const findPaymentIntentById = async (id: string, auth: AuthUser) => {
  return await prisma.paymentIntent.findFirst({
    where: getPaymentIntentScopeWhere(id, auth),
    include: paymentIntentInclude,
  });
};

export const findPaymentIntentByProviderReference = async (providerReference: string) => {
  return await prisma.paymentIntent.findUnique({
    where: {
      providerReference,
    },
    include: paymentIntentInclude,
  });
};

export const markPaymentIntentPaidService = async (
  id: string,
  data: {
    heldAmountMinor: bigint;
    releaseCondition?: string;
  },
) => {
  return await prisma.$transaction(async (tx) => {
    const paymentIntent = await tx.paymentIntent.update({
      where: {
        id,
      },
      data: {
        status: "PAID",
      },
      include: paymentIntentInclude,
    });

    await tx.escrowRecord.upsert({
      where: {
        paymentIntentId: id,
      },
      update: {
        status: "HOLDING",
        heldAmountMinor: data.heldAmountMinor,
        releaseCondition: data.releaseCondition || null,
      },
      create: {
        paymentIntentId: id,
        status: "HOLDING",
        heldAmountMinor: data.heldAmountMinor,
        releaseCondition: data.releaseCondition || null,
      },
    });

    return paymentIntent;
  });
};

export const cancelPaymentIntentService = async (id: string, auth: AuthUser) => {
  const paymentIntent = await findPaymentIntentById(id, auth);
  if (!paymentIntent) {
    return null;
  }

  if (paymentIntent.status !== "PENDING" && paymentIntent.status !== "AUTHORIZED") {
    return "INVALID_STATUS" as const;
  }

  if (paymentIntent.cargoAllocation.cargoPool?.status === "CLOSED") {
    return "POOL_CLOSED" as const;
  }

  return await prisma.$transaction(async (tx) => {
    await tx.paymentIntent.update({
      where: {
        id,
      },
      data: {
        status: "CANCELLED",
      },
    });

    await tx.cargoAllocation.update({
      where: {
        id: paymentIntent.cargoAllocationId,
      },
      data: {
        status: "DRAFT",
      },
    });

    return await tx.paymentIntent.findUnique({
      where: {
        id,
      },
      include: paymentIntentInclude,
    });
  });
};

export const findEscrowByPaymentIntentId = async (intentId: string, auth: AuthUser) => {
  return await prisma.escrowRecord.findFirst({
    where: {
      paymentIntentId: intentId,
      paymentIntent: {
        cargoAllocation: auth.orgId ? { organizationId: auth.orgId } : { createdByUserId: auth.userId },
      },
    },
    include: {
      paymentIntent: {
        include: paymentIntentInclude,
      },
    },
  });
};
