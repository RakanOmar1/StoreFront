import { Request, Response } from 'express'
import path from 'path'
import fs from 'fs'
import { UserModel } from '../models/UserModel'
type AuthRequest = Request & { user?: { id?: number } }
const model = new UserModel()
export class ProfileController {
  me = async (req: AuthRequest,res: Response) => { const user=await model.showCurrent(req.user!.id!); user?res.json(user):res.status(404).json('Profile not found') }
  update = async (req: AuthRequest,res: Response) => { try{res.json(await model.updateCurrent(req.user!.id!,req.body))}catch{res.status(400).json('Could not update profile')} }
  avatar = async (req: AuthRequest,res: Response) => { if(!req.file){res.status(400).json('Image required');return}res.json(await model.updateAvatar(req.user!.id!,`/uploads/avatars/${req.file.filename}`)) }
  removeAvatar = async (req: AuthRequest,res: Response) => { const current=await model.showCurrent(req.user!.id!);if(current?.avatar_url){const file=path.join(process.cwd(),current.avatar_url);if(fs.existsSync(file))fs.unlinkSync(file)}res.json(await model.updateAvatar(req.user!.id!,null)) }
  password = async (req: AuthRequest,res: Response) => { const {currentPassword,newPassword}=req.body;if(typeof newPassword!=='string'||newPassword.length<6){res.status(400).json('Password must contain at least 6 characters');return}const ok=await model.changePassword(req.user!.id!,String(currentPassword||''),newPassword);ok?res.json({message:'Password changed'}):res.status(400).json('Current password is incorrect') }
}
