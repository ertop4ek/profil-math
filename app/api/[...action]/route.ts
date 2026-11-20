import {env} from 'cloudflare:workers';
import {service} from '@/lib/service.mjs';
export const dynamic='force-dynamic';
export const GET=(r:Request)=>service(r,env.DB);
export const POST=(r:Request)=>service(r,env.DB);
export const PUT=(r:Request)=>service(r,env.DB);
