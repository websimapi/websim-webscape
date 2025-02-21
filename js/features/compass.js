function initializeCompass() {
  const compassContainer = document.getElementById('compass-container');
  let previousAngle = 0;

  // Calculate shortest rotation diff between current and target
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
  
  // Listen for camera direction updates from the iframe
  window.addEventListener('message', (event) => {
    if (event.data.type === 'cameraDirection') {
      // Get the new target angle (negative because we want to rotate opposite to camera)
      const targetAngle = -Math.round(event.data.direction);
      // Calculate minimal rotation step
      const rotationDiff = getShortestRotation(previousAngle, targetAngle);
      const newAngle = previousAngle + rotationDiff;
      compassContainer.style.transform = `rotate(${newAngle}deg)`;
      previousAngle = newAngle;
    }
  });

  // Request camera direction updates
  function requestCameraDirection() {
    const iframe = document.querySelector('#game-screen iframe');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage('getCameraDirection', '*');
    }
  }

  // Poll for camera direction every 100ms
  setInterval(requestCameraDirection, 100);
}

export { initializeCompass };