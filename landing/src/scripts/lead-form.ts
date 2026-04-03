/**
 * Lead form → Telegram bot handler.
 *
 * Static site (Astro SSG) on GitHub Pages — no server runtime.
 * Bot token is scoped to sendMessage only. Risk is limited to spam.
 */

const BOT_TOKEN = '8679984493:AAHf5dxUO6ec49IxTwWDy6c54mhXFfH6gCo';
const CHAT_ID = '-5057763299';
const TELEGRAM_HANDLE = '@marketer_for_business';

// UTM: prefer current URL query string, fall back to localStorage
const currentQs = window.location.search;
const saved: { path?: string; search?: string } | null = JSON.parse(
  localStorage.getItem('mm_utm') || 'null',
);
const utmSearch = currentQs.length > 1 ? currentQs : (saved?.search || '');
const utmLandingPath = saved?.path || window.location.pathname;
const urlParams = new URLSearchParams(utmSearch);

// --- Validation helpers ---
function showFieldError(field: HTMLElement, message: string) {
  field.classList.add('border-red-500');
  const existing = field.parentElement?.querySelector('.field-error');
  if (existing) {
    existing.textContent = message;
  } else {
    const err = document.createElement('p');
    err.className = 'field-error text-red-600 type-caption mt-1';
    err.textContent = message;
    field.insertAdjacentElement('afterend', err);
  }
}

function clearFieldError(field: HTMLElement) {
  field.classList.remove('border-red-500');
  field.parentElement?.querySelector('.field-error')?.remove();
}

function validatePhone(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return 'Введите номер телефона';
  if (/[^0-9\s()\-+.]/.test(trimmed)) return 'Телефон содержит недопустимые символы';
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < 6) return 'Номер слишком короткий';
  if (digits.length > 15) return 'Номер слишком длинный';
  return null;
}

const form = document.querySelector<HTMLFormElement>('#lead-form');

if (form) {
  const phoneInput = form.querySelector<HTMLInputElement>('#lead-phone')!;
  const consentInput = form.querySelector<HTMLInputElement>('[name="consent"]')!;
  const consentLabel = consentInput.closest('label')!;

  phoneInput.addEventListener('input', () => clearFieldError(phoneInput));
  consentInput.addEventListener('change', () => clearFieldError(consentLabel));

  form.addEventListener('submit', async (e: SubmitEvent) => {
    e.preventDefault();

    const name = (form.querySelector('#lead-name') as HTMLInputElement).value.trim();
    const phone = phoneInput.value.trim();
    const comment = (form.querySelector('#lead-comment') as HTMLTextAreaElement).value.trim();

    // Validate
    clearFieldError(phoneInput);
    clearFieldError(consentLabel);

    const phoneError = validatePhone(phone);
    if (phoneError) {
      showFieldError(phoneInput, phoneError);
      phoneInput.focus();
      return;
    }
    if (!consentInput.checked) {
      showFieldError(consentLabel, 'Необходимо дать согласие');
      return;
    }

    const btn = form.querySelector<HTMLButtonElement>('.lead-submit')!;
    const originalText = btn.textContent;
    btn.textContent = 'Отправка...';
    btn.disabled = true;

    const isResolved = (v: string | null) => v && !v.includes('{') && !v.includes('}');
    const get = (k: string) => {
      const v = urlParams.get(k);
      return isResolved(v) ? v : null;
    };

    let text = `📩 <b>Новая заявка (МодульМеталл)</b>\n\n👤 Имя: ${name}\n📱 Телефон: ${phone}`;
    if (comment) {
      text += `\n📝 Комментарий: ${comment}`;
    }
    text += `\n\n🔗 ${window.location.pathname}`;

    const source = get('utm_source');
    const medium = get('utm_medium');

    if (source) text += `\n📊 ${source}${medium ? ' / ' + medium : ''}`;

    const shown = new Set(['utm_source', 'utm_medium']);
    for (const [key, raw] of urlParams) {
      if (shown.has(key)) continue;
      if (!isResolved(raw)) continue;
      text += `\n🏷 ${key}: ${raw}`;
    }

    if (utmSearch) text += `\n\n🔗 ${utmLandingPath}${utmSearch}`;

    try {
      const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: 'HTML' }),
      });

      if (!res.ok) throw new Error('Telegram API error');

      localStorage.removeItem('mm_utm');
      if (typeof window.ym === 'function') {
        window.ym(108377413, 'reachGoal', 'lead_form_submit');
      }
      form.innerHTML =
        '<p class="text-center type-body text-green-600 font-semibold py-8">✓ Заявка отправлена! Мы&nbsp;свяжемся с&nbsp;вами в&nbsp;ближайшее время.</p>';
    } catch {
      btn.textContent = originalText;
      btn.disabled = false;

      if (!form.querySelector('.lead-error')) {
        const err = document.createElement('p');
        err.className = 'lead-error text-red-600 type-caption text-center mt-2';
        err.textContent = `Не\u00A0удалось отправить. Позвоните нам: +7\u00A0(4012) 99\u00A040\u00A040 или напишите в\u00A0Telegram: ${TELEGRAM_HANDLE}`;
        form.appendChild(err);
      }
    }
  });
}
