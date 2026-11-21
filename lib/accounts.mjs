const encoder = new TextEncoder();
const hex = bytes => Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
const random = () => hex(crypto.getRandomValues(new Uint8Array(32)));
const sha = async text => hex(await crypto.subtle.digest('SHA-256', encoder.encode(text)));
const minute = 60_000;
const maxAge = 7 * 24 * 60 * minute;
const cookieName = '__Host-profile_account';

async function passwordHash(password, salt) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  return hex(await crypto.subtle.deriveBits({name:'PBKDF2', salt:encoder.encode(salt), iterations:600_000, hash:'SHA-256'}, key, 256));
}

async function codeHash(secret, token, code) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), {name:'HMAC', hash:'SHA-256'}, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', key, encoder.encode(token + ':' + code)));
}

function codeNumber() {
  const numbers = new Uint32Array(1);
  do { crypto.getRandomValues(numbers); } while (numbers[0] >= 4_294_000_000);
  return String(numbers[0] % 1_000_000).padStart(6, '0');
}

const reply = (data, status = 200, cookie) => Response.json(data, {
  status, headers:{'Cache-Control':'no-store', ...(cookie ? {'Set-Cookie':cookie} : {})},
});
const fail = (error, status = 400) => reply({error}, status);
const cookie = (value, seconds) => `${cookieName}=${value}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=${seconds}`;

async function sessionDigest(request) {
  const token = request.headers.get('cookie')?.match(/(?:^|;\s*)__Host-profile_account=([a-f0-9]{64})(?:;|$)/)?.[1];
  return token ? sha(token) : null;
}

export async function accountSession(request, db) {
  const digest = await sessionDigest(request);
  if (!digest || !db) return null;
  return db.prepare(`SELECT a.id, a.login FROM profile_sessions s
    JOIN profile_accounts a ON a.id=s.account_id WHERE s.digest=? AND s.expires>?`).bind(digest, Date.now()).first();
}

async function limited(db, bucket, max, duration, now) {
  const expires = now + duration;
  const row = await db.prepare(`INSERT INTO profile_auth_limits (bucket, attempts, expires) VALUES (?,1,?)
    ON CONFLICT(bucket) DO UPDATE SET attempts=CASE WHEN expires<=? THEN 1 ELSE attempts+1 END,
    expires=CASE WHEN expires<=? THEN excluded.expires ELSE expires END RETURNING attempts`).bind(bucket, expires, now, now).first();
  return row.attempts > max;
}

export async function accountRequest(request, db, env, action, deliver = fetch) {
  const url = new URL(request.url);
  const enabled = Boolean(db && env?.PROFILE_MAIL_KEY && env.PROFILE_MAIL_FROM && env.PROFILE_OTP_SECRET?.length >= 32);
  if (action === 'session' && request.method === 'GET') {
    return reply({enabled, account:enabled ? await accountSession(request, db) : null});
  }
  if (!enabled) return fail('Регистрация пока недоступна.', 503);
  if (request.method !== 'POST' || !['register','login','verify','logout'].includes(action)) return fail('Адрес не найден.', 404);
  if (request.headers.get('origin') !== url.origin) return fail('Запрос должен отправляться с этого сайта.', 403);
  if (action === 'logout') {
    const digest = await sessionDigest(request);
    if (digest) await db.prepare('DELETE FROM profile_sessions WHERE digest=?').bind(digest).run();
    return reply({ok:true}, 200, cookie('', 0));
  }
  const now = Date.now();
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const ipKey = await sha(ip);
  if (await limited(db, 'ip:' + ipKey, 30, 15 * minute, now)) return fail('Слишком много запросов. Попробуй позже.', 429);
  const raw = await request.text();
  if (raw.length > 4096) return fail('Слишком большой запрос.', 413);
  const body = JSON.parse(raw);
  if (!body || typeof body !== 'object') return fail('Некорректные данные.');
  if (action === 'verify') {
    if (typeof body.token !== 'string' || !/^[a-f0-9]{64}$/.test(body.token) || typeof body.code !== 'string' || !/^\d{6}$/.test(body.code)) return fail('Введи шестизначный код.');
    const digest = await codeHash(env.PROFILE_OTP_SECRET, body.token, body.code);
    const row = await db.prepare(`UPDATE profile_codes SET attempts=attempts+1
      WHERE token=? AND expires>? AND attempts<5 RETURNING account_id, digest`).bind(body.token, now).first();
    if (!row || row.digest !== digest) return fail('Код неверный или истёк. Запроси новый код.');
    const consumed = await db.prepare('DELETE FROM profile_codes WHERE token=? AND digest=? RETURNING account_id').bind(body.token, digest).first();
    if (!consumed) return fail('Код уже использован.');
    const token = random();
    await db.batch([
      db.prepare('UPDATE profile_accounts SET verified=1 WHERE id=?').bind(row.account_id),
      db.prepare('INSERT INTO profile_sessions (digest,account_id,expires) VALUES (?,?,?)').bind(await sha(token),row.account_id,now+maxAge),
    ]);
    return reply({ok:true}, 200, cookie(token, maxAge / 1000));
  }
  const login = typeof body.login === 'string' ? body.login.trim().toLowerCase() : '';
  const password = body.password;
  if (!/^[a-z0-9_.-]{3,32}$/.test(login) || typeof password !== 'string' || password.length < 12 || password.length > 128) {
    return fail('Логин: 3–32 латинские буквы, цифры или символы _ . -. Пароль: 12–128 символов.');
  }
  if (await limited(db, 'login:' + login, 8, 15 * minute, now)) return fail('Слишком много попыток. Попробуй позже.', 429);
  let account = await db.prepare('SELECT * FROM profile_accounts WHERE login=?').bind(login).first();
  if (action === 'register') {
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail('Укажи корректный адрес электронной почты.');
    if (account) return fail('Логин или почта уже используются.', 409);
    const id = random(), salt = random(), hash = await passwordHash(password, salt);
    const result = await db.prepare('INSERT OR IGNORE INTO profile_accounts (id,login,email,password) VALUES (?,?,?,?)').bind(id, login, email, salt + ':' + hash).run();
    if (!result.meta.changes) return fail('Логин или почта уже используются.', 409);
    account = {id,email};
  } else {
    const [salt, expected] = (account?.password || 'unregistered:').split(':');
    if (await passwordHash(password, salt) !== expected) return fail('Неверный логин или пароль.', 401);
  }
  if (await limited(db, 'mail:' + account.id, 1, minute, now)) return fail('Новый код можно запросить через минуту.', 429);
  const token = random(), code = codeNumber();
  await db.prepare(`INSERT INTO profile_codes (token, account_id, digest, expires) VALUES (?,?,?,?)
    ON CONFLICT(account_id) DO UPDATE SET token=excluded.token,digest=excluded.digest,expires=excluded.expires,attempts=0`).bind(token, account.id, await codeHash(env.PROFILE_OTP_SECRET, token, code), now + 10 * minute).run();
  const result = await deliver('https://api.resend.com/emails', {
    method:'POST', headers:{Authorization:'Bearer ' + env.PROFILE_MAIL_KEY, 'Content-Type':'application/json'},
    signal:AbortSignal.timeout(10_000),
    body:JSON.stringify({from:env.PROFILE_MAIL_FROM,to:[account.email],subject:'Код входа в «Профиль»',text:`Код входа: ${code}. Действует 10 минут.`}),
  });
  if (!result.ok) return fail('Не удалось отправить письмо. Попробуй войти через минуту.', 502);
  return reply({token});
}
