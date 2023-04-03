// document scroll offset from 0.0 to 1.0
export function scrollUnitState(): number {
  // scrollY in modern browsers is high precision float
  const scrollY = window.scrollY || 0;

  if (scrollY <= 0) {
    return 0;
  }

  // also a high precision float, rounded here to avoid round-off error
  const documentHeight = Math.round(
    document.documentElement.getBoundingClientRect().height || 0
  );

  const viewportHeight = document.documentElement.clientHeight;

  const offset = scrollY / (documentHeight - viewportHeight);

  return Math.max(0, Math.min(1, offset));
}
