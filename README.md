# Capture Card Viewer

This tool displays fullscreen video out of cheap usb capture cards that appear as a webcam.

Double-click the player window to enter fullscreen.

## Selecting specific devices

The browser selects the first device in the list. In order to select as specific device you can use the `deviceId` and `audioDeviceId` query params.
The IDs of all connected devices are logged to the browser console.
Audio will only be enabled when `audioDeviceId` is set.
