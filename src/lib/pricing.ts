import type { OrderData, PriceBreakdown } from "@/types/order";

const VAT_RATE = 0.21; // 21% BTW

// Video pricing
const VIDEO_PACKAGES = {
  Starter: 250,
  Standard: 350,
  Premium: 450,
};

const VIDEO_ADDONS = {
  voiceOver: 75,
  twilight: 70,
  extraSocialCut: 45,
  rush24h: 100,
};

// 2D Floor Plans pricing
const PLAN_2D_BASE = {
  1: 240, // Basic
  2: 390, // Duo
  3: 540, // Trio
};

const PLAN_2D_ADDONS = {
  extraLevel: 150,
  largeLevel: 40, // Per level >150m²
  editableDWG: 45,
  rush24h: 60,
};

// 3D Floor Plans pricing
const PLAN_3D_QUALITY = {
  Basic: 300,
  Enhanced: 500,
  Photoreal: 800,
};

const PLAN_3D_ADDONS = {
  twilight: 70,
  flyThrough: 250,
};

export function calculateOrderPrice(orderData: OrderData) {
  const breakdown: any = {
    services: {},
    addons: {},
  };

  let subtotal = 0;

  // Calculate Video pricing
  if (orderData.services.includes("Property Video") && orderData.videoConfig) {
    const config = orderData.videoConfig;
    const packagePrice = VIDEO_PACKAGES[config.package];
    breakdown.services["Property Video"] = packagePrice;
    subtotal += packagePrice;

    if (config.voiceOver) {
      breakdown.addons["Voice Over"] = VIDEO_ADDONS.voiceOver;
      subtotal += VIDEO_ADDONS.voiceOver;
    }
    if (config.twilight) {
      breakdown.addons["Twilight"] = VIDEO_ADDONS.twilight;
      subtotal += VIDEO_ADDONS.twilight;
    }
    if (config.extraSocialCut) {
      breakdown.addons["Extra Social Cut"] = VIDEO_ADDONS.extraSocialCut;
      subtotal += VIDEO_ADDONS.extraSocialCut;
    }
    if (config.rush24h) {
      breakdown.addons["Rush 24h"] = VIDEO_ADDONS.rush24h;
      subtotal += VIDEO_ADDONS.rush24h;
    }
  }

  // Calculate 2D Floor Plans pricing
  if (orderData.services.includes("2D Floor Plans") && orderData.plan2dConfig) {
    const config = orderData.plan2dConfig;
    let price = 0;

    // Base price for up to 3 levels
    if (config.levels <= 3) {
      price = PLAN_2D_BASE[config.levels as 1 | 2 | 3];
    } else {
      // Trio base + extra levels
      price = PLAN_2D_BASE[3] + (config.levels - 3) * PLAN_2D_ADDONS.extraLevel;
    }

    // Large level surcharge
    if (config.squareMetersPerLevel > 150) {
      price += config.levels * PLAN_2D_ADDONS.largeLevel;
    }

    breakdown.services["2D Floor Plans"] = price;
    subtotal += price;

    if (config.editableDWG) {
      breakdown.addons["Editable DWG"] = PLAN_2D_ADDONS.editableDWG;
      subtotal += PLAN_2D_ADDONS.editableDWG;
    }
    if (config.rush24h) {
      const rushKey = "Rush 24h (2D)";
      breakdown.addons[rushKey] = PLAN_2D_ADDONS.rush24h;
      subtotal += PLAN_2D_ADDONS.rush24h;
    }
  }

  // Calculate 3D Floor Plans pricing
  if (orderData.services.includes("3D Floor Plans") && orderData.plan3dConfig) {
    const config = orderData.plan3dConfig;
    const pricePerLevel = PLAN_3D_QUALITY[config.quality];
    const price = pricePerLevel * config.levels;

    breakdown.services["3D Floor Plans"] = price;
    subtotal += price;

    if (config.twilight) {
      const twilightPrice = PLAN_3D_ADDONS.twilight * config.views.length;
      breakdown.addons["Twilight Render"] = twilightPrice;
      subtotal += twilightPrice;
    }
    if (config.flyThrough) {
      breakdown.addons["Fly-through"] = PLAN_3D_ADDONS.flyThrough;
      subtotal += PLAN_3D_ADDONS.flyThrough;
    }
  }

  const vat = subtotal * VAT_RATE;
  const total = subtotal + vat;

  return {
    breakdown,
    totalExclVat: Number(subtotal.toFixed(2)),
    vatRate: VAT_RATE,
    vatAmount: Number(vat.toFixed(2)),
    totalInclVat: Number(total.toFixed(2)),
  };
}
