import {env} from './env.js';


//solo el front puede hacer peticiones a la api 
export const corsOptions = {
    origin: env.CORS_ORIGIN,
};