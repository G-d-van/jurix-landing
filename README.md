# JURIX Ликвидация — лендинг

Одностраничный лендинг для юридической компании (ликвидация ООО).

## CSS (Tailwind)

Tailwind подключён **локально** (без CDN). Стили собираются в `dist/tailwind.css`.

Локально:

```bash
cd /home/dmitry/jurix-landing
npm ci
npm run build:css
```

На Vercel сборка запускается автоматически через `vercel.json` (`installCommand` + `buildCommand`).

## Заявки (FormSubmit)

Отправка заявок настроена через **FormSubmit** на адрес `3630013@mail.ru`.

Перед первым использованием нужно **один раз подтвердить** получателя у FormSubmit:

1. Откройте сайт и отправьте тестовую заявку (с реальным email в поле Email).
2. На `3630013@mail.ru` придёт письмо от FormSubmit с подтверждением — подтвердите.
3. Повторите отправку — после этого заявки должны стабильно доходить.

Автоответ клиенту отправляется на email из формы (если email не заполнен — отправка не стартует).

## Деплой на Vercel

### Первая настройка (один раз)

1. **Авторизация в Vercel**
   ```bash
   vercel login
   ```
   Откроется браузер для входа (GitHub/GitLab/Email).

2. **Привязать проект к Vercel**
   ```bash
   cd /home/dmitry/jurix-landing
   vercel link
   ```
   - Выберите или создайте аккаунт/команду.
   - Project name: например `jurix-liquidation` или оставьте предложенный.
   - Directory: `.` (текущая папка).

3. **Первый деплой**
   ```bash
   vercel --prod
   ```
   После выполнения в терминале появится ссылка на сайт (например `https://jurix-liquidation.vercel.app`).

### Автодеплой при `git push` (ветка master)

Чтобы каждый `git push` в `master` автоматически обновлял сайт на Vercel:

1. **Создайте репозиторий на GitHub** (если ещё нет):  
   https://github.com/new → имя репозитория, например `jurix-landing`.

2. **Добавьте remote и запушьте**
   ```bash
   cd /home/dmitry/jurix-landing
   git remote add origin https://github.com/ВАШ_ЛОГИН/jurix-landing.git
   git push -u origin master
   ```

3. **Подключите репозиторий в Vercel**
   - Зайдите на https://vercel.com/dashboard
   - Откройте проект (тот, что создали через `vercel link`)
   - **Settings** → **Git** → **Connect Git Repository**
   - Выберите GitHub и репозиторий `jurix-landing`
   - Production Branch: `master`
   - Сохраните

После этого каждый `git push origin master` будет запускать новый деплой на Vercel.

### Кастомный домен (DNS на Beget)

Vercel сам по себе не меняет DNS у регистратора: вы добавляете домен в Vercel, а в панели Beget выставляете те записи, которые Vercel покажет как **Required** для верификации и маршрутизации.

Рекомендуемый порядок:

1. В Vercel: **Project → Settings → Domains** → **Add** → `ooostop.ru` и (желательно) `www.ooostop.ru`.
2. Скопируйте из интерфейса Vercel список **DNS records** (A/CNAME/TXT) и пришлите сюда — я сверю с текущими записями на Beget и скажу, что именно менять, чтобы не сломать почту/поддомены.
3. После применения записей в Beget дождитесь статуса **Valid** в Vercel (иногда до нескольких часов из‑за TTL).

### Деплой вручную через CLI

Если Git к Vercel не подключён, можно деплоить так:
```bash
vercel --prod
```
