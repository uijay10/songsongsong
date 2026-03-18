import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import projectsRouter from "./projects";
import postsRouter from "./posts";
import spacesRouter from "./spaces";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/users", usersRouter);
router.use("/projects", projectsRouter);
router.use("/posts", postsRouter);
router.use("/spaces", spacesRouter);

export default router;
