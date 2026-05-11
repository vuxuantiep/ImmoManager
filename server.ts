import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import path from 'path';

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'secret123';

const app = express();
app.use(cors());
app.use(express.json());

// Auth Middleware
interface AuthRequest extends Request {
  user?: { id: string; email: string; tier: string };
}
const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

app.post('/api/auth/register', async (req, res) => {
  const { email, password, name } = req.body;
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
       res.status(400).json({ error: 'Email already in use' });
       return;
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name }
    });
    const token = jwt.sign({ id: user.id, email: user.email, tier: user.tier }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, tier: user.tier } });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
    }
    
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
    }
    const token = jwt.sign({ id: user.id, email: user.email, tier: user.tier }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, tier: user.tier } });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// App Data Routes
app.get('/api/data', authMiddleware, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  try {
    const properties = await prisma.property.findMany({ where: { userId }, include: { units: true } });
    const tenants = await prisma.tenant.findMany({ where: { userId } });
    const owners = await prisma.owner.findMany({ where: { userId } });
    const transactions = await prisma.transaction.findMany({ where: { userId } });
    res.json({ properties, tenants, owners, transactions });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

app.post('/api/properties', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const p = await prisma.property.create({
             data: { ...req.body, userId }
        });
        res.json(p);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist'); // when dist/server.cjs is used
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
