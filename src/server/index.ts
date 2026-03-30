import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { getInstallmentDueDate, calculateTotalInterest, calculateDailyInterest } from '../lib/financials';

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'alimin-secret-key-2026';

app.use(cors());
app.use(express.json());

// Auth Middleware
const authenticate = (req: Request, res: Response, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    (req as any).user = decoded;
    next();
  } catch (e) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Login
app.post('/api/mobile/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email : email.toLowerCase() } });
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (e) {
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Ledger (Mapa de Inventario)
app.get('/api/mobile/postventa/ledger', authenticate, async (req: any, res: any) => {
    const { stage } = req.query;
    try {
        const lots = await prisma.lot.findMany({
            where: {
                ...(stage && stage !== 'ALL' ? { stage: parseInt(stage as string) } : {})
            },
            include: { 
                reservations: { 
                    orderBy: { created_at: 'desc' },
                    take: 1,
                    include: { receipts: { where: { status: 'APPROVED' } } }
                }
            },
            orderBy: { number: 'asc' }
        });

        const data = lots.map((lot: any) => {
            const activeRes = lot.status !== 'available' && lot.reservations?.length > 0 ? lot.reservations[0] : null;
            
            // Financial Defaults
            let totalPaid = 0;
            let pendingBalance = lot.price_total_clp || 0;
            let nextDueDate = null;
            let lateDays = 0;
            let penaltyAmount = 0;
            let status: 'OK' | 'LATE' | 'UPCOMING' | 'AVAILABLE' = 'AVAILABLE';

            if (activeRes) {
                totalPaid = activeRes.receipts?.reduce((sum: number, r: any) => sum + r.amount_clp, 0) || 0;
                pendingBalance = Math.max(0, (lot.price_total_clp || 0) - totalPaid);
                
                const paidCuotas = activeRes.installments_paid || 0;
                const totalCuotas = lot.cuotas || 0;

                if (paidCuotas < totalCuotas) {
                    const baseDate = activeRes.legacy_installment_start_date || activeRes.created_at;
                    nextDueDate = getInstallmentDueDate(baseDate, paidCuotas + 1, activeRes.is_legacy);
                    
                    penaltyAmount = calculateTotalInterest(
                        lot.price_total_clp || 0,
                        lot.area_m2 || 200,
                        nextDueDate,
                        activeRes.is_legacy,
                        new Date(),
                        activeRes.mora_frozen,
                        activeRes.legacy_debt_start_date
                    );

                    if (penaltyAmount > 0) {
                        const daily = calculateDailyInterest(lot.price_total_clp || 0, lot.area_m2 || 200);
                        lateDays = Math.round(penaltyAmount / daily);
                    }
                }
                status = penaltyAmount > 0 ? 'LATE' : (pendingBalance === 0 ? 'OK' : 'UPCOMING');
            }

            return {
                customerId: activeRes?.id || null,
                customerName: activeRes ? `${activeRes.name} ${activeRes.last_name || ''}` : 'Lote Disponible',
                rut: activeRes?.rut || '',
                email: activeRes?.email || '',
                phone: activeRes?.phone || '',
                lotId: lot.number,
                stageName: `Etapa ${lot.stage}`,
                area_m2: lot.area_m2 || 0,
                price_total_clp: lot.price_total_clp || 0,
                valor_cuota: lot.valor_cuota || 0,
                reservation_amount: lot.reservation_amount_clp || 0,
                pie: activeRes?.pie || lot.pie || 0,
                pie_status: activeRes?.pie_status || 'PENDING',
                installments_paid: activeRes?.installments_paid || 0,
                totalPaid,
                totalInvested: totalPaid,
                pendingBalance,
                nextDueDate: nextDueDate ? nextDueDate.toISOString() : null,
                lateDays,
                penaltyAmount,
                status: activeRes ? status : 'AVAILABLE',
                lotStatus: lot.status, // sold, reserved, available
                badges: activeRes ? [activeRes.is_legacy ? 'LGC' : 'NEW'] : []
            };
        });

        res.json(data);
    } catch (e) {
        console.error('Ledger error:', e);
        res.status(500).json({ error: 'Error al obtener inventario' });
    }
});

// Rest of endpoints (Summary, Receipts, Assign, Reset, Docs...)
app.get('/api/mobile/postventa/summary', authenticate, async (req: Request, res: Response) => {
  try {
    const activeContracts = await prisma.reservation.count({
      where: { lot: { status: { in: ['sold', 'reserved'] } } }
    });
    const receipts = await prisma.paymentReceipt.findMany({ where: { status: 'APPROVED' } });
    const totalCollection = receipts.reduce((sum: number, r: any) => sum + r.amount_clp, 0);
    const pendingReceipts = await prisma.paymentReceipt.count({ where: { status: 'PENDING' } });
    res.json({ totalCollection, activeContracts, totalMora: 0, pendingReceipts });
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener resumen' });
  }
});

app.post('/api/mobile/postventa/lot/:lotId/assign', authenticate, async (req: Request, res: Response) => {
    const { lotId } = req.params;
    const body = req.body;
    try {
        const lot = await prisma.lot.findFirst({ where: { number: lotId } });
        if (!lot) return res.status(404).json({ error: 'Lote no encontrado' });
        await prisma.reservation.create({
            data: {
                lot_id: lot.id,
                name: body.name,
                last_name: body.surname,
                email: body.email.toLowerCase(),
                phone: body.phone,
                rut: body.rut,
                pie: body.pieAmount,
                pie_status: body.piePaid ? 'PAID' : 'PENDING',
                installments_paid: 0,
                mora_frozen: body.freezeMora,
                pipeline_stage: 'RESERVA_PAGADA'
            }
        });
        await prisma.lot.update({
            where: { id: lot.id },
            data: { status: 'sold', price_total_clp: body.priceTotal, valor_cuota: body.normalInstallmentValue, pie: body.pieAmount }
        });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Error al asignar propietario' });
    }
});

app.delete('/api/mobile/postventa/lot/:lotId', authenticate, async (req: Request, res: Response) => {
    const { lotId } = req.params;
    try {
        const lot = await prisma.lot.findFirst({ where: { number: lotId } });
        if (!lot) return res.status(404).json({ error: 'Lote no encontrado' });
        await prisma.reservation.deleteMany({ where: { lot_id: lot.id } });
        await prisma.lot.update({ where: { id: lot.id }, data: { status: 'available' } });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Error al resetear lote' });
    }
});

app.get('/api/mobile/postventa/receipts', authenticate, async (req: Request, res: Response) => {
    try {
        const receipts = await prisma.paymentReceipt.findMany({
            where: { status: 'PENDING' },
            include: { reservation: true, lot: true }
        });
        res.json(receipts.map((r: any) => ({
            id: r.id,
            customerName: r.reservation.name + ' ' + (r.reservation.last_name || ''),
            lotNumber: r.lot.number,
            amount: r.amount_clp,
            date: r.created_at.toISOString(),
            status: r.status,
            imageUrl: r.receipt_url
        })));
    } catch (e) {
        res.status(500).json({ error: 'Error al obtener recibos' });
    }
});

app.get('/api/mobile/user/docs', authenticate, async (req: Request, res: Response) => {
    const { userId } = req.query;
    res.json([
        { id: '1', title: 'Reserva', type: 'RESERVA', date: new Date().toISOString() },
        { id: '2', title: 'Promesa', type: 'PROMESA', date: new Date().toISOString() }
    ]);
});

app.patch('/api/mobile/receipt/:id', authenticate, async (req: Request, res: Response) => {
    const { id } = req.params;
    const { action } = req.body;
    try {
        const status = action === 'approve' ? 'APPROVED' : 'REJECTED';
        const receipt = await prisma.paymentReceipt.update({ where: { id }, data: { status, processed_at: new Date() } });
        if (status === 'APPROVED') {
            await prisma.reservation.update({
                where: { id: receipt.reservation_id },
                data: { installments_paid: { increment: receipt.scope === 'INSTALLMENT' ? 1 : 0 }, pie_status: receipt.scope === 'PIE' ? 'PAID' : undefined } as any
            });
        }
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Error al procesar recibo' });
    }
});

app.use(express.static(path.join(__dirname, '../../dist')));
app.get('*', (req, res) => { res.sendFile(path.join(__dirname, '../../dist/index.html')); });
app.listen(PORT, () => { console.log(`Server running on port ${PORT}`); });
