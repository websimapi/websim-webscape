function initializeCompass() {
  const compassContainer = document.getElementById('compass-container');
  const compassLetters = {
    n: document.getElementById('compass-n'),
    s: document.getElementById('compass-s'),
    e: document.getElementById('compass-e'),
    w: document.getElementById('compass-w')
  };
  
  let previousAngle = 0;
  let animationFrameId = null;

  // Calculate shortest rotation path
  function getShortestRotation(current, target) {
    current = ((current % 360) + 360) % 360;
    target = ((target % 360) + 360) % 360;
    
    let diff = target - current;
    
    if (diff > 180) {
      diff -= 360;
    } else if (diff < -180) {
      diff += 360;
    }
    
    return diff;
  }

  // Throttle compass updates using requestAnimationFrame
  let lastMessageTime = 0;
  const THROTTLE_MS = 50; // Limit updates to 20fps

  window.addEventListener('message', (event) => {
    if (event.data.type === 'cameraDirection') {
      const now = performance.now();
      if (now - lastMessageTime < THROTTLE_MS) {
        return;
      }
      lastMessageTime = now;

      const targetAngle = -Math.round(event.data.direction);
      const rotationDiff = getShortestRotation(previousAngle, targetAngle);
      const newAngle = previousAngle + rotationDiff;
      
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      
      animationFrameId = requestAnimationFrame(() => {
        compassContainer.style.transform = `rotate(${newAngle}deg)`;
        previousAngle = newAngle;
      });
    }
  });

  function requestCameraDirection() {
    const iframe = document.querySelector('#game-screen iframe');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage('getCameraDirection', '*');
    }
  }

  let updateInterval = setInterval(requestCameraDirection, 100);

  // Cleanup when page unloads
  window.addEventListener('unload', () => {
    clearInterval(updateInterval);
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
  });
}

export { initializeCompass };