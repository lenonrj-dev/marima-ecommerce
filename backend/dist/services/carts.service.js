"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GUEST_CART_COOKIE = void 0;
exports.invalidateCartCache = invalidateCartCache;
exports.getOrCreateCart = getOrCreateCart;
exports.getCart = getCart;
exports.upsertCartItem = upsertCartItem;
exports.patchCartItemQty = patchCartItemQty;
exports.deleteCartItem = deleteCartItem;
exports.applyCouponToCart = applyCouponToCart;
exports.removeCouponFromCart = removeCouponFromCart;
exports.saveCartSnapshotForCustomer = saveCartSnapshotForCustomer;
exports.listSavedCartsForCustomer = listSavedCartsForCustomer;
exports.getSavedCartForCustomer = getSavedCartForCustomer;
exports.deleteSavedCartForCustomer = deleteSavedCartForCustomer;
exports.loadSavedCartForCustomer = loadSavedCartForCustomer;
exports.shareSavedCartForCustomer = shareSavedCartForCustomer;
exports.revokeSavedCartShareForCustomer = revokeSavedCartShareForCustomer;
exports.createSharedCartLink = createSharedCartLink;
exports.getSharedCartByToken = getSharedCartByToken;
exports.importSharedCartByToken = importSharedCartByToken;
exports.bindGuestCartToCustomer = bindGuestCartToCustomer;
exports.markCartConverted = markCartConverted;
exports.listAbandonedCarts = listAbandonedCarts;
exports.recoverAbandonedCart = recoverAbandonedCart;
exports.getCartForConversion = getCartForConversion;
const crypto_1 = require("crypto");
const prisma_1 = require("../lib/prisma");
const cache_1 = require("../lib/cache");
const env_1 = require("../config/env");
const apiError_1 = require("../utils/apiError");
const SHIPPING_FLAT_CENTS = 1290;
const FREE_SHIPPING_THRESHOLD_CENTS = 29900;
const TAX_RATE = 0.08;
const SHARED_CART_TTL_DAYS = 1;
const CART_CACHE_TTL_SECONDS = 60 * 5;
exports.GUEST_CART_COOKIE = "marima_guest_cart";
const asArray = (value) => (Array.isArray(value) ? value : []);
const asObj = (value) => (value && typeof value === "object" ? value : null);
const toIso = (value) => {
    if (!value)
        return undefined;
    if (value instanceof Date)
        return value.toISOString();
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
};
function cacheKey(identity) {
    if (identity.customerId)
        return `cache:v1:cart:saved:${identity.customerId}`;
    if (identity.guestToken)
        return `cache:v1:cart:saved:guest:${identity.guestToken}`;
    return null;
}
async function invalidateCartCache(identity) {
    const key = cacheKey(identity);
    if (key)
        await (0, cache_1.delCache)(key);
}
const nVariant = (value) => value?.trim().toLowerCase() || "default";
const nSize = (value) => value?.trim().toLowerCase() || "default";
function parseItem(input) {
    const row = asObj(input);
    if (!row)
        return null;
    const productId = String(row.productId || "").trim();
    const slug = String(row.slug || "").trim();
    const name = String(row.name || "").trim();
    const imageUrl = String(row.imageUrl || "").trim();
    if (!productId || !slug || !name || !imageUrl)
        return null;
    return {
        itemId: row.itemId ? String(row.itemId) : row.id ? String(row.id) : undefined,
        productId,
        slug,
        name,
        imageUrl,
        variant: typeof row.variant === "string" && row.variant.trim() ? row.variant.trim() : undefined,
        sizeLabel: typeof row.sizeLabel === "string" && row.sizeLabel.trim() ? row.sizeLabel.trim() : undefined,
        unitPriceCents: Math.max(0, Math.floor(Number(row.unitPriceCents || 0))),
        qty: Math.max(1, Math.floor(Number(row.qty || 1))),
        stock: Math.max(0, Math.floor(Number(row.stock || 0))),
    };
}
function parseItems(value) {
    return asArray(value)
        .map((item) => parseItem(item))
        .filter((item) => item !== null)
        .map((item) => ({ ...item, itemId: item.itemId || (0, crypto_1.randomUUID)() }));
}
function toItemsJson(items) {
    return items.map((item) => ({
        itemId: item.itemId,
        id: item.itemId,
        productId: item.productId,
        slug: item.slug,
        name: item.name,
        imageUrl: item.imageUrl,
        variant: item.variant,
        sizeLabel: item.sizeLabel,
        unitPriceCents: item.unitPriceCents,
        qty: item.qty,
        stock: item.stock,
    }));
}
function hydrate(row) {
    return {
        id: String(row.id),
        customerId: row.customerId ? String(row.customerId) : undefined,
        guestToken: row.guestToken ? String(row.guestToken) : undefined,
        status: row.status || "active",
        recovered: Boolean(row.recovered),
        lastActivityAt: row.lastActivityAt instanceof Date ? row.lastActivityAt : new Date(row.lastActivityAt || Date.now()),
        couponCode: row.couponCode ? String(row.couponCode) : undefined,
        freeShippingCouponApplied: Boolean(row.freeShippingCouponApplied),
        discountCents: Math.max(0, Math.floor(Number(row.discountCents || 0))),
        shippingCents: Math.max(0, Math.floor(Number(row.shippingCents || 0))),
        taxCents: Math.max(0, Math.floor(Number(row.taxCents || 0))),
        subtotalCents: Math.max(0, Math.floor(Number(row.subtotalCents || 0))),
        totalCents: Math.max(0, Math.floor(Number(row.totalCents || 0))),
        notes: asArray(row.notes).map((n) => String(n || "").trim()).filter(Boolean),
        items: parseItems(row.items),
    };
}
function totals(cart, forceFreeShipping) {
    const subtotal = cart.items.reduce((acc, item) => acc + item.unitPriceCents * item.qty, 0);
    const discount = Math.max(0, cart.discountCents || 0);
    const taxable = Math.max(0, subtotal - discount);
    const freeShipping = forceFreeShipping ?? Boolean(cart.freeShippingCouponApplied);
    const shipping = freeShipping || subtotal >= FREE_SHIPPING_THRESHOLD_CENTS || subtotal === 0 ? 0 : SHIPPING_FLAT_CENTS;
    const tax = Math.round(taxable * TAX_RATE);
    cart.subtotalCents = subtotal;
    cart.shippingCents = shipping;
    cart.taxCents = tax;
    cart.totalCents = Math.max(0, taxable + shipping + tax);
}
async function persist(cart) {
    const updated = await prisma_1.prisma.cart.update({
        where: { id: cart.id },
        data: {
            customerId: cart.customerId || null,
            guestToken: cart.customerId ? null : cart.guestToken || null,
            status: cart.status,
            recovered: cart.recovered,
            lastActivityAt: cart.lastActivityAt,
            couponCode: cart.couponCode || null,
            freeShippingCouponApplied: cart.freeShippingCouponApplied,
            discountCents: cart.discountCents,
            shippingCents: cart.shippingCents,
            taxCents: cart.taxCents,
            subtotalCents: cart.subtotalCents,
            totalCents: cart.totalCents,
            notes: cart.notes,
            items: toItemsJson(cart.items),
        },
    });
    return hydrate(updated);
}
function toOutput(cart) {
    return {
        id: cart.id,
        customerId: cart.customerId,
        guestToken: cart.guestToken,
        status: cart.status,
        recovered: cart.recovered,
        lastActivityAt: toIso(cart.lastActivityAt),
        couponCode: cart.couponCode,
        freeShippingCouponApplied: Boolean(cart.freeShippingCouponApplied),
        items: cart.items.map((item) => ({
            itemId: item.itemId,
            id: item.itemId,
            productId: item.productId,
            slug: item.slug,
            name: item.name,
            imageUrl: item.imageUrl,
            variant: item.variant,
            sizeLabel: item.sizeLabel,
            unitPrice: item.unitPriceCents,
            unitPriceCents: item.unitPriceCents,
            qty: item.qty,
            stock: item.stock,
            subtotalCents: item.unitPriceCents * item.qty,
        })),
        totals: {
            subtotal: cart.subtotalCents,
            discount: cart.discountCents,
            shipping: cart.shippingCents,
            tax: cart.taxCents,
            total: cart.totalCents,
            subtotalCents: cart.subtotalCents,
            discountCents: cart.discountCents,
            shippingCents: cart.shippingCents,
            taxCents: cart.taxCents,
            totalCents: cart.totalCents,
        },
    };
}
function parseSizes(product) {
    return asArray(product.sizes)
        .map((entry) => {
        const row = asObj(entry);
        if (!row)
            return null;
        const label = String(row.label || "").trim();
        if (!label)
            return null;
        return {
            label,
            stock: Math.max(0, Math.floor(Number(row.stock ?? 0))),
            active: row.active === undefined ? true : Boolean(row.active),
        };
    })
        .filter((row) => row !== null);
}
function resolveStock(product, sizeLabel) {
    const sizes = parseSizes(product);
    const sizeType = String(product.sizeType || "").trim() || (sizes.length ? "custom" : "unico");
    if (sizeType === "unico" || sizes.length === 0) {
        return { stock: Math.max(0, Math.floor(Number(product.stock ?? 0))), sizeLabel: undefined };
    }
    const raw = String(sizeLabel || "").trim();
    if (!raw)
        throw new apiError_1.ApiError(400, "Selecione um tamanho.");
    const normalized = raw.toLocaleLowerCase("pt-BR");
    const match = sizes.find((row) => row.active && row.label.toLocaleLowerCase("pt-BR") === normalized);
    if (!match)
        throw new apiError_1.ApiError(400, "Tamanho inválido para este produto.");
    return { stock: Math.max(0, match.stock), sizeLabel: match.label };
}
async function syncWithCatalog(items) {
    if (!items.length)
        return [];
    const productIds = Array.from(new Set(items.map((item) => item.productId)));
    const products = await prisma_1.prisma.product.findMany({ where: { id: { in: productIds }, active: true } });
    const byId = new Map(products.map((row) => [String(row.id), row]));
    const next = [];
    for (const item of items) {
        const product = byId.get(item.productId);
        if (!product)
            continue;
        let resolved;
        try {
            resolved = resolveStock(product, item.sizeLabel);
        }
        catch {
            continue;
        }
        if (resolved.stock <= 0)
            continue;
        const images = asArray(product.images).map((img) => String(img || "").trim()).filter(Boolean);
        next.push({
            itemId: item.itemId || (0, crypto_1.randomUUID)(),
            productId: String(product.id),
            slug: String(product.slug || item.slug || ""),
            name: String(product.name || item.name || ""),
            imageUrl: images[0] || item.imageUrl,
            variant: item.variant,
            sizeLabel: resolved.sizeLabel,
            unitPriceCents: Math.max(0, Math.floor(Number(product.priceCents || 0))),
            qty: Math.min(resolved.stock, Math.max(1, Math.floor(item.qty || 1))),
            stock: resolved.stock,
        });
    }
    return next;
}
async function getSavedCart(customerId, savedCartId) {
    const row = await prisma_1.prisma.savedCart.findFirst({ where: { id: savedCartId, customerId } });
    if (!row)
        throw new apiError_1.ApiError(404, "Carrinho salvo não encontrado.");
    return row;
}
async function getSharedByToken(token) {
    const normalized = String(token || "").trim();
    if (!normalized)
        throw new apiError_1.ApiError(400, "Token inválido.");
    const row = await prisma_1.prisma.sharedCart.findUnique({ where: { token: normalized } });
    if (!row)
        throw new apiError_1.ApiError(404, "Carrinho compartilhado não encontrado.");
    if (row.expiresAt.getTime() <= Date.now()) {
        await prisma_1.prisma.sharedCart.delete({ where: { id: row.id } }).catch(() => undefined);
        throw new apiError_1.ApiError(410, "Este link de carrinho compartilhado expirou.");
    }
    return row;
}
async function replaceFromSnapshot(identity, itemsInput) {
    const normalized = itemsInput.map((row) => parseItem(row)).filter((row) => row !== null);
    if (!normalized.length)
        throw new apiError_1.ApiError(400, "Nenhum item válido para carregar no carrinho.");
    let cart = await getOrCreateCart(identity);
    cart.items = [];
    cart.couponCode = undefined;
    cart.discountCents = 0;
    cart.freeShippingCouponApplied = false;
    cart.lastActivityAt = new Date();
    totals(cart);
    await persist(cart);
    await invalidateCartCache(identity);
    let imported = 0;
    for (const item of normalized) {
        try {
            await upsertCartItem(identity, { productId: item.productId, qty: item.qty, variant: item.variant, sizeLabel: item.sizeLabel });
            imported += 1;
        }
        catch { }
    }
    if (imported === 0)
        throw new apiError_1.ApiError(400, "Não foi possível importar itens disponíveis para o carrinho.");
    return getCart(identity);
}
async function getOrCreateCart(identity) {
    let row = null;
    if (identity.customerId) {
        row = await prisma_1.prisma.cart.findFirst({ where: { customerId: identity.customerId, status: "active" }, orderBy: { updatedAt: "desc" } });
    }
    else if (identity.guestToken) {
        row = await prisma_1.prisma.cart.findFirst({ where: { guestToken: identity.guestToken, status: "active" }, orderBy: { updatedAt: "desc" } });
    }
    if (!row) {
        row = await prisma_1.prisma.cart.create({
            data: { customerId: identity.customerId || null, guestToken: identity.customerId ? null : identity.guestToken || (0, crypto_1.randomUUID)(), status: "active", lastActivityAt: new Date(), items: [] },
        });
    }
    let cart = hydrate(row);
    totals(cart);
    cart = await persist(cart);
    return cart;
}
async function getCart(identity) {
    const key = cacheKey(identity);
    if (!key)
        return toOutput(await getOrCreateCart(identity));
    return (0, cache_1.getOrSetCache)(key, CART_CACHE_TTL_SECONDS, async () => toOutput(await getOrCreateCart(identity)));
}
async function upsertCartItem(identity, input) {
    const productId = String(input.productId || "").trim();
    if (!productId)
        throw new apiError_1.ApiError(400, "Produto inválido.");
    const product = await prisma_1.prisma.product.findFirst({ where: { id: productId, active: true } });
    if (!product)
        throw new apiError_1.ApiError(404, "Produto não encontrado.");
    const resolved = resolveStock(product, input.sizeLabel);
    if (resolved.stock <= 0)
        throw new apiError_1.ApiError(400, "Produto sem estoque.");
    const images = asArray(product.images).map((img) => String(img || "").trim()).filter(Boolean);
    let cart = await getOrCreateCart(identity);
    const qty = Math.max(1, Math.floor(Number(input.qty || 1)));
    const existing = cart.items.find((row) => row.productId === productId && nVariant(row.variant) === nVariant(input.variant) && nSize(row.sizeLabel) === nSize(resolved.sizeLabel));
    if (existing) {
        existing.qty = Math.min(resolved.stock, qty);
        existing.stock = resolved.stock;
        existing.unitPriceCents = product.priceCents;
        existing.slug = product.slug;
        existing.name = product.name;
        existing.imageUrl = images[0] || existing.imageUrl;
        existing.variant = input.variant;
        existing.sizeLabel = resolved.sizeLabel;
    }
    else {
        cart.items.push({
            itemId: (0, crypto_1.randomUUID)(),
            productId,
            slug: product.slug,
            name: product.name,
            imageUrl: images[0] || "",
            variant: input.variant,
            sizeLabel: resolved.sizeLabel,
            unitPriceCents: product.priceCents,
            qty: Math.min(resolved.stock, qty),
            stock: resolved.stock,
        });
    }
    cart.status = "active";
    cart.recovered = false;
    cart.lastActivityAt = new Date();
    totals(cart);
    cart = await persist(cart);
    await invalidateCartCache(identity);
    return toOutput(cart);
}
async function patchCartItemQty(identity, itemId, qty) {
    let cart = await getOrCreateCart(identity);
    const target = cart.items.find((item) => item.itemId === String(itemId || "").trim());
    if (!target)
        throw new apiError_1.ApiError(404, "Item não encontrado no carrinho.");
    const product = await prisma_1.prisma.product.findFirst({ where: { id: target.productId, active: true } });
    if (!product) {
        cart.items = cart.items.filter((item) => item.itemId !== target.itemId);
    }
    else {
        try {
            const resolved = resolveStock(product, target.sizeLabel);
            if (resolved.stock <= 0) {
                cart.items = cart.items.filter((item) => item.itemId !== target.itemId);
            }
            else {
                const images = asArray(product.images).map((img) => String(img || "").trim()).filter(Boolean);
                target.slug = product.slug;
                target.name = product.name;
                target.imageUrl = images[0] || target.imageUrl;
                target.unitPriceCents = product.priceCents;
                target.stock = resolved.stock;
                target.sizeLabel = resolved.sizeLabel;
                target.qty = Math.min(resolved.stock, Math.max(1, Math.floor(Number(qty || 1))));
            }
        }
        catch {
            cart.items = cart.items.filter((item) => item.itemId !== target.itemId);
        }
    }
    cart.lastActivityAt = new Date();
    totals(cart);
    cart = await persist(cart);
    await invalidateCartCache(identity);
    return toOutput(cart);
}
async function deleteCartItem(identity, itemId) {
    let cart = await getOrCreateCart(identity);
    const before = cart.items.length;
    cart.items = cart.items.filter((item) => item.itemId !== String(itemId || "").trim());
    if (before === cart.items.length)
        return toOutput(cart);
    cart.lastActivityAt = new Date();
    totals(cart);
    cart = await persist(cart);
    await invalidateCartCache(identity);
    return toOutput(cart);
}
async function applyCouponToCart(identity, code) {
    let cart = await getOrCreateCart(identity);
    const normalized = String(code || "").trim().toUpperCase();
    if (!normalized) {
        cart.couponCode = undefined;
        cart.discountCents = 0;
        cart.freeShippingCouponApplied = false;
        totals(cart);
        cart = await persist(cart);
        await invalidateCartCache(identity);
        return toOutput(cart);
    }
    const coupon = await prisma_1.prisma.coupon.findFirst({ where: { code: normalized, active: true } });
    if (!coupon)
        throw new apiError_1.ApiError(404, "Cupom não encontrado.");
    const now = new Date();
    if (coupon.startsAt > now || coupon.endsAt < now)
        throw new apiError_1.ApiError(400, "Cupom fora do período de validade.");
    if (coupon.maxUses && coupon.uses >= coupon.maxUses)
        throw new apiError_1.ApiError(400, "Cupom atingiu o limite de usos.");
    const subtotal = cart.items.reduce((acc, item) => acc + item.unitPriceCents * item.qty, 0);
    if (coupon.minSubtotalCents && subtotal < coupon.minSubtotalCents)
        throw new apiError_1.ApiError(400, "Subtotal mínimo não atingido para este cupom.");
    let discount = 0;
    let freeShipping = false;
    if (coupon.type === "percent")
        discount = Math.round(subtotal * (Number(coupon.amount || 0) / 100));
    if (coupon.type === "fixed")
        discount = Math.min(subtotal, Math.max(0, Math.floor(Number(coupon.amount || 0))));
    if (coupon.type === "shipping")
        freeShipping = true;
    cart.couponCode = normalized;
    cart.discountCents = discount;
    cart.freeShippingCouponApplied = freeShipping;
    totals(cart, freeShipping);
    cart = await persist(cart);
    await invalidateCartCache(identity);
    return toOutput(cart);
}
async function removeCouponFromCart(identity) {
    return applyCouponToCart(identity, "");
}
async function saveCartSnapshotForCustomer(customerId) {
    const cart = await getOrCreateCart({ customerId });
    if (!cart.items.length)
        throw new apiError_1.ApiError(400, "Adicione itens ao carrinho antes de salvar.");
    const items = cart.items.map((item) => ({ ...item }));
    const itemCount = items.reduce((acc, item) => acc + item.qty, 0);
    const row = await prisma_1.prisma.savedCart.create({
        data: {
            customerId,
            sourceCartId: cart.id,
            title: `Carrinho salvo em ${new Date().toLocaleDateString("pt-BR")}`,
            items: items,
            itemCount,
            couponCode: cart.couponCode || null,
            discountCents: cart.discountCents,
            shippingCents: cart.shippingCents,
            taxCents: cart.taxCents,
            subtotalCents: cart.subtotalCents,
            totalCents: cart.totalCents,
        },
    });
    return {
        id: row.id,
        title: row.title || "Carrinho salvo",
        itemCount: row.itemCount,
        couponCode: row.couponCode || undefined,
        createdAt: toIso(row.createdAt),
        updatedAt: toIso(row.updatedAt),
        items: parseItems(row.items).map((item) => ({ ...item, subtotalCents: item.qty * item.unitPriceCents })),
        totals: { subtotalCents: row.subtotalCents, discountCents: row.discountCents, shippingCents: row.shippingCents, taxCents: row.taxCents, totalCents: row.totalCents },
    };
}
async function listSavedCartsForCustomer(customerId) {
    const rows = await prisma_1.prisma.savedCart.findMany({ where: { customerId }, orderBy: { createdAt: "desc" }, take: 30 });
    return rows.map((row) => ({
        id: row.id,
        title: row.title || "Carrinho salvo",
        itemCount: row.itemCount,
        couponCode: row.couponCode || undefined,
        createdAt: toIso(row.createdAt),
        updatedAt: toIso(row.updatedAt),
        items: parseItems(row.items).map((item) => ({ ...item, subtotalCents: item.qty * item.unitPriceCents })),
        totals: { subtotalCents: row.subtotalCents, discountCents: row.discountCents, shippingCents: row.shippingCents, taxCents: row.taxCents, totalCents: row.totalCents },
    }));
}
async function getSavedCartForCustomer(customerId, savedCartId) {
    const row = await getSavedCart(customerId, savedCartId);
    return {
        id: row.id,
        title: row.title || "Carrinho salvo",
        itemCount: row.itemCount,
        couponCode: row.couponCode || undefined,
        createdAt: toIso(row.createdAt),
        updatedAt: toIso(row.updatedAt),
        items: parseItems(row.items).map((item) => ({ ...item, subtotalCents: item.qty * item.unitPriceCents })),
        totals: { subtotalCents: row.subtotalCents, discountCents: row.discountCents, shippingCents: row.shippingCents, taxCents: row.taxCents, totalCents: row.totalCents },
    };
}
async function deleteSavedCartForCustomer(customerId, savedCartId) {
    const row = await getSavedCart(customerId, savedCartId);
    await prisma_1.prisma.$transaction([prisma_1.prisma.sharedCart.deleteMany({ where: { sourceSavedCartId: row.id } }), prisma_1.prisma.savedCart.delete({ where: { id: row.id } })]);
}
async function loadSavedCartForCustomer(customerId, savedCartId) {
    const row = await getSavedCart(customerId, savedCartId);
    const cart = await replaceFromSnapshot({ customerId }, asArray(row.items));
    return { savedCart: await getSavedCartForCustomer(customerId, savedCartId), cart };
}
async function shareSavedCartForCustomer(customerId, savedCartId) {
    const row = await getSavedCart(customerId, savedCartId);
    const now = new Date();
    const existing = await prisma_1.prisma.sharedCart.findFirst({
        where: { sourceSavedCartId: row.id, sourceCustomerId: customerId, expiresAt: { gt: now } },
        orderBy: { createdAt: "desc" },
    });
    if (existing) {
        const path = `/carrinho/compartilhado/${existing.token}`;
        const base = String(env_1.env.STORE_URL || "").trim().replace(/\/+$/, "");
        return { token: existing.token, savedCartId: existing.sourceSavedCartId || undefined, path, url: base ? `${base}${path}` : path, expiresAt: toIso(existing.expiresAt) };
    }
    const token = (0, crypto_1.randomUUID)().replace(/-/g, "");
    const created = await prisma_1.prisma.sharedCart.create({
        data: {
            token,
            sourceCustomerId: customerId,
            sourceSavedCartId: row.id,
            sourceCartId: row.sourceCartId || null,
            items: asArray(row.items),
            itemCount: row.itemCount,
            couponCode: row.couponCode || null,
            discountCents: row.discountCents,
            shippingCents: row.shippingCents,
            taxCents: row.taxCents,
            subtotalCents: row.subtotalCents,
            totalCents: row.totalCents,
            expiresAt: new Date(Date.now() + SHARED_CART_TTL_DAYS * 24 * 60 * 60 * 1000),
        },
    });
    const path = `/carrinho/compartilhado/${created.token}`;
    const base = String(env_1.env.STORE_URL || "").trim().replace(/\/+$/, "");
    return { token: created.token, savedCartId: created.sourceSavedCartId || undefined, path, url: base ? `${base}${path}` : path, expiresAt: toIso(created.expiresAt) };
}
async function revokeSavedCartShareForCustomer(customerId, savedCartId) {
    const row = await getSavedCart(customerId, savedCartId);
    await prisma_1.prisma.sharedCart.deleteMany({ where: { sourceSavedCartId: row.id, sourceCustomerId: customerId } });
}
async function createSharedCartLink(identity) {
    const cart = await getOrCreateCart(identity);
    if (!cart.items.length)
        throw new apiError_1.ApiError(400, "Adicione itens ao carrinho antes de compartilhar.");
    const token = (0, crypto_1.randomUUID)().replace(/-/g, "");
    const created = await prisma_1.prisma.sharedCart.create({
        data: {
            token,
            sourceCustomerId: identity.customerId || null,
            sourceCartId: cart.id,
            items: toItemsJson(cart.items),
            itemCount: cart.items.reduce((acc, item) => acc + item.qty, 0),
            couponCode: cart.couponCode || null,
            discountCents: cart.discountCents,
            shippingCents: cart.shippingCents,
            taxCents: cart.taxCents,
            subtotalCents: cart.subtotalCents,
            totalCents: cart.totalCents,
            expiresAt: new Date(Date.now() + SHARED_CART_TTL_DAYS * 24 * 60 * 60 * 1000),
        },
    });
    const path = `/carrinho/compartilhado/${created.token}`;
    const base = String(env_1.env.STORE_URL || "").trim().replace(/\/+$/, "");
    return { token: created.token, savedCartId: created.sourceSavedCartId || undefined, path, url: base ? `${base}${path}` : path, expiresAt: toIso(created.expiresAt) };
}
async function getSharedCartByToken(token) {
    const row = await getSharedByToken(token);
    return {
        token: row.token,
        savedCartId: row.sourceSavedCartId ? String(row.sourceSavedCartId) : undefined,
        itemCount: row.itemCount,
        couponCode: row.couponCode || undefined,
        expiresAt: toIso(row.expiresAt),
        createdAt: toIso(row.createdAt),
        items: parseItems(row.items).map((item) => ({ ...item, subtotalCents: item.qty * item.unitPriceCents })),
        totals: { subtotalCents: row.subtotalCents, discountCents: row.discountCents, shippingCents: row.shippingCents, taxCents: row.taxCents, totalCents: row.totalCents },
    };
}
async function importSharedCartByToken(identity, token) {
    const row = await getSharedByToken(token);
    const cart = await replaceFromSnapshot(identity, asArray(row.items));
    return { sharedCart: await getSharedCartByToken(token), cart };
}
async function bindGuestCartToCustomer(guestToken, customerId) {
    const token = String(guestToken || "").trim();
    if (!token)
        return;
    const [guestRow, customerRow] = await Promise.all([
        prisma_1.prisma.cart.findFirst({ where: { guestToken: token, status: "active" }, orderBy: { updatedAt: "desc" } }),
        prisma_1.prisma.cart.findFirst({ where: { customerId, status: "active" }, orderBy: { updatedAt: "desc" } }),
    ]);
    if (!guestRow)
        return;
    const guest = hydrate(guestRow);
    if (!customerRow) {
        guest.items = await syncWithCatalog(guest.items);
        guest.customerId = customerId;
        guest.guestToken = undefined;
        guest.lastActivityAt = new Date();
        totals(guest);
        await persist(guest);
        await invalidateCartCache({ guestToken: token });
        await invalidateCartCache({ customerId });
        return;
    }
    const customer = hydrate(customerRow);
    const map = new Map();
    for (const item of [...customer.items, ...guest.items]) {
        const key = `${item.productId}::${nVariant(item.variant)}::${nSize(item.sizeLabel)}`;
        const current = map.get(key);
        if (current)
            current.qty += Math.max(1, Math.floor(Number(item.qty || 1)));
        else
            map.set(key, { ...item, itemId: item.itemId || (0, crypto_1.randomUUID)(), qty: Math.max(1, Math.floor(Number(item.qty || 1))) });
    }
    customer.items = await syncWithCatalog(Array.from(map.values()));
    customer.lastActivityAt = new Date();
    totals(customer);
    await prisma_1.prisma.$transaction([
        prisma_1.prisma.cart.update({
            where: { id: customer.id },
            data: { items: toItemsJson(customer.items), subtotalCents: customer.subtotalCents, discountCents: customer.discountCents, shippingCents: customer.shippingCents, taxCents: customer.taxCents, totalCents: customer.totalCents, lastActivityAt: customer.lastActivityAt },
        }),
        prisma_1.prisma.cart.delete({ where: { id: guest.id } }),
    ]);
    await invalidateCartCache({ guestToken: token });
    await invalidateCartCache({ customerId });
}
async function markCartConverted(cartId) {
    const id = String(cartId || "").trim();
    if (!id)
        return;
    const row = await prisma_1.prisma.cart.findUnique({ where: { id } });
    if (!row)
        return;
    await prisma_1.prisma.cart.update({ where: { id }, data: { status: "converted", lastActivityAt: new Date() } });
    await invalidateCartCache({ customerId: row.customerId || undefined, guestToken: row.guestToken || undefined });
}
function stage(lastActivityAt) {
    const diffHours = (Date.now() - lastActivityAt.getTime()) / 36e5;
    if (diffHours <= 24)
        return "quente";
    if (diffHours <= 72)
        return "morno";
    return "frio";
}
async function listAbandonedCarts(input) {
    const threshold = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const candidates = await prisma_1.prisma.cart.findMany({ where: { status: "active", lastActivityAt: { lte: threshold } }, select: { id: true, items: true } });
    const ids = candidates.filter((row) => parseItems(row.items).length > 0).map((row) => row.id);
    if (ids.length)
        await prisma_1.prisma.cart.updateMany({ where: { id: { in: ids } }, data: { status: "abandoned" } });
    const [rows, total] = await Promise.all([
        prisma_1.prisma.cart.findMany({ where: { status: "abandoned" }, include: { customer: { select: { name: true, email: true } } }, orderBy: { lastActivityAt: "desc" }, skip: (input.page - 1) * input.limit, take: input.limit }),
        prisma_1.prisma.cart.count({ where: { status: "abandoned" } }),
    ]);
    return {
        data: rows.map((row) => {
            const items = parseItems(row.items);
            return {
                id: String(row.id),
                customerName: row.customer?.name || "Cliente",
                email: row.customer?.email || "cliente@exemplo.com",
                itemsCount: items.reduce((acc, item) => acc + item.qty, 0),
                value: Number((Number(row.totalCents || 0) / 100).toFixed(2)),
                stage: stage(row.lastActivityAt instanceof Date ? row.lastActivityAt : new Date(row.lastActivityAt || Date.now())),
                recovered: Boolean(row.recovered),
                lastActivityAt: toIso(row.lastActivityAt),
            };
        }),
        meta: { total, page: input.page, limit: input.limit, pages: Math.max(1, Math.ceil(total / input.limit)) },
    };
}
async function recoverAbandonedCart(cartId, note) {
    const id = String(cartId || "").trim();
    const row = await prisma_1.prisma.cart.findUnique({ where: { id } });
    if (!row)
        throw new apiError_1.ApiError(404, "Carrinho não encontrado.");
    const notes = asArray(row.notes).map((n) => String(n || "").trim()).filter(Boolean);
    if (note && String(note).trim())
        notes.push(String(note).trim());
    await prisma_1.prisma.cart.update({ where: { id }, data: { recovered: true, notes: notes } });
    await invalidateCartCache({ customerId: row.customerId || undefined, guestToken: row.guestToken || undefined });
    return { success: true };
}
async function getCartForConversion(cartId) {
    const id = String(cartId || "").trim();
    const row = await prisma_1.prisma.cart.findUnique({ where: { id } });
    if (!row)
        throw new apiError_1.ApiError(404, "Carrinho não encontrado.");
    const cart = hydrate(row);
    if (!cart.items.length)
        throw new apiError_1.ApiError(400, "Carrinho sem itens.");
    return cart;
}
