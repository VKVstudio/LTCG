/* ============================================================
   LTCG — Main JavaScript
   Lenis Smooth Scroll + GSAP ScrollTrigger + Interactions
   ============================================================ */

(function () {
  'use strict';

  // ── Проверка, что библиотеки приехали с CDN ────────────
  // Скрипты подключены без SRI и без локального фолбэка. Раньше new Lenis()
  // стоял первой строкой — при недоступности CDN падал весь скрипт целиком:
  // меню, переключатель языков, аккордеон, счётчики, якоря.
  const hasLenis = typeof Lenis !== 'undefined';
  const hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';

  // ── Lenis Smooth Scroll ────────────────────────────────
  let lenis = null;

  if (hasLenis && hasGsap) {
    lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    // Lenis драйвится ТОЛЬКО через gsap.ticker — один драйвер на кадр.
    // Собственный requestAnimationFrame-цикл здесь был лишним: lenis.raf
    // вызывался дважды за кадр, инерция отрабатывала за половину duration.
    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);
  } else {
    // Фолбэк: нативная плавная прокрутка вместо инерционной
    document.documentElement.style.scrollBehavior = 'smooth';
  }


  // ── Header Scroll ──────────────────────────────────────
  const header = document.querySelector('.header');
  let lastScroll = 0;

  function handleHeaderScroll() {
    const currentScroll = window.scrollY || document.documentElement.scrollTop;
    if (currentScroll > 60) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    lastScroll = currentScroll;
  }

  window.addEventListener('scroll', handleHeaderScroll, { passive: true });
  handleHeaderScroll();


  // ── Mobile Menu ────────────────────────────────────────
  const burger = document.querySelector('.header__burger');
  const mobileMenu = document.querySelector('.mobile-menu');
  const mobileLinks = mobileMenu.querySelectorAll('a');

  burger.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.contains('open');
    if (isOpen) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  });

  function openMobileMenu() {
    mobileMenu.classList.add('open');
    burger.classList.add('active');
    document.body.style.overflow = 'hidden';
    if (lenis) lenis.stop();
  }

  function closeMobileMenu() {
    mobileMenu.classList.remove('open');
    burger.classList.remove('active');
    document.body.style.overflow = '';
    if (lenis) lenis.start();
  }

  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      closeMobileMenu();
    });
  });


  // ── Language Switcher ──────────────────────────────────
  const langSwitcher = document.getElementById('lang-switcher');
  if (langSwitcher) {
    const langBtn = langSwitcher.querySelector('.lang-switcher__current');
    langBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      langSwitcher.classList.toggle('active');
    });
    document.addEventListener('click', () => {
      langSwitcher.classList.remove('active');
    });
    langSwitcher.querySelector('.lang-switcher__dropdown').addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }


  // ── Smooth Scroll for Anchor Links ─────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        if (lenis) {
          lenis.scrollTo(target, { offset: -72, duration: 1.2 });
        } else {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });


  // ── GSAP ScrollTrigger Animations ──────────────────────

  // Check reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Без GSAP элементы .reveal остаются с opacity:0 из CSS и страница выглядит
  // пустой. Если библиотеки не приехали — показываем контент сразу.
  if (!hasGsap) {
    document.querySelectorAll('.reveal, .reveal-scale, .reveal-left, .reveal-right')
      .forEach((el) => { el.style.opacity = '1'; el.style.transform = 'none'; });
  }

  if (!prefersReducedMotion && hasGsap) {

    // Register ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

    // ─ Reveal animations (fade up)
    gsap.utils.toArray('.reveal').forEach((el) => {
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          once: true,
        },
      });
    });

    // ─ Reveal scale animations
    gsap.utils.toArray('.reveal-scale').forEach((el) => {
      gsap.to(el, {
        opacity: 1,
        scale: 1,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          once: true,
        },
      });
    });

    // ─ Reveal left/right animations
    gsap.utils.toArray('.reveal-left, .reveal-right').forEach((el) => {
      gsap.to(el, {
        opacity: 1,
        x: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          once: true,
        },
      });
    });

    // ─ Staggered card animations
    document.querySelectorAll('.services__grid, .why__grid, .pricing__grid').forEach((grid) => {
      const cards = grid.children;
      gsap.fromTo(cards, {
        opacity: 0,
        y: 40,
      }, {
        opacity: 1,
        y: 0,
        duration: 0.7,
        stagger: 0.12,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: grid,
          start: 'top 85%',
          once: true,
        },
      });
    });

    // ─ Hero entrance animation
    const heroTl = gsap.timeline({ delay: 0.3 });
    const heroContent = document.querySelector('.hero__content');

    if (heroContent) {
      const heroElements = heroContent.children;
      heroTl.fromTo(heroElements, {
        opacity: 0,
        y: 30,
      }, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power3.out',
      });
    }

    const floatCard = document.querySelector('.hero__float-card');
    if (floatCard) {
      heroTl.fromTo(floatCard, {
        opacity: 0,
        x: 40,
        scale: 0.9,
      }, {
        opacity: 1,
        x: 0,
        scale: 1,
        duration: 0.8,
        ease: 'power3.out',
      }, '-=0.4');
    }

    // ─ Process timeline steps
    const processSteps = document.querySelectorAll('.process__step');
    processSteps.forEach((step, i) => {
      const isOdd = i % 2 === 0;
      gsap.fromTo(step, {
        opacity: 0,
        x: isOdd ? -30 : 30,
      }, {
        opacity: 1,
        x: 0,
        duration: 0.7,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: step,
          start: 'top 85%',
          once: true,
        },
      });
    });

  } // end prefersReducedMotion check


  // ── Счётчик цифр удалён вместе с секцией «достижений» ──────────────
  // 04.09.2026: 500+ клиентов, 5 лет, 98 % успешных кейсов и 3 языка не имели источника.
  // Требование клиента (31.08.2026): «все данные должны быть достоверными и весомыми».
  // Секция вернётся, когда Геворг даст настоящие числа, — вместе с этим счётчиком.

  // ── FAQ Accordion ──────────────────────────────────────
  const faqItems = document.querySelectorAll('.faq__item');

  faqItems.forEach(item => {
    const question = item.querySelector('.faq__question');
    const answer = item.querySelector('.faq__answer');
    const inner = item.querySelector('.faq__answer-inner');

    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      // Close all others
      faqItems.forEach(otherItem => {
        if (otherItem !== item) {
          otherItem.classList.remove('open');
          otherItem.querySelector('.faq__answer').style.maxHeight = '0';
        }
      });

      if (isOpen) {
        item.classList.remove('open');
        answer.style.maxHeight = '0';
      } else {
        item.classList.add('open');
        answer.style.maxHeight = inner.scrollHeight + 'px';
      }
    });
  });


  // ── Navigation Active State on Scroll ──────────────────
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.header__nav a[href^="#"]');

  if ('IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + id) {
              link.classList.add('active');
            }
          });
        }
      });
    }, {
      rootMargin: '-40% 0px -40% 0px',
      threshold: 0,
    });

    sections.forEach(section => sectionObserver.observe(section));
  }


  // ── Parallax-like subtle effect on Hero decorations ────
  if (!prefersReducedMotion) {
    const decos = document.querySelectorAll('.hero__deco');
    window.addEventListener('mousemove', (e) => {
      const { clientX, clientY } = e;
      const moveX = (clientX / window.innerWidth - 0.5) * 20;
      const moveY = (clientY / window.innerHeight - 0.5) * 20;
      decos.forEach((deco, i) => {
        const factor = (i + 1) * 0.4;
        deco.style.transform = `translate(${moveX * factor}px, ${moveY * factor}px)`;
      });
    }, { passive: true });
  }

})();
