import "dotenv/config";

import { createHash } from "node:crypto";

import bcrypt from "bcrypt";

import {
  CouponRedemptionStatus,
  CouponType,
  IdempotencyStatus,
  InventoryTransactionType,
  OrderStatus,
  PaymentMethod,
  PaymentProvider,
  PaymentStatus,
  PrismaClient,
  ProductStatus,
  ReviewStatus,
  UploadProviderType,
  UserRole,
} from "../src/generated/prisma/client";
import { createMariaDbAdapter } from "../src/config/database.js";

const ADMIN_EMAIL = "admin@f1store.com";
const ADMIN_PASSWORD = "Admin@123";
const CUSTOMER_PASSWORD = "Customer@123";

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is required to run the seed script.");
  }

  return new PrismaClient({ adapter: createMariaDbAdapter(connectionString) });
}

const prisma = createPrismaClient();

const categories = [
  { name: "T-Shirts", slug: "t-shirts", sortOrder: 1 },
  { name: "Polos", slug: "polos", sortOrder: 2 },
  { name: "Jackets", slug: "jackets", sortOrder: 3 },
  { name: "Hoodies", slug: "hoodies", sortOrder: 4 },
  { name: "Caps", slug: "caps", sortOrder: 5 },
  { name: "Accessories", slug: "accessories", sortOrder: 6 },
  { name: "Kids", slug: "kids", sortOrder: 7 },
] as const;

const brands = [
  { name: "Scuderia Ferrari", slug: "ferrari", sortOrder: 1 },
  { name: "Mercedes-AMG Petronas", slug: "mercedes", sortOrder: 2 },
  { name: "Red Bull Racing", slug: "red-bull-racing", sortOrder: 3 },
  { name: "McLaren Racing", slug: "mclaren", sortOrder: 4 },
  { name: "Aston Martin", slug: "aston-martin", sortOrder: 5 },
  { name: "BWT Alpine", slug: "alpine", sortOrder: 6 },
  { name: "Williams Racing", slug: "williams", sortOrder: 7 },
] as const;

const sizes = [
  { name: "XS", slug: "xs", sortOrder: 1 },
  { name: "S", slug: "s", sortOrder: 2 },
  { name: "M", slug: "m", sortOrder: 3 },
  { name: "L", slug: "l", sortOrder: 4 },
  { name: "XL", slug: "xl", sortOrder: 5 },
] as const;

const colors = [
  { name: "Black", slug: "black", hexCode: "#111111", sortOrder: 1 },
  { name: "White", slug: "white", hexCode: "#FFFFFF", sortOrder: 2 },
  { name: "Racing Red", slug: "racing-red", hexCode: "#D71920", sortOrder: 3 },
  { name: "Navy", slug: "navy", hexCode: "#101C3A", sortOrder: 4 },
  { name: "British Green", slug: "british-green", hexCode: "#004225", sortOrder: 5 },
  { name: "Papaya", slug: "papaya", hexCode: "#FF8700", sortOrder: 6 },
  { name: "Team Blue", slug: "team-blue", hexCode: "#0057B8", sortOrder: 7 },
] as const;

type ProductSeed = {
  brandSlug: string;
  categorySlug: string;
  name: string;
  slug: string;
  skuPrefix: string;
  basePrice: number;
  salePrice?: number;
  featured?: boolean;
};

const products: ProductSeed[] = [
  { brandSlug: "ferrari", categorySlug: "t-shirts", name: "Ferrari Race Graphic Tee", slug: "ferrari-race-graphic-tee", skuPrefix: "FER-TEE-001", basePrice: 1290000, salePrice: 1190000, featured: true },
  { brandSlug: "ferrari", categorySlug: "polos", name: "Ferrari Team Polo", slug: "ferrari-team-polo", skuPrefix: "FER-POL-001", basePrice: 2190000, featured: true },
  { brandSlug: "ferrari", categorySlug: "jackets", name: "Ferrari Paddock Jacket", slug: "ferrari-paddock-jacket", skuPrefix: "FER-JAC-001", basePrice: 4690000 },
  { brandSlug: "ferrari", categorySlug: "caps", name: "Ferrari Classic Race Cap", slug: "ferrari-classic-race-cap", skuPrefix: "FER-CAP-001", basePrice: 990000 },
  { brandSlug: "mercedes", categorySlug: "t-shirts", name: "Mercedes Silver Arrows Tee", slug: "mercedes-silver-arrows-tee", skuPrefix: "MER-TEE-001", basePrice: 1350000, featured: true },
  { brandSlug: "mercedes", categorySlug: "polos", name: "Mercedes Team Polo", slug: "mercedes-team-polo", skuPrefix: "MER-POL-001", basePrice: 2250000 },
  { brandSlug: "mercedes", categorySlug: "hoodies", name: "Mercedes Stealth Hoodie", slug: "mercedes-stealth-hoodie", skuPrefix: "MER-HOO-001", basePrice: 3190000, salePrice: 2890000 },
  { brandSlug: "mercedes", categorySlug: "accessories", name: "Mercedes Team Backpack", slug: "mercedes-team-backpack", skuPrefix: "MER-ACC-001", basePrice: 2490000 },
  { brandSlug: "red-bull-racing", categorySlug: "t-shirts", name: "Red Bull Racing Logo Tee", slug: "red-bull-racing-logo-tee", skuPrefix: "RBR-TEE-001", basePrice: 1290000, featured: true },
  { brandSlug: "red-bull-racing", categorySlug: "hoodies", name: "Red Bull Racing Full Zip Hoodie", slug: "red-bull-racing-full-zip-hoodie", skuPrefix: "RBR-HOO-001", basePrice: 3290000 },
  { brandSlug: "red-bull-racing", categorySlug: "caps", name: "Red Bull Racing Driver Cap", slug: "red-bull-racing-driver-cap", skuPrefix: "RBR-CAP-001", basePrice: 1050000 },
  { brandSlug: "red-bull-racing", categorySlug: "kids", name: "Red Bull Racing Kids Tee", slug: "red-bull-racing-kids-tee", skuPrefix: "RBR-KID-001", basePrice: 990000 },
  { brandSlug: "mclaren", categorySlug: "t-shirts", name: "McLaren Papaya Essentials Tee", slug: "mclaren-papaya-essentials-tee", skuPrefix: "MCL-TEE-001", basePrice: 1290000, featured: true },
  { brandSlug: "mclaren", categorySlug: "polos", name: "McLaren Team Polo", slug: "mclaren-team-polo", skuPrefix: "MCL-POL-001", basePrice: 2190000 },
  { brandSlug: "mclaren", categorySlug: "jackets", name: "McLaren Rain Jacket", slug: "mclaren-rain-jacket", skuPrefix: "MCL-JAC-001", basePrice: 4390000 },
  { brandSlug: "mclaren", categorySlug: "caps", name: "McLaren New Era Cap", slug: "mclaren-new-era-cap", skuPrefix: "MCL-CAP-001", basePrice: 1090000 },
  { brandSlug: "aston-martin", categorySlug: "t-shirts", name: "Aston Martin Heritage Tee", slug: "aston-martin-heritage-tee", skuPrefix: "AMR-TEE-001", basePrice: 1390000 },
  { brandSlug: "aston-martin", categorySlug: "polos", name: "Aston Martin Team Polo", slug: "aston-martin-team-polo", skuPrefix: "AMR-POL-001", basePrice: 2290000, featured: true },
  { brandSlug: "aston-martin", categorySlug: "hoodies", name: "Aston Martin Team Hoodie", slug: "aston-martin-team-hoodie", skuPrefix: "AMR-HOO-001", basePrice: 3290000 },
  { brandSlug: "alpine", categorySlug: "t-shirts", name: "Alpine Racing Graphic Tee", slug: "alpine-racing-graphic-tee", skuPrefix: "ALP-TEE-001", basePrice: 1190000 },
  { brandSlug: "alpine", categorySlug: "jackets", name: "Alpine Team Softshell Jacket", slug: "alpine-team-softshell-jacket", skuPrefix: "ALP-JAC-001", basePrice: 4190000 },
  { brandSlug: "alpine", categorySlug: "caps", name: "Alpine Trucker Cap", slug: "alpine-trucker-cap", skuPrefix: "ALP-CAP-001", basePrice: 950000 },
  { brandSlug: "williams", categorySlug: "t-shirts", name: "Williams Racing Core Tee", slug: "williams-racing-core-tee", skuPrefix: "WIL-TEE-001", basePrice: 1150000 },
  { brandSlug: "williams", categorySlug: "hoodies", name: "Williams Racing Team Hoodie", slug: "williams-racing-team-hoodie", skuPrefix: "WIL-HOO-001", basePrice: 2990000 },
  { brandSlug: "williams", categorySlug: "accessories", name: "Williams Racing Water Bottle", slug: "williams-racing-water-bottle", skuPrefix: "WIL-ACC-001", basePrice: 790000 },
];

const customerSeeds = [
  { fullName: "Nguyen Minh Anh", email: "minhanh@example.com", phone: "0901000001", province: "Ho Chi Minh", district: "Quan 1", ward: "Ben Nghe" },
  { fullName: "Tran Hoang Nam", email: "hoangnam@example.com", phone: "0901000002", province: "Ha Noi", district: "Ba Dinh", ward: "Lieu Giai" },
  { fullName: "Le Thu Ha", email: "thuha@example.com", phone: "0901000003", province: "Da Nang", district: "Hai Chau", ward: "Thach Thang" },
  { fullName: "Pham Gia Bao", email: "giabao@example.com", phone: "0901000004", province: "Can Tho", district: "Ninh Kieu", ward: "Tan An" },
  { fullName: "Vo Khanh Linh", email: "khanhlinh@example.com", phone: "0901000005", province: "Hai Phong", district: "Le Chan", ward: "An Bien" },
] as const;

async function clearDatabase(): Promise<void> {
  await prisma.review.deleteMany();
  await prisma.inventoryTransaction.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.couponRedemption.deleteMany();
  await prisma.checkoutIdempotency.deleteMany();
  await prisma.orderStatusHistory.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.uploadAsset.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.color.deleteMany();
  await prisma.size.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.category.deleteMany();
  await prisma.address.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.refreshSession.deleteMany();
  await prisma.user.deleteMany();
}

async function seedUsers() {
  const [adminPasswordHash, customerPasswordHash] = await Promise.all([
    bcrypt.hash(ADMIN_PASSWORD, 12),
    bcrypt.hash(CUSTOMER_PASSWORD, 12),
  ]);

  const admin = await prisma.user.create({
    data: {
      email: ADMIN_EMAIL,
      passwordHash: adminPasswordHash,
      fullName: "F1 Store Admin",
      phone: "0900000000",
      role: UserRole.ADMIN,
    },
  });

  const customers = [];

  for (const customerSeed of customerSeeds) {
    const customer = await prisma.user.create({
      data: {
        email: customerSeed.email,
        passwordHash: customerPasswordHash,
        fullName: customerSeed.fullName,
        phone: customerSeed.phone,
        role: UserRole.CUSTOMER,
        cart: { create: {} },
        addresses: {
          create: {
            recipientName: customerSeed.fullName,
            phone: customerSeed.phone,
            line1: "123 Racing Street",
            ward: customerSeed.ward,
            district: customerSeed.district,
            province: customerSeed.province,
            isDefault: true,
          },
        },
      },
      include: { addresses: true, cart: true },
    });

    customers.push(customer);
  }

  return { admin, customers };
}

async function seedCatalog(adminId: string) {
  await prisma.category.createMany({
    data: categories.map((category) => ({
      ...category,
      description: `${category.name} inspired by Formula 1 teams and race culture.`,
      imageUrl: `https://placehold.co/1200x800/111111/FFFFFF?text=${encodeURIComponent(category.name)}`,
    })),
  });

  await prisma.brand.createMany({
    data: brands.map((brand) => ({
      ...brand,
      description: `Official-style fashion collection inspired by ${brand.name}.`,
      logoUrl: `https://placehold.co/600x300/FFFFFF/111111?text=${encodeURIComponent(brand.name)}`,
    })),
  });

  await prisma.size.createMany({ data: sizes.map((size) => ({ ...size })) });
  await prisma.color.createMany({ data: colors.map((color) => ({ ...color })) });

  const [createdCategories, createdBrands, createdSizes, createdColors] = await Promise.all([
    prisma.category.findMany(),
    prisma.brand.findMany(),
    prisma.size.findMany(),
    prisma.color.findMany(),
  ]);

  const categoryBySlug = new Map(createdCategories.map((item) => [item.slug, item]));
  const brandBySlug = new Map(createdBrands.map((item) => [item.slug, item]));
  const sizeBySlug = new Map(createdSizes.map((item) => [item.slug, item]));
  const colorBySlug = new Map(createdColors.map((item) => [item.slug, item]));
  const variantIds: string[] = [];

  for (const [productIndex, productSeed] of products.entries()) {
    const category = categoryBySlug.get(productSeed.categorySlug);
    const brand = brandBySlug.get(productSeed.brandSlug);

    if (!category || !brand) {
      throw new Error(`Missing category or brand for ${productSeed.slug}.`);
    }

    const imageUrl = `https://placehold.co/1200x1200/151515/FFFFFF?text=${encodeURIComponent(productSeed.name)}`;
    const asset = await prisma.uploadAsset.create({
      data: {
        provider: UploadProviderType.LOCAL,
        providerAssetId: `seed/products/${productSeed.slug}`,
        url: imageUrl,
        width: 1200,
        height: 1200,
        format: "webp",
        bytes: 150000,
        uploadedById: adminId,
      },
    });

    const product = await prisma.product.create({
      data: {
        categoryId: category.id,
        brandId: brand.id,
        name: productSeed.name,
        slug: productSeed.slug,
        shortDescription: `Premium ${productSeed.name} for race weekends and everyday wear.`,
        description: `${productSeed.name} combines modern sportswear construction with Formula 1 team identity.`,
        basePrice: productSeed.basePrice,
        salePrice: productSeed.salePrice,
        status: ProductStatus.ACTIVE,
        isFeatured: productSeed.featured ?? false,
        publishedAt: new Date(),
        images: {
          create: {
            assetId: asset.id,
            urlSnapshot: imageUrl,
            altText: productSeed.name,
            sortOrder: 0,
            isPrimary: true,
          },
        },
      },
    });

    const isDemoProduct = productIndex === 0;
    const firstSizeSlug = isDemoProduct ? "m" : sizes[productIndex % sizes.length].slug;
    const secondSizeSlug = isDemoProduct ? "l" : sizes[(productIndex + 2) % sizes.length].slug;
    const firstColorSlug = isDemoProduct ? "racing-red" : colors[productIndex % colors.length].slug;
    const secondColorSlug = isDemoProduct ? "black" : colors[(productIndex + 3) % colors.length].slug;
    const variantSeeds = [
      {
        sizeSlug: firstSizeSlug,
        colorSlug: firstColorSlug,
        sku: `${productSeed.skuPrefix}-${firstColorSlug.toUpperCase()}-${firstSizeSlug.toUpperCase()}`,
        stock: isDemoProduct ? 10 : 12 + (productIndex % 9),
      },
      {
        sizeSlug: secondSizeSlug,
        colorSlug: secondColorSlug,
        sku: `${productSeed.skuPrefix}-${secondColorSlug.toUpperCase()}-${secondSizeSlug.toUpperCase()}`,
        stock: 8 + (productIndex % 11),
      },
    ];

    for (const [variantIndex, variantSeed] of variantSeeds.entries()) {
      const size = sizeBySlug.get(variantSeed.sizeSlug);
      const color = colorBySlug.get(variantSeed.colorSlug);

      if (!size || !color) {
        throw new Error(`Missing size or color for SKU ${variantSeed.sku}.`);
      }

      const variant = await prisma.productVariant.create({
        data: {
          productId: product.id,
          sizeId: size.id,
          colorId: color.id,
          sku: variantSeed.sku,
          price: variantIndex === 1 ? productSeed.basePrice + 100000 : null,
          salePrice: variantIndex === 0 ? productSeed.salePrice : null,
          stock: variantSeed.stock,
        },
      });

      await prisma.inventoryTransaction.create({
        data: {
          variantId: variant.id,
          createdById: adminId,
          type: InventoryTransactionType.IMPORT,
          quantityDelta: variantSeed.stock,
          stockBefore: 0,
          stockAfter: variantSeed.stock,
          reference: "SEED-INITIAL",
          reason: "Initial development inventory",
        },
      });

      variantIds.push(variant.id);
    }
  }

  return variantIds;
}

async function seedCoupons() {
  const now = new Date();
  const startAt = new Date(now);
  startAt.setDate(startAt.getDate() - 30);
  const endAt = new Date(now);
  endAt.setFullYear(endAt.getFullYear() + 1);

  await prisma.coupon.createMany({
    data: [
      {
        code: "RACE10",
        type: CouponType.PERCENT,
        value: 10,
        minOrderValue: 1000000,
        maxDiscount: 500000,
        startAt,
        endAt,
        usageLimit: 200,
        perUserLimit: 2,
      },
      {
        code: "PADDOCK200",
        type: CouponType.FIXED,
        value: 200000,
        minOrderValue: 2000000,
        startAt,
        endAt,
        usageLimit: 100,
        perUserLimit: 1,
      },
      {
        code: "WELCOME15",
        type: CouponType.PERCENT,
        value: 15,
        minOrderValue: 800000,
        maxDiscount: 300000,
        startAt,
        endAt,
        usageLimit: 500,
        perUserLimit: 1,
      },
    ],
  });

  return prisma.coupon.findMany();
}

function statusPath(finalStatus: OrderStatus): OrderStatus[] {
  switch (finalStatus) {
    case OrderStatus.PENDING:
      return [OrderStatus.PENDING];
    case OrderStatus.CONFIRMED:
      return [OrderStatus.PENDING, OrderStatus.CONFIRMED];
    case OrderStatus.SHIPPING:
      return [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.SHIPPING];
    case OrderStatus.DELIVERED:
      return [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.SHIPPING, OrderStatus.DELIVERED];
    case OrderStatus.CANCELLED:
      return [OrderStatus.PENDING, OrderStatus.CANCELLED];
  }
}

async function seedOrders(
  adminId: string,
  customers: Awaited<ReturnType<typeof seedUsers>>["customers"],
  variantIds: string[],
  coupons: Awaited<ReturnType<typeof seedCoupons>>,
) {
  const finalStatuses = [
    OrderStatus.DELIVERED,
    OrderStatus.DELIVERED,
    OrderStatus.DELIVERED,
    OrderStatus.DELIVERED,
    OrderStatus.DELIVERED,
    OrderStatus.SHIPPING,
    OrderStatus.SHIPPING,
    OrderStatus.CONFIRMED,
    OrderStatus.CONFIRMED,
    OrderStatus.PENDING,
    OrderStatus.CANCELLED,
    OrderStatus.CANCELLED,
  ];
  const deliveredItems: Array<{ orderItemId: string; productId: string; userId: string }> = [];

  // Skip the first two variant IDs so the Ferrari Red/M demo variant remains at stock 10.
  const orderVariantIds = variantIds.slice(2);

  for (const [index, finalStatus] of finalStatuses.entries()) {
    const customer = customers[index % customers.length];
    const variantId = orderVariantIds[index % orderVariantIds.length];
    const quantity = index % 3 === 0 ? 2 : 1;
    const useCoupon = index % 4 === 0;
    const coupon = useCoupon ? coupons.find((item) => item.code === "RACE10") : undefined;
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - (20 - index));

    const seeded = await prisma.$transaction(async (tx) => {
      const variant = await tx.productVariant.findUniqueOrThrow({
        where: { id: variantId },
        include: {
          product: { include: { images: { where: { isPrimary: true }, take: 1 } } },
          size: true,
          color: true,
        },
      });
      const unitPrice = Number(
        variant.salePrice ?? variant.price ?? variant.product.salePrice ?? variant.product.basePrice,
      );
      const subtotal = unitPrice * quantity;
      const discount = coupon ? Math.min(Math.round(subtotal * 0.1), 500000) : 0;
      const shippingFee = subtotal >= 2000000 ? 0 : 50000;
      const total = subtotal - discount + shippingFee;
      const orderCode = `F1-${createdAt.toISOString().slice(0, 10).replaceAll("-", "")}-${String(index + 1).padStart(4, "0")}`;
      const isDelivered = finalStatus === OrderStatus.DELIVERED;
      const isCancelled = finalStatus === OrderStatus.CANCELLED;

      const order = await tx.order.create({
        data: {
          userId: customer.id,
          couponId: coupon?.id,
          orderCode,
          status: finalStatus,
          paymentMethod: PaymentMethod.COD,
          paymentStatus: isDelivered ? PaymentStatus.PAID : PaymentStatus.UNPAID,
          receiverName: customer.fullName,
          receiverPhone: customer.phone ?? "0900000000",
          receiverEmail: customer.email,
          addressLine1: "123 Racing Street",
          ward: customer.addresses[0].ward,
          district: customer.addresses[0].district,
          province: customer.addresses[0].province,
          couponCode: coupon?.code,
          note: index % 2 === 0 ? "Development seed order" : null,
          subtotal,
          discount,
          shippingFee,
          total,
          paidAt: isDelivered ? new Date(createdAt.getTime() + 4 * 86400000) : null,
          deliveredAt: isDelivered ? new Date(createdAt.getTime() + 4 * 86400000) : null,
          cancelledAt: isCancelled ? new Date(createdAt.getTime() + 3600000) : null,
          createdAt,
        },
      });

      const orderItem = await tx.orderItem.create({
        data: {
          orderId: order.id,
          productId: variant.productId,
          variantId: variant.id,
          productName: variant.product.name,
          sku: variant.sku,
          size: variant.size.name,
          color: variant.color.name,
          imageUrl: variant.product.images[0]?.urlSnapshot,
          unitPrice,
          quantity,
          subtotal,
          createdAt,
        },
      });

      const stockBeforeSale = variant.stock;
      const stockAfterSale = stockBeforeSale - quantity;
      if (stockAfterSale < 0) {
        throw new Error(`Seed order ${orderCode} exceeds stock for ${variant.sku}.`);
      }

      await tx.productVariant.update({
        where: { id: variant.id },
        data: { stock: stockAfterSale },
      });
      await tx.inventoryTransaction.create({
        data: {
          variantId: variant.id,
          orderId: order.id,
          orderItemId: orderItem.id,
          type: InventoryTransactionType.SALE,
          quantityDelta: -quantity,
          stockBefore: stockBeforeSale,
          stockAfter: stockAfterSale,
          reference: orderCode,
          reason: "Seed checkout sale",
          createdAt,
        },
      });

      const path = statusPath(finalStatus);
      for (const [pathIndex, status] of path.entries()) {
        await tx.orderStatusHistory.create({
          data: {
            orderId: order.id,
            actorId: pathIndex === 0 ? customer.id : adminId,
            fromStatus: pathIndex === 0 ? null : path[pathIndex - 1],
            toStatus: status,
            note: pathIndex === 0 ? "Order created" : `Seed transition to ${status}`,
            createdAt: new Date(createdAt.getTime() + pathIndex * 3600000),
          },
        });
      }

      if (coupon) {
        await tx.couponRedemption.create({
          data: {
            couponId: coupon.id,
            userId: customer.id,
            orderId: order.id,
            status: isCancelled ? CouponRedemptionStatus.RELEASED : CouponRedemptionStatus.APPLIED,
            discountAmount: discount,
            appliedAt: createdAt,
            releasedAt: isCancelled ? new Date(createdAt.getTime() + 3600000) : null,
          },
        });
      }

      await tx.checkoutIdempotency.create({
        data: {
          userId: customer.id,
          idempotencyKey: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
          requestHash: createHash("sha256").update(`${customer.id}:${orderCode}`).digest("hex"),
          status: IdempotencyStatus.COMPLETED,
          orderId: order.id,
          responseStatus: 201,
          expiresAt: new Date(createdAt.getTime() + 24 * 3600000),
          createdAt,
        },
      });

      await tx.payment.create({
        data: {
          orderId: order.id,
          provider: PaymentProvider.COD,
          amount: total,
          currency: "VND",
          status: isDelivered ? PaymentStatus.PAID : PaymentStatus.PENDING,
          paidAt: isDelivered ? new Date(createdAt.getTime() + 4 * 86400000) : null,
          metadata: { source: "development-seed" },
          createdAt,
        },
      });

      if (isCancelled) {
        await tx.productVariant.update({
          where: { id: variant.id },
          data: { stock: stockBeforeSale },
        });
        await tx.inventoryTransaction.create({
          data: {
            variantId: variant.id,
            orderId: order.id,
            orderItemId: orderItem.id,
            createdById: adminId,
            type: InventoryTransactionType.CANCEL_RETURN,
            quantityDelta: quantity,
            stockBefore: stockAfterSale,
            stockAfter: stockBeforeSale,
            reference: orderCode,
            reason: "Seed cancelled order stock return",
            createdAt: new Date(createdAt.getTime() + 3600000),
          },
        });
      }

      return { orderItem, userId: customer.id, productId: variant.productId, isDelivered };
    });

    if (seeded.isDelivered) {
      deliveredItems.push({
        orderItemId: seeded.orderItem.id,
        productId: seeded.productId,
        userId: seeded.userId,
      });
    }
  }

  for (const coupon of coupons) {
    const usedCount = await prisma.couponRedemption.count({
      where: { couponId: coupon.id, status: CouponRedemptionStatus.APPLIED },
    });
    await prisma.coupon.update({ where: { id: coupon.id }, data: { usedCount } });
  }

  return deliveredItems;
}

async function seedReviews(
  deliveredItems: Awaited<ReturnType<typeof seedOrders>>,
): Promise<void> {
  const reviewContent = [
    "Fabric feels premium and the fit is accurate.",
    "Great team colors and comfortable for race weekend.",
    "Fast delivery, careful packaging, and a solid product.",
    "The details look better in person than in the photos.",
    "Comfortable everyday piece with a clean racing style.",
  ];

  for (const [index, item] of deliveredItems.slice(0, 5).entries()) {
    await prisma.review.create({
      data: {
        userId: item.userId,
        productId: item.productId,
        orderItemId: item.orderItemId,
        rating: index === 3 ? 4 : 5,
        title: index === 3 ? "Very good" : "Excellent quality",
        content: reviewContent[index],
        status: ReviewStatus.APPROVED,
      },
    });
  }
}

async function seedCustomerShoppingData(
  customers: Awaited<ReturnType<typeof seedUsers>>["customers"],
  variantIds: string[],
): Promise<void> {
  const productIds = await prisma.product.findMany({
    orderBy: { createdAt: "asc" },
    take: 10,
    select: { id: true },
  });

  for (const [index, customer] of customers.entries()) {
    const cart = customer.cart;
    if (!cart) {
      throw new Error(`Customer ${customer.email} has no cart.`);
    }

    await prisma.favorite.create({
      data: {
        userId: customer.id,
        productId: productIds[index % productIds.length].id,
      },
    });

    if (index < 3) {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          variantId: variantIds[variantIds.length - 1 - index],
          quantity: index + 1,
        },
      });
    }
  }
}

async function printSummary(): Promise<void> {
  const [userCount, productCount, variantCount, orderCount, reviewCount, inventoryCount] =
    await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.productVariant.count(),
      prisma.order.count(),
      prisma.review.count(),
      prisma.inventoryTransaction.count(),
    ]);
  const demoVariant = await prisma.productVariant.findUniqueOrThrow({
    where: { sku: "FER-TEE-001-RACING-RED-M" },
  });

  console.info("Development seed completed.");
  console.info({
    users: userCount,
    products: productCount,
    variants: variantCount,
    orders: orderCount,
    reviews: reviewCount,
    inventoryTransactions: inventoryCount,
    ferrariRedMStock: demoVariant.stock,
  });
  console.info(`Admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.info(`Customer example: ${customerSeeds[0].email} / ${CUSTOMER_PASSWORD}`);
}

async function main(): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Development seed is disabled in production.");
  }

  console.info("Resetting development data...");
  await clearDatabase();

  const { admin, customers } = await seedUsers();
  const variantIds = await seedCatalog(admin.id);
  const coupons = await seedCoupons();
  const deliveredItems = await seedOrders(admin.id, customers, variantIds, coupons);
  await seedReviews(deliveredItems);
  await seedCustomerShoppingData(customers, variantIds);
  await printSummary();
}

main()
  .catch((error: unknown) => {
    console.error("Development seed failed.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
