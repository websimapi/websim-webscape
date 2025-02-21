function initializeCompass() {
  const compassContainer = document.getElementById('compass-container');
  const compassDirections = {
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
  
  // Counter-rotate the direction letters to keep them upright
  function updateDirectionLetters(angle) {
    const inverseAngle = -angle;
    for (const direction in compassDirections) {
      compassDirections[direction].style.transform = 
        `${compassDirections[direction].dataset.baseTransform} rotate(${inverseAngle}deg)`;
    }
  }

  // Store the base transforms
  compassDirections.n.dataset.baseTransform = 'translateX(-50%)';
  compassDirections.s.dataset.baseTransform = 'translateX(-50%)';
  compassDirections.e.dataset.baseTransform = 'translateY(-50%)';
  compassDirections.w.dataset.baseTransform = 'translateY(-50%)';
  
  window.addEventListener('message', (event) => {
    if (event.data.type === 'cameraDirection') {
      const targetAngle = -Math.round(event.data.direction);
      const rotationDiff = getShortestRotation(previousAngle, targetAngle);
      const newAngle = previousAngle + rotationDiff;
      
      compassContainer.style.transform = `rotate(${newAngle}deg)`;
      updateDirectionLetters(newAngle);
      
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