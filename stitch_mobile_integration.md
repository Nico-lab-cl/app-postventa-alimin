# FINAL STITCH PROMPT: Lomas del Mar Postventa (Mobile App)

## 🎯 Objetivo General
Construir una aplicación móvil nativa (Expo/React Native) que replique con **exactitud literal** todas las funcionalidades, vistas y flujos del Portal de Postventa del CRM Lomas del Mar. La aplicación debe ser 100% dependiente de internet (online-only) y enfocada exclusivamente en la visualización y gestión administrativa de cartera para asesores.

---

## 🛠️ Stack Tecnológico Mandatorio
1. **Fundamentos**: Expo SDK 51+, TypeScript, React Navigation (Tabs + Stacks).
2. **Estado & Datos**: TanStack Query (React Query) v5 (Sin persistencia offline).
3. **Networking**: Axios (BaseURL: `https://aliminlomasdelmar.com/api`).
4. **Diseño**: NativeWind (Tailwind CSS) con estética Premium/Dark Mode (Vidrio/Glassmorphism).
5. **Autenticación**: JWT persistido en `expo-secure-store`.

---

## 🏗️ Estructura de Navegación y Vistas (Módulos)

### 1. Sistema de Auth (Login)
- **Pantalla**: Login minimalista con logo, email y password.
- **Conexión**: `POST /api/mobile/auth/login`.
- **Lógica**: Al recibir el `token`, inyectarlo en el header `Authorization: Bearer <token>` para todas las peticiones de Axios.

### 2. Tab: Dashboard / Terrenos (AdminLotList)
- **Visualización**: Lista de todos los lotes agrupados por etapa (1, 2, 3, 4).
- **Filtros**: Por etapa y estado (Disponible/Vendido/Reservado).
- **Acción**: Al tocar un lote, si tiene dueño, abrir el "Customer Ledger".

### 3. Tab: Ledger / Cartera (Estado de Cuentas)
- **Endpoint**: `GET /api/mobile/postventa/ledger?stage=ALL`.
- **Vista**: Tarjetas de clientes con:
    - Nombre del cliente, Lote y Etapa.
    - Barra de progreso de pago (Cuotas pagadas vs Totales).
    - Status badges: `RES` (Contrato Reserva), `COM` (Comprobantes), `PRM` (Promesa), `GST` (Gastos).
- **Filtros**: Buscador por nombre/lote, filtro por etapa y estado (`PAID`/`PENDING`).

### 4. Tab: Alertas & Mora (AdminMoraManager)
- **Vista**: Ranking de deuda y alertas de vencimiento.
- **Categorías**:
    - **Mora**: Clientes con `penaltyAmount > 0`.
    - **Gracia**: Periodo de gracia activado.
    - **Próximos**: Vencimientos en los próximos 5 días.
- **Detalle**: Mostrar días de atraso (`lateDays`) y monto de multa (`penaltyAmount`).

### 5. Tab: Recibos (Verification)
- **Vista**: Lista de comprobantes cargados por clientes (Pagos Webpay o Transferencias).
- **Acciones**: Aprobar/Rechazar recibos (`PATCH /api/mobile/receipt/[id]`).

---

## 📊 Lógica de Negocio y Finanzas
La App **NO** debe calcular intereses localmente. Toda la lógica ya está procesada en el backend en `getFullPostventaData`. La app debe utilizar los siguientes campos de la respuesta JSON:
- `totalPaid`: Inversión total del cliente.
- `pendingBalance`: Lo que resta por pagar del valor total del terreno.
- `nextDueDate`: Fecha del próximo vencimiento de cuota.
- `lateDays` / `penaltyAmount`: Información de mora calculada.

---

## 📄 Requerimientos Visuales y UX
1. **Premium Dark Mode**: Fondo `#0F172A`, tarjetas con bordes `emerald-500/10` y desenfoque de fondo.
2. **Visualización de Documentos**: Usar `react-native-webview` o la integración de sistema para abrir URLs de documentos (RESERVA, PROMESA, GASTOS) desde `/api/contracts/[id]/file`.
3. **Cero Placeholders**: No usar datos falsos; manejar estados de `Loading` con esqueletos (Skeletons) animados.
4. **Online Only**: Si no hay conexión, mostrar una pantalla de bloqueo "Sin conexión a Internet".

---

## 🔗 Referencia de Endpoints (Mapping)
- `GET /api/mobile/postventa/ledger` (Data completa de cartera).
- `GET /api/mobile/postventa/payments` (Historial de pagos).
- `GET /api/mobile/postventa/receipts` (Recibos pendientes de aprobación).
- `PATCH /api/mobile/receipt/[id]` (Aprobar/Rechazar).
- `POST /api/mobile/postventa/payments/manual` (Registrar pago manual).
