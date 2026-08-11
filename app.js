// ============================================
// MOUSY JOURNAL — App Logic
// Lexy Dehermes
// ============================================

(function() {
  'use strict';

  // State
  let activeFilter = 'all';
  let searchQuery = '';

  // DOM refs
  const entriesGrid = document.getElementById('entriesGrid');
  const searchInput = document.getElementById('searchInput');
  const filterChips = document.querySelectorAll('.filter-chip');
  const modal = document.getElementById('entryModal');
  const modalContent = document.getElementById('modalContent');
  const modalClose = document.getElementById('modalClose');
  const emptyState = document.getElementById('emptyState');

  // Init hero stats
  document.getElementById('totalBugs').textContent = totalBugs;
  document.getElementById('totalCriticals').textContent = totalCriticals;
  document.getElementById('totalBounties').textContent = formatBounty(totalBounties);

  // Render entries
  function getFilteredEntries() {
    return journalEntries.filter(entry => {
      // Severity filter
      if (activeFilter !== 'all' && entry.severity !== activeFilter) return false;

      // Search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const haystack = [
          entry.title,
          entry.target,
          entry.technique,
          entry.description,
          entry.cve,
          entry.id
        ].join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }

  function renderEntries() {
    const filtered = getFilteredEntries();

    if (filtered.length === 0) {
      entriesGrid.innerHTML = '';
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';

    entriesGrid.innerHTML = filtered.map(entry => {
      const severityColors = {
        critical: 'var(--critical)',
        high: 'var(--high)',
        medium: 'var(--medium)',
        low: 'var(--low)',
        info: 'var(--info)'
      };

      return `
        <article
          class="entry-card"
          style="--severity-color: ${severityColors[entry.severity] || 'var(--border)'}"
          onclick="window.openEntry('${entry.id}')"
          role="button"
          tabindex="0"
          aria-label="View ${entry.id}"
        >
          <div class="entry-header">
            <span class="entry-id">${entry.id}</span>
            <span class="entry-badge badge-${entry.severity}">${entry.severity}</span>
          </div>
          <h3 class="entry-title">${entry.title}</h3>
          <div class="entry-target">${entry.target}</div>
          <p class="entry-excerpt">${entry.description}</p>
          <div class="entry-meta">
            <span>📅 ${entry.date}</span>
            <span>⚡ ${entry.technique.split(' / ')[0]}</span>
            ${entry.bounty > 0 ? `<span class="entry-bounty">💰 ${formatBounty(entry.bounty)}</span>` : ''}
          </div>
        </article>
      `;
    }).join('');
  }

  // Open entry modal
  window.openEntry = function(entryId) {
    const entry = journalEntries.find(e => e.id === entryId);
    if (!entry) return;

    const severityColors = {
      critical: 'var(--critical)',
      high: 'var(--high)',
      medium: 'var(--medium)',
      low: 'var(--low)',
      info: 'var(--info)'
    };

    modalContent.innerHTML = `
      <span class="modal-severity badge-${entry.severity}">${entry.severity}</span>
      <h2 class="modal-title">${entry.title}</h2>
      <div class="modal-target">🎯 ${entry.target}</div>

      <div class="modal-section">
        <h4>Description</h4>
        <p>${entry.description}</p>
      </div>

      <div class="modal-section">
        <h4>Technique</h4>
        <p>${entry.technique}</p>
      </div>

      <div class="modal-section">
        <h4>Steps to Reproduce</h4>
        <code>${escapeHTML(entry.steps)}</code>
      </div>

      <div class="modal-section">
        <h4>Impact</h4>
        <p>${entry.impact}</p>
      </div>

      <div class="modal-section">
        <h4>Remediation</h4>
        <p>${entry.remediation}</p>
      </div>

      ${entry.references.length ? `
        <div class="modal-section">
          <h4>References</h4>
          ${entry.references.map(ref => `<p><a href="${ref}" target="_blank" rel="noopener" style="color:var(--info);">${ref}</a></p>`).join('')}
        </div>
      ` : ''}

      <div class="modal-meta-row">
        <div><strong>Entry ID</strong> ${entry.id}</div>
        <div><strong>Date</strong> ${entry.date}</div>
        <div><strong>Status</strong> ${entry.status}</div>
        <div><strong>CVSS</strong> ${entry.cvss}</div>
        ${entry.cve ? `<div><strong>CVE</strong> <span class="modal-cve">${entry.cve}</span></div>` : ''}
        <div><strong>Bounty</strong> <span class="modal-bounty">${formatBounty(entry.bounty)}</span></div>
      </div>
    `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  // Close modal
  function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  modalClose.addEventListener('click', closeModal);
  modal.addEventListener('click', function(e) {
    if (e.target === modal) closeModal();
  });
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });

  // Filter chips
  filterChips.forEach(chip => {
    chip.addEventListener('click', function() {
      filterChips.forEach(c => c.classList.remove('active'));
      this.classList.add('active');
      activeFilter = this.dataset.filter;
      renderEntries();
    });
  });

  // Search with debounce
  let searchTimeout;
  searchInput.addEventListener('input', function() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      searchQuery = this.value.trim();
      renderEntries();
    }, 200);
  });

  // Escape HTML helper
  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Initial render
  renderEntries();

})();
