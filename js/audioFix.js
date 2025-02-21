window.addEventListener('click', function resumeAudioContext() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (AudioCtx) {
    // Create a dummy AudioContext and resume if needed
    const ac = new AudioCtx();
    if (ac.state === 'suspended') {
      ac.resume().then(() => {
        console.log('AudioContext resumed');
      }).catch(err => console.error('AudioContext resume failed:', err));
    }
  }
  window.removeEventListener('click', resumeAudioContext);
});