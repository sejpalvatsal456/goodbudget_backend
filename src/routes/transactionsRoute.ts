import { Router } from "express";
import { getAllTransactionForSpecificAccount, getAllTransactionForSpecificUser, getAllTransactionsController, getSpecificTransactionController, issueTransactionController, updateTransactionController, softDeleteTransactionController } from "../controllers/transactionsController.js";
import { authMiddleware } from "../middlewares/authMidddleware.js";

const transactionsRouter = Router();

transactionsRouter.get('/', getAllTransactionsController);
transactionsRouter.get('/:id', getSpecificTransactionController);
transactionsRouter.get("/user/:id", getAllTransactionForSpecificUser);
transactionsRouter.get('/account/:id', getAllTransactionForSpecificAccount);
transactionsRouter.post('/', authMiddleware, issueTransactionController);
transactionsRouter.patch('/', authMiddleware, updateTransactionController);
transactionsRouter.delete('/', authMiddleware, softDeleteTransactionController);

export default transactionsRouter;