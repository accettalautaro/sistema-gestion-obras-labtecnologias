import express from 'express';
import cors from 'cors';
import { corsOptions } from './config/cors.js';
import { notFound } from './middlewares/notFound.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { badRequest } from './middlewares/badRequest.js';
import obrasRoutes from './modules/obras/obras.routes.js';
import authRoutes from './modules/auth/auth.routes.js'
import clientesRoutes from './modules/clientes/clientes.routes.js';
import recordatoriosRoutes from './modules/recordatorios/recordatorios.routes.js';
import pagosRoutes from './modules/pagos/pagos.routes.js';
import terrenosRoutes from './modules/terrenos/terrenos.routes.js';

const app = express();

app.use(cors(corsOptions));
app.use(express.json());

app.use('/api/obras', obrasRoutes);
app.use('/api/auth', authRoutes);

app.use('/api/clientes', clientesRoutes);
app.use('/api/recordatorios', recordatoriosRoutes);

app.use('/api/pagos', pagosRoutes);
app.use('/api/terrenos', terrenosRoutes);


// Primero la ruta 404 (Pagina no encontrada), después el manejo de errores
app.use(badRequest);
app.use(notFound);
app.use(errorHandler);

export default app;
