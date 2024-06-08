console.log("Use deviceId query param to request a specific device.");

navigator.mediaDevices
  .enumerateDevices()
  .then((devices) =>
    devices.filter((d) => d.kind === "videoinput" || d.kind === "audioinput")
  )
  .then((devices) =>
    devices
      .map((d) => {
        return "[" + d.kind + "] " + d.label + ": " + d.deviceId;
      })
      .join("\n\n")
  )
  .then(console.log);

const urlParams = new URLSearchParams(window.location.search);
const videoDeviceId = urlParams.get("deviceId");
const audioDeviceId = urlParams.get("audioDeviceId");

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
      if (error.name === 'NotFoundError') {
        alert('No microphone detected.');
      }
    });
}

function enterFullscreen() {
  const element = document.documentElement;

  if (element.requestFullscreen) {
    element.requestFullscreen();
  } else if (element.mozRequestFullScreen) {
    element.mozRequestFullScreen();
  } else if (element.msRequestFullscreen) {
    element.msRequestFullscreen();
  } else if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen();
  }
}

// Call startVideo and show the no-video message initially
document.addEventListener("DOMContentLoaded", function() {
  startVideo();
  document.getElementById('no-video').style.display = 'block';
});

