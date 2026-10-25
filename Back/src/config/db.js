import pkg from 'pg';
import { env } from './env.js';

const { Pool} = pkg;

export const pool = new Pool({
    host : env.PGHOST,
    port: env.PGPORT,
    user : env.PGUSER,
    password: env.PGPASSWORD,
    database: env.PGDATABASE,
    
    max:50,
    min: 0,

    idleTimeoutMillis: 30000, //ms que una conexion puede estar inactiva antes de ser cerrada
    connectionTimeoutMillis: 5000, //ms que una conexion puede tardar en ser establecida antes de dar error
    query_timeout: 10000, //ms que una query puede tardar en ser ejecutada antes de dar error
    statement_timeout:10000, //ms maximo que el servidor Postgres deja  correr una sentencia SQL

    allowExitOnIdle:false, // si está en true, permite que el proceso de Node termine cuando el pool queda vacío e inactivo

});

// Log de errores de conexiones inactivas que el servidor puede cerrar inesperadamente
pool.on('error', (err) => { 
    console.error('Error inesperado en el pool de conexiones', err);
});