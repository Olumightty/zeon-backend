import { Router } from 'express';
import {getPorts, getVesselById, getVesselandPortLocations, getVessels} from './carrier.controller';
const router = Router();

//business facing API

// get vessel, port and user/organization current shipment locations for map view, real-time via webhook later but for now reload to update
router.get('/map', getVesselandPortLocations);

// get all vessels (visible to everyone in the marketplace), add search and filter logic
router.get('/vessels', getVessels);

// get a specific vessel by id (visible to everyone in the marketplace)
router.get('/vessels/:id', getVesselById);

// get all ports (visible to everyone in the marketplace), add search and filter logic
router.get('/ports', getPorts);

export default router;