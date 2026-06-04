import { VesselType } from '../src/generated/prisma/client';
import { carriers } from "./seed-data/carriers";
import { ports } from "./seed-data/ports";
import { prisma } from '../src/lib/prisma'


async function carrierSeed() {
  await prisma.vessel.deleteMany();
  await prisma.port.deleteMany();
  await prisma.carrier.deleteMany();

  // Create carriers
  const createdCarriers = [];

  for (const carrier of carriers) {
    const created = await prisma.carrier.create({
      data: carrier,
    });

    createdCarriers.push(created);
  }

  // Create vessels
  for (const carrier of createdCarriers) {
    await prisma.vessel.createMany({
      data: [
        {
          carrierId: carrier.id,
          name: `${carrier.name} Ship Alpha`,
          type: VesselType.SHIP,
          capacityTeu: 18000,
          currentLoadTeu: 12000,
        },
        {
          carrierId: carrier.id,
          name: `${carrier.name} Ship Bravo`,
          type: VesselType.SHIP,
          capacityTeu: 14000,
          currentLoadTeu: 8000,
        },
        {
          carrierId: carrier.id,
          name: `${carrier.name} Cargo Air 01`,
          type: VesselType.PLANE,
          capacityTeu: 500,
          currentLoadTeu: 350,
        },
        {
          carrierId: carrier.id,
          name: `${carrier.name} Rail Express`,
          type: VesselType.TRAIN,
          capacityTeu: 1500,
          currentLoadTeu: 900,
        },
        {
          carrierId: carrier.id,
          name: `${carrier.name} Truck Fleet 01`,
          type: VesselType.TRUCK,
          capacityTeu: 50,
          currentLoadTeu: 35,
        },
      ],
    });
  }

  // Create ports
  await prisma.port.createMany({
    data: ports,
    skipDuplicates: true,
  });

  console.log("✅ Seed complete");
}

carrierSeed()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });