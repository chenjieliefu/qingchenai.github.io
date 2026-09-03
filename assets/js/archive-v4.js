(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const initReader = (reader) => {
    const pagesHost = reader.querySelector('[data-archive-pages]');
    const previousButton = reader.querySelector('[data-archive-prev]');
    const nextButton = reader.querySelector('[data-archive-next]');
    const currentLabel = reader.querySelector('[data-archive-current]');
    const totalLabel = reader.querySelector('[data-archive-total]');
    if (!pagesHost || !previousButton || !nextButton || !currentLabel || !totalLabel) return;

    const entries = Array.from(pagesHost.querySelectorAll('.archive-entry'));
    const heading = pagesHost.querySelector('.archive-heading-block');
    const note = pagesHost.querySelector('.archive-note');
    const pageSize = Math.max(1, Number(pagesHost.dataset.pageSize) || 5);
    const groups = [];

    for (let index = 0; index < entries.length; index += pageSize) {
      groups.push(entries.slice(index, index + pageSize));
    }
    if (!groups.length) groups.push([]);

    pagesHost.replaceChildren();

    groups.forEach((group, pageIndex) => {
      const spread = document.createElement('div');
      spread.className = 'archive-spread';
      spread.dataset.archivePage = String(pageIndex + 1);
      spread.setAttribute('aria-hidden', 'true');
      spread.setAttribute('inert', '');

      const left = document.createElement('div');
      left.className = 'archive-paper archive-paper-left';
      const right = document.createElement('div');
      right.className = 'archive-paper archive-paper-right';

      if (pageIndex === 0 && heading) left.append(heading);
      group.slice(0, 2).forEach((entry) => left.append(entry));
      group.slice(2).forEach((entry) => right.append(entry));
      if (pageIndex === groups.length - 1 && note) right.append(note);

      spread.append(left, right);
      pagesHost.append(spread);
    });

    const pages = Array.from(pagesHost.querySelectorAll('[data-archive-page]'));
    const hashId = window.location.hash.slice(1);
    const hashEntryIndex = entries.findIndex((entry) => entry.id === hashId);
    let currentPage = hashEntryIndex >= 0 ? Math.floor(hashEntryIndex / pageSize) : 0;
    let touchStartX = null;

    const showPage = (nextPage, direction = 'forward', focusButton = false) => {
      if (nextPage < 0 || nextPage >= pages.length || nextPage === currentPage && pages[nextPage].classList.contains('is-active')) return;

      pages.forEach((page, index) => {
        page.classList.remove('is-active', 'is-entering-forward', 'is-entering-backward');
        const isCurrent = index === nextPage;
        page.setAttribute('aria-hidden', String(!isCurrent));
        if (isCurrent) page.removeAttribute('inert');
        else page.setAttribute('inert', '');
      });

      const activePage = pages[nextPage];
      activePage.classList.add('is-active');
      if (!reduceMotion) activePage.classList.add(direction === 'forward' ? 'is-entering-forward' : 'is-entering-backward');
      currentPage = nextPage;
      currentLabel.textContent = String(currentPage + 1);
      previousButton.disabled = currentPage === 0;
      nextButton.disabled = currentPage === pages.length - 1;

      if (focusButton) {
        const target = direction === 'forward' ? nextButton : previousButton;
        target.focus({ preventScroll: true });
      }
    };

    totalLabel.textContent = String(pages.length);
    previousButton.onclick = () => showPage(currentPage - 1, 'backward', true);
    nextButton.onclick = () => showPage(currentPage + 1, 'forward', true);

    reader.onkeydown = (event) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === 'ArrowLeft') showPage(currentPage - 1, 'backward');
      if (event.key === 'ArrowRight') showPage(currentPage + 1, 'forward');
    };

    reader.ontouchstart = (event) => {
      touchStartX = event.changedTouches[0].clientX;
    };
    reader.ontouchend = (event) => {
      if (touchStartX === null) return;
      const distance = event.changedTouches[0].clientX - touchStartX;
      touchStartX = null;
      if (Math.abs(distance) < 58) return;
      showPage(currentPage + (distance > 0 ? -1 : 1), distance > 0 ? 'backward' : 'forward');
    };

    showPage(currentPage, 'forward');
  };

  const initArchiveReaders = () => {
    document.querySelectorAll('[data-archive-reader]').forEach(initReader);
  };

  window.initArchiveReaders = initArchiveReaders;
  initArchiveReaders();
})();
