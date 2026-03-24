document.addEventListener('DOMContentLoaded', () => {
  const blocks = document.querySelectorAll('div.chroma[data-init="true"]');

  function getBody(block) {
    return block.querySelector(':scope > .table-wrapper');
  }

  function forceReflow(el) {
    void el.offsetHeight;
  }

  function setExpandTransition(body) {
    body.style.transition = `
      max-height 0.28s cubic-bezier(0.22, 0.61, 0.36, 1),
      opacity 0.18s ease-out,
      transform 0.18s ease-out
    `;
  }

  function setCollapseTransition(body) {
    body.style.transition = `
      max-height 0.22s cubic-bezier(0.4, 0, 1, 1),
      opacity 0.14s ease-in,
      transform 0.14s ease-in
    `;
  }

  function expand(block, immediate = false) {
    const body = getBody(block);
    if (!body) return;

    if (immediate) {
      const oldTransition = body.style.transition;
      body.style.transition = 'none';
      body.style.maxHeight = body.scrollHeight + 'px';
      body.style.opacity = '1';
      body.style.transform = 'translateY(0)';
      forceReflow(body);
      body.style.transition = oldTransition;
      return;
    }

    setExpandTransition(body);
    body.style.maxHeight = '0px';
    body.style.opacity = '0';
    body.style.transform = 'translateY(-2px)';
    forceReflow(body);

    requestAnimationFrame(() => {
      body.style.maxHeight = body.scrollHeight + 'px';
      body.style.opacity = '1';
      body.style.transform = 'translateY(0)';
    });
  }

  function collapse(block, immediate = false) {
    const body = getBody(block);
    if (!body) return;

    if (immediate) {
      const oldTransition = body.style.transition;
      body.style.transition = 'none';
      body.style.maxHeight = '0px';
      body.style.opacity = '0';
      body.style.transform = 'translateY(-2px)';
      forceReflow(body);
      body.style.transition = oldTransition;
      return;
    }

    setCollapseTransition(body);
    body.style.maxHeight = body.scrollHeight + 'px';
    body.style.opacity = '1';
    body.style.transform = 'translateY(0)';
    forceReflow(body);

    requestAnimationFrame(() => {
      body.style.maxHeight = '0px';
      body.style.opacity = '0';
      body.style.transform = 'translateY(-2px)';
    });
  }

  function syncBlock(block, immediate = false) {
    if (block.classList.contains('open')) {
      expand(block, immediate);
    } else {
      collapse(block, immediate);
    }
  }

  blocks.forEach((block) => {
    const body = getBody(block);
    if (!body) return;

    syncBlock(block, true);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          syncBlock(block, false);
        }
      }
    });

    observer.observe(block, {
      attributes: true,
      attributeFilter: ['class'],
    });

    body.addEventListener('transitionend', (e) => {
      if (e.propertyName !== 'max-height') return;

      if (block.classList.contains('open')) {
        body.style.maxHeight = body.scrollHeight + 'px';
      }
    });

    window.addEventListener('resize', () => {
      if (block.classList.contains('open')) {
        body.style.maxHeight = body.scrollHeight + 'px';
      }
    });
  });
});
