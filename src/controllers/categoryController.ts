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

export const createCategory = async(req: Request, res: Response) => {
    try {
        const user_id: string = req.auth!.id;
        const raw_name: string = req.body.name;
        const raw_desc: string | undefined = req.body.desc;

        if (typeof raw_name !== "string") {
            return res.status(400).json({
                msg: "name should be string"
            });
        }

        if (raw_desc !== undefined && typeof raw_desc !== "string") {
            return res.status(400).json({
                msg: "desc should be string"
            });
        }

        const name = raw_name.trim();
        const desc = raw_desc?.trim();

        if(name === "") {
            return res.status(400).json({
                msg: "Name can not be empty string."
            });
        }

        const query = "INSERT INTO categories(cat_name, cat_desc, user_id) VALUES ($1, $2, $3) RETURNING *;";
        const result = await pool.query(query, [name, desc, user_id]);

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
}