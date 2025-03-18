import { Router } from 'express';
import * as aiController from '../controllers/ai.controller.js';
const router = Router();


router.post('/template', aiController.template)
router.post('/chat', aiController.chat)



export default router;