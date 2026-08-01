import express, { Request, Response, NextFunction }  from "express";
import { handleEntityRequest } from "./entity-handler"
import { Router } from 'express';
export { prisma } from './entities';

const router: Router = express.Router();

router.post("/api/entities", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { entity, method, args } = req.body;
    const result = await handleEntityRequest(entity, method, args);
    res.json(result);
  } catch (error) {
    next(error); // 将错误传递给错误处理中间件
  }
});

router.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(`模块错误: ${err.message}`);
  res.status(500).json({ error: '模块内部错误' });
});

export const path = '/BACKEND_PROJ_fcb9e6ee_snap_20260726_092922_893_snap_20260726_092922_893';

// 或者导出为对象
const routeModule = {
  path,
  router
};

export default routeModule;
