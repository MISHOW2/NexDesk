import 'dotenv/config';
import express from 'express';
import cors from "cors";
import helmet from "helmet";
import authRoutes from './routes/authRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { errorHandler } from './middlewares/errorHandler.js';
import pool from "./data/db.js";

const app = express();
const PORT = process.env.PORT || 5000;
if (process.env.VERCEL) {
  app.set("trust proxy", 1);
}
const allowedOrigins = (process.env.CLIENT_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
app.use(helmet());
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.get('/', (req, res) => {
  res.send('TicketFlow API is running');
});

app.use('/api/auth/', authRoutes);
app.use('/api/tickets/', ticketRoutes);
app.use('/api/admin/', adminRoutes);
app.use(errorHandler);

async function startServer() {
  try {
    await pool.query("SELECT 1");
    console.log("Connected to PostgreSQL");

    app.listen(PORT, () => {
      console.log(`Server listening on PORT ${PORT}`);
    });
  } catch (error) {
    console.error("Unable to connect to PostgreSQL:", error.message);
    process.exit(1);
  }
}
startServer();