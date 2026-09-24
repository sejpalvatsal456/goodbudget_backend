import { Router } from "express";
import { createAccountController, deleteAccountController, getAllAccountsController, getSpecificAccountController, updateAccountController } from "../controllers/accountsController.js";
import { authMiddleware } from "../middlewares/authMidddleware.js";

const accountsRouter = Router();

accountsRouter.get('/', getAllAccountsController);
accountsRouter.get('/:id', getSpecificAccountController);
accountsRouter.post('/',authMiddleware, createAccountController);
accountsRouter.patch('/', authMiddleware, updateAccountController);
accountsRouter.delete('/', authMiddleware, deleteAccountController);

export default accountsRouter;