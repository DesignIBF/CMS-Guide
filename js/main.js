// ============================================
// IBuyFlowers HubSpot CMS Guide
// main.js
// ============================================

document.addEventListener('DOMContentLoaded', () => {

  // ---- Nav group helper ----
  function setNavGroup(groupId, open) {
    const group = document.querySelector(`.nav-group[data-group="${groupId}"]`);
    if (!group) return;
    const items = group.querySelector('.nav-items');
    group.classList.toggle('collapsed', !open);
    if (items) items.classList.toggle('collapsed', !open);
  }

  // Collapse all nav groups on load (state restored later with sections)
  document.querySelectorAll('.nav-group').forEach(group => {
    group.classList.add('collapsed');
    const items = group.querySelector('.nav-items');
    if (items) items.classList.add('collapsed');
  });

  // ---- Nav group collapse/expand (synced with sections) ----
  // NOTE: openSection/closeSection are defined further down — this handler runs
  // at click-time so the functions are always available by then.
  document.querySelectorAll('.nav-group-header:not([disabled])').forEach(header => {
    header.addEventListener('click', () => {
      const group    = header.closest('.nav-group');
      const groupId  = group.dataset.group;
      const section  = groupId && document.getElementById(groupId);
      const opening  = group.classList.contains('collapsed');

      // Toggle nav group
      group.classList.toggle('collapsed', !opening);
      const items = group.querySelector('.nav-items');
      if (items) items.classList.toggle('collapsed', !opening);

      // Mirror on the section
      if (section) {
        const isOpen = section.querySelector('.section-content').classList.contains('open');
        if (opening && !isOpen) openSection(section);
        if (!opening && isOpen) closeSection(section);
      }
    });
  });

  // ---- Active nav link on scroll ----
  const articles = document.querySelectorAll('.article[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });
        // Ensure the nav group for this section is expanded when scrolling through it
        const section = entry.target.closest('.guide-section');
        if (section) setNavGroup(section.id, true);
      }
    });
  }, {
    rootMargin: '-15% 0px -75% 0px',
    threshold: 0
  });

  articles.forEach(article => observer.observe(article));

  // ---- Back to top ----
  const backToTop = document.getElementById('backToTop');

  window.addEventListener('scroll', () => {
    backToTop.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });

  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ---- Mobile sidebar toggle ----
  const menuToggle = document.querySelector('.menu-toggle');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');

  const openSidebar = () => {
    sidebar.classList.add('open');
    overlay.classList.add('visible');
    document.body.style.overflow = 'hidden';
  };

  const closeSidebar = () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('visible');
    document.body.style.overflow = '';
  };

  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
    });
  }

  if (overlay) {
    overlay.addEventListener('click', closeSidebar);
  }

  // ---- Collapsible sections ----
  const guideSections = document.querySelectorAll('.guide-section');
  const STORAGE_KEY   = 'ibf-guide-open-sections';

  function saveState() {
    const openIds = [];
    guideSections.forEach(s => {
      if (s.querySelector('.section-content').classList.contains('open')) openIds.push(s.id);
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(openIds));
  }

  // Inject chevron into every section-hero
  document.querySelectorAll('.section-hero').forEach(hero => {
    const chevron = document.createElement('span');
    chevron.className = 'hero-chevron';
    chevron.setAttribute('aria-hidden', 'true');
    chevron.textContent = '▾';
    hero.querySelector('.section-hero-inner').appendChild(chevron);
  });

  function openSection(section, instant) {
    const content = section.querySelector('.section-content');
    const hero    = section.querySelector('.section-hero');
    if (!content) return;
    if (instant) content.style.transition = 'none';
    content.style.maxHeight = content.scrollHeight + 'px';
    content.classList.add('open');
    hero?.classList.add('open');
    setNavGroup(section.id, true);
    if (instant) {
      requestAnimationFrame(() => { content.style.transition = ''; content.style.maxHeight = 'none'; });
    } else {
      content.addEventListener('transitionend', () => {
        if (content.classList.contains('open')) content.style.maxHeight = 'none';
      }, { once: true });
    }
    saveState();
  }

  function closeSection(section) {
    const content = section.querySelector('.section-content');
    const hero    = section.querySelector('.section-hero');
    if (!content) return;
    // Re-establish explicit height so the CSS transition animates correctly from 'none'
    if (!content.style.maxHeight || content.style.maxHeight === 'none') {
      content.style.maxHeight = content.scrollHeight + 'px';
    }
    requestAnimationFrame(() => { content.style.maxHeight = '0'; });
    content.classList.remove('open');
    hero?.classList.remove('open');
    setNavGroup(section.id, false);
    saveState();
  }

  // Restore open sections from localStorage
  const savedIds = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  guideSections.forEach(section => {
    if (savedIds.includes(section.id)) openSection(section, true);
  });

  // Hero click → toggle independently (no accordion)
  document.querySelectorAll('.section-hero').forEach(hero => {
    hero.addEventListener('click', () => {
      const section = hero.closest('.guide-section');
      section.querySelector('.section-content').classList.contains('open')
        ? closeSection(section)
        : openSection(section);
    });
  });

  // Nav link click → open section if needed, then scroll to article
  navLinks.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const targetId = link.getAttribute('href')?.slice(1);
      const target   = targetId && document.getElementById(targetId);
      if (!target) { if (window.innerWidth <= 900) closeSidebar(); return; }

      const section = target.closest('.guide-section');
      if (section) {
        const isOpen = section.querySelector('.section-content').classList.contains('open');
        if (!isOpen) openSection(section);
        const delay = isOpen ? 0 : 460;
        setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), delay);
      }

      if (window.innerWidth <= 900) closeSidebar();
    });
  });

  // ---- Code copy buttons ----
  document.querySelectorAll('.code-copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const pre = targetId
        ? document.getElementById(targetId)
        : btn.closest('.code-block-wrap')?.querySelector('.code-block');
      if (!pre) return;
      navigator.clipboard.writeText(pre.innerText).then(() => {
        btn.textContent = 'Copied!';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = 'Copy';
          btn.classList.remove('copied');
        }, 2000);
      });
    });
  });

  // ---- Internal anchor links → open target section before scrolling ----
  document.addEventListener('click', e => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    // Skip nav links and special triggers (they have their own handlers)
    if (link.classList.contains('nav-link') ||
        link.closest('.sidebar') ||
        link.closest('.glossary-overlay')) return;

    const targetId = link.getAttribute('href').slice(1);
    const target   = targetId && document.getElementById(targetId);
    if (!target) return;

    const section = target.closest('.guide-section');
    if (!section) return;

    e.preventDefault();
    const isOpen = section.querySelector('.section-content').classList.contains('open');
    if (!isOpen) openSection(section);
    const delay = isOpen ? 0 : 460;
    setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), delay);
  });

  // ---- Expand all <details> when printing (for PDF export) ----
  window.addEventListener('beforeprint', () => {
    document.querySelectorAll('details').forEach(d => d.open = true);
  });

  window.addEventListener('afterprint', () => {
    document.querySelectorAll('details').forEach(d => d.open = false);
  });

  // ---- Sidebar search ----
  const sidebarSearch      = document.getElementById('sidebarSearch');
  const sidebarSearchClear = document.getElementById('sidebarSearchClear');
  const sidebarSearchRes   = document.getElementById('sidebarSearchResults');

  // Build index: one entry per article[id]
  const searchIndex = [];
  document.querySelectorAll('.article[id]').forEach(article => {
    const heading = article.querySelector('h2');
    if (!heading) return;

    // Determine section label from closest section-hero
    const section = article.closest('.guide-section');
    const sectionNum  = section?.querySelector('.section-num-hero')?.textContent.trim() || '';
    const sectionName = section?.querySelector('.section-title')?.textContent.trim() || '';
    const sectionLabel = sectionNum && sectionName ? `${sectionNum} — ${sectionName}` : sectionName;

    // Grab plain text of the article body (strip HTML)
    const bodyText = article.textContent.replace(/\s+/g, ' ').trim();

    searchIndex.push({
      id:      article.id,
      title:   heading.textContent.trim(),
      section: sectionLabel,
      body:    bodyText,
    });
  });

  let focusedResultIndex = -1;

  function renderResults(query) {
    const q = query.trim().toLowerCase();
    sidebarSearchRes.innerHTML = '';
    focusedResultIndex = -1;

    if (!q) {
      sidebarSearchRes.classList.remove('open');
      return;
    }

    const matches = searchIndex.filter(entry =>
      entry.title.toLowerCase().includes(q) || entry.body.toLowerCase().includes(q)
    ).slice(0, 8);

    if (matches.length === 0) {
      sidebarSearchRes.innerHTML = `<div class="search-no-results">No results for "<strong>${escapeHtml(query)}</strong>"</div>`;
      sidebarSearchRes.classList.add('open');
      return;
    }

    matches.forEach((entry, i) => {
      const snippet = getSnippet(entry.body, q, 80);
      const btn = document.createElement('button');
      btn.className = 'search-result-item';
      btn.setAttribute('role', 'option');
      btn.dataset.index = i;
      btn.innerHTML = `
        <span class="search-result-section">${escapeHtml(entry.section)}</span>
        <span class="search-result-title">${highlightMatch(entry.title, q)}</span>
        ${snippet ? `<span class="search-result-snippet">${highlightMatch(snippet, q)}</span>` : ''}
      `;
      btn.addEventListener('click', () => goToResult(entry.id));
      sidebarSearchRes.appendChild(btn);
    });

    sidebarSearchRes.classList.add('open');
  }

  function goToResult(id) {
    const target = document.getElementById(id);
    if (!target) return;
    sidebarSearchRes.classList.remove('open');
    sidebarSearch.value = '';
    sidebarSearchClear.classList.remove('visible');

    const section = target.closest('.guide-section');
    const isOpen  = section?.querySelector('.section-content').classList.contains('open');
    if (section && !isOpen) openSection(section);
    const delay = isOpen ? 0 : 460;

    setTimeout(() => {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      target.style.transition = 'background 0.2s';
      target.style.background = 'rgba(224,25,131,0.06)';
      setTimeout(() => { target.style.background = ''; }, 1200);
    }, delay);

    if (window.innerWidth <= 900) closeSidebar();
  }

  function getSnippet(text, query, maxLen) {
    const idx = text.toLowerCase().indexOf(query);
    if (idx === -1) return text.slice(0, maxLen);
    const start = Math.max(0, idx - 20);
    const raw = text.slice(start, start + maxLen);
    return (start > 0 ? '…' : '') + raw + (start + maxLen < text.length ? '…' : '');
  }

  function highlightMatch(text, query) {
    if (!query) return escapeHtml(text);
    const escaped = escapeHtml(text);
    const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
    return escaped.replace(regex, '<mark>$1</mark>');
  }

  function escapeHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  if (sidebarSearch) {
    sidebarSearch.addEventListener('input', e => {
      const val = e.target.value;
      sidebarSearchClear.classList.toggle('visible', val.length > 0);
      renderResults(val);
    });

    // Keyboard navigation through results
    sidebarSearch.addEventListener('keydown', e => {
      const items = sidebarSearchRes.querySelectorAll('.search-result-item');
      if (!items.length) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        focusedResultIndex = Math.min(focusedResultIndex + 1, items.length - 1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        focusedResultIndex = Math.max(focusedResultIndex - 1, 0);
      } else if (e.key === 'Enter' && focusedResultIndex >= 0) {
        e.preventDefault();
        items[focusedResultIndex].click();
        return;
      } else if (e.key === 'Escape') {
        sidebarSearchRes.classList.remove('open');
        return;
      } else {
        return;
      }

      items.forEach((item, i) => item.classList.toggle('focused', i === focusedResultIndex));
      items[focusedResultIndex]?.scrollIntoView({ block: 'nearest' });
    });
  }

  if (sidebarSearchClear) {
    sidebarSearchClear.addEventListener('click', () => {
      sidebarSearch.value = '';
      sidebarSearchClear.classList.remove('visible');
      sidebarSearchRes.classList.remove('open');
      sidebarSearch.focus();
    });
  }

  // Close results when clicking outside
  document.addEventListener('click', e => {
    if (!e.target.closest('.sidebar-search-wrap')) {
      sidebarSearchRes.classList.remove('open');
    }
  });

  // ---- Image zoom modal ----
  const zoomOverlay = document.getElementById('zoomOverlay');
  const zoomImg     = document.getElementById('zoomImg');
  const zoomClose   = document.getElementById('zoomClose');

  const openZoom = (src, alt) => {
    zoomImg.src = src;
    zoomImg.alt = alt || '';
    zoomOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  const closeZoom = () => {
    zoomOverlay.classList.remove('open');
    document.body.style.overflow = '';
  };

  document.querySelectorAll('.screenshot-figure img').forEach(img => {
    img.addEventListener('click', () => openZoom(img.src, img.alt));
  });

  zoomClose.addEventListener('click', closeZoom);
  zoomOverlay.addEventListener('click', e => { if (e.target === zoomOverlay || e.target === zoomImg) closeZoom(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && zoomOverlay.classList.contains('open')) closeZoom(); });

  // ---- Glossary term tooltips ----
  const gtTooltip = document.createElement('div');
  gtTooltip.className = 'gt-tooltip';
  gtTooltip.textContent = '📖 See Glossary';
  document.body.appendChild(gtTooltip);

  let gtHideTimer;
  const TIP_W = 116, TIP_H = 26;

  document.querySelectorAll('.gt').forEach(el => {
    el.setAttribute('tabindex', '0');
    el.setAttribute('role', 'button');

    const showTip = () => {
      clearTimeout(gtHideTimer);
      const r = el.getBoundingClientRect();
      const left = Math.max(8, Math.min(r.left + r.width / 2 - TIP_W / 2, window.innerWidth - TIP_W - 8));
      const top  = r.top > TIP_H + 10 ? r.top - TIP_H - 6 : r.bottom + 6;
      gtTooltip.style.left = left + 'px';
      gtTooltip.style.top  = top + 'px';
      gtTooltip.classList.add('visible');
    };

    const hideTip = () => { gtHideTimer = setTimeout(() => gtTooltip.classList.remove('visible'), 80); };

    el.addEventListener('mouseenter', showTip);
    el.addEventListener('mouseleave', hideTip);
    el.addEventListener('focus', showTip);
    el.addEventListener('blur', hideTip);

    el.addEventListener('click', () => {
      gtTooltip.classList.remove('visible');
      const query = el.dataset.gt || el.textContent.trim();
      openGlossary();
      setTimeout(() => {
        glossarySearch.value = query;
        filterGlossary(query);
      }, 60);
    });

    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); } });
  });

  // ---- Glossary modal ----
  const glossaryOverlay  = document.getElementById('glossaryOverlay');
  const glossaryTrigger  = document.getElementById('glossaryTrigger');
  const glossaryFab      = document.getElementById('glossaryFab');
  const glossaryClose    = document.getElementById('glossaryClose');
  const glossarySearch   = document.getElementById('glossarySearch');
  const glossaryNoRes    = document.getElementById('glossaryNoResults');
  const glossaryGroups   = document.querySelectorAll('.gloss-group');
  const glossaryItems    = document.querySelectorAll('.gloss-item');

  const openGlossary = () => {
    glossaryOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    glossarySearch.value = '';
    filterGlossary('');
    setTimeout(() => glossarySearch.focus(), 220);
  };

  const closeGlossary = () => {
    glossaryOverlay.classList.remove('open');
    document.body.style.overflow = '';
  };

  if (glossaryTrigger) glossaryTrigger.addEventListener('click', openGlossary);
  if (glossaryFab)     glossaryFab.addEventListener('click', openGlossary);
  if (glossaryClose)   glossaryClose.addEventListener('click', closeGlossary);

  glossaryOverlay.addEventListener('click', e => {
    if (e.target === glossaryOverlay) closeGlossary();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && glossaryOverlay.classList.contains('open')) closeGlossary();
  });

  // ---- Glossary search filter ----
  function filterGlossary(query) {
    const q = query.trim().toLowerCase();
    let totalVisible = 0;

    glossaryGroups.forEach(group => {
      let groupVisible = 0;

      group.querySelectorAll('.gloss-item').forEach(item => {
        const term = item.querySelector('dt').textContent.toLowerCase();
        const def  = item.querySelector('dd').textContent.toLowerCase();
        const match = !q || term.includes(q) || def.includes(q);
        item.style.display = match ? '' : 'none';
        if (match) groupVisible++;
      });

      group.style.display = groupVisible > 0 ? '' : 'none';
      totalVisible += groupVisible;
    });

    glossaryNoRes.style.display = totalVisible === 0 ? 'block' : 'none';
  }

  if (glossarySearch) {
    glossarySearch.addEventListener('input', e => filterGlossary(e.target.value));
  }

});
