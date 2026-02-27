# JURIX Ликвидация — лендинг

Одностраничный лендинг для юридической компании (ликвидация ООО).

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

### Деплой вручную через CLI

Если Git к Vercel не подключён, можно деплоить так:
```bash
vercel --prod
```
