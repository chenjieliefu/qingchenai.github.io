const menuButton = document.querySelector('.menu-toggle');
const primaryNav = document.querySelector('#primary-nav');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (menuButton && primaryNav) {
  const menuLabel = menuButton.querySelector('.menu-label');
  const setMenuState = (isOpen) => {
    menuButton.setAttribute('aria-expanded', String(isOpen));
    primaryNav.dataset.open = String(isOpen);
    if (menuLabel) menuLabel.textContent = isOpen ? '关闭' : '菜单';
  };

  menuButton.addEventListener('click', () => {
    setMenuState(menuButton.getAttribute('aria-expanded') !== 'true');
  });

  primaryNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setMenuState(false));
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
      setMenuState(false);
      menuButton.focus();
    }
  });
}

document.querySelectorAll('[data-current-year]').forEach((item) => {
  item.textContent = String(new Date().getFullYear());
});

const wechatToggle = document.querySelector('[data-wechat-toggle]');
const wechatNote = document.querySelector('[data-wechat-note]');
const wechatClose = document.querySelector('[data-wechat-close]');
const wechatPage = wechatNote?.closest('.contact-right');

const setWechatNoteState = (isOpen, restoreFocus = false) => {
  if (!wechatToggle || !wechatNote || !wechatPage) return;
  wechatToggle.setAttribute('aria-expanded', String(isOpen));
  wechatNote.setAttribute('aria-hidden', String(!isOpen));
  wechatPage.classList.toggle('is-wechat-open', isOpen);
  if (isOpen) {
    wechatNote.removeAttribute('inert');
  } else {
    wechatNote.setAttribute('inert', '');
    if (restoreFocus) wechatToggle.focus({ preventScroll: true });
  }
};

if (wechatToggle && wechatNote && wechatClose && wechatPage) {
  wechatToggle.addEventListener('click', () => {
    const isOpen = wechatToggle.getAttribute('aria-expanded') !== 'true';
    setWechatNoteState(isOpen);
  });

  wechatClose.addEventListener('click', () => setWechatNoteState(false, true));

  document.addEventListener('pointerdown', (event) => {
    if (wechatToggle.getAttribute('aria-expanded') !== 'true') return;
    if (wechatNote.contains(event.target) || wechatToggle.contains(event.target)) return;
    setWechatNoteState(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || wechatToggle.getAttribute('aria-expanded') !== 'true') return;
    setWechatNoteState(false, true);
  });
}

const notebook = document.querySelector('[data-notebook]');

if (notebook) {
  const coverView = notebook.querySelector('[data-cover-view]');
  const readerView = notebook.querySelector('[data-reader-view]');
  const openButton = notebook.querySelector('[data-open-book]');
  const prevButton = notebook.querySelector('[data-prev-page]');
  const nextButton = notebook.querySelector('[data-next-page]');
  const prevLabel = notebook.querySelector('[data-prev-label]');
  const currentLabel = notebook.querySelector('[data-page-current]');
  const titleLabel = notebook.querySelector('[data-page-title]');
  const pages = Array.from(notebook.querySelectorAll('[data-page]'));
  const totalPages = pages.length;
  const transitionTime = reduceMotion ? 0 : 620;
  let currentPage = 0;
  let locked = false;
  let touchStartX = null;

  const warmBookAssets = () => {
    notebook.querySelectorAll('img[loading="lazy"]').forEach((image) => {
      image.loading = 'eager';
      image.decode?.().catch(() => {});
    });
  };

  notebook.querySelector('[data-page-total]').textContent = String(totalPages);

  const pageForHash = () => {
    const id = window.location.hash.slice(1);
    if (!id || id === 'home') return 0;
    const match = pages.find((page) => page.id === id);
    return match ? Number(match.dataset.page) : 0;
  };

  const updateNavigation = () => {
    const current = pages[currentPage - 1];
    if (!current) return;
    currentLabel.textContent = String(currentPage);
    titleLabel.textContent = current.dataset.title;
    prevLabel.textContent = currentPage === 1 ? '封面' : '上一页';
    nextButton.disabled = currentPage === totalPages;

    document.querySelectorAll('[data-page-target]').forEach((link) => {
      const target = Number(link.dataset.pageTarget);
      if (target === currentPage) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  };

  const clearTurnClasses = () => {
    pages.forEach((page) => {
      page.classList.remove('is-entering-forward', 'is-entering-backward', 'is-leaving-forward', 'is-leaving-backward');
    });
    readerView.classList.remove('is-turning-forward', 'is-turning-backward');
  };

  const setSpreadState = (nextPage, direction = 'forward', animate = true) => {
    if (nextPage < 1 || nextPage > totalPages || nextPage === currentPage) {
      locked = false;
      return;
    }

    const previous = pages[currentPage - 1];
    const next = pages[nextPage - 1];
    setWechatNoteState(false);
    clearTurnClasses();

    pages.forEach((page) => {
      if (page === previous || page === next) return;
      page.classList.remove('is-active');
      page.setAttribute('aria-hidden', 'true');
      page.setAttribute('inert', '');
    });

    if (previous) {
      previous.classList.remove('is-active');
      if (animate) previous.classList.add(direction === 'forward' ? 'is-leaving-forward' : 'is-leaving-backward');
      previous.setAttribute('aria-hidden', 'true');
      previous.setAttribute('inert', '');
    }

    next.classList.add('is-active');
    if (animate) next.classList.add(direction === 'forward' ? 'is-entering-forward' : 'is-entering-backward');
    next.setAttribute('aria-hidden', 'false');
    next.removeAttribute('inert');
    if (animate) readerView.classList.add(direction === 'forward' ? 'is-turning-forward' : 'is-turning-backward');

    currentPage = nextPage;
    updateNavigation();
    history.replaceState(null, '', `#${next.id}`);

    window.setTimeout(() => {
      clearTurnClasses();
      locked = false;
    }, animate ? transitionTime : 0);
  };

  const openBook = (targetPage = 1, animate = true) => {
    if (locked) return;
    warmBookAssets();
    locked = true;
    const direction = currentPage > targetPage ? 'backward' : 'forward';

    if (currentPage > 0) {
      setSpreadState(targetPage, direction, animate);
      return;
    }

    setSpreadState(targetPage, 'forward', false);
    locked = true;

    if (!animate || reduceMotion) {
      coverView.classList.remove('is-active');
      coverView.setAttribute('aria-hidden', 'true');
      readerView.classList.add('is-active');
      readerView.setAttribute('aria-hidden', 'false');
      locked = false;
      return;
    }

    coverView.classList.add('is-opening');
    window.setTimeout(() => {
      coverView.classList.remove('is-active', 'is-opening');
      coverView.setAttribute('aria-hidden', 'true');
      readerView.classList.add('is-active', 'is-book-opening');
      readerView.setAttribute('aria-hidden', 'false');
      window.setTimeout(() => {
        readerView.classList.remove('is-book-opening');
        locked = false;
      }, transitionTime);
    }, 300);
  };

  const closeBook = () => {
    if (locked || currentPage === 0) return;
    setWechatNoteState(false);
    locked = true;
    readerView.classList.add('is-book-closing');
    history.replaceState(null, '', '#home');

    window.setTimeout(() => {
      readerView.classList.remove('is-active', 'is-book-closing');
      readerView.setAttribute('aria-hidden', 'true');
      coverView.classList.add('is-active', 'is-returning');
      coverView.setAttribute('aria-hidden', 'false');
      document.querySelectorAll('[data-page-target]').forEach((link) => link.removeAttribute('aria-current'));
      currentPage = 0;
      window.setTimeout(() => {
        coverView.classList.remove('is-returning');
        locked = false;
        openButton.focus({ preventScroll: true });
      }, transitionTime);
    }, reduceMotion ? 0 : 340);
  };

  const previousPage = () => {
    if (locked) return;
    if (currentPage === 1) closeBook();
    else {
      locked = true;
      setSpreadState(currentPage - 1, 'backward');
    }
  };

  const nextPage = () => {
    if (locked || currentPage >= totalPages) return;
    locked = true;
    setSpreadState(currentPage + 1, 'forward');
  };

  openButton.addEventListener('pointerenter', warmBookAssets, { once: true });
  openButton.addEventListener('focus', warmBookAssets, { once: true });
  openButton.addEventListener('pointerdown', warmBookAssets, { once: true });
  openButton.addEventListener('click', () => openBook(1));
  prevButton.addEventListener('click', previousPage);
  nextButton.addEventListener('click', nextPage);

  document.querySelectorAll('[data-page-target]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const target = Number(link.dataset.pageTarget);
      if (target === 0) closeBook();
      else openBook(target, true);
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return;
    if (event.key === 'ArrowLeft' && currentPage > 0) previousPage();
    if (event.key === 'ArrowRight' && currentPage > 0) nextPage();
  });

  readerView.addEventListener('touchstart', (event) => {
    touchStartX = event.changedTouches[0].clientX;
  }, { passive: true });

  readerView.addEventListener('touchend', (event) => {
    if (touchStartX === null) return;
    const distance = event.changedTouches[0].clientX - touchStartX;
    touchStartX = null;
    if (Math.abs(distance) < 58) return;
    if (distance > 0) previousPage();
    else nextPage();
  }, { passive: true });

  window.addEventListener('hashchange', () => {
    const targetPage = pageForHash();
    if (targetPage === currentPage) return;
    if (targetPage === 0) closeBook();
    else openBook(targetPage, true);
  });

  const initialPage = pageForHash();
  if (initialPage > 0) openBook(initialPage, false);
}
