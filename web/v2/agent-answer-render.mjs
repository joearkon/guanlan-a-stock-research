(function (root) {
  const ESC_MAP = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC_MAP[c]);

  // Cut before discourse markers without deleting any characters from the source.
  const MARKERS = [
    /结论[：:]/g,
    /从指数看/g,
    /从广度看/g,
    /若[^。]{0,40}则/g,
    /来源[：:]/g,
    /本报告不构成投资建议/g
  ];

  function cutIndices(text) {
    const cuts = new Set([0]);
    for (const re of MARKERS) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(text))) {
        if (m.index > 0) cuts.add(m.index);
      }
    }
    const blank = /\n{2,}/g;
    let bm;
    while ((bm = blank.exec(text))) cuts.add(bm.index + bm[0].length);
    cuts.add(text.length);
    return [...cuts].sort((a, b) => a - b);
  }

  function segment(text) {
    const full = String(text ?? '');
    if (!full.trim()) return { sections: [], fullText: full };

    if (/\n{2,}/.test(full)) {
      const sections = full
        .split(/\n{2,}/)
        .map((s) => s.replace(/^\n+|\n+$/g, ''))
        .filter((s) => s.length)
        .map((body) => ({ body }));
      return { sections, fullText: full };
    }

    if (!full.includes('\n')) {
      const idx = cutIndices(full);
      const sections = [];
      for (let i = 0; i < idx.length - 1; i++) {
        const body = full.slice(idx[i], idx[i + 1]).trim();
        if (body) sections.push({ body });
      }
      if (sections.length >= 2) return { sections, fullText: full };
      return { sections: [{ body: full }], fullText: full };
    }

    const sections = full
      .split(/\n/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((body) => ({ body }));
    return {
      sections: sections.length ? sections : [{ body: full }],
      fullText: full
    };
  }

  // Escape first, then apply a small safe Markdown subset. Never inject raw HTML from the model.
  function inlineMarkdown(escaped) {
    return escaped
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*\w])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
  }

  function formatBlock(raw) {
    const text = String(raw ?? '');
    const lines = text.split('\n');
    const out = [];
    let listType = null; // 'ul' | 'ol'
    let listBuf = [];

    function flushList() {
      if (!listBuf.length) return;
      const tag = listType;
      out.push(
        `<${tag} class="agent-answer-list">` +
          listBuf.map((item) => `<li>${inlineMarkdown(esc(item))}</li>`).join('') +
          `</${tag}>`
      );
      listBuf = [];
      listType = null;
    }

    for (const line of lines) {
      const heading = /^(#{1,3})\s+(.+)$/.exec(line);
      const ul = /^[-*]\s+(.+)$/.exec(line);
      const ol = /^(\d+)\.\s+(.+)$/.exec(line);
      if (heading) {
        flushList();
        const level = heading[1].length;
        out.push(`<h${level} class="agent-answer-h">${inlineMarkdown(esc(heading[2]))}</h${level}>`);
        continue;
      }
      if (ul) {
        if (listType && listType !== 'ul') flushList();
        listType = 'ul';
        listBuf.push(ul[1]);
        continue;
      }
      if (ol) {
        if (listType && listType !== 'ol') flushList();
        listType = 'ol';
        listBuf.push(ol[2]);
        continue;
      }
      flushList();
      if (!line.trim()) continue;
      out.push(`<p class="agent-answer-seg">${inlineMarkdown(esc(line)).replace(/\n/g, '<br>')}</p>`);
    }
    flushList();
    if (!out.length) return `<p class="agent-answer-seg">${inlineMarkdown(esc(text))}</p>`;
    return out.join('');
  }

  function render(text) {
    const { sections, fullText } = segment(text);
    const body = sections.length
      ? sections.map((s) => formatBlock(s.body)).join('')
      : '';
    const full = fullText
      ? `<details class="agent-answer-full"><summary>完整原文</summary><pre class="agent-answer-full-pre">${esc(fullText)}</pre></details>`
      : '';
    return `<div class="agent-answer-text">${body}${full}</div>`;
  }

  root.GLAgentAnswerRender = { segment, render, esc, formatBlock, inlineMarkdown };
})(globalThis);

export default globalThis.GLAgentAnswerRender;
