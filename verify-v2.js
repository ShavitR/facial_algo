/**
 * Verification Script for Facial Analysis V2 (V4 Multi-Angle)
 */
import { processMultiAngle } from './facialAnalysisV2.js';

// --- MOCK DATA FACTORY ---
const createMockFrame = (offset = 0) => {
    const p = Array(68).fill(0).map(() => ({ x: 150 + offset, y: 150 }));

    // Landmarks for skeletal depth (Profile view simulation)
    p[8] = { x: 150 + offset, y: 300 }; // Menton
    p[33] = { x: 150 + (offset * 1.5), y: 200 }; // Subnasale
    p[27] = { x: 150 + offset, y: 150 }; // Nasion
    p[30] = { x: 155 + (offset * 2), y: 200 }; // Nose Tip

    // Frontal Proportions
    p[0] = { x: 50 + offset, y: 150 }; p[16] = { x: 250 + offset, y: 150 };
    p[4] = { x: 80 + offset, y: 250 }; p[12] = { x: 220 + offset, y: 250 };
    
    // Eyes
    p[36] = { x: 110 + offset, y: 140 }; p[39] = { x: 140 + offset, y: 140 };
    p[42] = { x: 160 + offset, y: 140 }; p[45] = { x: 190 + offset, y: 140 };
    // Center irises
    [37, 38, 40, 41, 43, 44, 46, 47].forEach(i => { p[i].x = 150 + offset; p[i].y = 140; });

    // Tissue points
    p[3] = { x: 65 + offset, y: 230 }; p[13] = { x: 235 + offset, y: 230 };
    p[48] = { x: 130 + offset, y: 240 }; p[54] = { x: 170 + offset, y: 240 };
    p[51] = { x: 150 + offset, y: 220 }; p[57] = { x: 150 + offset, y: 270 };

    return { 
        landmarks: { positions: p }, 
        box: { top: 50, bottom: 300, left: 50 + offset, right: 250 + offset } 
    };
};

// --- MULTI-ANGLE VERIFICATION ---
console.log("--- MULTI-ANGLE BIOMETRIC VERIFICATION (V4) ---");

const frames = {
    front: createMockFrame(0),
    right: createMockFrame(20),
    left: createMockFrame(-20)
};

const result = processMultiAngle(frames);

console.log(`\nVersion: ${result.version}`);
console.log(`Final Score: ${result.score}/100`);
console.log(`Confidence: ${result.confidence.toFixed(1)}%`);

console.log("\nCOMPOSITE METRICS:");
console.log(`- Symmetry: ${result.metrics.symmetry}%`);
console.log(`- fWHR: ${result.metrics.fwhr}`);
console.log(`- Facial Thirds: ${result.metrics.facialThirds}`);
console.log(`- Midface Ratio: ${result.metrics.midfaceRatio}`);
console.log(`- Skeletal Projection: ${result.metrics.projection}`);
console.log(`- Tissue Leanness: ${result.metrics.leanness}`);

console.log("\nADVANCED RECOMMENDATIONS:");
result.recommendations.forEach(r => console.log(`[${r.t}] ${r.d}`));
