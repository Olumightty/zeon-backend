import type { Request, Response } from "express";
import {
  cancelCargoAllocationService,
  canManageOrganizationCargo,
  createCargoAllocationService,
  findCargoAllocationById,
  findProductsForStore,
  findStoreById,
  findUserById,
  getCargoAllocationsService,
  updateCargoAllocationService,
} from "./cargo.service";
import {
  createLandedCostBreakdownService,
  createPaymentIntentService,
} from "../payment/payment.service";

const jsonSafe = (data: unknown) => {
  return JSON.parse(
    JSON.stringify(data, (_key, value) => (typeof value === "bigint" ? value.toString() : value)),
  );
};

const getAuthUser = (req: Request) => {
  const userId = req.user?.userId;
  if (!userId) {
    return null;
  }

  const orgId = req.user?.orgId;

  return {
    userId,
    orgId,
  };
};

const getParam = (req: Request, key: string) => {
  const value = req.params[key];
  return Array.isArray(value) ? value[0] || "" : value || "";
};

const hasBodyData = (body: Record<string, unknown>) => {
  return Object.keys(body).length > 0;
};

const hasDuplicateProducts = (items: { productId: string }[]) => {
  return new Set(items.map((item) => item.productId)).size !== items.length;
};

const productsBelongToStore = async (storeId: string, items: { productId: string }[]) => {
  const products = await findProductsForStore(
    storeId,
    items.map((item) => item.productId),
  );

  return products.length === items.length;
};

export const createCargoAllocation = async (req: Request, res: Response) => {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return res.status(401).json({ message: "Unauthorized", status: false });
    }

    const user = await findUserById(auth.userId);
    if (!user) {
      return res.status(404).json({ message: "User profile not found", status: false });
    }

    if (auth.orgId) {
      const canManageCargo = await canManageOrganizationCargo(auth.userId, auth.orgId);
      if (!canManageCargo) {
        return res.status(403).json({ message: "You cannot manage cargo allocations for this organization", status: false });
      }
    }

    const store = await findStoreById(req.body.storeId);
    if (!store) {
      return res.status(404).json({ message: "Store not found", status: false });
    }

    if (hasDuplicateProducts(req.body.items)) {
      return res.status(400).json({ message: "Duplicate products are not allowed in one cargo allocation", status: false });
    }

    const allProductsBelongToStore = await productsBelongToStore(req.body.storeId, req.body.items);
    if (!allProductsBelongToStore) {
      return res.status(400).json({ message: "One or more products are not available in this store", status: false });
    }

    const cargoAllocation = await createCargoAllocationService(auth, {
      storeId: req.body.storeId,
      currencyCode: req.body.currencyCode || store.currencyCode,
      deliveryAddress: req.body.deliveryAddress,
      items: req.body.items,
    });

    return res.status(201).json({
      message: "Cargo allocation created successfully",
      status: true,
      data: jsonSafe(cargoAllocation),
    });
  } catch (error) {
    console.error("Create cargo allocation error:", error);
    return res.status(500).json({ message: "Unable to process request", status: false });
  }
};

export const getCargoAllocations = async (req: Request, res: Response) => {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return res.status(401).json({ message: "Unauthorized", status: false });
    }

    const result = await getCargoAllocationsService(auth, {
      status: req.query.status as string,
      storeId: req.query.storeId as string,
      page: Number(req.query.page) as number,
      limit: Number(req.query.limit) as number,
    });

    return res.status(200).json({
      message: "Cargo allocations fetched successfully",
      status: true,
      data: jsonSafe(result),
    });
  } catch (error) {
    console.error("Get cargo allocations error:", error);
    return res.status(500).json({ message: "Unable to process request", status: false });
  }
};

export const checkoutCargoAllocation = async (req: Request, res: Response) => {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return res.status(401).json({ message: "Unauthorized", status: false });
    }

    if (auth.orgId) {
      const canManageCargo = await canManageOrganizationCargo(auth.userId, auth.orgId);
      if (!canManageCargo) {
        return res.status(403).json({ message: "You cannot manage cargo allocations for this organization", status: false });
      }
    }

    const cargoAllocation = await findCargoAllocationById(req.body.allocationId, auth);
    if (!cargoAllocation) {
      return res.status(404).json({ message: "Cargo allocation not found", status: false });
    }

    if (cargoAllocation.status !== "DRAFT") {
      return res.status(400).json({ message: "Only draft cargo allocations can be checked out", status: false });
    }

    if (cargoAllocation.items.length === 0) {
      return res.status(400).json({ message: "Cargo allocation has no items", status: false });
    }

    const landedCostBreakdown = await createLandedCostBreakdownService(cargoAllocation, {
      tariffRateBps: req.body.tariffRateBps,
      customsFeeMinor: req.body.customsFeeMinor,
      vatRateBps: req.body.vatRateBps,
      otherFeeMinor: req.body.otherFeeMinor,
    });

    return res.status(200).json({
      message: "Cargo allocation cost breakdown generated successfully",
      status: true,
      data: jsonSafe(landedCostBreakdown),
    });
  } catch (error) {
    console.error("Checkout cargo allocation error:", error);
    return res.status(500).json({ message: "Unable to process request", status: false });
  }
};

export const confirmCargoAllocation = async (req: Request, res: Response) => {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return res.status(401).json({ message: "Unauthorized", status: false });
    }

    if (auth.orgId) {
      const canManageCargo = await canManageOrganizationCargo(auth.userId, auth.orgId);
      if (!canManageCargo) {
        return res.status(403).json({ message: "You cannot manage cargo allocations for this organization", status: false });
      }
    }

    const cargoAllocation = await findCargoAllocationById(getParam(req, "id"), auth);
    if (!cargoAllocation) {
      return res.status(404).json({ message: "Cargo allocation not found", status: false });
    }

    if (cargoAllocation.status !== "DRAFT") {
      return res.status(400).json({ message: "Only draft cargo allocations can be confirmed", status: false });
    }

    if (cargoAllocation.items.length === 0) {
      return res.status(400).json({ message: "Cargo allocation has no items", status: false });
    }

    if (!cargoAllocation.landedCostBreakdown) {
      return res.status(400).json({ message: "Cargo allocation must be checked out before confirmation", status: false });
    }

    const paymentIntent = await createPaymentIntentService(auth, {
      cargoAllocationId: cargoAllocation.id,
      amountMinor: cargoAllocation.landedCostBreakdown.totalAmountMinor,
      currencyCode: cargoAllocation.landedCostBreakdown.currencyCode,
      description: `Cargo allocation payment for ${cargoAllocation.store.name}`,
    });

    if (paymentIntent === "USER_NOT_FOUND") {
      return res.status(404).json({ message: "User profile not found", status: false });
    }

    if (paymentIntent === "PROVIDER_FAILED") {
      return res.status(502).json({ message: "Unable to create payment checkout", status: false });
    }

    return res.status(200).json({
      message: "Cargo allocation confirmed successfully",
      status: true,
      data: jsonSafe(paymentIntent),
    });
  } catch (error) {
    console.error("Confirm cargo allocation error:", error);
    return res.status(500).json({ message: "Unable to process request", status: false });
  }
};

export const getCargoAllocationById = async (req: Request, res: Response) => {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return res.status(401).json({ message: "Unauthorized", status: false });
    }

    const cargoAllocation = await findCargoAllocationById(getParam(req, "id"), auth);
    if (!cargoAllocation) {
      return res.status(404).json({ message: "Cargo allocation not found", status: false });
    }

    return res.status(200).json({
      message: "Cargo allocation fetched successfully",
      status: true,
      data: jsonSafe(cargoAllocation),
    });
  } catch (error) {
    console.error("Get cargo allocation error:", error);
    return res.status(500).json({ message: "Unable to process request", status: false });
  }
};

export const updateCargoAllocation = async (req: Request, res: Response) => {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return res.status(401).json({ message: "Unauthorized", status: false });
    }

    if (!hasBodyData(req.body)) {
      return res.status(400).json({ message: "Invalid request parameters", status: false });
    }

    if (auth.orgId) {
      const canManageCargo = await canManageOrganizationCargo(auth.userId, auth.orgId);
      if (!canManageCargo) {
        return res.status(403).json({ message: "You cannot manage cargo allocations for this organization", status: false });
      }
    }

    const existingAllocation = await findCargoAllocationById(getParam(req, "id"), auth);
    if (!existingAllocation) {
      return res.status(404).json({ message: "Cargo allocation not found", status: false });
    }

    const storeId = req.body.storeId || existingAllocation.storeId;
    if (req.body.storeId) {
      const store = await findStoreById(req.body.storeId);
      if (!store) {
        return res.status(404).json({ message: "Store not found", status: false });
      }
    }

    if (req.body.items) {
      if (hasDuplicateProducts(req.body.items)) {
        return res.status(400).json({ message: "Duplicate products are not allowed in one cargo allocation", status: false });
      }

      const allProductsBelongToStore = await productsBelongToStore(storeId, req.body.items);
      if (!allProductsBelongToStore) {
        return res.status(400).json({ message: "One or more products are not available in this store", status: false });
      }
    }

    const result = await updateCargoAllocationService(getParam(req, "id"), auth, {
      ...(req.body.storeId !== undefined && { storeId: req.body.storeId }),
      ...(req.body.currencyCode !== undefined && { currencyCode: req.body.currencyCode }),
      ...(req.body.deliveryAddress !== undefined && { deliveryAddress: req.body.deliveryAddress }),
      ...(req.body.items !== undefined && { items: req.body.items }),
    });

    if (result === "INVALID_STATUS") {
      return res.status(400).json({ message: "Only draft cargo allocations can be updated", status: false });
    }

    if (result === "POOL_LOCKED") {
      return res.status(400).json({ message: "Cargo allocation can no longer be updated", status: false });
    }

    return res.status(200).json({
      message: "Cargo allocation updated successfully",
      status: true,
      data: jsonSafe(result),
    });
  } catch (error) {
    console.error("Update cargo allocation error:", error);
    return res.status(500).json({ message: "Unable to process request", status: false });
  }
};

export const cancelCargoAllocation = async (req: Request, res: Response) => {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return res.status(401).json({ message: "Unauthorized", status: false });
    }

    if (auth.orgId) {
      const canManageCargo = await canManageOrganizationCargo(auth.userId, auth.orgId);
      if (!canManageCargo) {
        return res.status(403).json({ message: "You cannot manage cargo allocations for this organization", status: false });
      }
    }

    const result = await cancelCargoAllocationService(getParam(req, "id"), auth);
    if (!result) {
      return res.status(404).json({ message: "Cargo allocation not found", status: false });
    }

    if (result === "POOL_CLOSED") {
      return res.status(400).json({ message: "Cargo allocation can no longer be cancelled", status: false });
    }

    return res.status(200).json({
      message: "Cargo allocation cancelled successfully",
      status: true,
      data: jsonSafe(result),
    });
  } catch (error) {
    console.error("Cancel cargo allocation error:", error);
    return res.status(500).json({ message: "Unable to process request", status: false });
  }
};
