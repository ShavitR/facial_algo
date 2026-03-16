# Facial Biometric Analysis Algorithm (v3.3)

This directory contains the core mathematical algorithm for facial analysis, isolated from the visual components and React state. It is designed to be highly portable and can be implemented in any JavaScript project.

## Files

- `facialAnalysis.js`: The pure JavaScript implementation of the analysis logic.

## Usage

The algorithm depends on data provided by **face-api.js** (specifically, the landmarks and detection box).

### 1. Prerequisites

Ensure you have `face-api.js` installed in your project:

```bash
npm install face-api.js
```

### 2. Integration Example

Import the functions and pass the detection results from `face-api.js` directly into the algorithm.

```javascript
import { processLandmarks, checkOcclusion } from './algo/facialAnalysis';

// ... inside your face-api.js detection loop ...
const detection = await faceapi.detectSingleFace(videoElement, options)
    .withFaceLandmarks();

if (detection) {
    // Optional: Check if the face is clear
    const isOccluded = checkOcclusion(detection.landmarks);
    
    if (!isOccluded) {
        // Execute the full analysis
        const results = processLandmarks(detection.landmarks, detection.detection.box);
        
        console.log("Analysis Results:", results);
        // results.fwhr -> 1.85
        // results.symmetry -> 92.5%
        // results.recommendations -> Array of growth protocols
    }
}
```

## Functions

### `checkOcclusion(landmarks)`
Returns `true` if the face is likely obstructed or the head is turned too far away from the camera.

### `processLandmarks(landmarks, box)`
The primary analysis engine. It calculates:
- **fWHR**: Facial Width to Height Ratio.
- **Symmetry**: Bilateral mapping relative to the midline.
- **Gonial Angle**: Mathematical estimation of jawline sharpness.
- **Vertical Thirds**: Proportional balance (Hairline : Brow : Subnasale : Menton).
- **Philtrum/Chin Ratio**: Vertical lower-face proportions.
- **Canthal Tilt**: Angle of the eye vector.
- **Structural Score**: An aggregated index based on all metrics.
- **Recommendations**: Dynamic text advice based on morphological deficiencies.

## Data Requirement
This algorithm uses the **68-point landmark model**. Ensure your model selection in `face-api.js` includes landmark weights.
