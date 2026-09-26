import { Request, Response } from "express";
import { validateDate } from "../lib/validations.js";
import { validate } from "uuid";
import pool from "../lib/pgInit.js";

export const summarizeAllTransaction = async(req: Request, res: Response) => {
  try {
    const start_date = req.query.start_date;
    const end_date = req.query.end_date;
    const user_id = req.auth?.id;

    // Validate that start_date, end_date and user_id are all string
    if(typeof start_date !== "string") {
      return res.status(400).json({
        msg: "start_end should be a stirng"
      });
    }

    if(typeof end_date !== "string") {
      return res.status(400).json({
        msg: "end_end should be a stirng"
      });
    }

    if(typeof user_id !== "string") {
      return res.status(400).json({
        msg: "user_id should be a stirng"
      });
    }

    // Validate the start_date, end_date
    if(!validateDate(start_date)) {
      return res.status(400).json({
        msg: "Start date isn't a valid date"
      });
    }

    if(!validateDate(end_date)) {
      return res.status(400).json({
        msg: "End date isn't a valid date"
      });
    }

    // Validate user_id

    if(!validate(user_id)) {
      return res.status(400).json({
        msg: "Invalid user Id"
      });
    }

    // Check if the user_id exist
    const existedUser = await pool.query("SELECT user_id FROM users WHERE user_id = $1", [user_id]);
    if(existedUser.rows.length === 0) {
      return res.status(404).json({
        msg: "User with this id doesn't exist"
      });
    }

    const query = `
    
    WITH filtered AS (
      SELECT * FROM transactions
      WHERE 
        user_id = $1 AND 
        tran_date BETWEEN $2 AND $3
    )

    SELECT 
      COUNT(*)::int AS total_number_of_transaction,
      COALESCE(SUM(tran_amount), 0)::int AS total_value_of_transaction,
      COUNT(*) FILTER (WHERE tran_type = 'income')::int AS total_number_of_income,
      COUNT(*) FILTER (WHERE tran_type = 'expense')::int AS total_number_of_expense,
      COALESCE(SUM(tran_amount) FILTER (WHERE tran_type = 'income'), 0)::int AS total_value_of_income,
      COALESCE(SUM(tran_amount) FILTER (WHERE tran_type = 'expense'), 0)::int AS total_value_of_expense,
      (
        SELECT to_jsonb(f) FROM filtered f 
        WHERE f.tran_type = 'expense'
        ORDER BY f.tran_amount DESC, f.tran_date DESC LIMIT 1
      ) AS most_expense_transaction,
      (
        SELECT to_jsonb(f) FROM filtered f 
        WHERE f.tran_type = 'income'
        ORDER BY f.tran_amount DESC, f.tran_date DESC LIMIT 1
      ) AS most_income_transaction,
      ( 
        SELECT to_jsonb(f) FROM filtered f 
        WHERE f.tran_type = 'expense'
        ORDER BY f.tran_amount ASC, f.tran_date DESC LIMIT 1
      ) AS least_expense_transaction,
      (
        SELECT to_jsonb(f) FROM filtered f 
        WHERE f.tran_type = 'income'
        ORDER BY f.tran_amount ASC, f.tran_date DESC LIMIT 1
      ) AS least_income_transaction
    FROM filtered f; 
    
    `;

    const result = await pool.query(query, [user_id, start_date, end_date]);


    return res.json({
      msg: "OK",
      result: result.rows
    })

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      msg: "Internal Server Error"
    });
  }
}