export function setupAnswerConfirmation(root: HTMLElement) {
  const dialog = root.querySelector<HTMLDialogElement>('[data-answer-dialog]')!;
  let pending: HTMLDetailsElement | null = null;
  let trigger: HTMLElement | null = null;
  root.querySelector('[data-cancel-answer]')?.addEventListener('click', () => dialog.close());
  root.querySelector('[data-reveal-answer]')?.addEventListener('click', () => {
    if (pending) pending.open = true;
    dialog.close();
  });
  dialog.addEventListener('close', () => {
    trigger?.focus();
    pending = null; trigger = null;
  });
  root.querySelectorAll<HTMLDetailsElement>('details[data-level="3"]').forEach((detail) => {
    detail.querySelector('summary')?.addEventListener('click', (event) => {
      event.preventDefault();
      if (detail.open) { detail.open = false; return; }
      pending = detail; trigger = detail.querySelector('summary'); dialog.showModal();
    });
  });
}
