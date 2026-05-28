import { Router } from 'express';
import {downloadManifest, generateManifest, getManifest, getShipmentById, getShipments} from './shipment.controller';
const router = Router();

//business facing API

//system will automatically create a shipment after a cargo pool has been confirmed

//get all shipments related to a business (user/organization)
router.get('/', getShipments);

//get a specific shipment by id
router.get('/:id', getShipmentById);

//generate a manifest for a specific shipment
router.post('/:id/manifest', generateManifest);

//get the manifest for a specific shipment
router.get('/:id/manifest', getManifest);

//download the manifest for a specific shipment
router.get('/:id/download', downloadManifest);



export default router;