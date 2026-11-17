import { PORTFOLIO_PROJECTS } from './data/projects';
import {
  DARK_SPOTLIGHT_SELECTORS,
  shouldEnableCursorSpotlight,
  stepSpotlightPosition,
  type SpotlightState,
} from './utils/darkSpotlight';
import {
  computeActiveNavSection,
  computeScrollProgress,
  toCachedSpotlightCoordinates,
  type CachedSectionEntry,
  type DocumentRect,
} from './utils/layoutGeometry';
import {
  BATCHTECH_WHATSAPP_NUMBER,
  buildWhatsAppChatUrl,
  validateContactFormValues,
} from './utils/whatsappInquiry';
import {
  shouldCloseMobileMenuOnKeyDown,
  shouldCloseMobileMenuOnOutsideInteraction,
  shouldLockScrollForMobileMenu,
  shouldUnlockScrollOnMobileMenuClose,
} from './utils/mobileMenu';

(function initBatchTechSite() {
  const MIN_PRELOADER_MS = 3500;
  const PACED_RAMP_MS = 3050;
  const HOLD_AT_100_MS = 260;
  const EXIT_PRELOADER_MS = 700;

  const preloaderEl = document.getElementById('bt-preloader');
  const preloaderFillEl = document.getElementById('bt-preloader-fill');
  const preloaderPercentEl = document.getElementById('bt-preloader-percent');

  const getNow = (): number =>
    window.performance && typeof window.performance.now === 'function'
      ? window.performance.now()
      : Date.now();

  let preloaderShownAt = 0;
  let lastProgressFrameAt = 0;
  let displayedProgress = 0;
  let lastRenderedPercent = -1;
  let minimumTimeElapsed = false;
  let pageReady = false;
  let reachedHundred = false;
  let windowLoaded = false;
  let fontsSettled = false;
  let logoSettled = false;
  let preloaderDismissStarted = false;
  let preloaderMinTimer = 0;
  let preloaderExitTimer = 0;
  let preloaderFontTimer = 0;
  let preloaderHoldTimer = 0;
  let preloaderMountRaf = 0;
  let preloaderProgressRaf = 0;

  const motionMediaQuery = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null;
  const touchOnlyMediaQuery = window.matchMedia
    ? window.matchMedia('(hover: none) and (pointer: coarse)')
    : null;

  let prefersReducedMotion = Boolean(motionMediaQuery && motionMediaQuery.matches);

  const renderProgress = (value: number) => {
    const clamped = Math.max(0, Math.min(100, value));
    const rounded = Math.round(clamped);
    if (preloaderFillEl) {
      preloaderFillEl.style.transform = `scaleX(${(clamped / 100).toFixed(4)})`;
    }
    if (preloaderPercentEl && rounded !== lastRenderedPercent) {
      lastRenderedPercent = rounded;
      preloaderPercentEl.textContent = `${rounded}%`;
    }
  };

  function cleanupPreloader() {
    window.removeEventListener('load', handleWindowLoad);
    if (preloaderEl) {
      preloaderEl.removeEventListener('transitionend', onPreloaderTransitionEnd);
    }
    if (preloaderMountRaf) {
      window.cancelAnimationFrame(preloaderMountRaf);
      preloaderMountRaf = 0;
    }
    if (preloaderProgressRaf) {
      window.cancelAnimationFrame(preloaderProgressRaf);
      preloaderProgressRaf = 0;
    }
    if (preloaderMinTimer) {
      window.clearTimeout(preloaderMinTimer);
      preloaderMinTimer = 0;
    }
    if (preloaderHoldTimer) {
      window.clearTimeout(preloaderHoldTimer);
      preloaderHoldTimer = 0;
    }
    if (preloaderExitTimer) {
      window.clearTimeout(preloaderExitTimer);
      preloaderExitTimer = 0;
    }
    if (preloaderFontTimer) {
      window.clearTimeout(preloaderFontTimer);
      preloaderFontTimer = 0;
    }
  }

  function finalizePreloaderDone() {
    document.documentElement.classList.remove('bt-preload-lock');
    if (preloaderEl) {
      preloaderEl.classList.add('is-done');
      preloaderEl.setAttribute('aria-hidden', 'true');
    }
    cleanupPreloader();
  }

  function onPreloaderTransitionEnd(event: TransitionEvent) {
    if (!preloaderEl || event.target !== preloaderEl || event.propertyName !== 'opacity') return;
    if (preloaderEl.classList.contains('is-exiting')) {
      finalizePreloaderDone();
    }
  }

  function startPreloaderExit() {
    if (preloaderDismissStarted) return;
    preloaderDismissStarted = true;
    if (!preloaderEl) {
      finalizePreloaderDone();
      return;
    }
    renderProgress(100);
    preloaderEl.classList.add('is-ready');
    const holdMs = prefersReducedMotion ? 80 : HOLD_AT_100_MS;
    preloaderHoldTimer = window.setTimeout(() => {
      document.documentElement.classList.remove('bt-preload-lock');
      preloaderEl.classList.add('is-exiting');
      preloaderEl.addEventListener('transitionend', onPreloaderTransitionEnd);
      preloaderExitTimer = window.setTimeout(
        finalizePreloaderDone,
        prefersReducedMotion ? 60 : EXIT_PRELOADER_MS + 90
      );
    }, holdMs);
  }

  function evaluatePreloaderDismissal() {
    if (preloaderDismissStarted || !minimumTimeElapsed || !pageReady || !reachedHundred) return;
    const elapsed = preloaderShownAt ? getNow() - preloaderShownAt : 0;
    if (elapsed < MIN_PRELOADER_MS) {
      minimumTimeElapsed = false;
      if (preloaderMinTimer) window.clearTimeout(preloaderMinTimer);
      preloaderMinTimer = window.setTimeout(() => {
        minimumTimeElapsed = true;
        evaluatePreloaderDismissal();
      }, Math.ceil(MIN_PRELOADER_MS - elapsed));
      return;
    }
    startPreloaderExit();
  }

  function measureResourceProgress(elapsed: number): number {
    if (pageReady) return 100;
    let score = 10;
    const eagerImages = Array.from(document.images || []).filter(
      (img) => img.getAttribute('loading') !== 'lazy'
    );
    if (eagerImages.length) {
      let loadedEager = 0;
      for (const img of eagerImages) {
        if (img.complete) loadedEager += 1;
      }
      score += (loadedEager / eagerImages.length) * 35;
    } else {
      score += 35;
    }
    if (logoSettled) score += 15;
    if (document.readyState === 'interactive' || document.readyState === 'complete') score += 8;
    if (windowLoaded) score += 14;
    if (fontsSettled) score += 12;
    const crawl = 92 - 34 * Math.exp(-elapsed / 1600);
    return Math.min(94, Math.max(score, crawl));
  }

  function computeTargetProgress(elapsed: number): number {
    if (prefersReducedMotion) {
      return pageReady ? 100 : measureResourceProgress(elapsed);
    }
    const rampFraction = Math.min(1, Math.max(0, elapsed / PACED_RAMP_MS));
    const pacedCeiling = 95 * (1 - Math.pow(1 - rampFraction, 2.1));
    if (!pageReady) {
      return Math.min(94, measureResourceProgress(elapsed), pacedCeiling);
    }
    if (elapsed < PACED_RAMP_MS) {
      return Math.min(95, pacedCeiling);
    }
    return 100;
  }

  function tickProgress() {
    if (!preloaderEl || preloaderDismissStarted) return;
    const now = getNow();
    const elapsed = preloaderShownAt ? Math.max(0, now - preloaderShownAt) : 0;
    const dt = lastProgressFrameAt ? Math.min(64, Math.max(8, now - lastProgressFrameAt)) : 16;
    lastProgressFrameAt = now;

    const target = computeTargetProgress(elapsed);
    if (prefersReducedMotion) {
      displayedProgress = target;
    } else {
      const diff = target - displayedProgress;
      if (target >= 100 && diff > 0) {
        displayedProgress = Math.min(
          100,
          displayedProgress + Math.max(diff * Math.min(1, dt * 0.015), dt * 0.022)
        );
      } else if (diff > 0) {
        displayedProgress += diff * Math.min(1, dt * 0.009);
      }
    }

    if (pageReady && target >= 100 && displayedProgress >= 99.6) {
      displayedProgress = 100;
    } else if (!pageReady && displayedProgress > 94) {
      displayedProgress = 94;
    }

    renderProgress(displayedProgress);

    if (pageReady && displayedProgress >= 100) {
      reachedHundred = true;
      evaluatePreloaderDismissal();
      return;
    }

    preloaderProgressRaf = window.requestAnimationFrame(tickProgress);
  }

  function checkPageReady() {
    if (pageReady) return;
    if (windowLoaded && fontsSettled && logoSettled) {
      pageReady = true;
      if (prefersReducedMotion) {
        displayedProgress = 100;
        renderProgress(100);
        reachedHundred = true;
      }
      evaluatePreloaderDismissal();
    }
  }

  function handleWindowLoad() {
    if (windowLoaded) return;
    windowLoaded = true;
    if (document.fonts && document.fonts.ready && typeof document.fonts.ready.then === 'function') {
      const markFontsSettled = () => {
        if (fontsSettled) return;
        fontsSettled = true;
        if (preloaderFontTimer) {
          window.clearTimeout(preloaderFontTimer);
          preloaderFontTimer = 0;
        }
        checkPageReady();
      };
      preloaderFontTimer = window.setTimeout(markFontsSettled, 1500);
      document.fonts.ready.then(markFontsSettled, markFontsSettled);
    } else {
      fontsSettled = true;
      checkPageReady();
    }
  }

  function startMinimumDisplayTimer() {
    preloaderShownAt = getNow();
    lastProgressFrameAt = preloaderShownAt;
    renderProgress(0);
    preloaderMinTimer = window.setTimeout(() => {
      minimumTimeElapsed = true;
      evaluatePreloaderDismissal();
    }, MIN_PRELOADER_MS);
    if (!prefersReducedMotion) {
      preloaderProgressRaf = window.requestAnimationFrame(tickProgress);
    }
  }

  // Track brand mark readiness passively via img.complete (zero heavy pixel loop)
  const brandLogos = Array.from(document.querySelectorAll<HTMLImageElement>('.brand__logo'));
  const preloaderLogo = document.querySelector<HTMLImageElement>('.bt-preloader__logo') || brandLogos[0];
  const markLogosReady = () => {
    for (const el of brandLogos) {
      el.classList.add('is-ready');
    }
    if (!logoSettled) {
      logoSettled = true;
      checkPageReady();
    }
  };

  if (!preloaderLogo || preloaderLogo.complete) {
    markLogosReady();
  } else {
    preloaderLogo.addEventListener('load', markLogosReady, { once: true });
    preloaderLogo.addEventListener('error', markLogosReady, { once: true });
  }

  if (preloaderEl) {
    preloaderMountRaf = window.requestAnimationFrame(() => {
      preloaderMountRaf = 0;
      startMinimumDisplayTimer();
    });
    if (document.readyState === 'complete') {
      handleWindowLoad();
    } else {
      window.addEventListener('load', handleWindowLoad, { once: true });
    }
  } else {
    document.documentElement.classList.remove('bt-preload-lock');
  }

  // Contact form -> WhatsApp launcher
  const form = document.getElementById('bt-contact-form') as HTMLFormElement | null;
  const formStatus = document.getElementById('bt-form-status');

  const showFormStatus = (type: 'info' | 'error', message: string) => {
    if (!formStatus) return;
    formStatus.className = `form-status is-visible form-status--${type}`;
    formStatus.textContent = message;
  };

  const clearFormStatus = () => {
    if (!formStatus) return;
    formStatus.className = 'form-status';
    formStatus.textContent = '';
  };

  const openWhatsAppUrl = (whatsappUrl: string) => {
    const launcher = document.createElement('a');
    launcher.href = whatsappUrl;
    launcher.target = '_blank';
    launcher.rel = 'noopener noreferrer';
    launcher.style.display = 'none';
    document.body.appendChild(launcher);
    launcher.click();
    document.body.removeChild(launcher);
  };

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const hpInput = document.getElementById('bt-website-hp') as HTMLInputElement | null;
      if (hpInput && String(hpInput.value || '').trim()) {
        return;
      }

      const nameInput = document.getElementById('full-name') as HTMLInputElement | null;
      const emailInput = document.getElementById('business-email') as HTMLInputElement | null;
      const companyInput = document.getElementById('company-name') as HTMLInputElement | null;
      const serviceInput = document.getElementById('service-required') as HTMLSelectElement | null;
      const detailsInput = document.getElementById('project-details') as HTMLTextAreaElement | null;
      const phoneInput = form.querySelector<HTMLInputElement>(
        'input[name="phone"], input[name="phoneNumber"], input[type="tel"]'
      );
      const subjectInput = form.querySelector<HTMLInputElement | HTMLSelectElement>(
        'input[name="subject"], select[name="subject"]'
      );

      const values = {
        fullName: nameInput ? String(nameInput.value || '').trim() : '',
        businessEmail: emailInput ? String(emailInput.value || '').trim() : '',
        companyName: companyInput ? String(companyInput.value || '').trim() : '',
        phoneNumber: phoneInput ? String(phoneInput.value || '').trim() : '',
        serviceRequired: serviceInput ? String(serviceInput.value || '').trim() : '',
        subject: subjectInput ? String(subjectInput.value || '').trim() : '',
        projectDetails: detailsInput ? String(detailsInput.value || '').trim() : '',
      };

      const validation = validateContactFormValues(values);
      if (!validation.valid) {
        showFormStatus('error', validation.errorMessage || 'Please review your inquiry fields.');
        const fieldMap = {
          fullName: nameInput,
          businessEmail: emailInput,
          serviceRequired: serviceInput,
          projectDetails: detailsInput,
        } as const;
        if (validation.errorField && fieldMap[validation.errorField]) {
          fieldMap[validation.errorField]?.focus();
        }
        return;
      }

      clearFormStatus();
      const whatsappUrl = buildWhatsAppChatUrl(values, BATCHTECH_WHATSAPP_NUMBER);
      openWhatsAppUrl(whatsappUrl);
    });
  }

  // Portfolio Project Modal
  const modalEl = document.getElementById('project-modal');
  const modalDialog = modalEl ? modalEl.querySelector<HTMLElement>('.pmodal__dialog') : null;
  const modalCat = document.getElementById('pmodal-cat');
  const modalTitle = document.getElementById('pmodal-title');
  const modalPicture = document.getElementById('pmodal-picture');
  const modalSummary = document.getElementById('pmodal-summary');
  const modalTags = document.getElementById('pmodal-tags');
  const modalOverview = document.getElementById('pmodal-overview');
  const modalDirection = document.getElementById('pmodal-direction');
  const modalFeatures = document.getElementById('pmodal-features');
  const modalServices = document.getElementById('pmodal-services');
  const modalCatNote = document.getElementById('pmodal-category-note');
  const modalPrev = document.getElementById('pmodal-prev');
  const modalNext = document.getElementById('pmodal-next');
  const modalClose = document.getElementById('pmodal-close');
  const modalCta = document.getElementById('pmodal-cta');
  const projectCards = Array.from(document.querySelectorAll<HTMLElement>('.card[data-project-index]'));
  let currentProjectIndex = 0;
  let lastFocusedBeforeModal: HTMLElement | null = null;

  function renderProjectModal(index: number) {
    const safeIndex =
      ((index % PORTFOLIO_PROJECTS.length) + PORTFOLIO_PROJECTS.length) % PORTFOLIO_PROJECTS.length;
    currentProjectIndex = safeIndex;
    const project = PORTFOLIO_PROJECTS[safeIndex];
    if (!project) return;

    if (modalEl) {
      modalEl.setAttribute('data-accent', project.accent || 'blue');
    }
    if (modalCat) modalCat.textContent = project.category;
    if (modalTitle) modalTitle.textContent = project.title;
    if (modalPicture) {
      modalPicture.innerHTML = '';
      const avifSource = document.createElement('source');
      avifSource.type = 'image/avif';
      avifSource.sizes = '(max-width: 1140px) 92vw, 1020px';
      avifSource.srcset = `${project.imageBase}-480.avif 480w, ${project.imageBase}-800.avif 800w, ${project.imageBase}-1376.avif 1376w`;

      const webpSource = document.createElement('source');
      webpSource.type = 'image/webp';
      webpSource.sizes = '(max-width: 1140px) 92vw, 1020px';
      webpSource.srcset = `${project.imageBase}-480.webp 480w, ${project.imageBase}-800.webp 800w, ${project.imageBase}-1376.webp 1376w`;

      const img = document.createElement('img');
      img.id = 'pmodal-img';
      img.srcset = `${project.imageBase}-800.jpg 800w, ${project.imageBase}-1376.jpg 1376w`;
      img.sizes = '(max-width: 1140px) 92vw, 1020px';
      img.src = `${project.imageBase}-1376.jpg`;
      img.alt = project.alt;
      img.width = 1376;
      img.height = 768;
      img.decoding = 'async';

      modalPicture.appendChild(avifSource);
      modalPicture.appendChild(webpSource);
      modalPicture.appendChild(img);
    }
    if (modalSummary) modalSummary.textContent = project.summary;
    if (modalOverview) modalOverview.textContent = project.overview;
    if (modalDirection) modalDirection.textContent = project.direction;
    if (modalCatNote) modalCatNote.textContent = project.categoryNote;

    if (modalTags) {
      modalTags.innerHTML = '';
      for (const tagText of project.tags) {
        const span = document.createElement('span');
        span.className = 'tag';
        span.textContent = tagText;
        modalTags.appendChild(span);
      }
    }
    if (modalFeatures) {
      modalFeatures.innerHTML = '';
      for (const item of project.features) {
        const li = document.createElement('li');
        li.textContent = item;
        modalFeatures.appendChild(li);
      }
    }
    if (modalServices) {
      modalServices.innerHTML = '';
      for (const item of project.services) {
        const li = document.createElement('li');
        li.textContent = item;
        modalServices.appendChild(li);
      }
    }
  }

  function lockBodyScroll() {
    const scrollbarGap = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    if (scrollbarGap > 0) {
      document.body.style.paddingRight = `${scrollbarGap}px`;
    }
  }

  function unlockBodyScroll() {
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  }

  function openProjectModal(index: number, triggerEl: HTMLElement | null) {
    if (!modalEl) return;
    lastFocusedBeforeModal = triggerEl || (document.activeElement as HTMLElement | null);
    renderProjectModal(index);
    lockBodyScroll();
    modalEl.scrollTop = 0;
    modalEl.classList.add('is-open');
    modalEl.setAttribute('aria-hidden', 'false');
    deactivateAllSpotlights();
    window.requestAnimationFrame(() => {
      if (modalClose) modalClose.focus({ preventScroll: true });
    });
  }

  function closeProjectModal(restoreFocus?: boolean) {
    if (!modalEl || !modalEl.classList.contains('is-open')) return;
    modalEl.classList.remove('is-open');
    modalEl.setAttribute('aria-hidden', 'true');
    unlockBodyScroll();
    if (
      restoreFocus !== false &&
      lastFocusedBeforeModal &&
      typeof lastFocusedBeforeModal.focus === 'function'
    ) {
      lastFocusedBeforeModal.focus({ preventScroll: true });
    }
    lastFocusedBeforeModal = null;
  }

  function stepProject(delta: number) {
    renderProjectModal(currentProjectIndex + delta);
    if (modalEl) modalEl.scrollTop = 0;
  }

  for (const card of projectCards) {
    const idx = parseInt(card.getAttribute('data-project-index') || '0', 10);
    card.addEventListener('click', () => openProjectModal(idx, card));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openProjectModal(idx, card);
      }
    });
  }

  if (modalPrev) modalPrev.addEventListener('click', () => stepProject(-1));
  if (modalNext) modalNext.addEventListener('click', () => stepProject(1));
  if (modalClose) modalClose.addEventListener('click', () => closeProjectModal(true));
  if (modalCta) modalCta.addEventListener('click', () => closeProjectModal(false));
  if (modalEl) {
    modalEl.addEventListener('click', (e) => {
      if (e.target === modalEl) closeProjectModal(true);
    });
  }

  function onModalKeyDown(e: KeyboardEvent) {
    if (!modalEl || !modalEl.classList.contains('is-open')) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      closeProjectModal(true);
      return;
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      stepProject(-1);
      return;
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      stepProject(1);
      return;
    }
    if (e.key === 'Tab' && modalDialog) {
      const focusables = Array.from(
        modalDialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
        )
      );
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  // Navigation, mobile drawer lifecycle, cached geometry & zero-reflow scroll tracking
  const navHeader = document.querySelector('.nav');
  const navToggle = document.getElementById('navtoggle') as HTMLInputElement | null;
  const navLinksContainer = document.querySelector<HTMLElement>('.nav__links');
  const navBurger = document.querySelector<HTMLElement>('.nav__burger');
  const navLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>('.nav__links a'));
  let lastActiveNavHash = '';

  function isMobileMenuOpen(): boolean {
    return Boolean(navToggle && navToggle.checked);
  }

  function isProjectModalOpen(): boolean {
    return Boolean(modalEl && modalEl.classList.contains('is-open'));
  }

  function syncMobileMenuScrollLock() {
    if (shouldLockScrollForMobileMenu(isMobileMenuOpen(), window.innerWidth)) {
      lockBodyScroll();
    } else if (shouldUnlockScrollOnMobileMenuClose(isProjectModalOpen())) {
      unlockBodyScroll();
    }
  }

  function closeMobileMenu(options?: { restoreFocus?: boolean }) {
    if (!navToggle || !navToggle.checked) return;
    navToggle.checked = false;
    syncMobileMenuScrollLock();
    if (options?.restoreFocus) {
      navToggle.focus({ preventScroll: true });
    }
  }

  function onNavToggleChange() {
    if (isMobileMenuOpen() && window.innerWidth > 820 && navToggle) {
      navToggle.checked = false;
    }
    syncMobileMenuScrollLock();
  }

  function onDocumentMenuOutsideEvent(event: Event) {
    if (!isMobileMenuOpen()) return;
    const target = event.target as HTMLElement | null;
    const targetInsideMenu = Boolean(target && navLinksContainer && navLinksContainer.contains(target));
    const targetInsideToggle = Boolean(
      target &&
        ((navBurger && navBurger.contains(target)) || (navToggle && target === navToggle))
    );
    if (
      shouldCloseMobileMenuOnOutsideInteraction({
        isMenuOpen: true,
        targetInsideMenu,
        targetInsideToggle,
      })
    ) {
      closeMobileMenu();
    }
  }

  function onMenuKeyDown(e: KeyboardEvent) {
    if (isProjectModalOpen()) return;
    if (shouldCloseMobileMenuOnKeyDown(isMobileMenuOpen(), e.key)) {
      e.preventDefault();
      closeMobileMenu({ restoreFocus: true });
    }
  }

  function setActiveNav(hash: string) {
    if (hash === lastActiveNavHash) return;
    lastActiveNavHash = hash;
    for (const link of navLinks) {
      const isMatch = link.getAttribute('href') === hash;
      link.classList.toggle('is-active', isMatch);
      if (isMatch) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    }
  }

  function onNavLinkClick(this: HTMLAnchorElement) {
    const href = this.getAttribute('href');
    if (href) setActiveNav(href);
    closeMobileMenu();
  }

  const trackedIds = ['#top', '#about', '#services', '#work', '#process', '#contact'];
  const trackedSectionEls = trackedIds
    .map((id) => ({ id, el: document.querySelector<HTMLElement>(id) }))
    .filter((entry): entry is { id: string; el: HTMLElement } => Boolean(entry.el));

  let cachedSections: CachedSectionEntry[] = [];
  let cachedScrollHeight = 0;
  let cachedViewportHeight = 0;

  // Scroll Progress Indicator
  const scrollProgressBtn = document.getElementById('bt-scroll-progress');
  const scrollProgressArc = document.getElementById('bt-scroll-progress-arc') as SVGCircleElement | null;
  const scrollProgressLabel = document.getElementById('bt-scroll-progress-label');
  const scrollProgressRadius = 23;
  const scrollProgressCircumference = 2 * Math.PI * scrollProgressRadius;
  let lastProgressPercent = -1;

  if (scrollProgressArc) {
    scrollProgressArc.style.strokeDasharray = scrollProgressCircumference.toFixed(3);
  }

  function updateScrollProgress(scrollTop: number) {
    if (!scrollProgressBtn || !scrollProgressArc || !scrollProgressLabel || !cachedScrollHeight) return;
    const progress = computeScrollProgress(
      scrollTop,
      cachedScrollHeight,
      cachedViewportHeight,
      scrollProgressCircumference
    );
    scrollProgressArc.style.strokeDashoffset = progress.dashOffset.toFixed(2);
    if (progress.percent !== lastProgressPercent) {
      lastProgressPercent = progress.percent;
      scrollProgressLabel.textContent = `${progress.percent}%`;
    }
  }

  function onScrollProgressClick() {
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  }

  function updateNavScrollState(scrollY: number) {
    if (navHeader) {
      navHeader.classList.toggle('is-scrolled', scrollY > 50);
    }
    if (!cachedSections.length) return;
    const activeHash = computeActiveNavSection(scrollY, cachedSections);
    setActiveNav(activeHash);
  }

  // Scroll-Triggered Section Reveals (Batched read -> write)
  const revealTargets: HTMLElement[] = [];
  const revealTimers: number[] = [];
  let revealObserver: IntersectionObserver | null = null;

  const registerRevealGroup = (
    selector: string,
    type: 'up' | 'fade' | 'scale' | 'media',
    staggerFn?: (index: number) => number
  ) => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>(selector));
    nodes.forEach((node, index) => {
      if (!node.hasAttribute('data-reveal')) {
        node.setAttribute('data-reveal', type || 'up');
        const delay = typeof staggerFn === 'function' ? staggerFn(index) : 0;
        if (delay > 0) {
          node.style.setProperty('--reveal-delay', `${delay}ms`);
        }
        revealTargets.push(node);
      }
    });
  };

  registerRevealGroup('#about .stat', 'up', (i) => i * 75);
  registerRevealGroup(
    'main > section:not(.hero) .shead > div:first-child, .collab__head > div:first-child, .process__copy .kicker, .process__copy h2, .contact__eyebrow, .contact__title, .foot__cta h2',
    'up'
  );
  registerRevealGroup(
    'main > section:not(.hero) .shead__p, .process__lead, .contact__lead, .foot__cta .btn',
    'fade',
    () => 90
  );
  registerRevealGroup('.caplist .cap', 'up', (i) => i * 70);
  registerRevealGroup('.work__grid .card', 'scale', (i) => (i % 3) * 80 + Math.floor(i / 3) * 65);
  registerRevealGroup('.diff__list .diff__row', 'up', (i) => i * 70);
  registerRevealGroup('.process__media', 'media', () => 100);
  registerRevealGroup('.timeline .timeline__step', 'up', (i) => i * 85);
  registerRevealGroup('.collab__media', 'media', () => 60);
  registerRevealGroup('.collab__list .collab__item', 'up', (i) => i * 80);
  registerRevealGroup('.faq__list .faq__item', 'up', (i) => i * 55);
  registerRevealGroup('.contact__details', 'up');
  registerRevealGroup('.contact__form-wrap', 'up', () => 110);
  registerRevealGroup('.foot__cols', 'up', () => 60);
  registerRevealGroup('.foot__bar', 'fade', () => 100);

  function markRevealSettled(target: HTMLElement) {
    if (target.classList.contains('is-settled')) return;
    const delayMs = parseInt(target.style.getPropertyValue('--reveal-delay') || '0', 10) || 0;
    const timer = window.setTimeout(() => {
      target.classList.add('is-settled');
      target.style.willChange = 'auto';
    }, 900 + delayMs);
    revealTimers.push(timer);
  }

  function revealElementOnce(target: HTMLElement) {
    if (target.classList.contains('is-revealed')) return;
    target.classList.add('is-revealed');
    if (revealObserver) revealObserver.unobserve(target);
    markRevealSettled(target);
  }

  function revealVisibleOrPassed() {
    const thresholdY = cachedViewportHeight * 0.94;
    // Batch all DOM reads BEFORE any class mutations to eliminate forced reflows
    const toReveal: HTMLElement[] = [];
    for (const target of revealTargets) {
      if (target.classList.contains('is-revealed')) continue;
      if (target.getBoundingClientRect().top <= thresholdY) {
        toReveal.push(target);
      }
    }
    for (const target of toReveal) {
      revealElementOnce(target);
    }
  }

  function setupSectionReveals() {
    if (!revealTargets.length) return;
    if (prefersReducedMotion || typeof window.IntersectionObserver !== 'function') {
      for (const target of revealTargets) {
        target.classList.add('is-revealed', 'is-settled');
      }
      return;
    }
    document.documentElement.classList.add('bt-reveal-ready');
    if (revealObserver) {
      revealObserver.disconnect();
    }
    revealObserver = new window.IntersectionObserver(
      (entries) => {
        const vh = window.innerHeight || 0;
        for (const entry of entries) {
          if (entry.isIntersecting || entry.boundingClientRect.top <= vh * 0.94) {
            revealElementOnce(entry.target as HTMLElement);
          }
        }
      },
      {
        threshold: 0.06,
        rootMargin: '0px 0px -32px 0px',
      }
    );
    for (const target of revealTargets) {
      if (!target.classList.contains('is-revealed')) {
        revealObserver.observe(target);
      }
    }
  }

  // Dark-Section Interactive Blue Spotlight
  interface DarkSpotlightItem extends SpotlightState {
    section: HTMLElement;
    layer: HTMLElement;
    docRect: DocumentRect;
  }

  const darkSpotlights: DarkSpotlightItem[] = [];
  let spotlightRafId = 0;
  let lastSpotlightFrameAt = 0;
  let lastPointerClientX: number | null = null;
  let lastPointerClientY: number | null = null;
  let pointerInViewport = false;

  const isTouchOnlyDevice = (): boolean => {
    if (touchOnlyMediaQuery && touchOnlyMediaQuery.matches) return true;
    if (
      window.matchMedia &&
      window.matchMedia('(pointer: coarse)').matches &&
      !window.matchMedia('(any-pointer: fine)').matches
    ) {
      return true;
    }
    return false;
  };

  const isSpotlightAllowed = (pointerType?: string): boolean =>
    shouldEnableCursorSpotlight({
      pointerType,
      prefersReducedMotion,
      isTouchOnlyDevice: isTouchOnlyDevice(),
      modalOpen: Boolean(modalEl && modalEl.classList.contains('is-open')),
    });

  function ensureDarkSpotlights() {
    if (darkSpotlights.length || isTouchOnlyDevice()) return;
    for (const selector of DARK_SPOTLIGHT_SELECTORS) {
      const section = document.querySelector<HTMLElement>(selector);
      if (!section) continue;
      let layer = section.querySelector<HTMLElement>(':scope > .bt-spotlight');
      if (!layer) {
        layer = document.createElement('span');
        layer.className = 'bt-spotlight';
        layer.setAttribute('aria-hidden', 'true');
        section.insertBefore(layer, section.firstChild);
      }
      darkSpotlights.push({
        section,
        layer,
        active: false,
        initialized: false,
        currentX: 0,
        currentY: 0,
        targetX: 0,
        targetY: 0,
        docRect: { docLeft: 0, docTop: 0, width: 0, height: 0 },
      });
    }
  }

  function refreshLayoutCache() {
    const scrollX = window.scrollX || window.pageXOffset || 0;
    const scrollY = window.scrollY || window.pageYOffset || 0;
    cachedViewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
    cachedScrollHeight = document.documentElement.scrollHeight;

    cachedSections = trackedSectionEls.map((entry) => ({
      id: entry.id,
      docTop: entry.el.getBoundingClientRect().top + scrollY,
    }));

    for (const item of darkSpotlights) {
      const r = item.section.getBoundingClientRect();
      item.docRect = {
        docLeft: r.left + scrollX,
        docTop: r.top + scrollY,
        width: r.width,
        height: r.height,
      };
    }
  }

  let layoutCacheRaf = 0;
  function scheduleLayoutCacheRefresh() {
    if (layoutCacheRaf) return;
    layoutCacheRaf = window.requestAnimationFrame(() => {
      layoutCacheRaf = 0;
      refreshLayoutCache();
      const currentY = window.scrollY || window.pageYOffset || 0;
      updateNavScrollState(currentY);
      updateScrollProgress(currentY);
    });
  }

  function deactivateAllSpotlights() {
    for (const item of darkSpotlights) {
      if (item.active) {
        item.active = false;
        item.layer.classList.remove('is-active');
      }
    }
  }

  function stepDarkSpotlights(now: number) {
    spotlightRafId = 0;
    if (!isSpotlightAllowed()) {
      deactivateAllSpotlights();
      return;
    }
    const dt = lastSpotlightFrameAt ? Math.min(64, Math.max(1, now - lastSpotlightFrameAt)) : 16;
    lastSpotlightFrameAt = now;
    let needsNextFrame = false;

    for (const item of darkSpotlights) {
      if (!item.active && !item.initialized) continue;
      const result = stepSpotlightPosition(item, dt);
      item.currentX = result.state.currentX;
      item.currentY = result.state.currentY;
      item.initialized = result.state.initialized;
      if (!result.settled && item.active) {
        needsNextFrame = true;
      }
      item.layer.style.transform = `translate3d(${item.currentX.toFixed(2)}px,${item.currentY.toFixed(2)}px,0)`;
    }

    if (needsNextFrame && !spotlightRafId) {
      spotlightRafId = window.requestAnimationFrame(stepDarkSpotlights);
    }
  }

  function scheduleSpotlightFrame() {
    if (!spotlightRafId) {
      lastSpotlightFrameAt = getNow();
      spotlightRafId = window.requestAnimationFrame(stepDarkSpotlights);
    }
  }

  function syncSpotlightAtPoint(clientX: number | null, clientY: number | null) {
    if (!isSpotlightAllowed() || clientX === null || clientY === null) {
      deactivateAllSpotlights();
      return;
    }
    if (!darkSpotlights.length) {
      ensureDarkSpotlights();
      refreshLayoutCache();
    }
    const scrollX = window.scrollX || window.pageXOffset || 0;
    const scrollY = window.scrollY || window.pageYOffset || 0;
    let matchedAny = false;

    for (const item of darkSpotlights) {
      const coords = toCachedSpotlightCoordinates(
        clientX,
        clientY,
        scrollX,
        scrollY,
        item.docRect
      );
      if (coords.inside) {
        matchedAny = true;
        item.targetX = coords.x;
        item.targetY = coords.y;
        if (!item.active) {
          item.currentX = coords.x;
          item.currentY = coords.y;
          item.initialized = true;
          item.layer.style.transform = `translate3d(${coords.x.toFixed(2)}px,${coords.y.toFixed(2)}px,0)`;
          item.active = true;
          item.layer.classList.add('is-active');
        }
      } else if (item.active) {
        item.active = false;
        item.layer.classList.remove('is-active');
      }
    }

    if (matchedAny) {
      scheduleSpotlightFrame();
    }
  }

  function onDocumentPointerMove(e: PointerEvent) {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    pointerInViewport = true;
    lastPointerClientX = e.clientX;
    lastPointerClientY = e.clientY;
    syncSpotlightAtPoint(lastPointerClientX, lastPointerClientY);
  }

  function onDocumentPointerLeave() {
    pointerInViewport = false;
    deactivateAllSpotlights();
  }

  function onTouchInteraction() {
    pointerInViewport = false;
    lastPointerClientX = null;
    lastPointerClientY = null;
    deactivateAllSpotlights();
  }

  function onSpotlightPreferenceChange() {
    prefersReducedMotion = Boolean(motionMediaQuery && motionMediaQuery.matches);
    if (!isSpotlightAllowed()) {
      deactivateAllSpotlights();
      if (spotlightRafId) {
        window.cancelAnimationFrame(spotlightRafId);
        spotlightRafId = 0;
      }
    }
  }

  let ticking = false;
  let rafId = 0;
  let layoutObserver: ResizeObserver | null = null;

  function onScroll() {
    if (!ticking) {
      ticking = true;
      rafId = window.requestAnimationFrame(() => {
        if (!cachedScrollHeight) {
          refreshLayoutCache();
        }
        const scrollY = window.scrollY || window.pageYOffset || 0;
        updateNavScrollState(scrollY);
        updateScrollProgress(scrollY);
        if (pointerInViewport && lastPointerClientX !== null && lastPointerClientY !== null) {
          syncSpotlightAtPoint(lastPointerClientX, lastPointerClientY);
        }
        ticking = false;
      });
    }
  }

  function onResize() {
    if (isMobileMenuOpen() && window.innerWidth > 820) {
      closeMobileMenu();
    }
    scheduleLayoutCacheRefresh();
    onScroll();
  }

  function attachPageListeners() {
    window.removeEventListener('scroll', onScroll);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.removeEventListener('resize', onResize);
    window.addEventListener('resize', onResize, { passive: true });
    document.removeEventListener('keydown', onModalKeyDown);
    document.addEventListener('keydown', onModalKeyDown);
    document.removeEventListener('keydown', onMenuKeyDown);
    document.addEventListener('keydown', onMenuKeyDown);
    document.removeEventListener('pointerdown', onDocumentMenuOutsideEvent, true);
    document.addEventListener('pointerdown', onDocumentMenuOutsideEvent, true);
    document.removeEventListener('click', onDocumentMenuOutsideEvent, true);
    document.addEventListener('click', onDocumentMenuOutsideEvent, true);
    document.removeEventListener('pointermove', onDocumentPointerMove);
    document.addEventListener('pointermove', onDocumentPointerMove, { passive: true });
    document.removeEventListener('mouseleave', onDocumentPointerLeave);
    document.addEventListener('mouseleave', onDocumentPointerLeave, { passive: true });
    document.removeEventListener('touchstart', onTouchInteraction);
    document.addEventListener('touchstart', onTouchInteraction, { passive: true });

    if (navToggle) {
      navToggle.removeEventListener('change', onNavToggleChange);
      navToggle.addEventListener('change', onNavToggleChange);
    }
    for (const link of navLinks) {
      link.removeEventListener('click', onNavLinkClick);
      link.addEventListener('click', onNavLinkClick);
    }

    if (motionMediaQuery && typeof motionMediaQuery.addEventListener === 'function') {
      motionMediaQuery.removeEventListener('change', onSpotlightPreferenceChange);
      motionMediaQuery.addEventListener('change', onSpotlightPreferenceChange);
    }
    if (scrollProgressBtn) {
      scrollProgressBtn.removeEventListener('click', onScrollProgressClick);
      scrollProgressBtn.addEventListener('click', onScrollProgressClick);
    }

    window.requestAnimationFrame(() => {
      ensureDarkSpotlights();
      setupSectionReveals();
      scheduleLayoutCacheRefresh();
    });

    if (typeof window.ResizeObserver === 'function') {
      if (layoutObserver) layoutObserver.disconnect();
      layoutObserver = new window.ResizeObserver(() => {
        scheduleLayoutCacheRefresh();
      });
      layoutObserver.observe(document.body);
    }
  }

  function cleanupPageListeners() {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onResize);
    document.removeEventListener('keydown', onModalKeyDown);
    document.removeEventListener('keydown', onMenuKeyDown);
    document.removeEventListener('pointerdown', onDocumentMenuOutsideEvent, true);
    document.removeEventListener('click', onDocumentMenuOutsideEvent, true);
    document.removeEventListener('pointermove', onDocumentPointerMove);
    document.removeEventListener('mouseleave', onDocumentPointerLeave);
    document.removeEventListener('touchstart', onTouchInteraction);
    if (navToggle) {
      navToggle.removeEventListener('change', onNavToggleChange);
    }
    for (const link of navLinks) {
      link.removeEventListener('click', onNavLinkClick);
    }
    if (motionMediaQuery && typeof motionMediaQuery.removeEventListener === 'function') {
      motionMediaQuery.removeEventListener('change', onSpotlightPreferenceChange);
    }
    if (scrollProgressBtn) {
      scrollProgressBtn.removeEventListener('click', onScrollProgressClick);
    }
    if (layoutObserver) {
      layoutObserver.disconnect();
      layoutObserver = null;
    }
    if (layoutCacheRaf) {
      window.cancelAnimationFrame(layoutCacheRaf);
      layoutCacheRaf = 0;
    }
    if (revealObserver) {
      revealObserver.disconnect();
      revealObserver = null;
    }
    if (revealTimers.length) {
      revealTimers.forEach((t) => window.clearTimeout(t));
      revealTimers.length = 0;
    }
    cleanupPreloader();
    if (spotlightRafId) {
      window.cancelAnimationFrame(spotlightRafId);
      spotlightRafId = 0;
    }
    if (rafId) {
      window.cancelAnimationFrame(rafId);
      rafId = 0;
      ticking = false;
    }
  }

  attachPageListeners();
  window.addEventListener('load', scheduleLayoutCacheRefresh, { once: true });
  window.addEventListener('hashchange', revealVisibleOrPassed);
  window.addEventListener('pagehide', cleanupPageListeners);
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      finalizePreloaderDone();
      attachPageListeners();
    }
  });
})();
