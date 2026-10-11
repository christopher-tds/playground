/*
  Add to cart hover: marks the button ready on its first hover or focus, so the
  resting-state animations don't play on page load. The swap itself is CSS.
*/
(() => {
  const ready = e => {
    const button = e.target.closest?.(".atc");
    if (button) button.classList.add("is-ready");
  };
  document.addEventListener("pointerover", ready, { passive: true });
  document.addEventListener("focusin", ready);
})();
