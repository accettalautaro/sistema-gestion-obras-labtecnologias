import express from 'express';
import cors from 'cors';
import { corsOptions } from './config/cors.js';
import { notFound } from './middlewares/notFound.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { badRequest } from './middlewares/badRequest.js';
import obrasRoutes from './modules/obras/obras.routes.js';
import authRoutes from './modules/auth/auth.routes.js'
import tareasRoutes  from './modules/tareas/tareas.routes.js';
import subtareasRoutes from './modules/subtareas/subtareas.routes.js'

const app = express();

app.use(cors(corsOptions));
app.use(express.json());

app.use('/api/obras', obrasRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/tareas', tareasRoutes);
app.use('/api/subtareas',subtareasRoutes);

// Primero la ruta 404 (Pagina no encontrada), después el manejo de errores
app.use(badRequest);
app.use(notFound);
app.use(errorHandler);

export default app;