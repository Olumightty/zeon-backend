import { prisma } from "../../lib/prisma";
import type { Prisma } from "../../generated/prisma/client";

type AuthUser = {
  userId: string;
  orgId?: string | undefined;
};

type ListInput = {
  status?: string;
  page?: number;
  limit?: number;
};

const getAllocationScopeWhere = (auth: AuthUser): Prisma.CargoAllocationWhereInput => {
  return auth.orgId ? { organizationId: auth.orgId } : { createdByUserId: auth.userId };
};

const getShipmentScopeWhere = (auth: AuthUser): Prisma.ShipmentWhereInput => {
  return {
    cargoPool: {
      cargoAllocations: {
        some: getAllocationScopeWhere(auth),
      },
    },
  };
};

const getShipmentInclude = (auth: AuthUser) => {
  return {
    originPort: true,
    destinationPort: true,
    carrier: true,
    vessel: true,
    shipmentEvents: {
      include: {
        port: true,
      },
      orderBy: {
        occurredAt: "desc" as const,
      },
    },
    manifestDocuments: {
      where: {
        cargoAllocation: getAllocationScopeWhere(auth),
      },
      orderBy: {
        generatedAt: "desc" as const,
      },
    },
    cargoPool: {
      include: {
        departurePort: true,
        arrivalPort: true,
        vessel: true,
        cargoAllocations: {
          where: getAllocationScopeWhere(auth),
          include: {
            store: true,
            organization: true,
            createdByUser: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
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
              where: {
                documentType: "MANIFEST" as const,
              },
              orderBy: {
                generatedAt: "desc" as const,
              },
            },
          },
        },
      },
    },
  };
};

type ScopedShipment = NonNullable<Awaited<ReturnType<typeof findShipmentById>>>;

const getScopedAllocationIds = (shipment: ScopedShipment) => {
  return shipment.cargoPool.cargoAllocations.map((allocation) => allocation.id);
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

export const canGenerateShipmentManifest = async (userId: string, organizationId: string) => {
  const membership = await findMembership(userId, organizationId);
  return membership?.role === "OWNER" || membership?.role === "ADMIN" || membership?.role === "OPS_MANAGER";
};

export const getShipmentsService = async (auth: AuthUser, input: ListInput) => {
  const page = input.page || 1;
  const limit = input.limit || 20;
  const skip = (page - 1) * limit;
  const where: Prisma.ShipmentWhereInput = {
    ...getShipmentScopeWhere(auth),
    ...(input.status && { status: input.status as Prisma.EnumShipmentStatusFilter<"Shipment"> }),
  };

  const shipments = await prisma.shipment.findMany({
    where,
    include: getShipmentInclude(auth),
    skip,
    take: limit,
    orderBy: {
      createdAt: "desc",
    },
  });

  const total = await prisma.shipment.count({
    where,
  });

  return {
    shipments,
    total,
    page,
    limit,
  };
};

export const findShipmentById = async (id: string, auth: AuthUser) => {
  return await prisma.shipment.findFirst({
    where: {
      id,
      ...getShipmentScopeWhere(auth),
    },
    include: getShipmentInclude(auth),
  });
};

export const createShipmentManifestService = async (shipment: ScopedShipment) => {
  const allocationIds = getScopedAllocationIds(shipment);

  if (allocationIds.length === 0) {
    return [];
  }

  return await prisma.$transaction(async (tx) => {
    const documents = [];

    for (const allocationId of allocationIds) {
      const storageKey = `manifests/${shipment.referenceCode}/${allocationId}.json`;
      const existingDocument = await tx.manifestDocument.findUnique({
        where: {
          storageKey,
        },
      });

      if (existingDocument) {
        documents.push(existingDocument);
        continue;
      }

      const document = await tx.manifestDocument.create({
        data: {
          shipmentId: shipment.id,
          cargoAllocationId: allocationId,
          documentType: "MANIFEST",
          storageKey,
          mimeType: "application/json",
        },
      });

      documents.push(document);
    }

    return documents;
  });
};

export const getShipmentManifestDocumentsService = async (shipment: ScopedShipment) => {
  const allocationIds = getScopedAllocationIds(shipment);
  if (allocationIds.length === 0) {
    return [];
  }

  return await prisma.manifestDocument.findMany({
    where: {
      shipmentId: shipment.id,
      cargoAllocationId: {
        in: allocationIds,
      },
      documentType: "MANIFEST",
    },
    orderBy: {
      generatedAt: "desc",
    },
  });
};

export const buildShipmentManifestPayload = (
  shipment: ScopedShipment,
  documents: Awaited<ReturnType<typeof getShipmentManifestDocumentsService>>,
) => {
  return {
    shipment: {
      id: shipment.id,
      referenceCode: shipment.referenceCode,
      status: shipment.status,
      originPort: shipment.originPort,
      destinationPort: shipment.destinationPort,
      carrier: shipment.carrier,
      vessel: shipment.vessel,
      bookedAt: shipment.bookedAt,
      departedAt: shipment.departedAt,
      arrivedAt: shipment.arrivedAt,
      deliveredAt: shipment.deliveredAt,
    },
    cargoPool: {
      id: shipment.cargoPool.id,
      status: shipment.cargoPool.status,
      departurePort: shipment.cargoPool.departurePort,
      arrivalPort: shipment.cargoPool.arrivalPort,
      departureEtaAt: shipment.cargoPool.departureEtaAt,
      arrivalEtaAt: shipment.cargoPool.arrivalEtaAt,
      totalCapacityUnits: shipment.cargoPool.totalCapacityUnits,
      reservedCapacityUnits: shipment.cargoPool.reservedCapacityUnits,
    },
    cargoAllocations: shipment.cargoPool.cargoAllocations,
    events: shipment.shipmentEvents,
    documents,
    generatedAt: new Date().toISOString(),
  };
};
