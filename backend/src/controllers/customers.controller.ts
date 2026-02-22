import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/notFound";
import {
  addMeFavorite,
  createMeAddress,
  deleteMeAddress,
  getAdminCustomerById,
  getMeProfile,
  listAdminCustomerOrders,
  listAdminCustomers,
  listMeAddresses,
  listMeFavorites,
  patchMeProfile,
  removeMeFavorite,
  updateAdminCustomer,
  updateMeAddress,
} from "../services/customers.service";

function currentCustomerId(req: Request) {
  return req.auth?.sub || "";
}

export const listAdminCustomersHandler = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));

  const result = await listAdminCustomers({
    page,
    limit,
    q: String(req.query.q || "").trim() || undefined,
    segment: String(req.query.segment || "").trim() || undefined,
  });

  res.json(result);
});

export const getAdminCustomerByIdHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await getAdminCustomerById(String(req.params.id));
  res.json({ data });
});

export const patchAdminCustomerHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await updateAdminCustomer(String(req.params.id), req.body);
  res.json({ data });
});

export const listAdminCustomerOrdersHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await listAdminCustomerOrders(String(req.params.id));
  res.json({ data });
});

export const getMeProfileHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await getMeProfile(currentCustomerId(req));
  res.json({ data });
});

export const patchMeProfileHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await patchMeProfile(currentCustomerId(req), req.body);
  res.json({ data });
});

export const listMeAddressesHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await listMeAddresses(currentCustomerId(req));
  res.json({ data });
});

export const createMeAddressHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await createMeAddress(currentCustomerId(req), req.body);
  res.status(201).json({ data });
});

export const patchMeAddressHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await updateMeAddress(currentCustomerId(req), String(req.params.id), req.body);
  res.json({ data });
});

export const deleteMeAddressHandler = asyncHandler(async (req: Request, res: Response) => {
  await deleteMeAddress(currentCustomerId(req), String(req.params.id));
  res.json({ data: { success: true } });
});

export const listMeFavoritesHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await listMeFavorites(currentCustomerId(req));
  res.json({ data });
});

export const createMeFavoriteHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await addMeFavorite(currentCustomerId(req), req.body.productId);
  res.status(201).json({ data });
});

export const deleteMeFavoriteHandler = asyncHandler(async (req: Request, res: Response) => {
  await removeMeFavorite(currentCustomerId(req), String(req.params.productId));
  res.json({ data: { success: true } });
});

