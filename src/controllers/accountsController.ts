import { Request, Response } from "express";
import pool from "../lib/pgInit.js";
import { validate } from "uuid";
import { validateBalance, validateName } from "../lib/validations.js";
import { Result } from "pg";

export const getAllAccountsController = async(req: Request, res: Response) => {
  try {
    const RATE_LIMIT = process.env.RATE_LIMIT || "10";
    const query = "SELECT * FROM accounts LIMIT $1";
    const result = await pool.query(query, [parseInt(RATE_LIMIT)]);

    return res.json({
      msg: "ok",
      result: result.rows
    })

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      msg: "Internal Server Error."
    });
  }
};

export const getSpecificAccountController = async(req: Request, res: Response) => {
  try {
    const acc_id = req.params.id as string;
    if(!validate(acc_id)) {
      return res.status(500).json({
        msg: "Invalid Account Id."
      });
    }

    const query = "SELECT * FROM accounts WHERE acc_id = $1";
    const result = await pool.query(query, [acc_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        msg: "Account with this id doesn't exist."
      });
    } 

    return res.json({
      msg: "ok",
      result: result.rows[0]
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      msg: "Internal Server Error."
    });
  }
};

export const createAccountController = async(req: Request, res: Response) => {
  try {
    
    const { acc_name, acc_type, acc_balance, user_id } = req.body as {
      acc_name: string,
      acc_type: 'cash' | 'saving' | 'credit_card' | 'current',
      acc_balance: number,
      user_id: string
    };

    if(!validateName(acc_name)) {
      return res.status(500).json({
        msg: "Account name should be non empty and atmost 60 characters."
      });
    }

    if(!validateBalance(acc_balance)) {
      return res.status(500).json({
        msg: "Balance should be greater than 0."
      });
    }

    if (!validate(user_id)) {
      return res.status(500).json({
        msg: "Invalid user id."
      });
    }

    const existedUserQuery = "SELECT user_id FROM users WHERE user_id = $1";
    const existedUserResult = await pool.query(existedUserQuery, [user_id]);

    if(existedUserResult.rows.length == 0) {
      return res.status(404).json({
        msg: "User with this id doesn't exist."
      });
    }

    const insertQuery = "INSERT INTO accounts(acc_name, acc_type, acc_balance, user_id) VALUES($1, $2, $3, $4) RETURNING *";
    const insertResult = await pool.query(insertQuery, [acc_name, acc_type, acc_balance, user_id]);

    return res.json({
      msg: "ok",
      result: insertResult.rows[0]
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      msg: "Internal Server Error."
    });
  }
}

export const updateAccountController = async(req: Request, res: Response) => {
  try {
    
    const { acc_id, acc_name, acc_type, acc_balance, acc_is_disabled } = req.body as {
      acc_id: string,
      acc_name: string | undefined,
      acc_type: 'cash' | 'current' | 'saving' | 'credit_card' | undefined,
      acc_balance: number | undefined,
      acc_is_disabled: boolean | undefined
    };

    if(!validate(acc_id)) {
      return res.status(500).json({
        msg: "Invalid account id."
      });
    }

    if(acc_name && !validateName(acc_name)) {
      return res.status(500).json({
        msg: "Acount name should be non empty adn atmost 60 characters."
      });
    }

    if(acc_balance && validateBalance(acc_balance)) {
      return res.status(500).json({
        msg: "Balance should be greater than 0."
      });
    }

    const existedAccountQuery = "SELECT acc_id FROM accounts WHERE acc_id = $1";
    const existedAccountResult = await pool.query(existedAccountQuery, [acc_id]);

    if(existedAccountResult.rows.length === 0) {
      return res.status(404).json({
        msg: "Account with this id doesn't exist."
      });
    }

    let updatedFields = [];
    let updatedValues = [];

    if(acc_name) {
      updatedFields.push(`acc_name = $${updatedFields.length + 1}`);
      updatedValues.push(acc_name);
    }

    if(acc_type) {
      updatedFields.push(`acc_type = $${updatedFields.length + 1}`);
      updatedValues.push(acc_type);
    }

    if(acc_balance) {
      updatedFields.push(`acc_balance = $${updatedFields.length + 1}`);
      updatedValues.push(acc_balance);
    }

    if(acc_is_disabled) {
      updatedFields.push(`acc_is_disabled = $${updatedFields.length + 1}`);
      updatedValues.push(acc_is_disabled);
    }

    updatedValues.push(acc_id);

    const updateQuery = `UPDATE accounts SET ${updatedFields.join(", ")} WHERE acc_id = $${updatedValues.length} RETURNING *`;
    const updateResult = await pool.query(updateQuery, updatedValues);

    return res.json({
      msg: "ok",
      result: updateResult.rows[0]
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      msg: "Internal Server Error."
    });
  }
};

export const deleteAccountController = async(req: Request, res: Response) => {
  try {
    const { acc_id } = req.body as { acc_id: string };

    if(!validate(acc_id)) {
      return res.status(500).json({
        msg: "Invalid Account ID."
      });
    }

    const existedAccountQuery = "SELECT * FROM accounts WHERE acc_id = $1";
    const existedAccountResult = await pool.query(existedAccountQuery, [acc_id]);

    if(existedAccountResult.rows.length === 0) {
      return res.status(400).json({
        msg: "Account with this id doesn't exist."
      });
    }

    const deleteQuery = "DELETE FROM accounts WHERE acc_id = $1 RETURNING *";
    const deleteResult = await pool.query(deleteQuery, [acc_id]);

    return res.json({
      msg: "ok",
      result: deleteResult.rows[0]
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      msg: "Internal Server Error."
    });
  }
}