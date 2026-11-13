import express from 'express';
import dotenv from 'dotenv';

import cors from "cors";
import authRoutes from './routes/authRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js'
import pool from "./data/db.js";

 
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('TicketFlow API is running');
});

app.use('/api/auth/', authRoutes)
app.use('/api/tickets/', ticketRoutes)

async function startServer() {
  try {
    await pool.query("SELECT 1");

    app.listen(PORT, () => {
      console.log(`Server listening on PORT ${PORT}`);
    });
  } catch (error) {
    console.error("Unable to connect to PostgreSQL:", error.message);
    process.exit(1);
  }
}
startServer();
