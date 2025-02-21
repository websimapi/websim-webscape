function initializeCompass() {
  const compassContainer = document.getElementById('compass-container');
  let previousAngle = 0;

  // Calculate shortest rotation path
  function getShortestRotation(current, target) {
    // Normalize angles to 0-360 range
    current = ((current % 360) + 360) % 360;
    target = ((target % 360) + 360) % 360;
    
    // Calculate the difference
    let diff = target - current;
    
    // Adjust for shortest path
    if (diff > 180) {
      diff -= 360;
    } else if (diff < -180) {
      diff += 360;
    }
    
    return diff;
  }
  
  // Listen for camera direction updates from the iframe
  window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'cameraDirection') {
      // Get the new target angle (negative because we want to rotate opposite to camera)
      const targetAngle = -Math.round(event.data.direction);
      
      // Calculate the shortest rotation path from previous angle
      const rotationDiff = getShortestRotation(previousAngle, targetAngle);
      
      // Update the compass rotation using the calculated difference
      const newAngle = previousAngle + rotationDiff;
      if (compassContainer) {
        compassContainer.style.transform = `rotate(${newAngle}deg)`;
      }
      
      // Store the new angle for next calculation
      previousAngle = newAngle;
    }
  });

  // Request camera direction updates with retry logic
  function requestCameraDirection() {
    const iframe = document.querySelector('#game-screen iframe');
    if (iframe && iframe.contentWindow) {
      try {
        iframe.contentWindow.postMessage('getCameraDirection', '*');
      } catch (e) {
        console.log('Could not request camera direction yet, will retry');
      }
    }
  }

  // Wait for iframe to load before starting compass updates
  const gameIframe = document.querySelector('#game-screen iframe');
  if (gameIframe) {
    gameIframe.addEventListener('load', () => {
      // Start polling for camera direction after iframe loads
      setInterval(requestCameraDirection, 100);
    });
  }
}

export { initializeCompass };