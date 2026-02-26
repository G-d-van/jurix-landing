# JURIX Ликвидация ООО — лендинг

Статический лендинг (HTML/CSS/JS, Tailwind, Alpine.js).

## Деплой на Vercel и автопуш при `git push`

### 1. Установите Vercel CLI (если ещё нет)

```bash
npm i -g vercel
```

### 2. Подключите проект к Vercel

Из папки проекта:

```bash
cd /home/dmitry/jurix-landing
vercel
```

При первом запуске войдите в аккаунт Vercel (логин в браузере). Ответьте на вопросы:

- **Set up and deploy?** — Yes  
- **Which scope?** — ваш аккаунт  
- **Link to existing project?** — No  
- **Project name?** — например `jurix-landing` или как хотите  
- **Directory?** — `./` (Enter)

После этого проект создастся и появится ссылка на превью.

Продакшен-деплой:

```bash
vercel --prod
```

### 3. Автодеплой при `git push` (ветка master)

Автопуш при пуше в репозиторий настраивается через **Git**, а не через CLI.

1. **Создайте репозиторий на GitHub** (если ещё нет):  
   https://github.com/new  
   Имя, например: `jurix-landing`.  
   Не добавляйте README/.gitignore — репозиторий пустой.

2. **Добавьте remote и запушьте:**

```bash
cd /home/dmitry/jurix-landing
git remote add origin https://github.com/<ВАШ_ЮЗЕРНЕЙМ>/jurix-landing.git
git push -u origin master
```

3. **Подключите репозиторий к проекту в Vercel:**

   - Зайдите на https://vercel.com/dashboard  
   - Откройте проект (тот, что создали через `vercel`)  
   - **Settings** → **Git** → **Connect Git Repository**  
   - Выберите **GitHub** и репозиторий `jurix-landing`  
   - Production Branch: `master`  
   - Сохраните

После этого каждый `git push origin master` будет автоматически запускать новый деплой на Vercel.

### Одной командой (только первый деплой)

```bash
cd /home/dmitry/jurix-landing
vercel --prod
```

Дальше для автодеплоя по пушам — шаги 3.1–3.3 выше.
