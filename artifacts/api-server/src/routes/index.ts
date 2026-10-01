import { Router, type IRouter } from "express";
import healthRouter from "./health";
import learningRouter from "./learning";

const router: IRouter = Router();

router.use(healthRouter);
router.use(learningRouter);

export default router;
