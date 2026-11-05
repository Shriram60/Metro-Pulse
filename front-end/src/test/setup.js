import '@testing-library/jest-dom/vitest';

// jsdom does not implement these browser features.
HTMLDialogElement.prototype.showModal = function showModal() {
  this.open = true;
};
HTMLDialogElement.prototype.close = function close() {
  this.open = false;
};
window.scrollTo = () => {};
