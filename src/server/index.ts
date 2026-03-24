import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'alimin-secret-key-2026';

app.use(cors());
app.use(express.json());

// Auth Middleware
const authenticate = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Login Endpoint
app.post('/api/mobile/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Postventa Summary
app.get('/api/mobile/postventa/summary', authenticate, async (req, res) => {
  try {
    const activeContracts = await prisma.reservation.count({
      where: { lot: { status: { in: ['sold', 'reserved'] } } }
    });
    
    // Simplified stats for dashboard
    const receipts = await prisma.paymentReceipt.findMany({
      where: { status: 'APPROVED' }
    });
    const totalCollection = receipts.reduce((sum, r) => sum + r.amount_clp, 0);
    const pendingReceipts = await prisma.paymentReceipt.count({ where: { status: 'PENDING' } });

    res.json({
      totalCollection,
      activeContracts,
      totalMora: 0, // Simplified for now
      pendingReceipts
    });
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener resumen' });
  }
});

// Ledger (Cartera)
app.get('/api/mobile/postventa/ledger', authenticate, async (req: any, res: any) => {
    const { stage } = req.query;
    try {
        const reservations = await prisma.reservation.findMany({
            where: {
                lot: {
                    status: { in: ['sold', 'reserved'] },
                    ...(stage && stage !== 'ALL' ? { stage: parseInt(stage as string) } : {})
                }
            },
            include: { lot: true, receipts: { where: { status: 'APPROVED' } } }
        });

        const data = reservations.map((resObj: any) => {
            const lot = resObj.lot;
            const totalPaid = resObj.receipts.reduce((sum: number, r: any) => sum + r.amount_clp, 0);
            const totalToPay = lot.price_total_clp || 0;
            const pendingBalance = Math.max(0, totalToPay - totalPaid);
            
            const paidCuotas = resObj.installments_paid || 0;
            const totalCuotas = lot.cuotas || 0;
            
            let nextDueDate = null;
            let lateDays = 0;
            let penaltyAmount = 0;

            if (paidCuotas < totalCuotas) {
                const baseDate = resObj.legacy_installment_start_date || resObj.created_at;
                nextDueDate = getInstallmentDueDate(baseDate, paidCuotas + 1, resObj.is_legacy);
                
                penaltyAmount = calculateTotalInterest(
                    totalToPay,
                    lot.area_m2 || 200,
                    nextDueDate,
                    resObj.is_legacy,
                    new Date(),
                    resObj.mora_frozen,
                    resObj.legacy_debt_start_date
                );

                if (penaltyAmount > 0) {
                    const daily = calculateDailyInterest(totalToPay, lot.area_m2 || 200);
                    lateDays = Math.round(penaltyAmount / daily);
                }
            }

            return {
                customerId: resObj.id,
                customerName: resObj.name + (resObj.last_name ? ` ${resObj.last_name}` : ''),
                lotId: lot.number,
                stageName: `Etapa ${lot.stage}`,
                totalPaid,
                pendingBalance,
                nextDueDate: nextDueDate ? nextDueDate.toISOString() : null,
                lateDays,
                penaltyAmount,
                status: penaltyAmount > 0 ? 'OVERDUE' : (pendingBalance === 0 ? 'PAID' : 'PENDING'),
                badges: [resObj.is_legacy ? 'LGC' : 'NEW']
            };
        });

        res.json(data);
    } catch (e) {
        res.status(500).json({ error: 'Error al obtener cartera' });
    }
});

// Receipts Management
app.get('/api/mobile/postventa/receipts', authenticate, async (req, res) => {
    try {
        const receipts = await prisma.paymentReceipt.findMany({
            where: { status: 'PENDING' },
            include: { reservation: true, lot: true }
        });
        res.json(receipts.map(r => ({
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

app.patch('/api/mobile/receipt/:id', authenticate, async (req, res) => {
    const { id } = req.params;
    const { action } = req.body;
    try {
        const status = action === 'approve' ? 'APPROVED' : 'REJECTED';
        const receipt = await prisma.paymentReceipt.update({
            where: { id },
            data: { status, processed_at: new Date() }
        });

        if (status === 'APPROVED') {
            await prisma.reservation.update({
                where: { id: receipt.reservation_id },
                data: {
                    installments_paid: { increment: receipt.scope === 'INSTALLMENT' ? 1 : 0 },
                    pie_status: receipt.scope === 'PIE' ? 'PAID' : undefined
                }
            });
        }
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Error al procesar recibo' });
    }
});

// Serve static files from Expo web build
app.use(express.static(path.join(__dirname, '../../dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
