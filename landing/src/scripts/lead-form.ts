/**
 * Lead form → Web3Forms handler.
 *
 * Static site (Astro SSG) on GitHub Pages — no server runtime.
 * Submissions are delivered via email through web3forms.com.
 */

const WEB3FORMS_KEY = '8e681514-70cb-47a2-a899-d3301d73a9c0';

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

    const payload: Record<string, string> = {
      access_key: WEB3FORMS_KEY,
      subject: 'Новая заявка (МодульМеталл)',
      from_name: 'МодульМеталл',
      botcheck: '',
      name,
      phone,
    };
    if (comment) payload.comment = comment;
    payload.landing_page = window.location.pathname;

    for (const [key, raw] of urlParams) {
      if (!isResolved(raw)) continue;
      payload[key] = raw;
    }
    if (utmSearch) payload.landing_url = utmLandingPath + utmSearch;

    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Web3Forms error');

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
        err.textContent = `Не\u00A0удалось отправить. Позвоните нам: +7\u00A0(4012) 99\u00A040\u00A040`;
        form.appendChild(err);
      }
    }
  });
}
