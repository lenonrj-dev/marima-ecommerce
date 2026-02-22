import bcrypt from "bcryptjs";
import request from "supertest";
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { app } from "../app";
import { connectDb, disconnectDb } from "../config/db";
import { prisma } from "../lib/prisma";
import { AdminUserModel } from "../models/AdminUser";
import { CategoryModel } from "../models/Category";
import { CustomerModel } from "../models/Customer";
import { PostModel } from "../models/Post";
import { ProductModel } from "../models/Product";
import { collectRouteInventory } from "./routeInventory";

const ADMIN_EMAIL = "admin@exemplo.com";
const ADMIN_PASSWORD = "Admin@123";
const CUSTOMER_EMAIL = "cliente@exemplo.com";
const CUSTOMER_PASSWORD = "Cliente@123";

let productId = "";
let postId = "";
let postSlug = "";
let draftSlug = "";
let adminAgent: ReturnType<typeof request.agent>;
let customerAgent: ReturnType<typeof request.agent>;

async function resetDatabase() {
  await prisma.document.deleteMany();
  await prisma.newsletterSubscriber.deleteMany();
}

async function seedBaseData() {
  const adminHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const customerHash = await bcrypt.hash(CUSTOMER_PASSWORD, 10);

  await AdminUserModel.create({
    name: "Administrador",
    email: ADMIN_EMAIL,
    passwordHash: adminHash,
    role: "admin",
    active: true,
  });

  await CustomerModel.create({
    name: "Cliente Exemplo",
    email: CUSTOMER_EMAIL,
    passwordHash: customerHash,
    phone: "+55 21 99999-0001",
    segment: "novo",
    active: true,
  });

  const category = await CategoryModel.create({
    name: "Fitness",
    slug: "fitness",
    active: true,
    sortOrder: 1,
  });

  const product = await ProductModel.create({
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

  const publishedPost = await PostModel.create({
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

  const draftPost = await PostModel.create({
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

async function login(agent: ReturnType<typeof request.agent>, email: string, password: string, mode: "admin" | "customer") {
  const endpoint = mode === "admin" ? "/api/v1/auth/admin/login" : "/api/v1/auth/customer/login";
  const response = await agent.post(endpoint).send({ email, password });
  expect(response.status).toBe(200);
}

function fillPath(path: string) {
  return path.replace(/:([a-zA-Z_]\w*)(\([^)]*\))?/g, (_full, param: string) => {
    const key = String(param);
    if (key === "id") return postId || "caaaaaaaaaaaaaaaaaaaaaaaa";
    if (key === "slug") return postSlug || "post-publicado";
    if (key === "productId") return productId || "cbbbbbbbbbbbbbbbbbbbbbbbb";
    if (key === "savedCartId") return "ccccccccccccccccccccccccc";
    if (key === "itemId") return "item-1";
    if (key === "token") return "token-smoke-1234";
    return `${key}-smoke`;
  });
}

function bodyFixture(path: string) {
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

describe.sequential("API v1 smoke routes", () => {
  beforeAll(async () => {
    await connectDb();
    await resetDatabase();
    await seedBaseData();

    adminAgent = request.agent(app);
    customerAgent = request.agent(app);
    await login(adminAgent, ADMIN_EMAIL, ADMIN_PASSWORD, "admin");
    await login(customerAgent, CUSTOMER_EMAIL, CUSTOMER_PASSWORD, "customer");
  });

  afterAll(async () => {
    await disconnectDb();
  });

  it("inventaria rotas automaticamente", () => {
    const routes = collectRouteInventory(app);
    expect(routes.length).toBeGreaterThan(0);
    expect(routes.some((route) => route.path === "/api/v1/blog/posts" && route.method === "GET")).toBe(true);
    expect(routes.some((route) => route.path === "/api/v1/admin/products" && route.method === "GET")).toBe(true);
  });

  it("garante auth/status para me e admin", async () => {
    await request(app).get("/api/v1/auth/me").expect(401);
    await customerAgent.get("/api/v1/admin/products").expect(403);
    await adminAgent.get("/api/v1/admin/products").expect(200);
    await adminAgent.get("/api/v1/auth/me").expect(200);
  }, 20_000);

  it("corrige fluxo do blog por id/slug e compatibilidade de métodos", async () => {
    const created = await adminAgent.post("/api/v1/blog/posts").send({
      title: "Post Integração",
      content: "Conteúdo de integração do post.",
      published: false,
    });
    expect(created.status).toBe(201);
    const createdId = String(created.body?.data?.id || "");
    expect(createdId).toHaveLength(25);

    await adminAgent.get(`/api/v1/blog/posts/${createdId}`).expect(200);
    await adminAgent.patch(`/api/v1/blog/posts/${createdId}`).send({ published: true }).expect(200);
    await adminAgent.put(`/api/v1/blog/posts/${createdId}`).send({ title: "Post Integração Atualizado" }).expect(200);
    await adminAgent.post(`/api/v1/blog/posts/${createdId}`).send({ featured: true }).expect(200);

    const missingId = `c${"z".repeat(24)}`;
    await adminAgent.get(`/api/v1/blog/posts/${missingId}`).expect(404);

    await request(app).get(`/api/v1/blog/posts/${postSlug}`).expect(200);
    await request(app).get(`/api/v1/blog/posts/${draftSlug}`).expect(404);
  }, 20_000);

  it("processa inscricao de newsletter com validacao e deduplicacao", async () => {
    await request(app)
      .post("/api/v1/marketing/newsletter/subscribe")
      .send({ email: "invalido", source: "blog" })
      .expect(400);

    const email = "newsletter.teste@exemplo.com";

    const first = await request(app)
      .post("/api/v1/marketing/newsletter/subscribe")
      .send({ email, source: "blog" });

    expect(first.status).toBe(201);
    expect(first.body?.data?.status).toBe("subscribed");

    const stored = await prisma.newsletterSubscriber.findUnique({
      where: { email },
    });
    expect(stored?.email).toBe(email);

    const second = await request(app)
      .post("/api/v1/marketing/newsletter/subscribe")
      .send({ email, source: "footer" });

    expect(second.status).toBe(200);
    expect(second.body?.data?.status).toBe("already_subscribed");
  }, 20_000);

  it("executa varredura de rotas sem 500 inesperado", async () => {
    const routes = collectRouteInventory(app);
    const allowedStatuses = new Set([200, 201, 204, 400, 401, 403, 404, 409]);

    for (const route of routes) {
      if (route.path === "/health") continue;
      const path = fillPath(route.path);
      const method = route.method.toLowerCase() as "get" | "post" | "put" | "patch" | "delete";
      const req = request(app)[method](path);

      if (method === "post" || method === "put" || method === "patch") {
        req.send(bodyFixture(path));
      }

      const response = await req;

      const requiresAuth =
        route.path.startsWith("/api/v1/admin") ||
        route.middlewares.includes("requireAdminAuth") ||
        route.middlewares.includes("requireCustomerAuth") ||
        route.middlewares.includes("requireAuth") ||
        route.middlewares.includes("requireRole");

      if (requiresAuth) {
        expect([400, 401, 403, 404]).toContain(response.status);
        continue;
      }

      expect(allowedStatuses.has(response.status)).toBe(true);
    }
  }, 60_000);
});
