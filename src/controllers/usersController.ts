import pool from '../lib/pgInit.js';
import bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import { validate } from 'uuid';
import { validateName, validatePassword, validateUsername } from '../lib/validations.js';

const RATE_LIMIT = Number.parseInt(process.env.RATE_LIMIT ?? "10", 10);

if (!Number.isInteger(RATE_LIMIT) || RATE_LIMIT <= 0) {
  throw new Error("Invalid RATE_LIMIT");
}

export const getUsersController = async(req: Request, res: Response) => {
  const query = `SELECT user_id, user_name, user_email, user_username FROM users LIMIT $1`;
  const result = await pool.query(query, [RATE_LIMIT]);
  console.log(result);
  return res.json({
    "msg": "ok",
    "data": result.rows
  });
};

export const getSpecificUserController = async(req: Request, res: Response) => {
  try {
    const user_id = req.params.id;
    if (!validate(user_id)) {
      return res.status(400).json({ "msg": "Invalid User ID." });
    }

    const query = `SELECT user_id, user_name, user_email, user_username FROM users WHERE user_id = $1`;
    const result = await pool.query(query, [user_id]);
    // console.log("Result: ");
    // console.log(result);

    if (result.rows.length == 0) {
      return res.status(404).json({
        msg: "User doesn' t exist."
      });
    }

    return res.json({
      "msg": "ok",
      "data": result.rows
    });
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({ "msg": "error" });
  }
};

export const createUserController = async(req: Request, res: Response) => {
  try {
    // const { user_name, user_email, user_username, user_password } = req.body as { user_name: string, user_email: string, user_username: string, user_password: string };

    const user_name: string = req.body.user_name.trim();
    const user_email: string = req.body.user_email.trim();
    const user_username: string = req.body.user_username.trim();
    const user_password: string = req.body.user_password;

    if(!validateName(user_name)) {
      return res.status(400).json({ msg: "Name should be non empty and should be less than 60 characters." });
    }
    if(!validateUsername(user_username)) {
      return res.status(400).json({ msg: "Username should be non empty, should only have lowercase, numeric or . _" });
    }
    if(!validatePassword(user_password)) {
      return res.status(400).json({ msg: "Password should be more than 8 characters, atleast one uppercase, one number adn one special character." });
    }

    const getUserQuery = `SELECT user_id FROM users WHERE user_username = $1`;

    const userExistResult = await pool.query(getUserQuery, [user_username]);
    // console.log(getUserQuery);
    if (userExistResult.rows.length > 0) {
      return res.status(409).json({
        "msg": "User already exist."
      });
    }

    const hash_salt = process.env.HASH_SALT;
    if (!hash_salt) {
      return res.status(500).json({
        "msg": "Hash salt is not set."
      }); 
    }

    const hashPassword = await bcrypt.hash(user_password, parseInt(hash_salt));

    const userCreateQuery = `INSERT INTO users(user_name, user_email, user_username, user_password) VALUES($1, $2, $3, $4) RETURNING user_id, user_name, user_email, user_username`;
    const insertUserResult = await pool.query(userCreateQuery, [user_name, user_email, user_username, hashPassword]);
    // console.log(insertUserResult);
    return res.json({
      "result": insertUserResult.rows[0]
    })

  } catch (error) {
    console.error(error);
    return res.status(500).json({ "msg": error });
  }
}

export const updateUserController = async(req: Request, res: Response) => {
  try {
    const user_id: string = req.body.user_id;
    const user_name: string | undefined = req.body.user_name?.trim();
    const user_email: string | undefined = req.body.user_email?.trim();
    const user_username: string | undefined = req.body.user_username?.trim();
    const user_password: string | undefined = req.body.user_password;

    if(user_name && !validateName(user_name)) {
      return res.status(400).json({ msg: "Name should be non empty and should be less than 60 characters." });
    }
    if(user_username && !validateUsername(user_username)) {
      return res.status(400).json({ msg: "Username should be non empty, should only have lowercase, numeric or . _" });
    }
    if(user_password && !validatePassword(user_password)) {
      return res.status(400).json({ msg: "Password should be more than 8 characters, atleast one uppercase, one number adn one special character." });
    }

    if (!validate(user_id)) {
      return res.status(400).json({ "msg": "Invalid User ID." });
    }

    const userExistQuery = "SELECT user_id FROM users WHERE user_id = $1";
    const userExistResult = await pool.query(userExistQuery, [user_id]);
    if (userExistResult.rows.length == 0) {
      return res.status(404).json({
        "msg": "User doesn't exist."
      });
    }

    const updateFields = [];
    const updateValues = []

    if (user_name) {
      updateFields.push(`user_name = $${updateValues.length + 1}`);
      updateValues.push(user_name);
    }

    if (user_email) {
      updateFields.push(`user_email = $${updateValues.length + 1}`);
      updateValues.push(user_email);
    }

    if (user_username) {
      updateFields.push(`user_username = $${updateValues.length + 1}`);
      updateValues.push(user_username);
    }

    if (user_password) {
      const hashSalt = process.env.HASH_SALT;

      if (!hashSalt) {
        console.error("HASH_SALT is not configured.");
        return res.status(500).json({
          msg: "Internal server error."
        });
      }

      const hashPassword = await bcrypt.hash(
        user_password,
        parseInt(hashSalt, 10)
      );

      updateFields.push(`user_password = $${updateValues.length + 1}`);
      updateValues.push(hashPassword);
    }

    updateValues.push(user_id);

    if (updateFields.length === 0) {
      return res.status(400).json({
          msg: "No fields provided for update."
      });
  }

    const updateQuery = `UPDATE users SET ${updateFields.join(", ")} WHERE user_id = $${updateValues.length} RETURNING user_id, user_name, user_email, user_username`;
    const updateResult = await pool.query(updateQuery, updateValues);
    console.log(updateQuery);
    return res.json({
      result: updateResult.rows[0]
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ "msg": error });
  }
}

export const deleteUserontroller = async(req: Request, res: Response) => {
  try {
    const { user_id } = req.body as { user_id: string };

    if (!validate(user_id)) {
      return res.status(400).json({ "msg": "Invalid User ID." });
    }

    const userExistQuery = `SELECT user_id FROM users WHERE user_id = $1`;
    const userExistResult = await pool.query(userExistQuery, [user_id]);
    if (userExistResult.rows.length === 0) {
      return res.status(404).json({
        "msg": "User doesn't exist."
      });
    }

    const deleteUserQuery = `DELETE FROM users WHERE user_id = $1 RETURNING user_id, user_name, user_email, user_username`;
    const deleteUserResult = await pool.query(deleteUserQuery, [user_id]);

    return res.json({
      result: deleteUserResult.rows[0]
    })

  } catch (error) {
    console.error(error);
    return res.status(500).json({ "msg": error });
  }
}