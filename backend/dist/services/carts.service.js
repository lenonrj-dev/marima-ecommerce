"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GUEST_CART_COOKIE = void 0;
exports.getOrCreateCart = getOrCreateCart;
exports.getCart = getCart;
exports.upsertCartItem = upsertCartItem;
exports.patchCartItemQty = patchCartItemQty;
exports.deleteCartItem = deleteCartItem;
exports.applyCouponToCart = applyCouponToCart;
exports.bindGuestCartToCustomer = bindGuestCartToCustomer;
exports.markCartConverted = markCartConverted;
exports.listAbandonedCarts = listAbandonedCarts;
exports.recoverAbandonedCart = recoverAbandonedCart;
exports.getCartForConversion = getCartForConversion;
const crypto_1 = require("crypto");
const mongoose_1 = require("mongoose");
const Cart_1 = require("../models/Cart");
const Coupon_1 = require("../models/Coupon");
const Product_1 = require("../models/Product");
const apiError_1 = require("../utils/apiError");
const SHIPPING_FLAT_CENTS = 1290;
const FREE_SHIPPING_THRESHOLD_CENTS = 29900;
const TAX_RATE = 0.08;
exports.GUEST_CART_COOKIE = "marima_guest_cart";
function computeTotals(cart) {
    const subtotalCents = cart.items.reduce((acc, item) => acc + item.unitPriceCents * item.qty, 0);
    const discountCents = cart.discountCents || 0;
    const taxable = Math.max(0, subtotalCents - discountCents);
    const shippingCents = subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS || subtotalCents === 0 ? 0 : SHIPPING_FLAT_CENTS;
    const taxCents = Math.round(taxable * TAX_RATE);
    const totalCents = Math.max(0, taxable + shippingCents + taxCents);
    cart.subtotalCents = subtotalCents;
    cart.shippingCents = shippingCents;
    cart.taxCents = taxCents;
    cart.totalCents = totalCents;
}
function toOutput(cart) {
    return {
        id: String(cart._id),
        customerId: cart.customerId ? String(cart.customerId) : undefined,
        guestToken: cart.guestToken,
        status: cart.status,
        recovered: cart.recovered,
        lastActivityAt: cart.lastActivityAt?.toISOString(),
        couponCode: cart.couponCode,
        items: cart.items.map((item) => ({
            itemId: String(item._id),
            id: String(item._id),
            productId: String(item.productId),
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
async function getOrCreateCart(identity) {
    let cart;
    if (identity.customerId) {
        cart = await Cart_1.CartModel.findOne({ customerId: identity.customerId, status: "active" });
    }
    else if (identity.guestToken) {
        cart = await Cart_1.CartModel.findOne({ guestToken: identity.guestToken, status: "active" });
    }
    if (!cart) {
        cart = await Cart_1.CartModel.create({
            customerId: identity.customerId || undefined,
            guestToken: identity.customerId ? undefined : identity.guestToken || (0, crypto_1.randomUUID)(),
            items: [],
            status: "active",
            lastActivityAt: new Date(),
        });
    }
    computeTotals(cart);
    await cart.save();
    return cart;
}
async function getCart(identity) {
    const cart = await getOrCreateCart(identity);
    return toOutput(cart);
}
function normalizeVariant(value) {
    return value?.trim().toLowerCase() || "default";
}
function normalizeSizeLabel(value) {
    return value?.trim().toLowerCase() || "default";
}
async function upsertCartItem(identity, input) {
    if (!mongoose_1.Types.ObjectId.isValid(input.productId))
        throw new apiError_1.ApiError(400, "Produto inválido.");
    const product = await Product_1.ProductModel.findById(input.productId);
    if (!product || !product.active)
        throw new apiError_1.ApiError(404, "Produto não encontrado.");
    if (product.stock <= 0)
        throw new apiError_1.ApiError(400, "Produto sem estoque.");
    const sizeType = product.sizeType || (Array.isArray(product.sizes) && product.sizes.length ? "custom" : "unico");
    const hasSizes = sizeType !== "unico" && Array.isArray(product.sizes) && product.sizes.length > 0;
    let sizeLabel;
    let availableStock = Math.max(0, Math.floor(Number(product.stock ?? 0)));
    if (hasSizes) {
        const rawLabel = String(input.sizeLabel || "").trim();
        if (!rawLabel)
            throw new apiError_1.ApiError(400, "Selecione um tamanho.");
        const normalized = rawLabel.toLocaleLowerCase("pt-BR");
        const row = product.sizes.find((entry) => {
            const label = String(entry?.label || "").trim();
            const active = entry?.active === undefined ? true : Boolean(entry.active);
            return active && label.toLocaleLowerCase("pt-BR") === normalized;
        });
        if (!row)
            throw new apiError_1.ApiError(400, "Tamanho inválido para este produto.");
        sizeLabel = String(row.label || rawLabel).trim();
        availableStock = Math.max(0, Math.floor(Number(row.stock ?? 0)));
        if (availableStock <= 0)
            throw new apiError_1.ApiError(400, "Tamanho sem estoque.");
    }
    const cart = await getOrCreateCart(identity);
    const qty = Math.max(1, Math.floor(input.qty));
    const variantKey = normalizeVariant(input.variant);
    const sizeKey = normalizeSizeLabel(sizeLabel);
    const existing = cart.items.find((item) => String(item.productId) === String(product._id) &&
        normalizeVariant(item.variant) === variantKey &&
        normalizeSizeLabel(item.sizeLabel) === sizeKey);
    if (existing) {
        existing.qty = Math.min(availableStock, qty);
        existing.stock = availableStock;
        existing.unitPriceCents = product.priceCents;
        existing.slug = product.slug;
        existing.name = product.name;
        existing.imageUrl = product.images?.[0] || "";
        existing.variant = input.variant;
        existing.sizeLabel = sizeLabel;
    }
    else {
        cart.items.push({
            productId: product._id,
            slug: product.slug,
            name: product.name,
            imageUrl: product.images?.[0] || "",
            variant: input.variant,
            sizeLabel,
            unitPriceCents: product.priceCents,
            qty: Math.min(availableStock, qty),
            stock: availableStock,
        });
    }
    cart.lastActivityAt = new Date();
    cart.status = "active";
    cart.recovered = false;
    computeTotals(cart);
    await cart.save();
    return toOutput(cart);
}
async function patchCartItemQty(identity, itemId, qty) {
    const cart = await getOrCreateCart(identity);
    const item = cart.items.id(itemId);
    if (!item)
        throw new apiError_1.ApiError(404, "Item não encontrado no carrinho.");
    const product = await Product_1.ProductModel.findById(item.productId);
    if (!product || !product.active) {
        item.deleteOne();
        cart.lastActivityAt = new Date();
        computeTotals(cart);
        await cart.save();
        return toOutput(cart);
    }
    const sizeType = product.sizeType || (Array.isArray(product.sizes) && product.sizes.length ? "custom" : "unico");
    const hasSizes = sizeType !== "unico" && Array.isArray(product.sizes) && product.sizes.length > 0;
    let availableStock = Math.max(0, Math.floor(Number(product.stock ?? 0)));
    if (hasSizes) {
        const rawLabel = String(item.sizeLabel || "").trim();
        if (!rawLabel) {
            item.deleteOne();
            cart.lastActivityAt = new Date();
            computeTotals(cart);
            await cart.save();
            return toOutput(cart);
        }
        const normalized = rawLabel.toLocaleLowerCase("pt-BR");
        const row = product.sizes.find((entry) => {
            const label = String(entry?.label || "").trim();
            const active = entry?.active === undefined ? true : Boolean(entry.active);
            return active && label.toLocaleLowerCase("pt-BR") === normalized;
        });
        availableStock = row ? Math.max(0, Math.floor(Number(row.stock ?? 0))) : 0;
    }
    if (availableStock <= 0) {
        item.deleteOne();
        cart.lastActivityAt = new Date();
        computeTotals(cart);
        await cart.save();
        return toOutput(cart);
    }
    item.slug = product.slug;
    item.name = product.name;
    item.imageUrl = product.images?.[0] || item.imageUrl;
    item.unitPriceCents = product.priceCents;
    item.stock = availableStock;
    item.qty = Math.min(availableStock, Math.max(1, Math.floor(qty)));
    cart.lastActivityAt = new Date();
    computeTotals(cart);
    await cart.save();
    return toOutput(cart);
}
async function deleteCartItem(identity, itemId) {
    const cart = await getOrCreateCart(identity);
    const item = cart.items.id(itemId);
    if (!item)
        return toOutput(cart);
    item.deleteOne();
    cart.lastActivityAt = new Date();
    computeTotals(cart);
    await cart.save();
    return toOutput(cart);
}
async function applyCouponToCart(identity, code) {
    const cart = await getOrCreateCart(identity);
    const normalized = code.trim().toUpperCase();
    if (!normalized) {
        cart.couponCode = undefined;
        cart.discountCents = 0;
        computeTotals(cart);
        await cart.save();
        return toOutput(cart);
    }
    const coupon = await Coupon_1.CouponModel.findOne({ code: normalized, active: true });
    if (!coupon)
        throw new apiError_1.ApiError(404, "Cupom não encontrado.");
    const now = new Date();
    if (coupon.startsAt > now || coupon.endsAt < now) {
        throw new apiError_1.ApiError(400, "Cupom fora do período de validade.");
    }
    if (coupon.maxUses && coupon.uses >= coupon.maxUses) {
        throw new apiError_1.ApiError(400, "Cupom atingiu o limite de usos.");
    }
    const subtotal = cart.items.reduce((acc, item) => acc + item.unitPriceCents * item.qty, 0);
    if (coupon.minSubtotalCents && subtotal < coupon.minSubtotalCents) {
        throw new apiError_1.ApiError(400, "Subtotal mínimo não atingido para este cupom.");
    }
    let discount = 0;
    if (coupon.type === "percent")
        discount = Math.round(subtotal * (coupon.amount / 100));
    if (coupon.type === "fixed")
        discount = Math.min(subtotal, coupon.amount);
    if (coupon.type === "shipping")
        discount = 0;
    cart.couponCode = normalized;
    cart.discountCents = discount;
    computeTotals(cart);
    await cart.save();
    return toOutput(cart);
}
async function bindGuestCartToCustomer(guestToken, customerId) {
    if (!guestToken)
        return;
    const guestCart = await Cart_1.CartModel.findOne({ guestToken, status: "active" });
    if (!guestCart)
        return;
    const customerObjectId = new mongoose_1.Types.ObjectId(customerId);
    const customerCart = await Cart_1.CartModel.findOne({ customerId: customerObjectId, status: "active" });
    if (!customerCart) {
        guestCart.customerId = customerObjectId;
        guestCart.guestToken = undefined;
        guestCart.lastActivityAt = new Date();
        computeTotals(guestCart);
        await guestCart.save();
        return;
    }
    for (const guestItem of guestCart.items) {
        const variantKey = normalizeVariant(guestItem.variant);
        const sizeKey = normalizeSizeLabel(guestItem.sizeLabel);
        const existing = customerCart.items.find((item) => String(item.productId) === String(guestItem.productId) &&
            normalizeVariant(item.variant) === variantKey &&
            normalizeSizeLabel(item.sizeLabel) === sizeKey);
        if (existing) {
            existing.qty += guestItem.qty;
            continue;
        }
        customerCart.items.push({
            productId: guestItem.productId,
            slug: guestItem.slug,
            name: guestItem.name,
            imageUrl: guestItem.imageUrl,
            variant: guestItem.variant,
            sizeLabel: guestItem.sizeLabel,
            unitPriceCents: guestItem.unitPriceCents,
            qty: guestItem.qty,
            stock: guestItem.stock,
        });
    }
    // Revalida itens com dados atuais de produto (estoque/preço/slug).
    for (const item of [...customerCart.items]) {
        const product = await Product_1.ProductModel.findById(item.productId);
        if (!product || !product.active) {
            item.deleteOne();
            continue;
        }
        const sizeType = product.sizeType || (Array.isArray(product.sizes) && product.sizes.length ? "custom" : "unico");
        const hasSizes = sizeType !== "unico" && Array.isArray(product.sizes) && product.sizes.length > 0;
        let availableStock = Math.max(0, Math.floor(Number(product.stock ?? 0)));
        if (hasSizes) {
            const rawLabel = String(item.sizeLabel || "").trim();
            if (!rawLabel) {
                item.deleteOne();
                continue;
            }
            const normalized = rawLabel.toLocaleLowerCase("pt-BR");
            const row = product.sizes.find((entry) => {
                const label = String(entry?.label || "").trim();
                const active = entry?.active === undefined ? true : Boolean(entry.active);
                return active && label.toLocaleLowerCase("pt-BR") === normalized;
            });
            availableStock = row ? Math.max(0, Math.floor(Number(row.stock ?? 0))) : 0;
        }
        if (availableStock <= 0) {
            item.deleteOne();
            continue;
        }
        item.slug = product.slug;
        item.name = product.name;
        item.imageUrl = product.images?.[0] || item.imageUrl;
        item.unitPriceCents = product.priceCents;
        item.stock = availableStock;
        item.qty = Math.min(availableStock, Math.max(1, Math.floor(item.qty)));
    }
    customerCart.lastActivityAt = new Date();
    computeTotals(customerCart);
    await customerCart.save();
    await guestCart.deleteOne();
}
async function markCartConverted(cartId) {
    const cart = await Cart_1.CartModel.findById(cartId);
    if (!cart)
        return;
    cart.status = "converted";
    cart.lastActivityAt = new Date();
    await cart.save();
}
function stageByDate(lastActivityAt) {
    const diffHours = (Date.now() - lastActivityAt.getTime()) / 36e5;
    if (diffHours <= 24)
        return "quente";
    if (diffHours <= 72)
        return "morno";
    return "frio";
}
async function listAbandonedCarts(input) {
    const threshold = new Date(Date.now() - 2 * 60 * 60 * 1000);
    await Cart_1.CartModel.updateMany({ status: "active", lastActivityAt: { $lte: threshold }, items: { $exists: true, $ne: [] } }, { $set: { status: "abandoned" } });
    const [rows, total] = await Promise.all([
        Cart_1.CartModel.find({ status: "abandoned" })
            .sort({ lastActivityAt: -1 })
            .skip((input.page - 1) * input.limit)
            .limit(input.limit),
        Cart_1.CartModel.countDocuments({ status: "abandoned" }),
    ]);
    return {
        data: rows.map((cart) => ({
            id: String(cart._id),
            customerName: "Cliente",
            email: "cliente@exemplo.com",
            itemsCount: cart.items.length,
            value: Number((cart.totalCents / 100).toFixed(2)),
            stage: stageByDate(cart.lastActivityAt),
            recovered: cart.recovered,
            lastActivityAt: cart.lastActivityAt.toISOString(),
        })),
        meta: {
            total,
            page: input.page,
            limit: input.limit,
            pages: Math.max(1, Math.ceil(total / input.limit)),
        },
    };
}
async function recoverAbandonedCart(cartId, note) {
    const cart = await Cart_1.CartModel.findById(cartId);
    if (!cart)
        throw new apiError_1.ApiError(404, "Carrinho não encontrado.");
    cart.recovered = true;
    if (note)
        cart.notes.push(note);
    await cart.save();
    return { success: true };
}
async function getCartForConversion(cartId) {
    const cart = await Cart_1.CartModel.findById(cartId);
    if (!cart)
        throw new apiError_1.ApiError(404, "Carrinho não encontrado.");
    if (!cart.items.length)
        throw new apiError_1.ApiError(400, "Carrinho sem itens.");
    return cart;
}
