export const createThanosSnap = (element, onComplete) => {
  if (!element) {
    if (onComplete) onComplete();
    return;
  }

  // Simple fade out animation - much more stable
  const duration = 800; // Shorter duration
  const startTime = performance.now();
  
  // Store original styles
  const originalOpacity = element.style.opacity || '1';
  const originalTransform = element.style.transform || '';
  
  const animate = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Simple fade and slight scale effect
    const opacity = 1 - progress;
    const scale = 1 - (progress * 0.1); // Slight shrink
    
    element.style.opacity = opacity;
    element.style.transform = `${originalTransform} scale(${scale})`;
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      // Reset styles and complete
      element.style.opacity = originalOpacity;
      element.style.transform = originalTransform;
      if (onComplete) onComplete();
    }
  };
  
  // Start animation
  requestAnimationFrame(animate);
  
  // Safety cleanup
  setTimeout(() => {
    element.style.opacity = originalOpacity;
    element.style.transform = originalTransform;
    if (onComplete) onComplete();
  }, duration + 100);
  
  return () => {
    element.style.opacity = originalOpacity;
    element.style.transform = originalTransform;
  };
};
