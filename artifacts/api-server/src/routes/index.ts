import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import projectsRouter from "./projects";
import postsRouter from "./posts";
import spacesRouter from "./spaces";
import adminRouter from "./admin";
import notificationsRouter from "./notifications";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/users", usersRouter);
router.use("/projects", projectsRouter);
router.use("/posts", postsRouter);
router.use("/spaces", spacesRouter);
router.use("/admin", adminRouter);
router.use("/notifications", notificationsRouter);

export default router;
