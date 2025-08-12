// Minimal React/JSX shims for typechecking in this lightweight demo UI
declare module 'react';
declare module 'react/jsx-runtime';

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}


