try {
  process.loadEnvFile();
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}


export const env={
    PORT: process.env.PORT ?? 3000,
    CORS_ORIGIN: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    PGHOST: process.env.PGHOST ?? 'localhost',
    PGPORT: process.env.PGPORT ?? 5432,
    PGUSER: process.env.PGUSER ?? 'postgres',
    PGPASSWORD: process.env.PGPASSWORD ?? 'postgres',
    PGDATABASE: process.env.PGDATABASE ?? 'gestion-obras',
    
}