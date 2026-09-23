import "@testing-library/jest-dom/vitest";

// jsdom lacks ResizeObserver and matchMedia used by some UI; stub them.
const g: unknown = globalThis;
if (g && typeof window !== "undefined") {
  const w = g as typeof globalThis & {
    ResizeObserver?: unknown;
    matchMedia?: unknown;
  };
  if (!w.ResizeObserver) {
    w.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
  if (!w.matchMedia) {
    w.matchMedia = () => ({
      matches: false,
      onchange: null,
      media: "",
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    });
  }
}
