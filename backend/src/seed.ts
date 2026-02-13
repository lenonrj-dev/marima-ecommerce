import bcrypt from "bcryptjs";
import { connectDb, disconnectDb } from "./config/db";
import { AdminUserModel } from "./models/AdminUser";
import { CategoryModel } from "./models/Category";
import { ProductModel } from "./models/Product";
import { StoreSettingsModel } from "./models/StoreSettings";
import { IntegrationConfigModel } from "./models/IntegrationConfig";
import { CouponModel } from "./models/Coupon";
import { CashbackRuleModel } from "./models/CashbackRule";
import { CustomerModel } from "./models/Customer";
import { OrderModel } from "./models/Order";
import { InventoryMovementModel } from "./models/InventoryMovement";
import { toCents } from "./utils/money";

async function seed() {
  await connectDb();

  const adminEmail = "admin@exemplo.com";
  const adminPassword = "Admin@123";

  const adminHash = await bcrypt.hash(adminPassword, 10);

  await AdminUserModel.findOneAndUpdate(
    { email: adminEmail },
    {
      $set: {
        name: "Administrador",
        email: adminEmail,
        passwordHash: adminHash,
        role: "admin",
        active: true,
      },
    },
    { upsert: true, new: true },
  );

  await StoreSettingsModel.findOneAndUpdate(
    {},
    {
      $set: {
        name: "Minha Loja",
        domain: "minhaloja.com",
        timezone: "America/Sao_Paulo",
        currency: "BRL",
        supportEmail: "suporte@minhaloja.com",
        policy: "Trocas em até 7 dias. Consulte regras no site.",
      },
    },
    { upsert: true, new: true },
  );

  // Migração simples: substitui "Acessórios" por "Casual" para manter consistência entre frontend/admin.
  const existingCasual = await CategoryModel.findOne({ slug: "casual" });
  const legacyAccessories = await CategoryModel.findOne({ slug: "acessorios" });
  if (legacyAccessories) {
    if (!existingCasual) {
      legacyAccessories.slug = "casual";
      legacyAccessories.name = "Casual";
      legacyAccessories.sortOrder = legacyAccessories.sortOrder || 3;
      legacyAccessories.active = true;
      try {
        await legacyAccessories.save();
      } catch {
        // Ignore migration failures and fallback to creating/upserting below.
      }
    } else {
      legacyAccessories.active = false;
      await legacyAccessories.save();
    }
  }

  await ProductModel.updateMany({ category: "acessorios" }, { $set: { category: "casual" } });

  const categories = [
    { name: "Fitness", slug: "fitness", active: true, sortOrder: 1 },
    { name: "Moda", slug: "moda", active: true, sortOrder: 2 },
    { name: "Casual", slug: "casual", active: true, sortOrder: 3 },
    { name: "Suplementos", slug: "suplementos", active: true, sortOrder: 4 },
    { name: "Outros", slug: "outros", active: true, sortOrder: 5 },
  ];

  for (const category of categories) {
    await CategoryModel.findOneAndUpdate({ slug: category.slug }, { $set: category }, { upsert: true });
  }

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
      description:
        "Legging seamless com alta compressão, cintura alta e tecido respirável. Ideal para treinos e uso diário.",
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
  ];

  for (const product of products) {
    await ProductModel.findOneAndUpdate({ sku: product.sku }, { $set: product }, { upsert: true, new: true });
  }

  await IntegrationConfigModel.bulkWrite([
    {
      updateOne: {
        filter: { group: "pagamentos", name: "Pix + Cartão" },
        update: {
          $set: {
            group: "pagamentos",
            name: "Pix + Cartão",
            description: "Conecte gateway para Pix, cartão e boleto.",
            connected: false,
          },
        },
        upsert: true,
      },
    },
    {
      updateOne: {
        filter: { group: "frete", name: "Correios / Melhor Envio" },
        update: {
          $set: {
            group: "frete",
            name: "Correios / Melhor Envio",
            description: "Cálculo de frete e geração de etiqueta.",
            connected: false,
          },
        },
        upsert: true,
      },
    },
    {
      updateOne: {
        filter: { group: "email", name: "E-mail Marketing" },
        update: {
          $set: {
            group: "email",
            name: "E-mail Marketing",
            description: "Automação para carrinhos abandonados e pós-compra.",
            connected: false,
          },
        },
        upsert: true,
      },
    },
    {
      updateOne: {
        filter: { group: "whatsapp", name: "WhatsApp" },
        update: {
          $set: {
            group: "whatsapp",
            name: "WhatsApp",
            description: "Recuperação, suporte e campanhas via WhatsApp.",
            connected: false,
          },
        },
        upsert: true,
      },
    },
    {
      updateOne: {
        filter: { group: "analytics", name: "Google Analytics" },
        update: {
          $set: {
            group: "analytics",
            name: "Google Analytics",
            description: "Métricas de tráfego e conversão transacional.",
            connected: false,
          },
        },
        upsert: true,
      },
    },
    {
      updateOne: {
        filter: { group: "pixel", name: "Meta Pixel" },
        update: {
          $set: {
            group: "pixel",
            name: "Meta Pixel",
            description: "Atribuição de campanhas e eventos de compra.",
            connected: false,
          },
        },
        upsert: true,
      },
    },
  ]);

  const now = new Date();
  const end = new Date(now);
  end.setMonth(end.getMonth() + 2);

  await CouponModel.findOneAndUpdate(
    { code: "BEMVINDO10" },
    {
      $set: {
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
    },
    { upsert: true },
  );

  await CouponModel.findOneAndUpdate(
    { code: "FRETEGRATIS" },
    {
      $set: {
        code: "FRETEGRATIS",
        description: "Frete grátis acima de R$199",
        type: "shipping",
        amount: 0,
        minSubtotalCents: toCents(199),
        maxUses: 500,
        startsAt: now,
        endsAt: end,
        active: true,
      },
    },
    { upsert: true },
  );

  await CashbackRuleModel.findOneAndUpdate(
    { name: "Cashback padrão" },
    {
      $set: {
        name: "Cashback padrão",
        percent: 5,
        validDays: 30,
        minSubtotalCents: toCents(150),
        maxCashbackCents: toCents(50),
        active: true,
      },
    },
    { upsert: true },
  );

  const customerHash = await bcrypt.hash("Cliente@123", 10);
  const customer = await CustomerModel.findOneAndUpdate(
    { email: "cliente@exemplo.com" },
    {
      $set: {
        name: "Cliente Exemplo",
        email: "cliente@exemplo.com",
        phone: "+55 21 99999-0001",
        passwordHash: customerHash,
        segment: "novo",
        tags: ["primeira compra"],
      },
    },
    { upsert: true, new: true },
  );

  const productRows = await ProductModel.find().limit(2);
  if (productRows.length >= 2) {
    const existingOrder = await OrderModel.findOne({ code: "10483" });
    if (!existingOrder) {
      const item1 = productRows[0]!;
      const item2 = productRows[1]!;
      const subtotal = item1.priceCents + item2.priceCents;
      const tax = Math.round(subtotal * 0.08);
      const shipping = 1290;
      const total = subtotal + tax + shipping;

      const order = await OrderModel.create({
        code: "10483",
        customerId: customer._id,
        customerName: customer.name,
        email: customer.email,
        status: "pago",
        channel: "Site",
        shippingMethod: "PAC",
        paymentMethod: "Pix",
        items: [
          {
            productId: item1._id,
            name: item1.name,
            sku: item1.sku,
            qty: 1,
            unitPriceCents: item1.priceCents,
            totalCents: item1.priceCents,
            slug: item1.slug,
          },
          {
            productId: item2._id,
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
      });

      await InventoryMovementModel.create({
        productId: item1._id,
        type: "saida",
        quantity: -1,
        reason: `Pedido ${order.code}`,
        createdBy: "seed",
      });

      await InventoryMovementModel.create({
        productId: item2._id,
        type: "saida",
        quantity: -1,
        reason: `Pedido ${order.code}`,
        createdBy: "seed",
      });
    }
  }

  console.log("Seed concluído com sucesso.");
  console.log(`Admin: ${adminEmail} / ${adminPassword}`);
}

seed()
  .catch((error) => {
    console.error("Falha no seed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDb();
  });
