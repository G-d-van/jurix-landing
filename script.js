document.addEventListener('alpine:init', () => {
  Alpine.store('scroll', { y: 0, rate: 0, whyVisible: false });

  const LEAD_ENDPOINT = '/api/lead';
  const LEAD_SUBJECT = 'Заявка от OOOSTOP.RU';
  const LEAD_AUTORESPONSE =
    'Спасибо за заявку на OOOSTOP.RU.\n\n' +
    'Мы получили ваше сообщение и свяжемся с вами по указанному телефону/email.\n\n' +
    'Если письмо пришло ошибочно — просто проигнорируйте его.';

  Alpine.data('landingApp', () => ({
    scrollY: 0,
    showStickyBar: false,
    modalOpen: false,
    modalTitle: 'Получить план',
    showServiceSelector: true,
    toastVisible: false,
    toastText: '',
    toastType: 'success',
    toastTimer: null,
    modalJustClosedAt: 0,
    mobileMenuOpen: false,
    formData: {
      service: '',
      situation: '',
      phone: '',
      email: ''
    },

    init() {
      const onScroll = () => {
        this.scrollY = window.scrollY;
        const docH = document.documentElement.scrollHeight - window.innerHeight;
        const rate = docH > 0 ? Math.min(1, this.scrollY / docH) : 0;
        Alpine.store('scroll').y = this.scrollY;
        Alpine.store('scroll').rate = rate;
        this.showStickyBar = rate > 0.3;
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();

      this.loadForm();
      ['service', 'situation', 'phone', 'email'].forEach(key => {
        this.$watch(`formData.${key}`, value => {
          try { localStorage.setItem('jurix_' + key, value || ''); } catch (_) {}
        });
      });

      const whyEl = document.getElementById('why');
      if (whyEl) {
        const io = new IntersectionObserver(
          ([e]) => {
            Alpine.store('scroll').whyVisible = e.isIntersecting;
          },
          { threshold: 0.2, rootMargin: '0px' }
        );
        io.observe(whyEl);
      }
    },

    loadForm() {
      ['service', 'situation', 'phone', 'email'].forEach(key => {
        try {
          const v = localStorage.getItem('jurix_' + key);
          if (v) this.formData[key] = v;
        } catch (_) {}
      });
    },

    openModal(type, preset) {
      if (Date.now() - this.modalJustClosedAt < 300) return;
      const isHeroMode = type === 'hero';
      if (preset) this.formData.service = preset;
      this.showServiceSelector = !isHeroMode;

      if (isHeroMode) {
        if (preset === 'Полная ликвидация') {
          this.modalTitle = 'Получить консультацию по официальной ликвидации';
        } else if (preset === 'Упрощенная ликвидация') {
          this.modalTitle = 'Получить консультацию по упрощенной ликвидации';
        } else if (preset === 'Затянувшаяся ликвидация') {
          this.modalTitle = 'Получить консультацию по затянувшейся ликвидации';
        } else {
          this.modalTitle = 'Получить консультацию';
        }
      } else {
        this.modalTitle = 'Получить план';
      }

      this.modalOpen = true;
    },

    closeModal() {
      this.modalOpen = false;
      this.modalJustClosedAt = Date.now();
    },

    showToast(text, type = 'success') {
      this.toastText = text;
      this.toastType = type;
      this.toastVisible = true;
      if (this.toastTimer) clearTimeout(this.toastTimer);
      this.toastTimer = setTimeout(() => {
        this.toastVisible = false;
      }, 2000);
    },

    async submitForm() {
      const email = (this.formData.email || '').trim();
      const phone = (this.formData.phone || '').trim();
      if (!email) {
        this.showToast('Укажите email — он нужен для автоответа.', 'error');
        return;
      }
      if (!phone) {
        this.showToast('Укажите телефон.', 'error');
        return;
      }

      const payload = {
        _subject: LEAD_SUBJECT,
        _autoresponse: LEAD_AUTORESPONSE,
        service: this.formData.service || '',
        situation: this.formData.situation || '',
        phone: this.formData.phone || '',
        email
      };

      try {
        const res = await fetch(LEAD_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const raw = await res.text();
        console.log('Lead API response:', res.status, raw);
        let data = null;
        try {
          data = raw ? JSON.parse(raw) : null;
        } catch (_) {
          data = null;
        }

        if (!res.ok) {
          const msg =
            (data && (data.message || data.error)) ||
            raw ||
            `Ошибка отправки (HTTP ${res.status})`;
          throw new Error(msg);
        }

        this.showToast('Заявка отправлена. Мы скоро свяжемся с вами.', 'success');
        // Close modal after toast is painted (avoids transition/stacking glitches)
        setTimeout(() => {
          this.closeModal();
        }, 50);
      } catch (e) {
        console.error(e);
        this.showToast(
          'Не удалось отправить заявку. Попробуйте еще раз через минуту.',
          'error'
        );
      }
    }
  }));

  Alpine.data('quiz', () => ({
    step: 1,
    answers: {},
    get allYes() {
      return this.step > 4 && Object.keys(this.answers).length === 4 && Object.values(this.answers).every(Boolean);
    },
    answer(i, val) {
      this.answers[i] = val;
      this.step = i < 4 ? i + 1 : 5;
    }
  }));

  Alpine.data('counterBlock', () => ({
    number: 0,
    done: false,
    init() {
      this.$watch('$store.scroll.whyVisible', (visible) => {
        if (visible && !this.done) {
          this.done = true;
          const step = 25;
          const max = 500;
          const interval = setInterval(() => {
            this.number = Math.min(this.number + step, max);
            if (this.number >= max) clearInterval(interval);
          }, 15);
        }
      });
    }
  }));
});
