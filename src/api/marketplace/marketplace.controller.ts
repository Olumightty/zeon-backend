import type { Request, Response } from "express";
import {
  canManageOrganization,
  createBankAccountService,
  createProductService,
  createStoreService,
  createTradePartnerService,
  deleteBankAccountService,
  deleteProductService,
  deleteStoreService,
  deleteTradePartnerService,
  findAnyBankAccountByStoreId,
  findBankAccountById,
  findProductById,
  findStoreById,
  findTradePartnerById,
  findUniqueStoreSlug,
  findUserById,
  getBankAccountsByStoreIdService,
  getProductsByStoreIdService,
  getStoreOwnerCanManage,
  getStoresService,
  getTradePartnersByStoreIdService,
  updateBankAccountService,
  updateProductService,
  updateStoreService,
  updateTradePartnerService,
} from "./marketplace.service";

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

const hasBodyData = (body: Record<string, unknown>) => {
  return Object.keys(body).length > 0;
};

const getParam = (req: Request, key: string) => {
  const value = req.params[key];
  return Array.isArray(value) ? value[0] || "" : value || "";
};

const validateRoutingMetadata = (value: unknown, countryCode: string) => {
  const metadata = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};

  if (countryCode === "US") {
    const routingNumber = metadata.routing_number;
    return typeof routingNumber === "string" && /^\d{9}$/.test(routingNumber);
  }

  if (countryCode === "NG") {
    const bankCode = metadata.bank_code;
    return typeof bankCode === "string" && /^\d{3}$/.test(bankCode);
  }

  if (countryCode === "DE" || countryCode === "FR") {
    const iban = metadata.iban;
    return typeof iban === "string" && iban.trim().length > 0;
  }

  return true;
};

const getRoutingMetadataError = (countryCode: string) => {
  // TODO: make this more robust in later iterations
  if (countryCode === "US") return "US bank accounts require a valid 9-digit ACH routing_number.";
  if (countryCode === "NG") return "Nigerian accounts require a valid 3-digit bank_code.";
  if (countryCode === "DE" || countryCode === "FR") return "European Union bank records require an iban value string.";
  return "Invalid routing metadata";
};

export const getStores = async (req: Request, res: Response) => {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return res.status(401).json({ message: "Unauthorized", status: false });
    }

    const result = await getStoresService(
      {
        search: req.query.search as string,
        category: req.query.category as string,
        countryCode: req.query.countryCode as string,
        city: req.query.city as string,
        page: Number(req.query.page) as number,
        limit: Number(req.query.limit) as number,
        mine: Boolean(req.query.mine) as boolean,
      },
      auth,
    );

    return res.status(200).json({
      message: "Stores fetched successfully",
      status: true,
      data: jsonSafe(result),
    });
  } catch (error) {
    console.error("Get stores error:", error);
    return res.status(500).json({ message: "Unable to process request", status: false });
  }
};

export const createStore = async (req: Request, res: Response) => {
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
      const canManage = await canManageOrganization(auth.userId, auth.orgId);
      if (!canManage) {
        return res.status(403).json({ message: "You cannot create stores for this organization", status: false });
      }
    }

    const slug = await findUniqueStoreSlug(req.body.slug || req.body.name);
    const store = await createStoreService(auth, {
      userId: auth.orgId ? null : auth.userId,
      organizationId: auth.orgId || null,
      name: req.body.name,
      slug,
      countryCode: req.body.countryCode,
      city: req.body.city,
      category: req.body.category,
      logoUrl: req.body.logoUrl || null,
      verificationBadge: req.body.verificationBadge || null,
      reliabilityScore: req.body.reliabilityScore ?? null,
      minimumOrderAmountMinor:
        req.body.minimumOrderAmountMinor !== undefined ? BigInt(req.body.minimumOrderAmountMinor) : null,
      currencyCode: req.body.currencyCode,
    });

    return res.status(201).json({
      message: "Store created successfully",
      status: true,
      data: jsonSafe(store),
    });
  } catch (error) {
    console.error("Create store error:", error);
    return res.status(500).json({ message: "Unable to process request", status: false });
  }
};

export const getStoreById = async (req: Request, res: Response) => {
  try {
    const storeId = getParam(req, "id");
    const store = await findStoreById(storeId);
    if (!store) {
      return res.status(404).json({ message: "Store not found", status: false });
    }

    return res.status(200).json({
      message: "Store fetched successfully",
      status: true,
      data: jsonSafe(store),
    });
  } catch (error) {
    console.error("Get store error:", error);
    return res.status(500).json({ message: "Unable to process request", status: false });
  }
};

export const updateStoreById = async (req: Request, res: Response) => {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return res.status(401).json({ message: "Unauthorized", status: false });
    }

    if (!hasBodyData(req.body)) {
      return res.status(400).json({ message: "Invalid request parameters", status: false });
    }

    const storeId = getParam(req, "id");
    const canManage = await getStoreOwnerCanManage(storeId, auth);
    if (!canManage) {
      return res.status(403).json({ message: "You cannot update this store", status: false });
    }

    const data = {
      ...(req.body.name !== undefined && { name: req.body.name }),
      ...(req.body.slug !== undefined && { slug: await findUniqueStoreSlug(req.body.slug, storeId) }),
      ...(req.body.countryCode !== undefined && { countryCode: req.body.countryCode }),
      ...(req.body.city !== undefined && { city: req.body.city }),
      ...(req.body.category !== undefined && { category: req.body.category }),
      ...(req.body.logoUrl !== undefined && { logoUrl: req.body.logoUrl }),
      ...(req.body.verificationBadge !== undefined && { verificationBadge: req.body.verificationBadge }),
      ...(req.body.reliabilityScore !== undefined && { reliabilityScore: req.body.reliabilityScore }),
      ...(req.body.minimumOrderAmountMinor !== undefined && {
        minimumOrderAmountMinor: BigInt(req.body.minimumOrderAmountMinor),
      }),
      ...(req.body.currencyCode !== undefined && { currencyCode: req.body.currencyCode }),
      ...(req.body.isActive !== undefined && { isActive: req.body.isActive }),
    };

    const store = await updateStoreService(storeId, data);

    return res.status(200).json({
      message: "Store updated successfully",
      status: true,
      data: jsonSafe(store),
    });
  } catch (error) {
    console.error("Update store error:", error);
    return res.status(500).json({ message: "Unable to process request", status: false });
  }
};

export const deleteStoreById = async (req: Request, res: Response) => {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return res.status(401).json({ message: "Unauthorized", status: false });
    }

    const storeId = getParam(req, "id");
    const canManage = await getStoreOwnerCanManage(storeId, auth);
    if (!canManage) {
      return res.status(403).json({ message: "You cannot delete this store", status: false });
    }

    await deleteStoreService(storeId);
    return res.status(200).json({ message: "Store deleted successfully", status: true });
  } catch (error) {
    console.error("Delete store error:", error);
    return res.status(500).json({ message: "Unable to process request", status: false });
  }
};

export const getProductsByStoreId = async (req: Request, res: Response) => {
  try {
    const storeId = getParam(req, "id");
    const store = await findStoreById(storeId);
    if (!store) {
      return res.status(404).json({ message: "Store not found", status: false });
    }

    const result = await getProductsByStoreIdService(storeId, {
      search: req.query.search as string,
      page: Number(req.query.page) as number,
      limit: Number(req.query.limit) as number,
    });

    return res.status(200).json({
      message: "Products fetched successfully",
      status: true,
      data: jsonSafe(result),
    });
  } catch (error) {
    console.error("Get products error:", error);
    return res.status(500).json({ message: "Unable to process request", status: false });
  }
};

export const createProductByStoreId = async (req: Request, res: Response) => {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return res.status(401).json({ message: "Unauthorized", status: false });
    }

    const storeId = getParam(req, "id");
    const canManage = await getStoreOwnerCanManage(storeId, auth);
    if (!canManage) {
      return res.status(403).json({ message: "You cannot create products in this store", status: false });
    }

    const product = await createProductService({
      storeId,
      name: req.body.name,
      description: req.body.description || null,
      sku: req.body.sku || null,
      priceAmountMinor: BigInt(req.body.priceAmountMinor),
      currencyCode: req.body.currencyCode,
      pricingUnit: req.body.pricingUnit,
      moqValue: req.body.moqValue,
      moqUnit: req.body.moqUnit,
      imageUrl: req.body.imageUrl || null,
    });

    return res.status(201).json({
      message: "Product created successfully",
      status: true,
      data: jsonSafe(product),
    });
  } catch (error) {
    console.error("Create product error:", error);
    return res.status(500).json({ message: "Unable to process request", status: false });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const storeId = getParam(req, "id");
    const productId = getParam(req, "pid");
    const product = await findProductById(storeId, productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found", status: false });
    }

    return res.status(200).json({
      message: "Product fetched successfully",
      status: true,
      data: jsonSafe(product),
    });
  } catch (error) {
    console.error("Get product error:", error);
    return res.status(500).json({ message: "Unable to process request", status: false });
  }
};

export const updateProductById = async (req: Request, res: Response) => {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return res.status(401).json({ message: "Unauthorized", status: false });
    }

    const storeId = getParam(req, "id");
    const productId = getParam(req, "pid");
    const canManage = await getStoreOwnerCanManage(storeId, auth);
    if (!canManage) {
      return res.status(403).json({ message: "You cannot update this product", status: false });
    }

    const existingProduct = await findProductById(storeId, productId);
    if (!existingProduct) {
      return res.status(404).json({ message: "Product not found", status: false });
    }

    const product = await updateProductService(productId, {
      ...(req.body.name !== undefined && { name: req.body.name }),
      ...(req.body.description !== undefined && { description: req.body.description }),
      ...(req.body.sku !== undefined && { sku: req.body.sku }),
      ...(req.body.priceAmountMinor !== undefined && { priceAmountMinor: BigInt(req.body.priceAmountMinor) }),
      ...(req.body.currencyCode !== undefined && { currencyCode: req.body.currencyCode }),
      ...(req.body.pricingUnit !== undefined && { pricingUnit: req.body.pricingUnit }),
      ...(req.body.moqValue !== undefined && { moqValue: req.body.moqValue }),
      ...(req.body.moqUnit !== undefined && { moqUnit: req.body.moqUnit }),
      ...(req.body.imageUrl !== undefined && { imageUrl: req.body.imageUrl }),
      ...(req.body.isActive !== undefined && { isActive: req.body.isActive }),
    });

    return res.status(200).json({
      message: "Product updated successfully",
      status: true,
      data: jsonSafe(product),
    });
  } catch (error) {
    console.error("Update product error:", error);
    return res.status(500).json({ message: "Unable to process request", status: false });
  }
};

export const deleteProductById = async (req: Request, res: Response) => {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return res.status(401).json({ message: "Unauthorized", status: false });
    }

    const storeId = getParam(req, "id");
    const productId = getParam(req, "pid");
    const canManage = await getStoreOwnerCanManage(storeId, auth);
    if (!canManage) {
      return res.status(403).json({ message: "You cannot delete this product", status: false });
    }

    const product = await findProductById(storeId, productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found", status: false });
    }

    await deleteProductService(productId);
    return res.status(200).json({ message: "Product deleted successfully", status: true });
  } catch (error) {
    console.error("Delete product error:", error);
    return res.status(500).json({ message: "Unable to process request", status: false });
  }
};

export const getTradePartnersByStoreId = async (req: Request, res: Response) => {
  try {
    const storeId = getParam(req, "id");
    const store = await findStoreById(storeId);
    if (!store) {
      return res.status(404).json({ message: "Store not found", status: false });
    }

    const tradePartners = await getTradePartnersByStoreIdService(storeId);
    return res.status(200).json({
      message: "Trade partners fetched successfully",
      status: true,
      data: jsonSafe(tradePartners),
    });
  } catch (error) {
    console.error("Get trade partners error:", error);
    return res.status(500).json({ message: "Unable to process request", status: false });
  }
};

export const getTradePartnerById = async (req: Request, res: Response) => {
  try {
    const storeId = getParam(req, "id");
    const tradePartnerId = getParam(req, "tpid");
    const tradePartner = await findTradePartnerById(storeId, tradePartnerId);
    if (!tradePartner) {
      return res.status(404).json({ message: "Trade partner not found", status: false });
    }

    return res.status(200).json({
      message: "Trade partner fetched successfully",
      status: true,
      data: jsonSafe(tradePartner),
    });
  } catch (error) {
    console.error("Get trade partner error:", error);
    return res.status(500).json({ message: "Unable to process request", status: false });
  }
};

export const createTradePartnerByStoreId = async (req: Request, res: Response) => {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return res.status(401).json({ message: "Unauthorized", status: false });
    }

    const storeId = getParam(req, "id");
    const canManage = await getStoreOwnerCanManage(storeId, auth);
    if (!canManage) {
      return res.status(403).json({ message: "You cannot create trade partners in this store", status: false });
    }

    if (req.body.handlesImports === false && req.body.handlesExports === false) {
      return res.status(400).json({ message: "Trade partner must handle imports or exports", status: false });
    }

    const tradePartner = await createTradePartnerService({
      storeId,
      organizationId: auth.orgId || null,
      fullName: req.body.fullName,
      email: req.body.email,
      phone: req.body.phone || null,
      jobTitle: req.body.jobTitle || null,
      role: req.body.role || null,
      isPrimary: req.body.isPrimary ?? false,
      handlesImports: req.body.handlesImports ?? false,
      handlesExports: req.body.handlesExports ?? true,
    });

    return res.status(201).json({
      message: "Trade partner created successfully",
      status: true,
      data: jsonSafe(tradePartner),
    });
  } catch (error) {
    console.error("Create trade partner error:", error);
    return res.status(500).json({ message: "Unable to process request", status: false });
  }
};

export const updateTradePartnerById = async (req: Request, res: Response) => {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return res.status(401).json({ message: "Unauthorized", status: false });
    }

    const storeId = getParam(req, "id");
    const tradePartnerId = getParam(req, "tpid");
    const canManage = await getStoreOwnerCanManage(storeId, auth);
    if (!canManage) {
      return res.status(403).json({ message: "You cannot update this trade partner", status: false });
    }

    const existingTradePartner = await findTradePartnerById(storeId, tradePartnerId);
    if (!existingTradePartner) {
      return res.status(404).json({ message: "Trade partner not found", status: false });
    }

    const handlesImports = req.body.handlesImports ?? existingTradePartner.handlesImports;
    const handlesExports = req.body.handlesExports ?? existingTradePartner.handlesExports;

    if (!handlesImports && !handlesExports) {
      return res.status(400).json({ message: "Trade partner must handle imports or exports", status: false });
    }

    const tradePartner = await updateTradePartnerService(storeId, tradePartnerId, {
      ...(req.body.fullName !== undefined && { fullName: req.body.fullName }),
      ...(req.body.email !== undefined && { email: req.body.email }),
      ...(req.body.phone !== undefined && { phone: req.body.phone }),
      ...(req.body.jobTitle !== undefined && { jobTitle: req.body.jobTitle }),
      ...(req.body.role !== undefined && { role: req.body.role }),
      ...(req.body.isPrimary !== undefined && { isPrimary: req.body.isPrimary }),
      ...(req.body.handlesImports !== undefined && { handlesImports: req.body.handlesImports }),
      ...(req.body.handlesExports !== undefined && { handlesExports: req.body.handlesExports }),
      ...(req.body.isActive !== undefined && { isActive: req.body.isActive }),
    });

    return res.status(200).json({
      message: "Trade partner updated successfully",
      status: true,
      data: jsonSafe(tradePartner),
    });
  } catch (error) {
    console.error("Update trade partner error:", error);
    return res.status(500).json({ message: "Unable to process request", status: false });
  }
};

export const deleteTradePartnerById = async (req: Request, res: Response) => {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return res.status(401).json({ message: "Unauthorized", status: false });
    }

    const storeId = getParam(req, "id");
    const tradePartnerId = getParam(req, "tpid");
    const canManage = await getStoreOwnerCanManage(storeId, auth);
    if (!canManage) {
      return res.status(403).json({ message: "You cannot delete this trade partner", status: false });
    }

    const tradePartner = await findTradePartnerById(storeId, tradePartnerId);
    if (!tradePartner) {
      return res.status(404).json({ message: "Trade partner not found", status: false });
    }

    await deleteTradePartnerService(tradePartnerId);
    return res.status(200).json({ message: "Trade partner deleted successfully", status: true });
  } catch (error) {
    console.error("Delete trade partner error:", error);
    return res.status(500).json({ message: "Unable to process request", status: false });
  }
};

export const getBankAccountsByStoreId = async (req: Request, res: Response) => {
  try {
    const storeId = getParam(req, "id");
    const store = await findStoreById(storeId);
    if (!store) {
      return res.status(404).json({ message: "Store not found", status: false });
    }

    const bankAccounts = await getBankAccountsByStoreIdService(storeId);
    return res.status(200).json({
      message: "Bank accounts fetched successfully",
      status: true,
      data: jsonSafe(bankAccounts),
    });
  } catch (error) {
    console.error("Get bank accounts error:", error);
    return res.status(500).json({ message: "Unable to process request", status: false });
  }
};

export const getBankAccountById = async (req: Request, res: Response) => {
  try {
    const storeId = getParam(req, "id");
    const bankAccountId = getParam(req, "baid");
    const bankAccount = await findBankAccountById(storeId, bankAccountId);
    if (!bankAccount) {
      return res.status(404).json({ message: "Bank account not found", status: false });
    }

    return res.status(200).json({
      message: "Bank account fetched successfully",
      status: true,
      data: jsonSafe(bankAccount),
    });
  } catch (error) {
    console.error("Get bank account error:", error);
    return res.status(500).json({ message: "Unable to process request", status: false });
  }
};

export const createBankAccountByStoreId = async (req: Request, res: Response) => {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return res.status(401).json({ message: "Unauthorized", status: false });
    }

    const storeId = getParam(req, "id");
    const canManage = await getStoreOwnerCanManage(storeId, auth);
    if (!canManage) {
      return res.status(403).json({ message: "You cannot create bank accounts in this store", status: false });
    }

    const store = await findStoreById(storeId);
    if (!store) {
      return res.status(404).json({ message: "Store not found", status: false });
    }

    const existingBankAccount = await findAnyBankAccountByStoreId(storeId);
    if (existingBankAccount) {
      return res.status(409).json({ message: "Store already has a bank account", status: false });
    }

    const bankAccount = await createBankAccountService({
      storeId,
      accountNumber: req.body.accountNumber,
      accountName: req.body.accountName,
      accountType: req.body.accountType || "CURRENT",
      holderType: req.body.holderType || "BUSINESS",
      bankName: req.body.bankName,
      bankCode: req.body.bankCode || null,
      swiftBic: req.body.swiftBic || null,
      countryCode: req.body.countryCode,
      currencyCode: req.body.currencyCode,
      routingMetadata: req.body.routingMetadata || {},
    });

    return res.status(201).json({
      message: "Bank account created successfully",
      status: true,
      data: jsonSafe(bankAccount),
    });
  } catch (error) {
    console.error("Create bank account error:", error);
    return res.status(500).json({ message: "Unable to process request", status: false });
  }
};

export const updateBankAccountById = async (req: Request, res: Response) => {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return res.status(401).json({ message: "Unauthorized", status: false });
    }

    if (!hasBodyData(req.body)) {
      return res.status(400).json({ message: "Invalid request parameters", status: false });
    }

    const storeId = getParam(req, "id");
    const bankAccountId = getParam(req, "baid");
    const canManage = await getStoreOwnerCanManage(storeId, auth);
    if (!canManage) {
      return res.status(403).json({ message: "You cannot update this bank account", status: false });
    }

    const existingBankAccount = await findBankAccountById(storeId, bankAccountId);
    if (!existingBankAccount) {
      return res.status(404).json({ message: "Bank account not found", status: false });
    }

    const countryCode = req.body.countryCode || existingBankAccount.countryCode;
    const routingMetadata = req.body.routingMetadata ?? existingBankAccount.routingMetadata;
    if (
      (req.body.routingMetadata !== undefined || req.body.countryCode !== undefined) &&
      !validateRoutingMetadata(routingMetadata, countryCode)
    ) {
      return res.status(400).json({ message: getRoutingMetadataError(countryCode), status: false });
    }

    const bankAccount = await updateBankAccountService(bankAccountId, {
      ...(req.body.accountNumber !== undefined && { accountNumber: req.body.accountNumber }),
      ...(req.body.accountName !== undefined && { accountName: req.body.accountName }),
      ...(req.body.accountType !== undefined && { accountType: req.body.accountType }),
      ...(req.body.holderType !== undefined && { holderType: req.body.holderType }),
      ...(req.body.bankName !== undefined && { bankName: req.body.bankName }),
      ...(req.body.bankCode !== undefined && { bankCode: req.body.bankCode }),
      ...(req.body.swiftBic !== undefined && { swiftBic: req.body.swiftBic }),
      ...(req.body.countryCode !== undefined && { countryCode: req.body.countryCode }),
      ...(req.body.currencyCode !== undefined && { currencyCode: req.body.currencyCode }),
      ...(req.body.routingMetadata !== undefined && { routingMetadata: req.body.routingMetadata }),
      ...(req.body.isActive !== undefined && { isActive: req.body.isActive }),
    });

    return res.status(200).json({
      message: "Bank account updated successfully",
      status: true,
      data: jsonSafe(bankAccount),
    });
  } catch (error) {
    console.error("Update bank account error:", error);
    return res.status(500).json({ message: "Unable to process request", status: false });
  }
};

export const deleteBankAccountById = async (req: Request, res: Response) => {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return res.status(401).json({ message: "Unauthorized", status: false });
    }

    const storeId = getParam(req, "id");
    const bankAccountId = getParam(req, "baid");
    const canManage = await getStoreOwnerCanManage(storeId, auth);
    if (!canManage) {
      return res.status(403).json({ message: "You cannot delete this bank account", status: false });
    }

    const bankAccount = await findBankAccountById(storeId, bankAccountId);
    if (!bankAccount) {
      return res.status(404).json({ message: "Bank account not found", status: false });
    }

    await deleteBankAccountService(bankAccountId);
    return res.status(200).json({ message: "Bank account deleted successfully", status: true });
  } catch (error) {
    console.error("Delete bank account error:", error);
    return res.status(500).json({ message: "Unable to process request", status: false });
  }
};
