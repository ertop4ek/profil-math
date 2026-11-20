import test from 'node:test';
import assert from 'node:assert/strict';
import {proxy} from '../deploy/vercel/proxy.mjs';
test('Vercel gateway preserves anonymous session and forwards only known API paths',async()=>{
 const session='a'.repeat(64),request=new Request('https://profile.vercel.app/api/progress',{headers:{cookie:'other=private; __Host-profile_session='+session,authorization:'do-not-forward'}});
 const result=await proxy(request,async(url,init)=>{assert.equal(url,'https://profil-math-yaroslav.livelyanole2050.chatgpt.site/api/progress');assert.equal(init.headers.get('cookie'),'__Host-profile_session='+session);assert.equal(init.headers.get('authorization'),null);return Response.json({revision:1,document:{}},{headers:{'Set-Cookie':'__Host-profile_session='+session+'; Path=/; Secure; HttpOnly; SameSite=Lax'}});});
 assert.equal(result.status,200);assert.match(result.headers.get('set-cookie'),/HttpOnly/);assert.equal(result.headers.get('cache-control'),'no-store');
 assert.equal((await proxy(new Request('https://profile.vercel.app/api/other'),()=>assert.fail())).status,404);
});
test('Vercel gateway checks browser origin before forwarding writes',async()=>{
 const create=origin=>new Request('https://profile.vercel.app/api/check',{method:'POST',headers:{'Content-Type':'application/json',origin},body:JSON.stringify({id:'p1',answer:'0'})});
 assert.equal((await proxy(create('https://evil.example'),()=>assert.fail())).status,403);
 const r=await proxy(create('https://profile.vercel.app'),async(url,init)=>{assert.equal(init.headers.get('origin'),'https://profil-math-yaroslav.livelyanole2050.chatgpt.site');assert.equal(JSON.parse(init.body).answer,'0');return Response.json({status:'incorrect'});});assert.equal(r.status,200);
});
test('Vercel gateway keeps backend conflicts and reports unavailable backend without returning HTML',async()=>{
 const request=new Request('https://profile.vercel.app/api/progress');
 assert.equal((await proxy(request,async()=>Response.json({revision:2}, {status:409}))).status,409);
 assert.equal((await proxy(request,async()=>new Response('<html>error</html>'))).status,502);
 assert.equal((await proxy(request,async()=>{throw Error('network')})).status,502);
});
