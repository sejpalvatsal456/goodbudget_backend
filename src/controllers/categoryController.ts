import { Request, Response } from "express";
import pool from "../lib/pgInit.js";

const RATE_LIMIT = Number.parseInt(process.env.RATE_LIMIT ?? "10", 10);

if (!Number.isInteger(RATE_LIMIT) || RATE_LIMIT <= 0) {
  throw new Error("Invalid RATE_LIMIT");
}

export const getAllCategories = async(req: Request, res: Response) => {
    try {
        const user_id = req.auth!.id;
        const query = "SELECT * FROM categories WHERE user_id = $1 LIMIT $2;";
        const result = await pool.query(query, [user_id, RATE_LIMIT]);
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
}

export const getSpecificCategory = async(req: Request, res: Response) => {
    try {
        const user_id: string = req.auth!.id;
        const cat_id = req.body.cat_id;

        const query = "SELECT * FROM categories WHERE user_id = $1, cat_id = $2 LIMIT $3";
        const result = await pool.query(query, [user_id, cat_id, RATE_LIMIT]);
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
}