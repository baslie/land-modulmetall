# План: PHP-обработчик формы для лендинга EBIS

## Контекст

Лендинг EBIS (Astro 6.1.1, static mode) нужно развернуть на shared-хостинге Beget, где есть только PHP. Форма заявки в `ContentSection.astro` (action="#") не работает — нужен бэкенд для приёма лидов и отправки на почту менеджерам.

**Ключевой факт**: Astro в static mode генерирует чистый HTML/CSS/JS в `dist/`. PHP-скрипты Astro не поддерживает нативно, но это и не нужно — HTML-форма может отправлять данные на любой URL, включая PHP-скрипт, лежащий рядом на хостинге.

**Подход**: создать отдельный PHP-скрипт для обработки формы, разместить его рядом со статическими файлами Astro на хостинге Beget.

---

## Структура файлов

```
landing/
  src/components/ContentSection.astro   ← модифицировать (action, honeypot, уведомления)
  php/                                  ← НОВАЯ директория
    api/
      send.php                          ← НОВЫЙ файл — обработчик формы
```

На хостинге Beget (public_html):
```
public_html/
  index.html          (из dist/)
  _astro/             (из dist/)
  privacy/            (из dist/)
  api/
    send.php          (из php/api/)
```

---

## Шаг 1: Создать `landing/php/api/send.php`

PHP-скрипт делает:
1. Принимает только POST-запросы (иначе 405)
2. Проверяет honeypot-поле `website` (если заполнено — бот, тихо редиректим)
3. Валидирует и санитизирует входные данные:
   - `name` — обязательно, trim, strip_tags, max 100 символов
   - `phone` — обязательно, regex `/^[\d\s\(\)\-\+]{7,20}$/`
   - `comment` — опционально, trim, strip_tags, max 1000 символов
4. Отправляет email через `mail()`:
   - Кому: `contact@baltebis.com`
   - Тема: `Новая заявка с сайта baltebis.com`
   - Тело: имя, телефон, комментарий, дата, IP клиента
   - From: `noreply@baltebis.com` (чтобы не нарушать SPF)
5. Редиректит обратно: `/?status=success` или `/?status=error`

**Почему `mail()`, а не PHPMailer**: работает из коробки на shared-хостинге Beget, не нужен Composer. Если будут проблемы с доставкой — можно перейти на PHPMailer позже.

**Почему редирект, а не AJAX**: минимум JS, надёжнее, проще для одностраничного лендинга.

---

## Шаг 2: Модифицировать `ContentSection.astro`

Файл: `landing/src/components/ContentSection.astro`

### 2.1 Изменить action формы
```html
<!-- Было: -->
<form action="#" method="POST" class="space-y-3">
<!-- Стало: -->
<form action="/api/send.php" method="POST" class="space-y-3">
```

### 2.2 Добавить honeypot-поле (сразу после `<form>`)
```html
<div style="position:absolute;left:-9999px;" aria-hidden="true">
  <input type="text" name="website" tabindex="-1" autocomplete="off" />
</div>
```

### 2.3 Добавить блок уведомления (перед формой)
Скрытый `<div id="form-status">` — показывается через JS при наличии `?status=` в URL.

### 2.4 Добавить `<script>` для показа уведомления
Читает `URLSearchParams`, показывает зелёный/красный баннер, чистит URL через `history.replaceState`.

---

## Шаг 3: Сборка и деплой

```bash
cd landing
npm run build                    # собирает dist/
# Загрузить на хостинг Beget:
# 1. Содержимое dist/ → public_html/
# 2. php/api/ → public_html/api/
```

---

## Безопасность

- **Санитизация**: `htmlspecialchars()` + `strip_tags()` для всех входных данных
- **Header injection**: пользовательские данные только в теле письма, никогда в заголовках
- **Honeypot**: скрытое поле от ботов (без внешних зависимостей типа reCAPTCHA)
- **Нет file upload**: нет вектора атаки через загрузку файлов
- **Rate limiting**: опционально добавить позже если будет спам

---

## Проверка

1. Локальный тест: `cp -r php/api dist/api && php -S localhost:8080 -t dist` → открыть форму, отправить тестовые данные
2. Проверить редирект на `/?status=success`
3. Проверить что письмо приходит на `contact@baltebis.com` (на хостинге Beget)
4. Заполнить honeypot вручную — должен быть тихий редирект без отправки
5. Отправить пустые обязательные поля — проверить серверную валидацию

---

## Критические файлы

- `landing/src/components/ContentSection.astro` — модификация формы (строки 19-59)
- `landing/php/api/send.php` — новый файл, PHP-обработчик
- `landing/astro.config.mjs` — без изменений (static mode уже настроен)
