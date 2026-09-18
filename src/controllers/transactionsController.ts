import { Request, Response } from "express";
import { validate } from "uuid";

import pool from "../lib/pgInit.js";
import {
  validateBalance,
  validateDate,
  validateTransactionMode,
  validateTransactionStatus,
  validateTransactionType,
} from "../lib/validations.js";

// ---------------------------------------------------------
// GET ALL TRANSACTIONS
// ---------------------------------------------------------

export const getAllTransactionsController = async (
  req: Request,
  res: Response,
) => {
  try {
    const RATE_LIMIT = process.env.RATE_LIMIT || "10";

    const query = `
      SELECT *
      FROM transactions
      ORDER BY "createdAt" DESC
      LIMIT $1
    `;

    const result = await pool.query(query, [parseInt(RATE_LIMIT)]);

    return res.json({
      msg: "ok",
      result: result.rows,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      msg: "Internal Server Error.",
    });
  }
};

// ---------------------------------------------------------
// GET SPECIFIC TRANSACTION
// ---------------------------------------------------------

export const getSpecificTransactionController = async (
  req: Request,
  res: Response,
) => {
  try {
    const tran_id = req.params.id as string;

    if (!validate(tran_id)) {
      return res.status(400).json({
        msg: "Invalid transaction id.",
      });
    }

    const query = `
      SELECT *
      FROM transactions
      WHERE tran_id = $1
    `;

    const result = await pool.query(query, [tran_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        msg: "Transaction with this id doesn't exist.",
      });
    }

    return res.json({
      msg: "ok",
      result: result.rows[0],
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      msg: "Internal Server Error.",
    });
  }
};

// ---------------------------------------------------------
// GET ALL TRANSACTIONS FOR SPECIFIC USER
// ---------------------------------------------------------

export const getAllTransactionForSpecificUser = async (
  req: Request,
  res: Response,
) => {
  try {
    const user_id = req.params.id as string;

    if (!validate(user_id)) {
      return res.status(400).json({
        msg: "Invalid user id.",
      });
    }

    const existedUserQuery = `
      SELECT user_id
      FROM users
      WHERE user_id = $1
    `;

    const existedUserResult = await pool.query(existedUserQuery, [user_id]);

    if (existedUserResult.rows.length === 0) {
      return res.status(404).json({
        msg: "User with this id doesn't exist.",
      });
    }

    const query = `
      SELECT *
      FROM transactions
      WHERE user_id = $1
      ORDER BY tran_date DESC, "createdAt" DESC
    `;

    const result = await pool.query(query, [user_id]);

    return res.json({
      msg: "ok",
      result: result.rows,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      msg: "Internal Server Error.",
    });
  }
};

// ---------------------------------------------------------
// GET ALL TRANSACTIONS FOR SPECIFIC ACCOUNT
// ---------------------------------------------------------

export const getAllTransactionForSpecificAccount = async (
  req: Request,
  res: Response,
) => {
  try {
    const account_id = req.params.id as string;

    if (!validate(account_id)) {
      return res.status(400).json({
        msg: "Invalid account id.",
      });
    }

    const existedAccountQuery = `
      SELECT acc_id
      FROM accounts
      WHERE acc_id = $1
    `;

    const existedAccountResult = await pool.query(existedAccountQuery, [
      account_id,
    ]);

    if (existedAccountResult.rows.length === 0) {
      return res.status(404).json({
        msg: "Account with this id doesn't exist.",
      });
    }

    const query = `
      SELECT *
      FROM transactions
      WHERE account_id = $1
      ORDER BY tran_date DESC, "createdAt" DESC
    `;

    const result = await pool.query(query, [account_id]);

    return res.json({
      msg: "ok",
      result: result.rows,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      msg: "Internal Server Error.",
    });
  }
};

// ---------------------------------------------------------
// CREATE TRANSACTION
// ---------------------------------------------------------

// ---------------------------------------------------------
// CREATE TRANSACTION
// ---------------------------------------------------------

export const createTransactionController = async (
  req: Request,
  res: Response,
) => {
  try {
    const {
      tran_desc,
      tran_status,
      user_id,
      account_id,
      tran_merchant,
      tran_mode,
      tran_type,
      tran_date,
      tran_amount,
    } = req.body as {
      tran_desc?: string;
      tran_status?: string;
      user_id: string;
      account_id: string;
      tran_merchant: string;
      tran_mode?: string;
      tran_type?: string;
      tran_date?: string;
      tran_amount: number;
    };

    // -------------------------
    // Validate IDs
    // -------------------------

    if (!validate(user_id)) {
      return res.status(400).json({
        msg: "Invalid user id.",
      });
    }

    if (!validate(account_id)) {
      return res.status(400).json({
        msg: "Invalid account id.",
      });
    }

    // -------------------------
    // Validate required fields
    // -------------------------

    if (!tran_merchant) {
      return res.status(400).json({
        msg: "Transaction merchant is required.",
      });
    }

    if (!validateBalance(tran_amount)) {
      return res.status(400).json({
        msg: "Transaction amount should be greater than 0.",
      });
    }

    // -------------------------
    // Validate optional fields
    // (only if provided)
    // -------------------------

    if (tran_status !== undefined && !validateTransactionStatus(tran_status)) {
      return res.status(400).json({
        msg: "Status can only be 'pending', 'completed', 'failed'."
      });
    }

    if (tran_mode !== undefined && !validateTransactionMode(tran_mode)) {
      return res.status(400).json({
        msg: "Mode can only be 'cash', 'online', 'credit_card'."
      });
    }

    if (tran_type !== undefined && !validateTransactionType(tran_type)) {
      return res.status(400).json({
        msg: "Type can only be 'income', 'expense'."
      });
    }

    if (tran_date !== undefined && !validateDate(tran_date)) {
      return res.status(400).json({
        msg: "Invalid transaction date.",
      });
    }

    // -------------------------
    // Check user exists
    // -------------------------

    const existedUserQuery = "SELECT * FROM users WHERE user_id = $1";

    const existedUserResult = await pool.query(existedUserQuery, [user_id]);

    if (existedUserResult.rows.length === 0) {
      return res.status(404).json({
        msg: "User with this id doesn't exist.",
      });
    }

    // -------------------------
    // Check account exists AND
    // belongs to this user
    // -------------------------

    const existedAccountQuery =
      "SELECT acc_id FROM accounts WHERE acc_id = $1 AND user_id = $2";

    const existedAccountResult = await pool.query(existedAccountQuery, [
      account_id,
      user_id,
    ]);

    if (existedAccountResult.rows.length === 0) {
      return res.status(400).json({
        msg: "Account doesn't exist or doesn't belong to this user.",
      });
    }

    // -------------------------
    // Build dynamic INSERT
    // (omitted fields fall back
    // to the schema's DEFAULT)
    // -------------------------

    const insertedFields: string[] = ["user_id", "account_id", "tran_merchant", "tran_amount"];
    const insertedValues: unknown[] = [user_id, account_id, tran_merchant, tran_amount];

    if (tran_desc !== undefined) {
      insertedFields.push("tran_desc");
      insertedValues.push(tran_desc);
    }

    if (tran_status !== undefined) {
      insertedFields.push("tran_status");
      insertedValues.push(tran_status);
    }

    if (tran_mode !== undefined) {
      insertedFields.push("tran_mode");
      insertedValues.push(tran_mode);
    }

    if (tran_type !== undefined) {
      insertedFields.push("tran_type");
      insertedValues.push(tran_type);
    }

    if (tran_date !== undefined) {
      insertedFields.push("tran_date");
      insertedValues.push(tran_date);
    }

    const placeholders = insertedValues.map((_, i) => `$${i + 1}`).join(", ");

    const insertQuery = `
      INSERT INTO transactions (${insertedFields.join(", ")})
      VALUES (${placeholders})
      RETURNING *
    `;

    const insertResult = await pool.query(insertQuery, insertedValues);

    return res.status(201).json({
      msg: "ok",
      result: insertResult.rows[0],
    });
  } catch (error: unknown) {
    console.error(error);

    if (typeof error === "object" && error !== null && "code" in error) {
      const pgError = error as {
        code: string;
      };

      // Invalid PostgreSQL enum value
      if (pgError.code === "22P02") {
        return res.status(400).json({
          msg: "Invalid transaction status, mode or type.",
        });
      }

      // Foreign key violation
      if (pgError.code === "23503") {
        return res.status(400).json({
          msg: "Invalid user or account.",
        });
      }

      // NOT NULL violation (e.g. a column with no schema DEFAULT was omitted)
      if (pgError.code === "23502") {
        return res.status(400).json({
          msg: "Missing required transaction field.",
        });
      }
    }

    return res.status(500).json({
      msg: "Internal Server Error.",
    });
  }
};

// ---------------------------------------------------------
// UPDATE TRANSACTION
// ---------------------------------------------------------

export const updateTransactionController = async (
  req: Request,
  res: Response,
) => {
  try {
    const {
      tran_id,
      tran_desc,
      tran_status,
      tran_merchant,
      tran_mode,
      tran_type,
      tran_date,
      tran_amount,
    } = req.body as {
      tran_id: string;
      tran_desc?: string;
      tran_status?: string;
      tran_merchant?: string;
      tran_mode?: string;
      tran_type?: string;
      tran_date?: string;
      tran_amount?: number;
    };

    // -------------------------
    // Validate transaction ID
    // -------------------------

    if (!validate(tran_id)) {
      return res.status(400).json({
        msg: "Invalid transaction id.",
      });
    }

    // -------------------------
    // Validate fields
    // -------------------------

    if (tran_status !== undefined && !validateTransactionStatus(tran_status)) {
      return res.status(400).json({
        msg: "Status can only be 'pending', 'completed', 'failed'.",
      });
    }

    if (tran_mode !== undefined && !validateTransactionMode(tran_mode)) {
      return res.status(400).json({
        msg: "Mode can only be 'cash', 'online', 'credit_card'.",
      });
    }

    if (tran_type !== undefined && !validateTransactionType(tran_type)) {
      return res.status(400).json({
        msg: "Type can only be 'income', 'expense'.",
      });
    }

    if (tran_amount !== undefined && !validateBalance(tran_amount)) {
      return res.status(400).json({
        msg: "Transaction amount should be greater than 0.",
      });
    }

    if (tran_date !== undefined && !validateDate(tran_date)) {
      return res.status(400).json({
        msg: "Invalid transaction date.",
      });
    }

    // -------------------------
    // Check transaction exists
    // -------------------------

    const existedTransactionQuery = `
      SELECT tran_id
      FROM transactions
      WHERE tran_id = $1
    `;

    const existedTransactionResult = await pool.query(existedTransactionQuery, [
      tran_id,
    ]);

    if (existedTransactionResult.rows.length === 0) {
      return res.status(404).json({
        msg: "Transaction with this id doesn't exist.",
      });
    }

    // -------------------------
    // Build dynamic UPDATE
    // -------------------------

    const updatedFields: string[] = [];
    const updatedValues: unknown[] = [];

    if (tran_desc !== undefined) {
      updatedFields.push(`tran_desc = $${updatedValues.length + 1}`);

      updatedValues.push(tran_desc);
    }

    if (tran_status !== undefined) {
      updatedFields.push(`tran_status = $${updatedValues.length + 1}`);

      updatedValues.push(tran_status);
    }

    if (tran_merchant !== undefined) {
      updatedFields.push(`tran_merchant = $${updatedValues.length + 1}`);

      updatedValues.push(tran_merchant);
    }

    if (tran_mode !== undefined) {
      updatedFields.push(`tran_mode = $${updatedValues.length + 1}`);

      updatedValues.push(tran_mode);
    }

    if (tran_type !== undefined) {
      updatedFields.push(`tran_type = $${updatedValues.length + 1}`);

      updatedValues.push(tran_type);
    }

    if (tran_date !== undefined) {
      updatedFields.push(`tran_date = $${updatedValues.length + 1}`);

      updatedValues.push(tran_date);
    }

    if (tran_amount !== undefined) {
      updatedFields.push(`tran_amount = $${updatedValues.length + 1}`);

      updatedValues.push(tran_amount);
    }

    // -------------------------
    // Nothing to update
    // -------------------------

    if (updatedFields.length === 0) {
      return res.status(400).json({
        msg: "No fields provided for update.",
      });
    }

    // Always update updatedAt
    updatedFields.push(`"updatedAt" = now()`);

    updatedValues.push(tran_id);

    const updateQuery = `
      UPDATE transactions
      SET ${updatedFields.join(", ")}
      WHERE tran_id = $${updatedValues.length}
      RETURNING *
    `;

    const updateResult = await pool.query(updateQuery, updatedValues);

    return res.json({
      msg: "ok",
      result: updateResult.rows[0],
    });
  } catch (error: unknown) {
    console.error(error);

    if (typeof error === "object" && error !== null && "code" in error) {
      const pgError = error as {
        code: string;
      };

      if (pgError.code === "22P02") {
        return res.status(400).json({
          msg: "Invalid transaction status, mode or type.",
        });
      }
    }

    return res.status(500).json({
      msg: "Internal Server Error.",
    });
  }
};

// ---------------------------------------------------------
// DELETE TRANSACTION
// ---------------------------------------------------------

export const deleteTransactionController = async (
  req: Request,
  res: Response,
) => {
  try {
    const { tran_id } = req.body as {
      tran_id: string;
    };

    if (!validate(tran_id)) {
      return res.status(400).json({
        msg: "Invalid transaction id.",
      });
    }

    const deleteQuery = `
      DELETE FROM transactions
      WHERE tran_id = $1
      RETURNING *
    `;

    const deleteResult = await pool.query(deleteQuery, [tran_id]);

    if (deleteResult.rows.length === 0) {
      return res.status(404).json({
        msg: "Transaction with this id doesn't exist.",
      });
    }

    return res.json({
      msg: "ok",
      result: deleteResult.rows[0],
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      msg: "Internal Server Error.",
    });
  }
};
