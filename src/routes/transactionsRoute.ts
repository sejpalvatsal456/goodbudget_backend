import { Router } from "express";
import { createTransactionController, getAllTransactionForSpecificAccount, getAllTransactionForSpecificUser, getAllTransactionsController, getSpecificTransactionController, updateTransactionController } from "../controllers/transactionsController.js";
import { deleteAccountController } from "../controllers/accountsController.js";

const transactionsRouter = Router();

transactionsRouter.get('/', getAllTransactionsController);
transactionsRouter.get('/:id', getSpecificTransactionController);
transactionsRouter.get("/user/:id", getAllTransactionForSpecificUser);
transactionsRouter.get('/account/:id', getAllTransactionForSpecificAccount);
transactionsRouter.post('/', createTransactionController);
transactionsRouter.patch('/', updateTransactionController);
transactionsRouter.delete('/', deleteAccountController);

export default transactionsRouter;