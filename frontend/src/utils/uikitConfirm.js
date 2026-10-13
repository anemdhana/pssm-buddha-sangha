/**
 * UIkit modal confirm — see https://getuikit.com/docs/modal (Modal dialogs).
 * Message is HTML; falls back to window.confirm with plain text when UIkit is unavailable.
 */
export function uikitConfirm(messageHtml, { ok = 'OK', cancel = 'Cancel', plainText = '' } = {}) {
  if (typeof window === 'undefined') return Promise.resolve(false);

  const UIkit = window.UIkit;
  if (UIkit?.modal?.confirm) {
    return UIkit.modal.confirm(messageHtml, { i18n: { ok, cancel } }).then(
      () => true,
      () => false
    );
  }

  const fallback = plainText || htmlToPlainText(messageHtml);
  return Promise.resolve(window.confirm(fallback));
}

function htmlToPlainText(html) {
  if (typeof document === 'undefined') return String(html || '');
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent?.trim() || '';
}
