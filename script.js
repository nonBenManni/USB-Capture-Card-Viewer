function startVideo() {
  const constraints = {
    video: { width: 1920, height: 1080 },
    audio: true, // Enable audio by default
  };

  if (videoDeviceId) {
    constraints.video.deviceId = { exact: videoDeviceId };
  }

  if (audioDeviceId) {
    constraints.audio = {
      deviceId: { exact: audioDeviceId },
      autoGainControl: false,
      echoCancellation: false,
      googAutoGainControl: false,
      noiseSuppression: false,
    };
  } else {
    // Set audio constraints if audioDeviceId is not provided
    constraints.audio = {
      autoGainControl: false,
      echoCancellation: false,
      googAutoGainControl: false,
      noiseSuppression: false,
    };
  }

  console.log({ constraints });
  
  navigator.mediaDevices
    .getUserMedia(constraints)
    .then((stream) => {
      const videoElement = document.querySelector("video");
      videoElement.srcObject = stream;

      // Hide the no-video message
      document.getElementById('no-video').style.display = 'none';

      // Check the number of audio input devices
      navigator.mediaDevices.enumerateDevices().then(devices => {
        const audioDevices = devices.filter(device => device.kind === 'audioinput');
        if (audioDevices.length > 1) {
          // Show notification for multiple microphones
          showNotification('Multiple microphones detected, Consider specifying Device ID if you hear loopback.');
        }
      });

      // Create an audio context and connect the audio stream to it
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      
      // Create a compressor
      const compressor = audioContext.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-50, audioContext.currentTime);
      compressor.knee.setValueAtTime(40, audioContext.currentTime);
      compressor.ratio.setValueAtTime(12, audioContext.currentTime);
      compressor.attack.setValueAtTime(0, audioContext.currentTime);
      compressor.release.setValueAtTime(0.25, audioContext.currentTime);

      // Create an equalizer
      const equalizer = [
        { frequency: 60, gain: 5 },   // Boost low frequencies
        { frequency: 170, gain: 4 },  // Boost low-mid frequencies
        { frequency: 350, gain: 3 },  // Boost mid frequencies
        { frequency: 1000, gain: 2 }, // Boost upper-mid frequencies
        { frequency: 3500, gain: 1 }, // Boost presence frequencies
        { frequency: 10000, gain: 0 } // No boost for high frequencies
      ].map(({ frequency, gain }) => {
        const filter = audioContext.createBiquadFilter();
        filter.type = 'peaking';
        filter.frequency.setValueAtTime(frequency, audioContext.currentTime);
        filter.gain.setValueAtTime(gain, audioContext.currentTime);
        return filter;
      });

      // Connect the nodes
      source.connect(compressor);
      equalizer.reduce((prev, curr) => {
        prev.connect(curr);
        return curr;
      }, compressor).connect(audioContext.destination);
    })
    .catch((error) => {
      console.error('Error accessing media devices.', error);
      if (error.name === 'NotFoundError' || error.name === 'NotAllowedError') {
        // Request access to media devices again
        navigator.mediaDevices.getUserMedia(constraints)
          .then((stream) => {
            startVideo(); // Try starting video again if access is granted
          })
          .catch((error) => {
            alert('Failed to access camera and microphone.');
          });
      }
    });
}
