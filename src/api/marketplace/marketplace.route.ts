import { Router } from 'express';
import {
    createBankAccountByStoreId,
    createProductByStoreId,
    createStore,
    createTradePartnerByStoreId,
    deleteBankAccountById,
    deleteProductById,
    deleteStoreById,
    deleteTradePartnerById,
    getBankAccountById,
    getBankAccountsByStoreId,
    getProductById,
    getProductsByStoreId,
    getStoreById,
    getStores,
    getTradePartnerById,
    getTradePartnersByStoreId,
    updateBankAccountById,
    updateProductById,
    updateStoreById,
    updateTradePartnerById
} from './marketplace.controller';
import {
    bankAccountIdValidator,
    createBankAccountValidator,
    createProductValidator,
    createStoreValidator,
    createTradePartnerValidator,
    getProductsValidator,
    getStoresValidator,
    productIdValidator,
    storeIdValidator,
    tradePartnerIdValidator,
    updateBankAccountValidator,
    updateProductValidator,
    updateStoreValidator,
    updateTradePartnerValidator,
} from './marketplace.validator';
const router = Router();

//business facing API

/*
    Users without an organization (orgId is null) can create stores in the marketplace, but the store will be associated with their user account and visible to everyone in the marketplace.
    Users who are owners and admins with an organization (orgId is not null) can create stores in the marketplace, but the store will be associated with their organization and visible to everyone in the marketplace.
*/


//list of stores in marketplace (add search and filter logic) (visible to everyone in the marketplace)
router.get('/stores', getStoresValidator, getStores); 

// create a new store in the marketplace (only users without an organization and owners and admins of an organization can create a store in the marketplace, the store will be associated with the user account if the user does not belong to an organization, otherwise it will be associated with the organization)
router.post('/stores', createStoreValidator, createStore); 

// get a specific store by id (visible to everyone in the marketplace)
router.get('/stores/:id', storeIdValidator, getStoreById);

// update a specific store by id (only the owner and admins (user) of the store can update it)
router.patch('/stores/:id', updateStoreValidator, updateStoreById);

// delete a specific store by id (only the owner and admins (user) of the store can delete it)
router.delete('/stores/:id', storeIdValidator, deleteStoreById);

// list of products in a specific store , add search and filter logic (visible to everyone in the marketplace)
router.get('/stores/:id/products', getProductsValidator, getProductsByStoreId);

// create a new product in a specific store (only the owner and admins (user) of the store can create a product in the store)
router.post('/stores/:id/products', createProductValidator, createProductByStoreId);

// get a specific product by id in a specific store (visible to everyone in the marketplace)
router.get('/stores/:id/products/:pid', productIdValidator, getProductById);

// update a specific product by id in a specific store (only the owner and admins (user) of the store can update it)
router.patch('/stores/:id/products/:pid', updateProductValidator, updateProductById);

// delete a specific product by id in a specific store (only the owner and admins (user) of the store can delete it)
router.delete('/stores/:id/products/:pid', productIdValidator, deleteProductById);

// list of trade partners for a specific store (visible to everyone in the marketplace)
router.get('/stores/:id/trade-partners', storeIdValidator, getTradePartnersByStoreId);

// get a specific trade partner by id in a specific store (visible to everyone in the marketplace)
router.get('/stores/:id/trade-partners/:tpid', tradePartnerIdValidator, getTradePartnerById);

// create a new trade partner for a specific store (only the owner and admins (user) of the store can create a trade partner in the store)
router.post('/stores/:id/trade-partners', createTradePartnerValidator, createTradePartnerByStoreId);

// update a specific trade partner by id in a specific store (only the owner and admins (user) of the store can update it)
router.patch('/stores/:id/trade-partners/:tpid', updateTradePartnerValidator, updateTradePartnerById);

// delete a specific trade partner by id in a specific store (only the owner and admins (user) of the store can delete it)
router.delete('/stores/:id/trade-partners/:tpid', tradePartnerIdValidator, deleteTradePartnerById);

// get list of bank accounts for a specific store (visible to everyone in the marketplace)
router.get('/stores/:id/bank-accounts', storeIdValidator, getBankAccountsByStoreId)

// get a specific bank account by id for a specific store (visible to everyone in the marketplace)
router.get('/stores/:id/bank-accounts/:baid', bankAccountIdValidator, getBankAccountById)

// create a new bank account for a specific store (only the owner and admins (user) of the store can create a bank account in the store)
router.post('/stores/:id/bank-accounts', createBankAccountValidator, createBankAccountByStoreId)

// update a specific bank account by id for a specific store (only the owner and admins (user) of the store can update it)
router.patch('/stores/:id/bank-accounts/:baid', updateBankAccountValidator, updateBankAccountById)

// delete a specific bank account by id in a specific store (only the owner and admins (user) of the store can delete it)
router.delete('/stores/:id/bank-accounts/:baid', bankAccountIdValidator, deleteBankAccountById)

export default router;
