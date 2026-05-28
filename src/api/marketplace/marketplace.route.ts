import { Router } from 'express';
import {createProductByStoreId,createStore,createTradePartnerByStoreId,deleteProductById, deleteStoreById, deleteTradePartnerById, getProductById, getProductsByStoreId, getStoreById, getStores, getTradePartnerById, getTradePartnersByStoreId, updateProductById, updateStoreById, updateTradePartnerById} from './marketplace.controller';
const router = Router();

//business facing API

/*
    Users without an organization (orgId is null) can create stores in the marketplace, but the store will be associated with their user account and visible to everyone in the marketplace.
    Users who are owners and admins with an organization (orgId is not null) can create stores in the marketplace, but the store will be associated with their organization and visible to everyone in the marketplace.
*/


//list of stores in marketplace (add search and filter logic) (visible to everyone in the marketplace)
router.get('/stores', getStores); 

// create a new store in the marketplace (only users without an organization and owners and admins of an organization can create a store in the marketplace, the store will be associated with the user account if the user does not belong to an organization, otherwise it will be associated with the organization)
router.post('/stores', createStore); 

// get a specific store by id (visible to everyone in the marketplace)
router.get('/stores/:id', getStoreById);

// update a specific store by id (only the owner and admins (user) of the store can update it)
router.patch('/stores/:id', updateStoreById);

// delete a specific store by id (only the owner and admins (user) of the store can delete it)
router.delete('/stores/:id', deleteStoreById);

// list of products in a specific store , add search and filter logic (visible to everyone in the marketplace)
router.get('/stores/:id/products', getProductsByStoreId);

// create a new product in a specific store (only the owner and admins (user) of the store can create a product in the store)
router.post('/stores/:id/products', createProductByStoreId);

// get a specific product by id in a specific store (visible to everyone in the marketplace)
router.get('/stores/:id/products/:pid', getProductById);

// update a specific product by id in a specific store (only the owner and admins (user) of the store can update it)
router.patch('/stores/:id/products/:pid', updateProductById);

// delete a specific product by id in a specific store (only the owner and admins (user) of the store can delete it)
router.delete('/stores/:id/products/:id', deleteProductById);

// list of trade partners for a specific store (visible to everyone in the marketplace)
router.get('/stores/:id/trade-partners', getTradePartnersByStoreId);

// get a specific trade partner by id in a specific store (visible to everyone in the marketplace)
router.get('/stores/:id/trade-partners/:tpid', getTradePartnerById);

// create a new trade partner for a specific store (only the owner and admins (user) of the store can create a trade partner in the store)
router.post('/stores/:id/trade-partners', createTradePartnerByStoreId);

// update a specific trade partner by id in a specific store (only the owner and admins (user) of the store can update it)
router.patch('/stores/:id/trade-partners/:tpid', updateTradePartnerById);

// delete a specific trade partner by id in a specific store (only the owner and admins (user) of the store can delete it)
router.delete('/stores/:id/trade-partners/:tpid', deleteTradePartnerById);

export default router;