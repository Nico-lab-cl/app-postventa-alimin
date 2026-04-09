import axios from 'axios';

async function testFetch() {
    try {
        console.log("Testeando API con postventa@lomasdelmar.cl / postventa123...");
        let resp = await axios.post('https://postventa.aliminlomasdelmar.com/api/mobile/auth/login', {
            email: 'postventa@lomasdelmar.cl',
            password: 'postventa123'
        });
        let token = resp.data.token;
        console.log("Token obtenido: ", token? true : false);

        let respLedger = await axios.get('https://postventa.aliminlomasdelmar.com/api/mobile/postventa/ledger?stage=ALL', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Resultados de Ledger: ", respLedger.data.length);
        if (respLedger.data.length > 0) {
            console.log("Primer caso: ", respLedger.data[0].customerName, "pie_status:", respLedger.data[0].pie_status);
            
            const pStatus = respLedger.data.map((d: any) => d.pie_status);
            const paid = pStatus.filter((p:any) => p === 'PAID').length;
            const pend = pStatus.filter((p:any) => p === 'PENDING').length;
            const nulls = pStatus.filter((p:any) => !p).length;
            console.log(`PAID: ${paid}, PENDING: ${pend}, NULOS: ${nulls}`);
        }
    } catch (e: any) {
        console.log("Error intentando viejo pass: ", e.response?.data || e.message);
        
        console.log("Probando con la nueva nicolas123...");
        try {
            let resp2 = await axios.post('https://postventa.aliminlomasdelmar.com/api/mobile/auth/login', {
                email: 'postventa@lomasdelmar.cl',
                password: 'cindy.alimin2026'
            });
            console.log("Con pass nuevo funcionó!", resp2.data.token ? "Si": "No");
        } catch(e2: any) {
            console.log("Falla también con el nuevo: ", e2.response?.data || e2.message);
        }
    }
}

testFetch();
