export function getSupport() {
  return {
    css: {
      // @ts-ignore
      backdropFilter: document.body.style.backdropFilter != undefined
    }
}