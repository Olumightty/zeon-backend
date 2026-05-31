import type { Request, Response } from "express";
import {
    buildShipmentManifestPayload,
    canGenerateShipmentManifest,
    createShipmentManifestService,
    findShipmentById,
    getShipmentManifestDocumentsService,
    getShipmentsService,
} from "./shipment.service";

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

export const getShipments = async (req: Request, res: Response) => {
    try {
        const auth = getAuthUser(req);
        if (!auth) {
            return res.status(401).json({ message: "Unauthorized", status: false });
        }

        const result = await getShipmentsService(auth, {
            status: req.query.status as string,
            page: Number(req.query.page) as number,
            limit: Number(req.query.limit) as number,
        });

        return res.status(200).json({
            message: "Shipments fetched successfully",
            status: true,
            data: jsonSafe(result),
        });
    } catch (error) {
        console.error("Get shipments error:", error);
        return res.status(500).json({ message: "Unable to process request", status: false });
    }
}

export const getShipmentById = async (req: Request, res: Response) => {
    try {
        const auth = getAuthUser(req);
        if (!auth) {
            return res.status(401).json({ message: "Unauthorized", status: false });
        }

        const shipment = await findShipmentById(getParam(req, "id"), auth);
        if (!shipment) {
            return res.status(404).json({ message: "Shipment not found", status: false });
        }

        return res.status(200).json({
            message: "Shipment fetched successfully",
            status: true,
            data: jsonSafe(shipment),
        });
    } catch (error) {
        console.error("Get shipment error:", error);
        return res.status(500).json({ message: "Unable to process request", status: false });
    }
}

export const generateManifest = async (req: Request, res: Response) => {
    try {
        const auth = getAuthUser(req);
        if (!auth) {
            return res.status(401).json({ message: "Unauthorized", status: false });
        }

        if (auth.orgId) {
            const canGenerate = await canGenerateShipmentManifest(auth.userId, auth.orgId);
            if (!canGenerate) {
                return res.status(403).json({ message: "You cannot generate manifests for this organization", status: false });
            }
        }

        const shipment = await findShipmentById(getParam(req, "id"), auth);
        if (!shipment) {
            return res.status(404).json({ message: "Shipment not found", status: false });
        }

        const documents = await createShipmentManifestService(shipment);
        const manifest = buildShipmentManifestPayload(shipment, documents);

        return res.status(201).json({
            message: "Manifest generated successfully",
            status: true,
            data: jsonSafe(manifest),
        });
    } catch (error) {
        console.error("Generate manifest error:", error);
        return res.status(500).json({ message: "Unable to process request", status: false });
    }
}

export const getManifest = async (req: Request, res: Response) => {
    try {
        const auth = getAuthUser(req);
        if (!auth) {
            return res.status(401).json({ message: "Unauthorized", status: false });
        }

        const shipment = await findShipmentById(getParam(req, "id"), auth);
        if (!shipment) {
            return res.status(404).json({ message: "Shipment not found", status: false });
        }

        const documents = await getShipmentManifestDocumentsService(shipment);
        if (documents.length === 0) {
            return res.status(404).json({ message: "Manifest not found", status: false });
        }

        const manifest = buildShipmentManifestPayload(shipment, documents);

        return res.status(200).json({
            message: "Manifest fetched successfully",
            status: true,
            data: jsonSafe(manifest),
        });
    } catch (error) {
        console.error("Get manifest error:", error);
        return res.status(500).json({ message: "Unable to process request", status: false });
    }
}

export const downloadManifest = async (req: Request, res: Response) => {
    try {
        const auth = getAuthUser(req);
        if (!auth) {
            return res.status(401).json({ message: "Unauthorized", status: false });
        }

        const shipment = await findShipmentById(getParam(req, "id"), auth);
        if (!shipment) {
            return res.status(404).json({ message: "Shipment not found", status: false });
        }

        const documents = await getShipmentManifestDocumentsService(shipment);
        if (documents.length === 0) {
            return res.status(404).json({ message: "Manifest not found", status: false });
        }

        const manifest = jsonSafe(buildShipmentManifestPayload(shipment, documents));
        const fileName = `${shipment.referenceCode}-manifest.json`;

        res.setHeader("Content-Type", "application/json");
        res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
        return res.status(200).send(JSON.stringify(manifest, null, 2));
    } catch (error) {
        console.error("Download manifest error:", error);
        return res.status(500).json({ message: "Unable to process request", status: false });
    }
}
