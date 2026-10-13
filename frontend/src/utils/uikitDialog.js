function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * UIkit modal with custom footer buttons. Resolves choice id, or null if dismissed.
 * @see https://getuikit.com/docs/modal — UIkit.modal.dialog
 */
export function uikitDialogChoice(messageHtml, choices, { cancelLabel = 'Cancel' } = {}) {
  if (typeof window === 'undefined') return Promise.resolve(null);

  const UIkit = window.UIkit;
  if (!UIkit?.modal?.dialog) {
    const plain = htmlToPlainText(messageHtml);
    const pick = window.prompt(`${plain}\n\nEnter: ${choices.map((c) => c.id).join(', ')}`);
    if (!pick) return Promise.resolve(null);
    const found = choices.find((c) => c.id === pick.trim());
    return Promise.resolve(found ? found.id : null);
  }

  const buttons = (Array.isArray(choices) ? choices : [])
    .map(
      (c) =>
        `<button type="button" class="uk-button ${c.buttonClass || 'uk-button-default'} uk-margin-small-left js-uikit-choice" data-choice="${escapeHtml(c.id)}">${escapeHtml(c.label)}</button>`
    )
    .join('');

  const html =
    `<div class="uk-modal-body">${messageHtml}</div>` +
    `<div class="uk-modal-footer uk-text-right">` +
    `<button type="button" class="uk-button uk-button-default uk-modal-close">${escapeHtml(cancelLabel)}</button>` +
    buttons +
    `</div>`;

  return new Promise((resolve) => {
    const modal = UIkit.modal.dialog(html, { stack: true });
    const el = modal.$el;
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      try {
        modal.hide();
      } catch {
        /* already closing */
      }
      resolve(value);
    };

    // UIkit delegated handlers: currentTarget is the modal root — use closest on the click target.
    UIkit.util.on(el, 'click', (e) => {
      const btn = e.target && e.target.closest ? e.target.closest('.js-uikit-choice') : null;
      if (!btn || !el.contains(btn)) return;
      e.preventDefault();
      e.stopPropagation();
      finish(btn.getAttribute('data-choice'));
    });
    UIkit.util.on(el, 'hidden', () => finish(null));
  });
}

function htmlToPlainText(html) {
  if (typeof document === 'undefined') return String(html || '');
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent?.trim() || '';
}
