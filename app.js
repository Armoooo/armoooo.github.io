(() => {
  'use strict';

  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  root.classList.add('js');

  const one = (selector, scope = document) => scope.querySelector(selector);
  const all = (selector, scope = document) => [...scope.querySelectorAll(selector)];

  // Theme
  const themeButton = one('[data-theme-toggle]');
  const savedTheme = localStorage.getItem('portfolio-theme');
  if (savedTheme === 'light' || savedTheme === 'dark') root.dataset.theme = savedTheme;

  const syncThemeLabel = () => {
    if (!themeButton) return;
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    themeButton.setAttribute('aria-label', `Switch to ${next} theme`);
  };

  syncThemeLabel();
  themeButton?.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('portfolio-theme', root.dataset.theme);
    syncThemeLabel();
  });

  // Navigation
  const header = one('[data-header]');
  const menu = one('[data-menu]');
  const menuButton = one('[data-menu-button]');

  const closeMenu = () => {
    menu?.classList.remove('is-open');
    menuButton?.setAttribute('aria-expanded', 'false');
    const label = one('.sr-only', menuButton);
    if (label) label.textContent = 'Open navigation';
  };

  menuButton?.addEventListener('click', (event) => {
    event.stopPropagation();
    const open = menu?.classList.toggle('is-open') ?? false;
    menuButton.setAttribute('aria-expanded', String(open));
    const label = one('.sr-only', menuButton);
    if (label) label.textContent = open ? 'Close navigation' : 'Open navigation';
  });
  all('a', menu).forEach((link) => link.addEventListener('click', closeMenu));
  document.addEventListener('click', (event) => {
    if (menu?.classList.contains('is-open') && !menu.contains(event.target) && !menuButton?.contains(event.target)) closeMenu();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });

  // Scroll progress, header state and active section
  const progress = one('.scroll-progress span');
  const navLinks = all('.site-nav a[href^="#"]');
  const sections = navLinks
    .map((link) => one(link.getAttribute('href')))
    .filter(Boolean);

  const updateScroll = () => {
    const top = window.scrollY;
    const available = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.transform = `scaleX(${available > 0 ? Math.min(top / available, 1) : 0})`;
    header?.classList.toggle('is-scrolled', top > 18);

    const marker = top + Math.min(window.innerHeight * 0.36, 260);
    let current = sections[0]?.id;
    sections.forEach((section) => {
      if (section.offsetTop <= marker) current = section.id;
    });
    navLinks.forEach((link) => {
      const selected = link.getAttribute('href') === `#${current}`;
      link.classList.toggle('is-active', selected);
      if (selected) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };

  updateScroll();
  window.addEventListener('scroll', updateScroll, { passive: true });

  // Reveal content progressively, without hiding it from users who reduce motion.
  const revealItems = all('[data-reveal]');
  if (reducedMotion.matches || !('IntersectionObserver' in window)) {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px' });
    revealItems.forEach((item) => revealObserver.observe(item));
  }

  // CV skill explorer
  const skillsData = {
    languages: ['Go', 'C#', '.NET', 'TypeScript', 'JavaScript', 'React', 'SQL'],
    systems: ['Distributed systems', 'Concurrency', 'Microservices', 'Performance optimisation', 'Event-driven architecture', 'Idempotency'],
    cloud: ['Google Cloud', 'Cloud Run', 'Cloud Spanner', 'Cloud SQL', 'Pub/Sub', 'Docker', 'Kubernetes', 'Linux'],
    observability: ['GitHub', 'Jenkins', 'GitLab', 'CI/CD', 'Grafana', 'Prometheus', 'New Relic', 'Splunk', 'ELK'],
    data: ['PostgreSQL', 'SQL Server', 'Kafka']
  };
  const skillTabs = all('[data-skill-category]');
  const skillPanel = one('[data-skills-list]');
  const skillCount = one('[data-skill-count]');

  const setSkills = (key, moveFocus = false) => {
    const skills = skillsData[key];
    const selected = skillTabs.find((tab) => tab.dataset.skillCategory === key);
    if (!skills || !selected || !skillPanel) return;
    skillTabs.forEach((tab) => {
      const active = tab === selected;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    skillPanel.setAttribute('aria-labelledby', selected.id);
    skillPanel.classList.add('is-changing');
    window.setTimeout(() => {
      skillPanel.innerHTML = skills.map((skill) => `<span>${skill}</span>`).join('');
      if (skillCount) skillCount.textContent = `${skills.length} ${skills.length === 1 ? 'skill' : 'skills'}`;
      skillPanel.classList.remove('is-changing');
    }, reducedMotion.matches ? 0 : 100);
    if (moveFocus) selected.focus();
  };

  skillTabs.forEach((tab, index) => {
    tab.addEventListener('click', () => setSkills(tab.dataset.skillCategory));
    tab.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      let next = index;
      if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = skillTabs.length - 1;
      else if (event.key === 'ArrowLeft') next = (index - 1 + skillTabs.length) % skillTabs.length;
      else next = (index + 1) % skillTabs.length;
      setSkills(skillTabs[next].dataset.skillCategory, true);
    });
  });
  setSkills('languages');

  // Tournely product walkthrough
  const tourData = {
    entries: {
      kicker: 'Registration',
      title: 'Collect entries and availability.',
      copy: 'Players choose events, share availability and provide the details organisers need before the draw begins.',
      cards: [['01', 'Event selection', 'Singles, doubles and mixed'], ['02', 'Availability', 'Date-level constraints'], ['03', 'Entry window', 'Configurable opening and closing'], ['04', 'Admin oversight', 'One reliable player list']]
    },
    draws: {
      kicker: 'Draw management',
      title: 'Create singles and doubles draws.',
      copy: 'Organisers can seed players, manage byes and track winners through each round.',
      cards: [['01', 'Seed control', 'Place seeded entrants clearly'], ['02', 'Automatic byes', 'Handle awkward draw sizes'], ['03', 'Doubles pairs', 'Manage partners together'], ['04', 'Progression', 'Winners move through the draw']]
    },
    schedule: {
      kicker: 'Tournament scheduling',
      title: 'Schedule matches around players and courts.',
      copy: 'The schedule considers court capacity, player availability, clashes and recovery time across connected events.',
      cards: [['01', 'Court capacity', 'Availability by day and time'], ['02', 'Player constraints', 'Unavailable dates respected'], ['03', 'Clash prevention', 'Avoid overlapping matches'], ['04', 'Match spacing', 'Recovery time between rounds']]
    },
    publish: {
      kicker: 'Player experience',
      title: 'Publish the latest schedule and results.',
      copy: 'Publish draws and schedules in stages, record results and keep public player information current as the tournament changes.',
      cards: [['01', 'Staged publishing', 'Release what is ready'], ['02', 'Live schedule', 'Latest time and court'], ['03', 'Results', 'Progress the draw clearly'], ['04', 'Player pages', 'Matches and progress together']]
    }
  };

  const tourTabs = all('[data-tour]');
  const tourShell = one('[data-product-shell]');
  const setTour = (key, moveFocus = false) => {
    const data = tourData[key];
    const selected = tourTabs.find((tab) => tab.dataset.tour === key);
    if (!data || !selected) return;
    tourTabs.forEach((tab) => {
      const active = tab === selected;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    tourShell?.setAttribute('aria-labelledby', selected.id);
    tourShell?.classList.add('is-changing');
    window.setTimeout(() => {
      one('[data-tour-kicker]').textContent = data.kicker;
      one('[data-tour-title]').textContent = data.title;
      one('[data-tour-copy]').textContent = data.copy;
      one('[data-tour-grid]').innerHTML = data.cards.map(([number, title, copy]) => `<article><span>${number}</span><strong>${title}</strong><small>${copy}</small></article>`).join('');
      tourShell?.classList.remove('is-changing');
    }, reducedMotion.matches ? 0 : 120);
    if (moveFocus) selected.focus();
  };

  tourTabs.forEach((tab, index) => {
    tab.addEventListener('click', () => setTour(tab.dataset.tour));
    tab.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      let next = index;
      if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tourTabs.length - 1;
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + tourTabs.length) % tourTabs.length;
      else next = (index + 1) % tourTabs.length;
      setTour(tourTabs[next].dataset.tour, true);
    });
  });
  setTour('entries');

  // Architecture explorer
  const architectureCopy = {
    browser: 'Players use the public pages, while club organisers manage tournaments through the admin area.',
    go: 'The server-rendered Go application handles the product, authentication and scheduling logic.',
    postgres: 'PostgreSQL stores club, tournament, player, draw and schedule data.',
    stripe: 'Stripe manages subscription billing; the application never stores raw card details.',
    gcp: 'The application was deployed on managed Google Cloud services.'
  };
  const architectureButtons = all('[data-architecture]');
  const architectureCaption = one('[data-architecture-caption]');
  architectureButtons.forEach((button) => {
    button.addEventListener('click', () => {
      architectureButtons.forEach((item) => item.classList.toggle('is-active', item === button));
      if (architectureCaption) architectureCaption.textContent = architectureCopy[button.dataset.architecture];
    });
  });

  one('[data-year]').textContent = new Date().getFullYear();
})();
