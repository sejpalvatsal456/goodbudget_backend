import express from 'express';
import usersRouter from './routes/usersRoute.js';
import dotenv from 'dotenv';
import accountsRouter from './routes/accountsRoute.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json())
app.use('/users/', usersRouter);
app.use('/accounts/', accountsRouter);

app.listen(PORT, (err) => {
  console.log(`App is running at http://localhost:${PORT}`);
});