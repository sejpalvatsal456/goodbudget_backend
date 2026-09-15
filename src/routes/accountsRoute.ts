import { Router } from "express";
import { createAccountController, deleteAccountController, getAllAccountsController, getSpecificAccountController, updateAccountController } from "../controllers/accountsController.js";

const accountsRouter = Router();

accountsRouter.get('/', getAllAccountsController);
accountsRouter.get('/:id', getSpecificAccountController);
accountsRouter.post('/', createAccountController);
accountsRouter.patch('/', updateAccountController);
accountsRouter.delete('/', deleteAccountController);

export default accountsRouter;