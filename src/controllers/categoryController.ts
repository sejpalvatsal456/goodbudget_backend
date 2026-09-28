import { Request, Response } from "express";
import pool from "../lib/pgInit.js";

const RATE_LIMIT = Number.parseInt(process.env.RATE_LIMIT ?? "10", 10);

if (!Number.isInteger(RATE_LIMIT) || RATE_LIMIT <= 0) {
  throw new Error("Invalid RATE_LIMIT");
}

export const getAllCategories = async(req: Request, res: Response) => {
    try {
        const query = "SELECT * FROM categories LIMIT $1;";
        const result = await pool.query(query, [RATE_LIMIT]);
        return res.json({
            msg: "ok",
            data: result.rows
        })
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            msg: "Internal Server Error."
        });
    }
}