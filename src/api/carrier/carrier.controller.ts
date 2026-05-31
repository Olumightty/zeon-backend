import type { Request, Response } from "express"
import {
    findVesselById,
    getPortsService,
    getVesselAndPortLocationsService,
    getVesselsService,
} from "./carrier.service";

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

export const getVesselandPortLocations = async (req: Request, res: Response) => {
    try {
        const auth = getAuthUser(req);
        if (!auth) {
            return res.status(401).json({ message: "Unauthorized", status: false });
        }

        const result = await getVesselAndPortLocationsService(auth);

        return res.status(200).json({
            message: "Vessel and port locations fetched successfully",
            status: true,
            data: jsonSafe(result),
        });
    } catch (error) {
        console.error("Get vessel and port locations error:", error);
        return res.status(500).json({ message: "Unable to process request", status: false });
    }
}

export const getVessels = async (req: Request, res: Response) => {
    try {
        const result = await getVesselsService({
            search: req.query.search as string,
            type: req.query.type as string,
            carrierId: req.query.carrierId as string,
            page: Number(req.query.page) as number,
            limit: Number(req.query.limit) as number,
        });

        return res.status(200).json({
            message: "Vessels fetched successfully",
            status: true,
            data: jsonSafe(result),
        });
    } catch (error) {
        console.error("Get vessels error:", error);
        return res.status(500).json({ message: "Unable to process request", status: false });
    }
}

export const getVesselById = async (req: Request, res: Response) => {
    try {
        const vessel = await findVesselById(getParam(req, "id"));
        if (!vessel) {
            return res.status(404).json({ message: "Vessel not found", status: false });
        }

        return res.status(200).json({
            message: "Vessel fetched successfully",
            status: true,
            data: jsonSafe(vessel),
        });
    } catch (error) {
        console.error("Get vessel error:", error);
        return res.status(500).json({ message: "Unable to process request", status: false });
    }
}

export const getPorts = async (req: Request, res: Response) => {
    try {
        const result = await getPortsService({
            search: req.query.search as string,
            countryCode: req.query.countryCode as string,
            page: Number(req.query.page) as number,
            limit: Number(req.query.limit) as number,
        });

        return res.status(200).json({
            message: "Ports fetched successfully",
            status: true,
            data: jsonSafe(result),
        });
    } catch (error) {
        console.error("Get ports error:", error);
        return res.status(500).json({ message: "Unable to process request", status: false });
    }
}
