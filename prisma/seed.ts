import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

const prisma = new PrismaClient({ adapter: new PrismaPg(url) });

async function main() {
  // ── Roles ───────────────────────────────────────────────────────
  await prisma.role.createMany({
    data: [
      { code: "admin",             label: "Admin",             isAdmin: true  },
      { code: "warehouse_manager", label: "Warehouse manager", isAdmin: false },
      { code: "storekeeper",       label: "Storekeeper",       isAdmin: false },
      { code: "engineer",          label: "Engineer",          isAdmin: false },
    ],
    skipDuplicates: true,
  });

  // ── Departments ─────────────────────────────────────────────────
  await prisma.department.createMany({
    data: [
      { code: "operations",  label: "Operations"  },
      { code: "civil",       label: "Civil"       },
      { code: "engineering", label: "Engineering" },
      { code: "procurement", label: "Procurement" },
      { code: "production",  label: "Production"  },
    ],
    skipDuplicates: true,
  });

  // ── Regions ─────────────────────────────────────────────────────
  await prisma.region.createMany({
    data: [
      { code: "greater_accra", label: "Greater Accra" },
      { code: "ashanti",       label: "Ashanti"       },
      { code: "volta",         label: "Volta"         },
      { code: "bono",          label: "Bono"          },
      { code: "eastern",       label: "Eastern"       },
      { code: "western",       label: "Western"       },
      { code: "central",       label: "Central"       },
      { code: "northern",      label: "Northern"      },
    ],
    skipDuplicates: true,
  });

  // ── Categories ──────────────────────────────────────────────────
  await prisma.category.createMany({
    data: [
      { code: "structural",       label: "Structural",       isMaintenance: false },
      { code: "finishing",        label: "Finishing",        isMaintenance: false },
      { code: "electrical",       label: "Electrical",       isMaintenance: false },
      { code: "mechanical_parts", label: "Mechanical Parts", isMaintenance: true  },
      { code: "hvac_parts",       label: "HVAC Parts",       isMaintenance: true  },
      { code: "electrical_parts", label: "Electrical Parts", isMaintenance: true  },
      { code: "safety_ppe",       label: "Safety / PPE",     isMaintenance: false },
    ],
    skipDuplicates: true,
  });

  // ── Units ───────────────────────────────────────────────────────
  await prisma.unit.createMany({
    data: [
      { code: "bags",      label: "Bags"      },
      { code: "pieces",    label: "Pieces",    symbol: "pcs" },
      { code: "litres",    label: "Litres",    symbol: "L"   },
      { code: "metres",    label: "Metres",    symbol: "m"   },
      { code: "kilograms", label: "Kilograms", symbol: "kg"  },
      { code: "trips",     label: "Trips"     },
    ],
    skipDuplicates: true,
  });

  // ── Storage locations ───────────────────────────────────────────
  await prisma.storageLocation.createMany({
    data: [
      { code: "main_warehouse", label: "Main Warehouse" },
      { code: "site_a",         label: "Site A"         },
      { code: "main_office",    label: "Main Office"    },
    ],
    skipDuplicates: true,
  });

  // ── Sites (linked to regions) ───────────────────────────────────
  const ashanti = await prisma.region.findUnique({ where: { code: "ashanti" } });
  const greaterAccra = await prisma.region.findUnique({ where: { code: "greater_accra" } });

  await prisma.site.createMany({
    data: [
      { code: "site_a",      label: "Site A",      regionId: ashanti?.id      ?? null },
      { code: "main_office", label: "Main Office", regionId: greaterAccra?.id ?? null },
    ],
    skipDuplicates: true,
  });

  // ── Suppliers ───────────────────────────────────────────────────
  await prisma.supplier.createMany({
    data: [
      { name: "GHACEM Ltd"      },
      { name: "Steel Corp"      },
      { name: "ColorPro Ghana"  },
      { name: "Volta Supplies"  },
      { name: "BuildMix Ltd"    },
      { name: "SafetyPro"       },
      { name: "PowerParts Ltd"  },
      { name: "CoolAir Ghana"   },
    ],
    skipDuplicates: true,
  });

  // ── Manufacturers ───────────────────────────────────────────────
  await prisma.manufacturer.createMany({
    data: [{ name: "Cummins" }, { name: "Carrier" }],
    skipDuplicates: true,
  });

  console.log("Seed complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
