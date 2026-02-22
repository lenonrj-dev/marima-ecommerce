"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = require("./config/db");
const AdminUser_1 = require("./models/AdminUser");
const Category_1 = require("./models/Category");
const Product_1 = require("./models/Product");
const StoreSettings_1 = require("./models/StoreSettings");
const IntegrationConfig_1 = require("./models/IntegrationConfig");
const Coupon_1 = require("./models/Coupon");
const CashbackRule_1 = require("./models/CashbackRule");
const Customer_1 = require("./models/Customer");
const Order_1 = require("./models/Order");
const InventoryMovement_1 = require("./models/InventoryMovement");
const money_1 = require("./utils/money");
async function seed() {
    await (0, db_1.connectDb)();
    const adminEmail = "admin@exemplo.com";
    const adminPassword = "Admin@123";
    const adminHash = await bcryptjs_1.default.hash(adminPassword, 10);
    await AdminUser_1.AdminUserModel.findOneAndUpdate({ email: adminEmail }, {
        $set: {
            name: "Administrador",
            email: adminEmail,
            passwordHash: adminHash,
            role: "admin",
            active: true,
        },
    }, { upsert: true, new: true });
    await StoreSettings_1.StoreSettingsModel.findOneAndUpdate({}, {
        $set: {
            name: "Minha Loja",
            domain: "minhaloja.com",
            timezone: "America/Sao_Paulo",
            currency: "BRL",
            supportEmail: "suporte@minhaloja.com",
            policy: "Trocas em at� 7 dias. Consulte regras no site.",
        },
    }, { upsert: true, new: true });
    // Migra��o simples: substitui "Acess�rios" por "Casual" para manter consist�ncia entre frontend/admin.
    const existingCasual = await Category_1.CategoryModel.findOne({ slug: "casual" });
    const legacyAccessories = await Category_1.CategoryModel.findOne({ slug: "acessorios" });
    if (legacyAccessories) {
        if (!existingCasual) {
            legacyAccessories.slug = "casual";
            legacyAccessories.name = "Casual";
            legacyAccessories.sortOrder = legacyAccessories.sortOrder || 3;
            legacyAccessories.active = true;
            try {
                await legacyAccessories.save();
            }
            catch {
                // Ignore migration failures and fallback to creating/upserting below.
            }
        }
        else {
            legacyAccessories.active = false;
            await legacyAccessories.save();
        }
    }
    await Product_1.ProductModel.updateMany({ category: "acessorios" }, { $set: { category: "casual" } });
    const categories = [
        { name: "Fitness", slug: "fitness", active: true, sortOrder: 1 },
        { name: "Moda", slug: "moda", active: true, sortOrder: 2 },
        { name: "Casual", slug: "casual", active: true, sortOrder: 3 },
        { name: "Suplementos", slug: "suplementos", active: true, sortOrder: 4 },
        { name: "Outros", slug: "outros", active: true, sortOrder: 5 },
    ];
    for (const category of categories) {
        await Category_1.CategoryModel.findOneAndUpdate({ slug: category.slug }, { $set: category }, { upsert: true });
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
            priceCents: (0, money_1.toCents)(159.9),
            compareAtPriceCents: (0, money_1.toCents)(199.9),
            shortDescription: "Modela o corpo com alta compress�o e conforto.",
            description: "Legging seamless com alta compress�o, cintura alta e tecido respir�vel. Ideal para treinos e uso di�rio.",
            tags: ["compress�o", "cintura alta", "best-seller"],
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
            priceCents: (0, money_1.toCents)(119.9),
            shortDescription: "Sustenta��o m�dia com acabamento premium.",
            description: "Top com sustenta��o m�dia e tecido de secagem r�pida.",
            tags: ["secagem r�pida", "suporte", "novo"],
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
            priceCents: (0, money_1.toCents)(89.9),
            compareAtPriceCents: (0, money_1.toCents)(99.9),
            shortDescription: "Leve, respir�vel e com caimento perfeito.",
            description: "Camiseta dry com tecido leve e respir�vel.",
            tags: ["dry", "respir�vel", "oferta"],
            status: "oferta",
            active: true,
            images: sampleImages,
        },
    ];
    for (const product of products) {
        await Product_1.ProductModel.findOneAndUpdate({ sku: product.sku }, { $set: product }, { upsert: true, new: true });
    }
    const integrations = [
        {
            group: "pagamentos",
            name: "Pix + Cart�o",
            description: "Conecte gateway para Pix, cart�o e boleto.",
            connected: false,
        },
        {
            group: "frete",
            name: "Correios / Melhor Envio",
            description: "C�lculo de frete e gera��o de etiqueta.",
            connected: false,
        },
        {
            group: "email",
            name: "E-mail Marketing",
            description: "Automa��o para carrinhos abandonados e p�s-compra.",
            connected: false,
        },
        {
            group: "whatsapp",
            name: "WhatsApp",
            description: "Recupera��o, suporte e campanhas via WhatsApp.",
            connected: false,
        },
        {
            group: "analytics",
            name: "Google Analytics",
            description: "M�tricas de tr�fego e convers�o transacional.",
            connected: false,
        },
        {
            group: "pixel",
            name: "Meta Pixel",
            description: "Atribui��o de campanhas e eventos de compra.",
            connected: false,
        },
    ];
    for (const integration of integrations) {
        await IntegrationConfig_1.IntegrationConfigModel.findOneAndUpdate({ group: integration.group, name: integration.name }, { $set: integration }, { upsert: true, new: true });
    }
    const now = new Date();
    const end = new Date(now);
    end.setMonth(end.getMonth() + 2);
    await Coupon_1.CouponModel.findOneAndUpdate({ code: "BEMVINDO10" }, {
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
    }, { upsert: true });
    await Coupon_1.CouponModel.findOneAndUpdate({ code: "FRETEGRATIS" }, {
        $set: {
            code: "FRETEGRATIS",
            description: "Frete gr�tis acima de R$199",
            type: "shipping",
            amount: 0,
            minSubtotalCents: (0, money_1.toCents)(199),
            maxUses: 500,
            startsAt: now,
            endsAt: end,
            active: true,
        },
    }, { upsert: true });
    await CashbackRule_1.CashbackRuleModel.findOneAndUpdate({ name: "Cashback padr�o" }, {
        $set: {
            name: "Cashback padr�o",
            percent: 5,
            validDays: 30,
            minSubtotalCents: (0, money_1.toCents)(150),
            maxCashbackCents: (0, money_1.toCents)(50),
            active: true,
        },
    }, { upsert: true });
    const customerHash = await bcryptjs_1.default.hash("Cliente@123", 10);
    const customer = await Customer_1.CustomerModel.findOneAndUpdate({ email: "cliente@exemplo.com" }, {
        $set: {
            name: "Cliente Exemplo",
            email: "cliente@exemplo.com",
            phone: "+55 21 99999-0001",
            passwordHash: customerHash,
            segment: "novo",
            tags: ["primeira compra"],
        },
    }, { upsert: true, new: true });
    const productRows = await Product_1.ProductModel.find().limit(2);
    if (productRows.length >= 2) {
        const existingOrder = await Order_1.OrderModel.findOne({ code: "10483" });
        if (!existingOrder) {
            const item1 = productRows[0];
            const item2 = productRows[1];
            const subtotal = item1.priceCents + item2.priceCents;
            const tax = Math.round(subtotal * 0.08);
            const shipping = 1290;
            const total = subtotal + tax + shipping;
            const order = await Order_1.OrderModel.create({
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
            await InventoryMovement_1.InventoryMovementModel.create({
                productId: item1._id,
                type: "saida",
                quantity: -1,
                reason: `Pedido ${order.code}`,
                createdBy: "seed",
            });
            await InventoryMovement_1.InventoryMovementModel.create({
                productId: item2._id,
                type: "saida",
                quantity: -1,
                reason: `Pedido ${order.code}`,
                createdBy: "seed",
            });
        }
    }
    console.log("Seed conclu�do com sucesso.");
    console.log(`Admin: ${adminEmail} / ${adminPassword}`);
}
seed()
    .catch((error) => {
    console.error("Falha no seed:", error);
    process.exitCode = 1;
})
    .finally(async () => {
    await (0, db_1.disconnectDb)();
});
