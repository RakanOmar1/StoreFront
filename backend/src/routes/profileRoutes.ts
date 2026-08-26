import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { verifyAuthToken } from '../middleware/verifyAuthToken'
import { ProfileController } from '../controllers/ProfileController'
const routes=Router(),controller=new ProfileController(),dir=path.join(process.cwd(),'uploads','avatars');fs.mkdirSync(dir,{recursive:true})
const upload=multer({storage:multer.diskStorage({destination:dir,filename:(_req,file,cb)=>cb(null,`${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file.originalname).toLowerCase()}`)}),limits:{fileSize:5*1024*1024},fileFilter:(_req,file,cb)=>cb(null,['image/jpeg','image/png','image/webp'].includes(file.mimetype))})
routes.use(verifyAuthToken);routes.get('/',controller.me);routes.patch('/',controller.update);routes.post('/avatar',upload.single('avatar'),controller.avatar);routes.delete('/avatar',controller.removeAvatar);routes.patch('/password',controller.password)
export default routes
