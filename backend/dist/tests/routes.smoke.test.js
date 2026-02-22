"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const supertest_1 = __importDefault(require("supertest"));
const vitest_1 = require("vitest");
const app_1 = require("../app");
const db_1 = require("../config/db");
const prisma_1 = require("../lib/prisma");
const AdminUser_1 = require("../models/AdminUser");
const Category_1 = require("../models/Category");
const Customer_1 = require("../models/Customer");
const Post_1 = require("../models/Post");
const Product_1 = require("../models/Product");
const routeInventory_1 = require("./routeInventory");
const ADMIN_EMAIL = "admin@exemplo.com";
const ADMIN_PASSWORD = "Admin@123";
const CUSTOMER_EMAIL = "cliente@exemplo.com";
const CUSTOMER_PASSWORD = "Cliente@123";
let productId = "";
let postId = "";
let postSlug = "";
let draftSlug = "";
let adminAgent;
let customerAgent;
async function resetDatabase() {
    await prisma_1.prisma.document.deleteMany();
}
async function seedBaseData() {
    const adminHash = await bcryptjs_1.default.hash(ADMIN_PASSWORD, 10);
    const customerHash = await bcryptjs_1.default.hash(CUSTOMER_PASSWORD, 10);
    await AdminUser_1.AdminUserModel.create({
        name: "Administrador",
        email: ADMIN_EMAIL,
        passwordHash: adminHash,
        role: "admin",
        active: true,
    });
    await Customer_1.CustomerModel.create({
        name: "Cliente Exemplo",
        email: CUSTOMER_EMAIL,
        passwordHash: customerHash,
        phone: "+55 21 99999-0001",
        segment: "novo",
        active: true,
    });
    const category = await Category_1.CategoryModel.create({
        name: "Fitness",
        slug: "fitness",
        active: true,
        sortOrder: 1,
    });
    const product = await Product_1.ProductModel.create({
        name: "Legging Teste",
        slug: "legging-teste",
        sku: "LEG-TEST-001",
        category: "fitness",
        categoryId: String(category._id),
        size: "P, M, G",
        sizeType: "roupas",
        sizes: [
            { label: "P", stock: 5, active: true },
            { label: "M", stock: 7, active: true },
            { label: "G", stock: 4, active: true },
        ],
        stock: 16,
        priceCents: 15990,
        shortDescription: "Legging de teste",
        description: "Descrição completa do produto de teste",
        additionalInfo: [{ label: "Tecido", value: "Tecnológico" }],
        tags: ["teste"],
        status: "padrao",
        active: true,
        images: ["https://example.com/image-1.jpg"],
    });
    productId = String(product._id);
    const publishedPost = await Post_1.PostModel.create({
        title: "Post Publicado",
        slug: "post-publicado",
        excerpt: "Resumo publicado",
        content: "Conteúdo publicado para testes.",
        coverImage: "https://example.com/post.jpg",
        tags: ["teste"],
        topic: "novidades",
        featured: false,
        published: true,
        publishedAt: new Date(),
        authorName: "Equipe Marima",
    });
    postId = String(publishedPost._id);
    postSlug = String(publishedPost.slug);
    const draftPost = await Post_1.PostModel.create({
        title: "Post Rascunho",
        slug: "post-rascunho",
        excerpt: "Resumo rascunho",
        content: "Conteúdo rascunho para testes.",
        coverImage: "https://example.com/post-draft.jpg",
        tags: ["teste"],
        topic: "novidades",
        featured: false,
        published: false,
        authorName: "Equipe Marima",
    });
    draftSlug = String(draftPost.slug);
}
async function login(agent, email, password, mode) {
    const endpoint = mode === "admin" ? "/api/v1/auth/admin/login" : "/api/v1/auth/customer/login";
    const response = await agent.post(endpoint).send({ email, password });
    (0, vitest_1.expect)(response.status).toBe(200);
}
function fillPath(path) {
    return path.replace(/:([a-zA-Z_]\w*)(\([^)]*\))?/g, (_full, param) => {
        const key = String(param);
        if (key === "id")
            return postId || "caaaaaaaaaaaaaaaaaaaaaaaa";
        if (key === "slug")
            return postSlug || "post-publicado";
        if (key === "productId")
            return productId || "cbbbbbbbbbbbbbbbbbbbbbbbb";
        if (key === "savedCartId")
            return "ccccccccccccccccccccccccc";
        if (key === "itemId")
            return "item-1";
        if (key === "token")
            return "token-smoke-1234";
        return `${key}-smoke`;
    });
}
function bodyFixture(path) {
    if (path.includes("/auth/customer/register")) {
        return { name: "Cliente Novo", email: "novo@exemplo.com", password: "Cliente@123", phone: "+55 11 90000-0000" };
    }
    if (path.includes("/auth/customer/login")) {
        return { email: CUSTOMER_EMAIL, password: CUSTOMER_PASSWORD };
    }
    if (path.includes("/auth/admin/login")) {
        return { email: ADMIN_EMAIL, password: ADMIN_PASSWORD };
    }
    if (path.includes("/store/coupons/validate")) {
        return { code: "BEMVINDO10", subtotalCents: 15990 };
    }
    if (path.includes("/payments/mercadopago/checkout-pro")) {
        return {
            address: {
                fullName: "Cliente Exemplo",
                email: CUSTOMER_EMAIL,
                phone: "+55 21 99999-0001",
                zip: "27213-120",
                state: "RJ",
                city: "Volta Redonda",
                neighborhood: "Aterrado",
                street: "Rua Exemplo",
                number: "123",
            },
        };
    }
    if (path.includes("/payments/mercadopago/cancel")) {
        return { orderId: "order-smoke" };
    }
    if (path.endsWith("/blog/posts")) {
        return {
            title: "Post Smoke",
            content: "Conteúdo smoke do blog para validação.",
            published: false,
        };
    }
    if (path.match(/\/blog\/posts\/[^/]+$/)) {
        return { published: true };
    }
    return {};
}
vitest_1.describe.sequential("API v1 smoke routes", () => {
    (0, vitest_1.beforeAll)(async () => {
        await (0, db_1.connectDb)();
        await resetDatabase();
        await seedBaseData();
        adminAgent = supertest_1.default.agent(app_1.app);
        customerAgent = supertest_1.default.agent(app_1.app);
        await login(adminAgent, ADMIN_EMAIL, ADMIN_PASSWORD, "admin");
        await login(customerAgent, CUSTOMER_EMAIL, CUSTOMER_PASSWORD, "customer");
    });
    (0, vitest_1.afterAll)(async () => {
        await (0, db_1.disconnectDb)();
    });
    (0, vitest_1.it)("inventaria rotas automaticamente", () => {
        const routes = (0, routeInventory_1.collectRouteInventory)(app_1.app);
        (0, vitest_1.expect)(routes.length).toBeGreaterThan(0);
        (0, vitest_1.expect)(routes.some((route) => route.path === "/api/v1/blog/posts" && route.method === "GET")).toBe(true);
        (0, vitest_1.expect)(routes.some((route) => route.path === "/api/v1/admin/products" && route.method === "GET")).toBe(true);
    });
    (0, vitest_1.it)("garante auth/status para me e admin", async () => {
        await (0, supertest_1.default)(app_1.app).get("/api/v1/auth/me").expect(401);
        await customerAgent.get("/api/v1/admin/products").expect(403);
        await adminAgent.get("/api/v1/admin/products").expect(200);
        await adminAgent.get("/api/v1/auth/me").expect(200);
    }, 20_000);
    (0, vitest_1.it)("corrige fluxo do blog por id/slug e compatibilidade de métodos", async () => {
        const created = await adminAgent.post("/api/v1/blog/posts").send({
            title: "Post Integração",
            content: "Conteúdo de integração do post.",
            published: false,
        });
        (0, vitest_1.expect)(created.status).toBe(201);
        const createdId = String(created.body?.data?.id || "");
        (0, vitest_1.expect)(createdId).toHaveLength(25);
        await adminAgent.get(`/api/v1/blog/posts/${createdId}`).expect(200);
        await adminAgent.patch(`/api/v1/blog/posts/${createdId}`).send({ published: true }).expect(200);
        await adminAgent.put(`/api/v1/blog/posts/${createdId}`).send({ title: "Post Integração Atualizado" }).expect(200);
        await adminAgent.post(`/api/v1/blog/posts/${createdId}`).send({ featured: true }).expect(200);
        const missingId = `c${"z".repeat(24)}`;
        await adminAgent.get(`/api/v1/blog/posts/${missingId}`).expect(404);
        await (0, supertest_1.default)(app_1.app).get(`/api/v1/blog/posts/${postSlug}`).expect(200);
        await (0, supertest_1.default)(app_1.app).get(`/api/v1/blog/posts/${draftSlug}`).expect(404);
    }, 20_000);
    (0, vitest_1.it)("processa inscricao de newsletter com validacao e deduplicacao", async () => {
        await (0, supertest_1.default)(app_1.app)
            .post("/api/v1/marketing/newsletter/subscribe")
            .send({ email: "invalido", source: "blog" })
            .expect(400);
        const email = "newsletter.teste@exemplo.com";
        const first = await (0, supertest_1.default)(app_1.app)
            .post("/api/v1/marketing/newsletter/subscribe")
            .send({ email, source: "blog" });
        (0, vitest_1.expect)(first.status).toBe(201);
        (0, vitest_1.expect)(first.body?.data?.status).toBe("subscribed");
        const stored = await prisma_1.prisma.newsletterSubscriber.findUnique({
            where: { email },
        });
        (0, vitest_1.expect)(stored?.email).toBe(email);
        const second = await (0, supertest_1.default)(app_1.app)
            .post("/api/v1/marketing/newsletter/subscribe")
            .send({ email, source: "footer" });
        (0, vitest_1.expect)(second.status).toBe(200);
        (0, vitest_1.expect)(second.body?.data?.status).toBe("already_subscribed");
    }, 20_000);
    (0, vitest_1.it)("executa varredura de rotas sem 500 inesperado", async () => {
        const routes = (0, routeInventory_1.collectRouteInventory)(app_1.app);
        const allowedStatuses = new Set([200, 201, 204, 400, 401, 403, 404, 409]);
        for (const route of routes) {
            if (route.path === "/health")
                continue;
            const path = fillPath(route.path);
            const method = route.method.toLowerCase();
            const req = (0, supertest_1.default)(app_1.app)[method](path);
            if (method === "post" || method === "put" || method === "patch") {
                req.send(bodyFixture(path));
            }
            const response = await req;
            const requiresAuth = route.path.startsWith("/api/v1/admin") ||
                route.middlewares.includes("requireAdminAuth") ||
                route.middlewares.includes("requireCustomerAuth") ||
                route.middlewares.includes("requireAuth") ||
                route.middlewares.includes("requireRole");
            if (requiresAuth) {
                (0, vitest_1.expect)([400, 401, 403, 404]).toContain(response.status);
                continue;
            }
            (0, vitest_1.expect)(allowedStatuses.has(response.status)).toBe(true);
        }
    }, 60_000);
});
