// Esto soluciona el error de NodeJS
export {};

declare global {
  namespace NodeJS {
    interface Timeout {}
    interface Immediate {}
  }
}