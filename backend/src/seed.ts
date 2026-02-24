import bcrypt from "bcryptjs";
import { prisma } from "./lib/prisma";
import { toCents } from "./utils/money";

async function upsertStoreSettings() {
  const existing = await prisma.storeSettings.findFirst();

  const payload = {
    name: "Minha Loja",
    domain: "minhaloja.com",
    timezone: "America/Sao_Paulo",
    currency: "BRL",
    supportEmail: "suporte@minhaloja.com",
    policy: "Trocas em até 7 dias. Consulte regras no site.",
  };

  if (existing) {
    await prisma.storeSettings.update({ where: { id: existing.id }, data: payload });
    return;
  }

  await prisma.storeSettings.create({ data: payload });
}

async function normalizeCategories() {
  const existingCasual = await prisma.category.findUnique({ where: { slug: "casual" } });
  const legacyAccessories = await prisma.category.findUnique({ where: { slug: "acessorios" } });

  if (legacyAccessories) {
    if (!existingCasual) {
      await prisma.category.update({
        where: { id: legacyAccessories.id },
        data: {
          slug: "casual",
          name: "Casual",
          sortOrder: legacyAccessories.sortOrder || 3,
          active: true,
        },
      });
    } else {
      await prisma.category.update({
        where: { id: legacyAccessories.id },
        data: { active: false },
      });
    }
  }

  await prisma.product.updateMany({
    where: { category: "acessorios" },
    data: { category: "casual" },
  });

  const categories = [
    { name: "Fitness", slug: "fitness", active: true, sortOrder: 1 },
    { name: "Moda", slug: "moda", active: true, sortOrder: 2 },
    { name: "Casual", slug: "casual", active: true, sortOrder: 3 },
    { name: "Suplementos", slug: "suplementos", active: true, sortOrder: 4 },
    { name: "Outros", slug: "outros", active: true, sortOrder: 5 },
  ] as const;

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    });
  }
}

async function upsertProducts() {
  const sampleImages = [
    "https://images.unsplash.com/photo-1520975682031-a8d55b2e9c5e?auto=format&fit=crop&w=900&q=60",
    "https://images.unsplash.com/photo-1590487988256-9ed24133863e?auto=format&fit=crop&w=900&q=60",
    "https://images.unsplash.com/photo-1519861155730-0b5fbf0dd889?auto=format&fit=crop&w=900&q=60",
    "https://images.unsplash.com/photo-1585487000160-6e68b007b6b0?auto=format&fit=crop&w=900&q=60",
    "https://images.unsplash.com/photo-1520975691375-39f7f5be8e7a?auto=format&fit=crop&w=900&q=60",
  ];

  const products = [
    {
      name: "Legging Sculpt Seamless",
      slug: "legging-sculpt-seamless-leg-001",
      sku: "LEG-001",
      category: "fitness",
      sizeType: "roupas",
      sizes: [
        { label: "P", stock: 2, active: true },
        { label: "M", stock: 0, active: true },
        { label: "G", stock: 5, active: true },
        { label: "GG", stock: 1, active: true },
      ],
      size: "P, M, G, GG",
      stock: 8,
      priceCents: toCents(159.9),
      compareAtPriceCents: toCents(199.9),
      shortDescription: "Modela o corpo com alta compressão e conforto.",
      description: "Legging seamless com alta compressão, cintura alta e tecido respirável. Ideal para treinos e uso diário.",
      tags: ["compressão", "cintura alta", "best-seller"],
      status: "destaque",
      active: true,
      images: sampleImages,
    },
    {
      name: "Top Active Fit",
      slug: "top-active-fit-top-014",
      sku: "TOP-014",
      category: "fitness",
      sizeType: "roupas",
      sizes: [
        { label: "P", stock: 1, active: true },
        { label: "M", stock: 2, active: true },
        { label: "G", stock: 3, active: true },
      ],
      size: "P, M, G",
      stock: 6,
      priceCents: toCents(119.9),
      shortDescription: "Sustentação média com acabamento premium.",
      description: "Top com sustentação média e tecido de secagem rápida.",
      tags: ["secagem rápida", "suporte", "novo"],
      status: "novo",
      active: true,
      images: sampleImages,
    },
    {
      name: "Camiseta Dry Performance",
      slug: "camiseta-dry-performance-tee-210",
      sku: "TEE-210",
      category: "moda",
      sizeType: "numerico",
      sizes: [
        { label: "34", stock: 4, active: true },
        { label: "36", stock: 8, active: true },
        { label: "38", stock: 10, active: true },
        { label: "40", stock: 9, active: true },
        { label: "42", stock: 7, active: true },
        { label: "44", stock: 5, active: true },
        { label: "46", stock: 2, active: true },
      ],
      size: "34, 36, 38, 40, 42, 44, 46",
      stock: 45,
      priceCents: toCents(89.9),
      compareAtPriceCents: toCents(99.9),
      shortDescription: "Leve, respirável e com caimento perfeito.",
      description: "Camiseta dry com tecido leve e respirável.",
      tags: ["dry", "respirável", "oferta"],
      status: "oferta",
      active: true,
      images: sampleImages,
    },
  ] as const;

  for (const product of products) {
    const category = await prisma.category.findUnique({
      where: { slug: product.category },
      select: { id: true },
    });

    const payload = {
      ...product,
      categoryId: category?.id,
    };

    await prisma.product.upsert({
      where: { sku: product.sku },
      update: payload,
      create: payload,
    });
  }
}

async function upsertIntegrations() {
  const integrations = [
    {
      group: "pagamentos",
      name: "Pix + Cartão",
      description: "Conecte gateway para Pix, cartão e boleto.",
      connected: false,
    },
    {
      group: "frete",
      name: "Correios / Melhor Envio",
      description: "Cálculo de frete e geração de etiqueta.",
      connected: false,
    },
    {
      group: "email",
      name: "E-mail Marketing",
      description: "Automação para carrinhos abandonados e pós-compra.",
      connected: false,
    },
    {
      group: "whatsapp",
      name: "WhatsApp",
      description: "Recuperação, suporte e campanhas via WhatsApp.",
      connected: false,
    },
    {
      group: "analytics",
      name: "Google Analytics",
      description: "Métricas de tráfego e conversão transacional.",
      connected: false,
    },
    {
      group: "pixel",
      name: "Meta Pixel",
      description: "Atribuição de campanhas e eventos de compra.",
      connected: false,
    },
  ] as const;

  for (const integration of integrations) {
    const existing = await prisma.integrationConfig.findFirst({
      where: {
        group: integration.group,
        name: integration.name,
      },
      select: { id: true },
    });

    if (existing) {
      await prisma.integrationConfig.update({
        where: { id: existing.id },
        data: integration,
      });
      continue;
    }

    await prisma.integrationConfig.create({ data: integration });
  }
}

async function upsertCouponsAndCashback() {
  const now = new Date();
  const end = new Date(now);
  end.setMonth(end.getMonth() + 2);

  await prisma.coupon.upsert({
    where: { code: "BEMVINDO10" },
    update: {
      description: "10% OFF na primeira compra",
      type: "percent",
      amount: 10,
      minSubtotalCents: 0,
      maxUses: 300,
      startsAt: now,
      endsAt: end,
      active: true,
    },
    create: {
      code: "BEMVINDO10",
      description: "10% OFF na primeira compra",
      type: "percent",
      amount: 10,
      minSubtotalCents: 0,
      maxUses: 300,
      startsAt: now,
      endsAt: end,
      active: true,
    },
  });

  await prisma.coupon.upsert({
    where: { code: "FRETEGRATIS" },
    update: {
      description: "Frete grátis acima de R$199",
      type: "shipping",
      amount: 0,
      minSubtotalCents: toCents(199),
      maxUses: 500,
      startsAt: now,
      endsAt: end,
      active: true,
    },
    create: {
      code: "FRETEGRATIS",
      description: "Frete gratis acima de R$199",
      type: "shipping",
      amount: 0,
      minSubtotalCents: toCents(199),
      maxUses: 500,
      startsAt: now,
      endsAt: end,
      active: true,
    },
  });

  const cashbackRule = await prisma.cashbackRule.findFirst({
    where: { name: "Cashback padrão" },
    select: { id: true },
  });

  if (cashbackRule) {
    await prisma.cashbackRule.update({
      where: { id: cashbackRule.id },
      data: {
        percent: 5,
        validDays: 30,
        minSubtotalCents: toCents(150),
        maxCashbackCents: toCents(50),
        active: true,
      },
    });
  } else {
    await prisma.cashbackRule.create({
      data: {
        name: "Cashback padrão",
        percent: 5,
        validDays: 30,
        minSubtotalCents: toCents(150),
        maxCashbackCents: toCents(50),
        active: true,
      },
    });
  }
}

async function upsertCustomerAndOrder() {
  const customerHash = await bcrypt.hash("Cliente@123", 10);
  const customer = await prisma.customer.upsert({
    where: { email: "cliente@exemplo.com" },
    update: {
      name: "Cliente Exemplo",
      phone: "+55 21 99999-0001",
      segment: "novo",
      tags: ["primeira compra"],
      active: true,
    },
    create: {
      name: "Cliente Exemplo",
      email: "cliente@exemplo.com",
      passwordHash: customerHash,
      phone: "+55 21 99999-0001",
      segment: "novo",
      tags: ["primeira compra"],
      active: true,
    },
  });

  const productRows = await prisma.product.findMany({
    orderBy: { createdAt: "asc" },
    take: 2,
  });

  if (productRows.length < 2) return;

  const existingOrder = await prisma.order.findUnique({ where: { code: "10483" }, select: { id: true } });
  if (existingOrder) return;

  const item1 = productRows[0]!;
  const item2 = productRows[1]!;
  const subtotal = item1.priceCents + item2.priceCents;
  const tax = Math.round(subtotal * 0.08);
  const shipping = 1290;
  const total = subtotal + tax + shipping;

  const order = await prisma.order.create({
    data: {
      code: "10483",
      customerId: customer.id,
      customerName: customer.name,
      email: customer.email,
      status: "pago",
      channel: "Site",
      shippingMethod: "PAC",
      paymentMethod: "Pix",
      items: [
        {
          productId: item1.id,
          name: item1.name,
          sku: item1.sku,
          qty: 1,
          unitPriceCents: item1.priceCents,
          totalCents: item1.priceCents,
          slug: item1.slug,
        },
        {
          productId: item2.id,
          name: item2.name,
          sku: item2.sku,
          qty: 1,
          unitPriceCents: item2.priceCents,
          totalCents: item2.priceCents,
          slug: item2.slug,
        },
      ],
      itemsCount: 2,
      subtotalCents: subtotal,
      discountCents: 0,
      shippingCents: shipping,
      taxCents: tax,
      totalCents: total,
      address: {
        fullName: "Cliente Exemplo",
        email: customer.email,
        phone: customer.phone,
        zip: "27213-120",
        state: "RJ",
        city: "Volta Redonda",
        neighborhood: "Aterrado",
        street: "Rua Exemplo",
        number: "123",
      },
      orderItems: {
        create: [
          {
            productId: item1.id,
            name: item1.name,
            sku: item1.sku,
            qty: 1,
            unitPriceCents: item1.priceCents,
            totalCents: item1.priceCents,
            slug: item1.slug,
          },
          {
            productId: item2.id,
            name: item2.name,
            sku: item2.sku,
            qty: 1,
            unitPriceCents: item2.priceCents,
            totalCents: item2.priceCents,
            slug: item2.slug,
          },
        ],
      },
    },
  });

  await prisma.inventoryMovement.create({
    data: {
      productId: item1.id,
      type: "saida",
      quantity: -1,
      reason: `Pedido ${order.code}`,
      createdBy: "seed",
    },
  });

  await prisma.inventoryMovement.create({
    data: {
      productId: item2.id,
      type: "saida",
      quantity: -1,
      reason: `Pedido ${order.code}`,
      createdBy: "seed",
    },
  });
}

async function seed() {
  const adminEmail = "admin@exemplo.com";
  const adminPassword = "Admin@123";
  const adminHash = await bcrypt.hash(adminPassword, 10);

  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: {
      name: "Administrador",
      passwordHash: adminHash,
      role: "admin",
      active: true,
      tempPassword: false,
    },
    create: {
      name: "Administrador",
      email: adminEmail,
      passwordHash: adminHash,
      role: "admin",
      active: true,
      tempPassword: false,
    },
  });

  await upsertStoreSettings();
  await normalizeCategories();
  await upsertProducts();
  await upsertIntegrations();
  await upsertCouponsAndCashback();
  await upsertCustomerAndOrder();

  console.log("Seed concluído com sucesso.");
  console.log(`Admin: ${adminEmail} / ${adminPassword}`);
}

seed()
  .catch((error) => {
    console.error("Falha no seed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
