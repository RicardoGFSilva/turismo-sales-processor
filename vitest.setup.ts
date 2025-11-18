// Polyfill for DOMMatrix in Node.js environment
if (typeof global.DOMMatrix === 'undefined') {
  (global as any).DOMMatrix = class DOMMatrix {
    constructor() {}
  };
}

// Polyfill for other DOM-related globals if needed
if (typeof global.HTMLCanvasElement === 'undefined') {
  (global as any).HTMLCanvasElement = class HTMLCanvasElement {
    getContext() {
      return {};
    }
  };
}
