import express, { type Express } from "express";
import cors from "cors";
import router from "./routes";
import { startEnergyDecayCron } from "./lib/energy-decay";

const app: Express = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/api", router);

startEnergyDecayCron();

export default app;
