function initializeCompass() {
  const compassContainer = document.getElementById('compass-container');
  const compassLetters = {
    n: document.getElementById('compass-n'),
    s: document.getElementById('compass-s'),
    e: document.getElementById('compass-e'),
    w: document.getElementById('compass-w')
  };
  
  let previousAngle = 0;

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

  window.addEventListener('message', (event) => {
    if (event.data.type === 'cameraDirection') {
      const targetAngle = -Math.round(event.data.direction);
      const rotationDiff = getShortestRotation(previousAngle, targetAngle);
      const newAngle = previousAngle + rotationDiff;
      
      // Only rotate the compass container, letters will stay fixed
      compassContainer.style.transform = `rotate(${newAngle}deg)`;
      
      previousAngle = newAngle;
    }
  });

  function requestCameraDirection() {
    const iframe = document.querySelector('#game-screen iframe');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage('getCameraDirection', '*');
    }
  }

  setInterval(requestCameraDirection, 100);
}

export { initializeCompass };