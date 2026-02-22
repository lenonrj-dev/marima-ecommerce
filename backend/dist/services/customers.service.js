"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.listAdminCustomers = listAdminCustomers;
exports.getAdminCustomerById = getAdminCustomerById;
exports.updateAdminCustomer = updateAdminCustomer;
exports.listAdminCustomerOrders = listAdminCustomerOrders;
exports.getMeProfile = getMeProfile;
exports.patchMeProfile = patchMeProfile;
exports.listMeAddresses = listMeAddresses;
exports.createMeAddress = createMeAddress;
exports.updateMeAddress = updateMeAddress;
exports.deleteMeAddress = deleteMeAddress;
exports.listMeFavorites = listMeFavorites;
exports.addMeFavorite = addMeFavorite;
exports.removeMeFavorite = removeMeFavorite;
exports.refreshCustomerMetrics = refreshCustomerMetrics;
exports.getMeCashbackBalance = getMeCashbackBalance;
exports.createCustomerFromGuest = createCustomerFromGuest;
exports.toCustomer = toCustomer;
exports.toOrder = toOrder;
exports.toAddress = toAddress;
exports.toFavorite = toFavorite;
const dbCompat_1 = require("../lib/dbCompat");
const CustomerAddress_1 = require("../models/CustomerAddress");
const Customer_1 = require("../models/Customer");
const Favorite_1 = require("../models/Favorite");
const Order_1 = require("../models/Order");
const Product_1 = require("../models/Product");
const apiError_1 = require("../utils/apiError");
const pagination_1 = require("../utils/pagination");
const money_1 = require("../utils/money");
const auth_service_1 = require("./auth.service");
function toCustomer(customer) {
    return {
        id: String(customer._id),
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        segment: customer.segment,
        ordersCount: customer.ordersCount,
        totalSpent: (0, money_1.fromCents)(customer.totalSpentCents),
        lastOrderAt: customer.lastOrderAt ? customer.lastOrderAt.toISOString() : undefined,
        createdAt: customer.createdAt?.toISOString(),
        tags: customer.tags || [],
    };
}
function toOrder(order) {
    return {
        id: String(order._id),
        code: order.code,
        customerId: order.customerId ? String(order.customerId) : undefined,
        customerName: order.customerName,
        email: order.email,
        itemsCount: order.itemsCount,
        total: (0, money_1.fromCents)(order.totalCents),
        status: order.status,
        channel: order.channel,
        shippingMethod: order.shippingMethod,
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt?.toISOString(),
        items: (order.items || []).map((item) => ({
            id: String(item._id),
            name: item.name,
            sku: item.sku,
            qty: item.qty,
            unitPrice: (0, money_1.fromCents)(item.unitPriceCents),
            total: (0, money_1.fromCents)(item.totalCents),
        })),
    };
}
function toAddress(address) {
    return {
        id: String(address._id),
        label: address.label,
        fullName: address.fullName,
        zip: address.zip,
        state: address.state,
        city: address.city,
        neighborhood: address.neighborhood,
        street: address.street,
        number: address.number,
        complement: address.complement,
        isDefault: address.isDefault,
        createdAt: address.createdAt?.toISOString(),
        updatedAt: address.updatedAt?.toISOString(),
    };
}
function toFavorite(favorite) {
    return {
        id: String(favorite._id),
        productId: String(favorite.productId),
        slug: favorite.slug,
        title: favorite.title,
        image: favorite.image,
        price: (0, money_1.fromCents)(favorite.priceCents),
        createdAt: favorite.createdAt?.toISOString(),
    };
}
async function listAdminCustomers(input) {
    const query = {};
    if (input.q) {
        query.$or = [
            { name: { $regex: input.q, $options: "i" } },
            { email: { $regex: input.q, $options: "i" } },
            { phone: { $regex: input.q, $options: "i" } },
            { tags: { $elemMatch: { $regex: input.q, $options: "i" } } },
        ];
    }
    if (input.segment && input.segment !== "all")
        query.segment = input.segment;
    const [rows, total] = await Promise.all([
        Customer_1.CustomerModel.find(query)
            .sort({ createdAt: -1 })
            .skip((input.page - 1) * input.limit)
            .limit(input.limit),
        Customer_1.CustomerModel.countDocuments(query),
    ]);
    return {
        data: rows.map(toCustomer),
        meta: (0, pagination_1.buildMeta)(total, input.page, input.limit),
    };
}
async function getAdminCustomerById(id) {
    const customer = await Customer_1.CustomerModel.findById(id);
    if (!customer)
        throw new apiError_1.ApiError(404, "Cliente n�o encontrado.");
    return toCustomer(customer);
}
async function updateAdminCustomer(id, input) {
    const customer = await Customer_1.CustomerModel.findById(id);
    if (!customer)
        throw new apiError_1.ApiError(404, "Cliente n�o encontrado.");
    if (input.segment)
        customer.segment = input.segment;
    if (input.tags)
        customer.tags = input.tags;
    if (input.phone !== undefined)
        customer.phone = input.phone || undefined;
    await customer.save();
    await (0, auth_service_1.invalidateMeCacheForUser)(String(customer._id));
    return toCustomer(customer);
}
async function listAdminCustomerOrders(customerId) {
    const rows = await Order_1.OrderModel.find({ customerId }).sort({ createdAt: -1 });
    return rows.map(toOrder);
}
async function getMeProfile(customerId) {
    const customer = await Customer_1.CustomerModel.findById(customerId);
    if (!customer)
        throw new apiError_1.ApiError(404, "Cliente n�o encontrado.");
    return toCustomer(customer);
}
async function patchMeProfile(customerId, input) {
    const customer = await Customer_1.CustomerModel.findById(customerId);
    if (!customer)
        throw new apiError_1.ApiError(404, "Cliente n�o encontrado.");
    if (input.name !== undefined)
        customer.name = input.name.trim();
    if (input.phone !== undefined)
        customer.phone = input.phone?.trim() || undefined;
    await customer.save();
    await (0, auth_service_1.invalidateMeCacheForUser)(String(customer._id));
    return toCustomer(customer);
}
async function listMeAddresses(customerId) {
    const rows = await CustomerAddress_1.CustomerAddressModel.find({ customerId }).sort({ isDefault: -1, createdAt: -1 });
    return rows.map(toAddress);
}
async function createMeAddress(customerId, input) {
    if (input.isDefault) {
        await CustomerAddress_1.CustomerAddressModel.updateMany({ customerId }, { $set: { isDefault: false } });
    }
    const created = await CustomerAddress_1.CustomerAddressModel.create({ ...input, customerId });
    return toAddress(created);
}
async function updateMeAddress(customerId, addressId, input) {
    const address = await CustomerAddress_1.CustomerAddressModel.findOne({ _id: addressId, customerId });
    if (!address)
        throw new apiError_1.ApiError(404, "Endere�o n�o encontrado.");
    if (input.isDefault) {
        await CustomerAddress_1.CustomerAddressModel.updateMany({ customerId }, { $set: { isDefault: false } });
    }
    Object.assign(address, input);
    await address.save();
    return toAddress(address);
}
async function deleteMeAddress(customerId, addressId) {
    await CustomerAddress_1.CustomerAddressModel.findOneAndDelete({ _id: addressId, customerId });
}
async function listMeFavorites(customerId) {
    const rows = await Favorite_1.FavoriteModel.find({ customerId }).sort({ createdAt: -1 });
    return rows.map(toFavorite);
}
async function addMeFavorite(customerId, productId) {
    if (!dbCompat_1.Types.ObjectId.isValid(productId))
        throw new apiError_1.ApiError(400, "Produto inv�lido.");
    const product = await Product_1.ProductModel.findById(productId);
    if (!product)
        throw new apiError_1.ApiError(404, "Produto n�o encontrado.");
    const row = await Favorite_1.FavoriteModel.findOneAndUpdate({ customerId, productId }, {
        $setOnInsert: {
            customerId,
            productId,
            slug: product.slug,
            title: product.name,
            image: product.images?.[0] || "",
            priceCents: product.priceCents,
        },
    }, { upsert: true, new: true });
    return toFavorite(row);
}
async function removeMeFavorite(customerId, productId) {
    await Favorite_1.FavoriteModel.findOneAndDelete({ customerId, productId });
}
async function refreshCustomerMetrics(customerId) {
    const [ordersCount, total] = await Promise.all([
        Order_1.OrderModel.countDocuments({ customerId }),
        Order_1.OrderModel.aggregate([
            { $match: { customerId: new dbCompat_1.Types.ObjectId(customerId), status: { $in: ["pago", "separacao", "enviado", "entregue"] } } },
            { $group: { _id: null, total: { $sum: "$totalCents" }, lastOrderAt: { $max: "$createdAt" } } },
        ]),
    ]);
    await Customer_1.CustomerModel.findByIdAndUpdate(customerId, {
        $set: {
            ordersCount,
            totalSpentCents: total[0]?.total || 0,
            lastOrderAt: total[0]?.lastOrderAt || null,
            segment: ordersCount >= 6 ? "vip" : ordersCount >= 2 ? "recorrente" : "novo",
        },
    });
}
async function getMeCashbackBalance(customerId) {
    const { CashbackLedgerModel } = await Promise.resolve().then(() => __importStar(require("../models/CashbackLedger")));
    const rows = await CashbackLedgerModel.find({ customerId }).sort({ createdAt: -1 });
    const balance = rows.length ? rows[0].balanceAfterCents : 0;
    return {
        balance: (0, money_1.fromCents)(balance),
        balanceCents: balance,
    };
}
async function createCustomerFromGuest(input) {
    const created = await Customer_1.CustomerModel.create({
        name: input.name,
        email: input.email.toLowerCase(),
        phone: input.phone,
        passwordHash: input.passwordHash,
        segment: "novo",
        ordersCount: 0,
        totalSpentCents: (0, money_1.toCents)(0),
    });
    return created;
}
