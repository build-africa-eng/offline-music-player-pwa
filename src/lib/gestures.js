export function addSwipeGestures(element, onSwipeLeft, onSwipeRight, threshold = 50) {
  let touchStartX = 0;
  let touchEndX = 0;

  const handleTouchStart = (e) => {
    if (e.changedTouches && e.changedTouches.length > 0) {
      touchStartX = e.changedTouches[0].screenX;
    }
  };

  const handleTouchEnd = (e) => {
    if (e.changedTouches && e.changedTouches.length > 0) {
      touchEndX = e.changedTouches[0].screenX;
      const delta = touchEndX - touchStartX;
      if (delta > threshold) {
        onSwipeRight();
      } else if (delta < -threshold) {
        onSwipeLeft();
      }
    }
  };

  element.addEventListener('touchstart', handleTouchStart, { passive: true });
  element.addEventListener('touchend', handleTouchEnd, { passive: true });

  // Return a cleanup function to remove the event listeners
  return () => {
    element.removeEventListener('touchstart', handleTouchStart);
    element.removeEventListener('touchend', handleTouchEnd);
  };
}