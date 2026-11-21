import {esc} from './ui-shared.js';

export async function readAccountSession() {
  try {
    const response = await fetch('/api/account/session', {signal:AbortSignal.timeout(5000)});
    if (response.ok) return await response.json();
  } catch {}
  return {enabled:false, account:null};
}

export function mountAccount({account, openDialog, save}) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'home-secondary';
  button.textContent = account ? 'Аккаунт' : 'Войти или зарегистрироваться';
  document.querySelector('.page-content').prepend(button);

  button.addEventListener('click', () => account ? showProfile() : showCredentials(false));

  function bindForm(action, input, done) {
    const form = document.querySelector('#accountForm');
    const status = form.querySelector('[role=status]');
    const submit = form.querySelector('[type=submit]');
    form.addEventListener('submit', async event => {
      event.preventDefault();
      submit.disabled = true;
      status.textContent = 'Подождите…';
      try {
        if (action === 'logout' && !await save() && !form.dataset.unsaved) {
          form.dataset.unsaved = 'yes';
          throw new Error('Прогресс пока не сохранён. Нажми ещё раз, чтобы выйти без синхронизации.');
        }
        const response = await fetch('/api/account/' + action, {
          method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(input(new FormData(form))),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        done(result);
      } catch (error) {
        status.textContent = error.message || 'Запрос не выполнен. Попробуй ещё раз.';
        submit.disabled = false;
      }
    });
  }

  function showProfile() {
    openDialog('Личный аккаунт', `<p>Логин: <strong>${esc(account.login)}</strong></p>
      <p>Прогресс тренировок и отметки уроков сохраняются в этом аккаунте.</p>
      <form id="accountForm"><button class="hint-button" type="submit">Выйти</button><p role="status"></p></form>`);
    bindForm('logout', () => ({}), () => window.location.reload());
  }

  function showCredentials(register) {
    openDialog(register ? 'Регистрация' : 'Вход', `<form id="accountForm" class="account-form">
      <label>Логин<input name="login" autocomplete="username" pattern="[a-zA-Z0-9_.\\-]{3,32}" minlength="3" maxlength="32" required></label>
      ${register ? '<label>Электронная почта<input name="email" type="email" autocomplete="email" maxlength="254" required></label>' : ''}
      <label>Пароль<input name="password" type="password" autocomplete="${register ? 'new-password' : 'current-password'}" minlength="12" maxlength="128" required></label>
      <p>После проверки пароля отправим на почту одноразовый код.</p>
      <button class="ai-button" type="submit">${register ? 'Зарегистрироваться' : 'Получить код'}</button>
      <button class="hint-button" type="button" id="accountToggle">${register ? 'Уже есть аккаунт' : 'Создать аккаунт'}</button>
      <p role="status"></p></form>`);
    document.querySelector('#accountToggle').onclick = () => showCredentials(!register);
    bindForm(register ? 'register' : 'login', data => Object.fromEntries(data), result => showCode(result.token));
  }

  function showCode(token) {
    openDialog('Подтверждение входа', `<form id="accountForm" class="account-form">
      <p>Введи шестизначный код из письма. Он действует 10 минут.</p>
      <label>Код из письма<input name="code" autocomplete="one-time-code" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" required></label>
      <button class="ai-button" type="submit">Подтвердить вход</button>
      <button class="hint-button" type="button" id="accountRestart">Запросить новый код</button>
      <p role="status"></p></form>`);
    document.querySelector('#accountRestart').onclick = () => showCredentials(false);
    bindForm('verify', data => ({token, code:data.get('code')}), () => window.location.reload());
  }
}
