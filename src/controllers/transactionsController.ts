import { Request, Response } from "express";

import pool from "../lib/pgInit.js";

import { validate } from "uuid";
import {
  validateBalance,
  validateName
} from "../lib/validations.js";


// GET ALL TRANSACTIONS
export const getAllTransactionsController = async (
  req: Request,
  res: Response
) => {
  try {
    const RATE_LIMIT = process.env.RATE_LIMIT || "10";

    const query = `
      SELECT *
      FROM transactions
      ORDER BY created_at DESC
      LIMIT $1
    `;

    const result = await pool.query(query, [
      parseInt(RATE_LIMIT)
    ]);

    return res.json({
      msg: "ok",
      result: result.rows
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      msg: "Internal Server Error."
    });
  }
};


// GET SPECIFIC TRANSACTION
export const getSpecificTransactionController = async (
  req: Request,
  res: Response
) => {
  try {
    const trans_id = req.params.id as string;

    if (!validate(trans_id)) {
      return res.status(400).json({
        msg: "Invalid transaction id."
      });
    }

    const query = `
      SELECT *
      FROM transactions
      WHERE trans_id = $1
    `;

    const result = await pool.query(query, [trans_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        msg: "Transaction with this id doesn't exist."
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

export const getAllTransactionForSpecificUser = async (
  req: Request,
  res: Response
) => {
  try {
    const user_id = req.params.id as string;

    if (!validate(user_id)) {
      return res.status(400).json({
        msg: "Invalid user id."
      });
    }

    const existedUserQuery = `
      SELECT user_id
      FROM users
      WHERE user_id = $1
    `;

    const existedUserResult = await pool.query(
      existedUserQuery,
      [user_id]
    );

    if (existedUserResult.rows.length === 0) {
      return res.status(404).json({
        msg: "User with this id doesn't exist."
      });
    }

    const query = `
      SELECT t.*
      FROM transactions t
      INNER JOIN accounts a
        ON t.account_id = a.acc_id
      WHERE a.user_id = $1
      ORDER BY t.created_at DESC
    `;

    const result = await pool.query(query, [user_id]);

    return res.json({
      msg: "ok",
      result: result.rows
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      msg: "Internal Server Error."
    });
  }
};


export const getAllTransactionForSpecificAccount = async (
  req: Request,
  res: Response
) => {
  try {
    const account_id = req.params.id as string;

    if (!validate(account_id)) {
      return res.status(400).json({
        msg: "Invalid account id."
      });
    }

    const existedAccountQuery = `
      SELECT acc_id
      FROM accounts
      WHERE acc_id = $1
    `;

    const existedAccountResult = await pool.query(
      existedAccountQuery,
      [account_id]
    );

    if (existedAccountResult.rows.length === 0) {
      return res.status(404).json({
        msg: "Account with this id doesn't exist."
      });
    }

    const query = `
      SELECT *
      FROM transactions
      WHERE account_id = $1
      ORDER BY created_at DESC
    `;

    const result = await pool.query(query, [account_id]);

    return res.json({
      msg: "ok",
      result: result.rows
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      msg: "Internal Server Error."
    });
  }
};

// CREATE TRANSACTION
export const createTransactionController = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      trans_desc,
      trans_status,
      account_id,
      trans_merchant_name,
      trans_mode,
      trans_amount
    } = req.body as {
      trans_desc: string;
      trans_status?: string;
      account_id: string;
      trans_merchant_name: string;
      trans_mode?: string;
      trans_amount: number;
    };

    // Validate account ID
    if (!validate(account_id)) {
      return res.status(400).json({
        msg: "Invalid account id."
      });
    }

    // Validate description
    if (!trans_desc || trans_desc.trim().length === 0) {
      return res.status(400).json({
        msg: "Transaction description cannot be empty."
      });
    }

    // Validate merchant name
    if (!validateName(trans_merchant_name)) {
      return res.status(400).json({
        msg: "Merchant name should be non-empty and at most 60 characters."
      });
    }

    // Validate amount
    if (!validateBalance(trans_amount)) {
      return res.status(400).json({
        msg: "Transaction amount should be greater than 0."
      });
    }

    // Check account
    const existedAccountQuery = `
      SELECT acc_id, acc_balance
      FROM accounts
      WHERE acc_id = $1
    `;

    const existedAccountResult = await pool.query(
      existedAccountQuery,
      [account_id]
    );

    if (existedAccountResult.rows.length === 0) {
      return res.status(404).json({
        msg: "Account with this id doesn't exist."
      });
    }

    const account = existedAccountResult.rows[0];

    // Store the balance before transaction
    const trans_balance_before = account.acc_balance;

    const insertQuery = `
      INSERT INTO transactions (
        trans_desc,
        trans_status,
        account_id,
        trans_merchant_name,
        trans_mode,
        trans_amount,
        trans_balance_before
      )
      VALUES (
        $1,
        COALESCE($2, 'pending'),
        $3,
        $4,
        COALESCE($5, 'cash'),
        $6,
        $7
      )
      RETURNING *
    `;

    const insertResult = await pool.query(
      insertQuery,
      [
        trans_desc,
        trans_status,
        account_id,
        trans_merchant_name,
        trans_mode,
        trans_amount,
        trans_balance_before
      ]
    );

    return res.status(201).json({
      msg: "ok",
      result: insertResult.rows[0]
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      msg: "Internal Server Error."
    });
  }
};


// UPDATE TRANSACTION
export const updateTransactionController = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      trans_id,
      trans_desc,
      trans_status,
      trans_merchant_name,
      trans_mode,
      trans_amount
    } = req.body as {
      trans_id: string;
      trans_desc?: string;
      trans_status?: string;
      trans_merchant_name?: string;
      trans_mode?: string;
      trans_amount?: number;
    };

    // Validate transaction ID
    if (!validate(trans_id)) {
      return res.status(400).json({
        msg: "Invalid transaction id."
      });
    }

    // Validate description
    if (
      trans_desc !== undefined &&
      trans_desc.trim().length === 0
    ) {
      return res.status(400).json({
        msg: "Transaction description cannot be empty."
      });
    }

    // Validate merchant name
    if (
      trans_merchant_name !== undefined &&
      !validateName(trans_merchant_name)
    ) {
      return res.status(400).json({
        msg: "Merchant name should be non-empty and at most 60 characters."
      });
    }

    // Validate amount
    if (
      trans_amount !== undefined &&
      !validateBalance(trans_amount)
    ) {
      return res.status(400).json({
        msg: "Transaction amount should be greater than 0."
      });
    }

    // Check transaction
    const existedTransactionQuery = `
      SELECT trans_id
      FROM transactions
      WHERE trans_id = $1
    `;

    const existedTransactionResult = await pool.query(
      existedTransactionQuery,
      [trans_id]
    );

    if (existedTransactionResult.rows.length === 0) {
      return res.status(404).json({
        msg: "Transaction with this id doesn't exist."
      });
    }

    const updatedFields: string[] = [];
    const updatedValues: unknown[] = [];

    if (trans_desc !== undefined) {
      updatedFields.push(
        `trans_desc = $${updatedValues.length + 1}`
      );

      updatedValues.push(trans_desc);
    }

    if (trans_status !== undefined) {
      updatedFields.push(
        `trans_status = $${updatedValues.length + 1}`
      );

      updatedValues.push(trans_status);
    }

    if (trans_merchant_name !== undefined) {
      updatedFields.push(
        `trans_merchant_name = $${updatedValues.length + 1}`
      );

      updatedValues.push(trans_merchant_name);
    }

    if (trans_mode !== undefined) {
      updatedFields.push(
        `trans_mode = $${updatedValues.length + 1}`
      );

      updatedValues.push(trans_mode);
    }

    if (trans_amount !== undefined) {
      updatedFields.push(
        `trans_amount = $${updatedValues.length + 1}`
      );

      updatedValues.push(trans_amount);
    }

    if (updatedFields.length === 0) {
      return res.status(400).json({
        msg: "No fields provided for update."
      });
    }

    updatedValues.push(trans_id);

    const updateQuery = `
      UPDATE transactions
      SET
        ${updatedFields.join(", ")},
        updated_at = now()
      WHERE trans_id = $${updatedValues.length}
      RETURNING *
    `;

    const updateResult = await pool.query(
      updateQuery,
      updatedValues
    );

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


// DELETE TRANSACTION
export const deleteTransactionController = async (
  req: Request,
  res: Response
) => {
  try {
    const { trans_id } = req.body as {
      trans_id: string;
    };

    if (!validate(trans_id)) {
      return res.status(400).json({
        msg: "Invalid transaction id."
      });
    }

    const existedTransactionQuery = `
      SELECT trans_id
      FROM transactions
      WHERE trans_id = $1
    `;

    const existedTransactionResult = await pool.query(
      existedTransactionQuery,
      [trans_id]
    );

    if (existedTransactionResult.rows.length === 0) {
      return res.status(404).json({
        msg: "Transaction with this id doesn't exist."
      });
    }

    const deleteQuery = `
      DELETE FROM transactions
      WHERE trans_id = $1
      RETURNING *
    `;

    const deleteResult = await pool.query(
      deleteQuery,
      [trans_id]
    );

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
};