import { Router } from 'express';
import {getPorts, getVesselById, getVesselandPortLocations, getVessels} from './carrier.controller';
import { getPortsValidator, getVesselsValidator, vesselIdValidator } from './carrier.validator';
const router = Router();

//business facing API

// get vessel, port and user/organization current shipment locations for map view, real-time via webhook later but for now reload to update
// the current shipment location for a user/organization is based on the vessel and port locations of the shipment that the user/organization has cargo allocated in, so we would have to get the cargopool ids for various cargo allocations to know those shipment details and then get the vessel and port locations for those shipments
router.get('/map', getVesselandPortLocations);

// get all vessels (visible to everyone in the marketplace), add search and filter logic
router.get('/vessels', getVesselsValidator, getVessels);

// get a specific vessel by id (visible to everyone in the marketplace)
router.get('/vessels/:id', vesselIdValidator, getVesselById);

// get all ports (visible to everyone in the marketplace), add search and filter logic
router.get('/ports', getPortsValidator, getPorts);

export default router;
