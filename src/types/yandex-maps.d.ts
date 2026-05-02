export {};

declare global {
  interface Window {
    ymaps?: {
      ready: (callback: () => void) => void;
      Map: new (
        parentElement: HTMLElement | string,
        state: {
          center: [number, number];
          zoom: number;
          controls?: string[];
        },
        options?: { suppressMapOpenBlock?: boolean },
      ) => { destroy: () => void };
    };
  }
}
