import { Router } from 'express';
import {downloadManifest, generateManifest, getManifest, getShipmentById, getShipments} from './shipment.controller';
import { getShipmentsValidator, shipmentIdValidator } from './shipment.validator';
const router = Router();

//business facing API

//creation of a shipment will happen elsewhere after a cargo pool has been confirmed

//get all shipments related to a business (user/organization), you would have to get the cargopool ids for various cargo allocations to know those shipment details
router.get('/', getShipmentsValidator, getShipments);

//get a specific shipment by id
router.get('/:id', shipmentIdValidator, getShipmentById);

// generate a manifest for a shipment, this would be used to know the details of the shipment and the cargo allocation of the user/organization in it, to be presented on cargo retrieval and delivery
router.post('/:id/manifest', shipmentIdValidator, generateManifest);

// Get the manifest details for a specific shipment, this would be used to know the details of the shipment and the cargo allocation of the user/organization in it, to be presented on cargo retrieval and delivery
router.get('/:id/manifest', shipmentIdValidator, getManifest);

// download the manifest for a specific shipment
router.get('/:id/download', shipmentIdValidator, downloadManifest);



export default router;
