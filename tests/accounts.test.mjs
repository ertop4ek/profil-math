import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {test} from 'node:test';
import {accountRequest} from '../lib/accounts.mjs';
import {service} from '../lib/service.mjs';

test('account enrollment, email challenge, progress isolation and logout', async () => {
  const sql = new DatabaseSync(':memory:');
  for (const file of ['0000_useful_mantis.sql','0001_accounts.sql']) {
    sql.exec(readFileSync(new URL('../drizzle/' + file, import.meta.url), 'utf8'));
  }
  const db = {
    prepare(query) {
      const statement = sql.prepare(query);
      return {bind(...args) {
        return {first:async () => statement.get(...args), run:async () => ({meta:statement.run(...args)})};
      }};
    },
    batch: statements => Promise.all(statements.map(statement => statement.run())),
  };
  const origin = 'https://profile.example';
  const env = {PROFILE_MAIL_KEY:'test', PROFILE_MAIL_FROM:'test@example.org', PROFILE_OTP_SECRET:'a'.repeat(32)};
  let mail;
  const deliver = async (_url, options) => {
    mail = JSON.parse(options.body);
    return new Response(null, {status:202});
  };
  function request(path, method = 'GET', body, cookie, accountId) {
    return new Request(origin + '/api/' + path, {
      method, body:body === undefined ? undefined : JSON.stringify(body),
      headers:{origin, ...(cookie ? {cookie} : {}), ...(accountId ? {'X-Profile-Account':accountId} : {})},
    });
  }
  const auth = (action, body, cookie) => accountRequest(request('account/' + action, body ? 'POST' : 'GET', body, cookie), db, env, action, deliver);
  const credentials = {login:'student-a',email:'a@example.org',password:'a long password'};
  async function enroll(data) {
    const registration = await auth('register', data);
    assert.equal(registration.status, 200);
    assert.equal(registration.headers.has('Set-Cookie'), false);
    assert.deepEqual(mail.to, [data.email]);
    const code = mail.text.match(/\d{6}/)[0];
    const {token} = await registration.json();
    assert.equal((await auth('verify', {token,code:code === '000000' ? '000001' : '000000'})).status, 400);
    const confirmation = await auth('verify', {token,code});
    assert.equal(confirmation.status, 200);
    assert.equal((await auth('verify',{token,code})).status, 400);
    const cookie = confirmation.headers.get('Set-Cookie').split(';')[0];
    const {account} = await (await auth('session',undefined,cookie)).json();
    return {cookie,id:account.id};
  }
  const a = await enroll(credentials);
  const b = await enroll({...credentials,login:'student-b',email:'b@example.org'});
  assert.equal((await auth('login',{...credentials,password:'completely wrong'})).status,401);
  sql.exec("DELETE FROM profile_auth_limits WHERE bucket LIKE 'mail:%'");
  const login = await auth('login',credentials);
  assert.equal(login.status,200);
  assert.equal(login.headers.has('Set-Cookie'),false);
  assert.ok((await login.json()).token);
  const progress = (identity,method='GET',body,id=identity.id) => service(request('account-progress',method,body,identity.cookie,id),db,env);
  const id = 'e26-1-right-1';
  assert.equal((await progress(a,'PUT',{revision:0,document:{practice:{records:{[id]:{solved:true}}}}})).status,200);
  assert.equal((await (await progress(a)).json()).document.practice.records[id].solved,true);
  assert.deepEqual((await (await progress(b)).json()).document.practice.records,{});
  assert.equal((await progress(b,'GET',undefined,a.id)).status,401);
  assert.equal((await auth('logout',{},a.cookie)).status,200);
  assert.equal((await progress(a)).status,401);
  sql.close();
});
