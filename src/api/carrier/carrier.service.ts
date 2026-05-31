import { prisma } from "../../lib/prisma";
import type { Prisma } from "../../generated/prisma/client";

type AuthUser = {
  userId: string;
  orgId?: string | undefined;
};

type VesselListInput = {
  search?: string;
  type?: string;
  carrierId?: string;
  page?: number;
  limit?: number;
};

type PortListInput = {
  search?: string;
  countryCode?: string;
  page?: number;
  limit?: number;
};

const vesselInclude = {
  carrier: true,
  cargoPools: {
    include: {
      departurePort: true,
      arrivalPort: true,
    },
    orderBy: {
      createdAt: "desc" as const,
    },
    take: 10,
  },
};

const vesselDetailInclude = {
  carrier: true,
  cargoPools: {
    include: {
      departurePort: true,
      arrivalPort: true,
      route: true,
    },
    orderBy: {
      createdAt: "desc" as const,
    },
  },
  shipments: {
    include: {
      originPort: true,
      destinationPort: true,
      shipmentEvents: {
        include: {
          port: true,
        },
        orderBy: {
          occurredAt: "desc" as const,
        },
        take: 10,
      },
    },
    orderBy: {
      createdAt: "desc" as const,
    },
    take: 20,
  },
};

const getAllocationScopeWhere = (auth: AuthUser): Prisma.CargoAllocationWhereInput => {
  return auth.orgId ? { organizationId: auth.orgId } : { createdByUserId: auth.userId };
};

export const getVesselsService = async (input: VesselListInput) => {
  const page = input.page || 1;
  const limit = input.limit || 20;
  const skip = (page - 1) * limit;
  const where: Prisma.VesselWhereInput = {
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
        imoNumber: {
          contains: input.search,
          mode: "insensitive",
        },
      },
      {
        carrier: {
          name: {
            contains: input.search,
            mode: "insensitive",
          },
        },
      },
    ];
  }

  if (input.type) where.type = input.type as Prisma.EnumVesselTypeFilter<"Vessel">;
  if (input.carrierId) where.carrierId = input.carrierId;

  const vessels = await prisma.vessel.findMany({
    where,
    include: vesselInclude,
    skip,
    take: limit,
    orderBy: {
      createdAt: "desc",
    },
  });

  const total = await prisma.vessel.count({
    where,
  });

  return {
    vessels,
    total,
    page,
    limit,
  };
};

export const findVesselById = async (id: string) => {
  return await prisma.vessel.findFirst({
    where: {
      id,
      isActive: true,
    },
    include: vesselDetailInclude,
  });
};

export const getPortsService = async (input: PortListInput) => {
  const page = input.page || 1;
  const limit = input.limit || 50;
  const skip = (page - 1) * limit;
  const where: Prisma.PortWhereInput = {};

  if (input.search) {
    where.OR = [
      {
        name: {
          contains: input.search,
          mode: "insensitive",
        },
      },
      {
        code: {
          contains: input.search,
          mode: "insensitive",
        },
      },
    ];
  }

  if (input.countryCode) where.countryCode = input.countryCode;

  const ports = await prisma.port.findMany({
    where,
    skip,
    take: limit,
    orderBy: [
      {
        countryCode: "asc",
      },
      {
        name: "asc",
      },
    ],
  });

  const total = await prisma.port.count({
    where,
  });

  return {
    ports,
    total,
    page,
    limit,
  };
};

export const getVesselAndPortLocationsService = async (auth: AuthUser) => {
  const shipmentWhere: Prisma.ShipmentWhereInput = {
    cargoPool: {
      cargoAllocations: {
        some: getAllocationScopeWhere(auth),
      },
    },
  };

  const [ports, vessels, shipments] = await Promise.all([
    prisma.port.findMany({
      orderBy: [
        {
          countryCode: "asc",
        },
        {
          name: "asc",
        },
      ],
    }),
    prisma.vessel.findMany({
      where: {
        isActive: true,
        currentLat: {
          not: null,
        },
        currentLng: {
          not: null,
        },
      },
      include: {
        carrier: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    }),
    prisma.shipment.findMany({
      where: shipmentWhere,
      include: {
        originPort: true,
        destinationPort: true,
        carrier: true,
        vessel: true,
        cargoPool: {
          include: {
            departurePort: true,
            arrivalPort: true,
            vessel: true,
            cargoAllocations: {
              where: getAllocationScopeWhere(auth),
              include: {
                store: true,
                items: {
                  include: {
                    product: true,
                  },
                },
              },
            },
          },
        },
        shipmentEvents: {
          include: {
            port: true,
          },
          orderBy: {
            occurredAt: "desc",
          },
          take: 5,
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    }),
  ]);

  return {
    ports,
    vessels,
    shipments,
  };
};
