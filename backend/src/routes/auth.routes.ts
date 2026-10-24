import { Router } from 'express'
import { login, logout, me, register } from '../controllers/auth.controller'
import { authenticate } from '../middleware/authenticate'
import { validate } from '../middleware/validate'
import { loginSchema, registerSchema } from '../validators/auth.validators'

export const authRouter = Router()

authRouter.post('/register', validate({ body: registerSchema }), register)
authRouter.post('/login', validate({ body: loginSchema }), login)
authRouter.post('/logout', logout)
authRouter.get('/me', authenticate, me)
