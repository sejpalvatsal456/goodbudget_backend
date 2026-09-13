import { Pool } from "pg";

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'pyBank',
  password: 'admin',
  port: 5432,
});

export default pool;