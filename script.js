document.addEventListener('alpine:init', () => {
  Alpine.store('scroll', { y: 0, rate: 0, whyVisible: false });

  Alpine.data('landingApp', () => ({
    scrollY: 0,
    showStickyBar: false,
    modalOpen: false,
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
      if (preset) this.formData.service = preset;
      this.modalOpen = true;
    },

    submitForm() {
      console.log('Submit', this.formData);
      alert('Заявка отправлена. Мы свяжемся с вами в течение 24 часов.');
      this.modalOpen = false;
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
