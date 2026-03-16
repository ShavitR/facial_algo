/**
 * Statistical Biometric Analysis Algorithm (v4.0 - V2 Improved)
 * Enhanced with rotation compensation and expanded morphological metrics.
 */

/**
 * Checks if the face is occluded based on landmark ratios.
 */
export const checkOcclusion = (landmarks) => {
    const pts = landmarks.positions;
    const jawWidth = Math.abs(pts[16].x - pts[0].x);
    const eyeDist = Math.abs(pts[45].x - pts[36].x);
    return eyeDist < jawWidth * 0.25;
};

/**
 * Detects head rotation (Yaw/Pitch) to calculate confidence levels.
 */
const calculateConfidence = (points, box) => {
    // Estimating Yaw through iris offset within orbital box
    const leftIrisX = (points[37].x + points[38].x + points[40].x + points[41].x) / 4;
    const rightIrisX = (points[43].x + points[44].x + points[46].x + points[47].x) / 4;
    
    const leftEyeWidth = points[39].x - points[36].x;
    const rightEyeWidth = points[45].x - points[42].x;
    
    const leftOffset = (leftIrisX - points[36].x) / leftEyeWidth;
    const rightOffset = (rightIrisX - points[42].x) / rightEyeWidth;
    
    const yawBias = Math.abs(leftOffset - (1 - rightOffset));
    
    // Estimating Pitch through vertical compression of the midface
    const eyeY = (points[36].y + points[45].y) / 2;
    const noseY = points[33].y;
    const mouthY = points[62].y;
    const midfaceRatio = (noseY - eyeY) / (mouthY - noseY);
    
    // Ideal midface ratio is ~1.0; deviations suggest pitch tilt
    const pitchBias = Math.abs(1.0 - midfaceRatio);
    
    const confidence = Math.max(0, 100 - (yawBias * 200) - (pitchBias * 50));
    return {
        score: confidence,
        yawSign: leftOffset > (1 - rightOffset) ? 'right' : 'left',
        isReliable: confidence > 85
    };
};

/**
 * Processes a single frame to extract high-precision biometric data.
 */
const processSingleFrame = (landmarks, box) => {
    const points = landmarks.positions;
    const { score: confidenceScore, isReliable } = calculateConfidence(points, box);

    // Dynamic Menton & Baseline Calibration
    const philtrumDist = Math.abs(points[51].y - points[33].y);
    const mentonY = points[8].y + (philtrumDist * 0.5);
    const hairlineY = box.top;
    const glabellaY = (points[21].y + points[22].y) / 2;
    const subnasaleY = points[33].y;
    const midlineX = (points[27].x + points[28].x + points[29].x + points[30].x) / 4;

    // Vertical Harmony (Facial Thirds)
    const totalHeight = mentonY - hairlineY;
    const upperThird = (glabellaY - hairlineY) / totalHeight;
    const middleThird = (subnasaleY - glabellaY) / totalHeight;
    const lowerThird = (mentonY - subnasaleY) / totalHeight;

    // Widths & Indices
    const bizygomaticWidth = Math.abs(points[16].x - points[0].x);
    const bigonialWidth = Math.abs(points[12].x - points[4].x);
    const nasalWidth = Math.abs(points[35].x - points[31].x);
    const noseHeight = Math.abs(points[33].y - glabellaY);
    const nasalIndex = nasalWidth / noseHeight;
    
    // Lower Face Ratios
    const philtrumHeight = Math.abs(points[51].y - points[33].y);
    const chinHeight = Math.max(0.1, Math.abs(mentonY - points[57].y));
    const philtrumChinRatio = philtrumHeight / chinHeight;

    // Orbital Suite (IPD, ESR, Tilt)
    const leftPupil = { x: (points[37].x + points[40].x) / 2, y: (points[37].y + points[40].y) / 2 };
    const rightPupil = { x: (points[43].x + points[46].x) / 2, y: (points[43].y + points[46].y) / 2 };
    const ipd = Math.sqrt(Math.pow(rightPupil.x - leftPupil.x, 2) + Math.pow(rightPupil.y - leftPupil.y, 2));
    
    const intercanthalWidth = Math.abs(points[42].x - points[39].x);
    const biocularWidth = Math.abs(points[45].x - points[36].x);
    const orbitalRatio = intercanthalWidth / biocularWidth;

    const midfaceHeight = Math.abs(points[51].y - ((leftPupil.y + rightPupil.y) / 2));
    const midfaceRatio = ipd / midfaceHeight;

    const leftTilt = Math.atan2(points[39].y - points[36].y, points[39].x - points[36].x) * (180 / Math.PI);
    const rightTilt = Math.atan2(points[42].y - points[45].y, points[45].x - points[42].x) * (180 / Math.PI);

    const upperFaceHeight = Math.abs(points[51].y - points[27].y);
    const fwhrValue = bizygomaticWidth / upperFaceHeight;

    // Symmetry Map
    let symmetryDiff = 0;
    [[36, 45], [39, 42], [31, 35], [48, 54]].forEach(([l, r]) => {
        symmetryDiff += Math.abs(Math.abs(points[l].x - midlineX) - Math.abs(points[r].x - midlineX));
    });
    const symmetryValue = Math.max(0, 100 - (symmetryDiff * 1.5));

    // Structural Estimates
    const maxillaryDepth = (subnasaleY - ((leftPupil.y + rightPupil.y) / 2)) / biocularWidth;
    const buccalWidth = Math.abs(points[13].x - points[3].x);
    const cheekHollowIndex = bizygomaticWidth / buccalWidth;

    return {
        fwhr: fwhrValue,
        symmetry: symmetryValue,
        nasalIndex: nasalIndex,
        orbitalRatio: orbitalRatio,
        maxillaryDepth: maxillaryDepth,
        cheekHollow: cheekHollowIndex,
        philtrumChin: philtrumChinRatio,
        thirds: { upper: upperThird, middle: middleThird, lower: lowerThird },
        tilts: { left: leftTilt, right: rightTilt },
        midface: midfaceRatio,
        confidence: confidenceScore,
        isReliable: isReliable,
        points: { hairline: hairlineY, glabella: glabellaY, subnasale: subnasaleY, menton: mentonY, midlineX }
    };
};

/**
 * Main V5 Entry Point: Processes Front, Right, and Left frames with Archetype Intelligence.
 */
export const processMultiAngle = (frames) => {
    const { front, right, left } = frames;
    const f = processSingleFrame(front.landmarks, front.box);
    
    const analyzeProfile = (landmarks) => {
        const p = landmarks.positions;
        const chinDepth = Math.abs(p[8].x - p[33].x); 
        const noseProj = Math.abs(p[30].x - p[27].x);
        return { chinDepth, noseProj };
    };

    const rightP = right ? analyzeProfile(right.landmarks) : null;
    const leftP = left ? analyzeProfile(left.landmarks) : null;

    const avgProjection = (rightP && leftP) ? (rightP.chinDepth + leftP.chinDepth) / 2 : (rightP?.chinDepth || leftP?.chinDepth || 0);
    const isLeannessHigh = f.cheekHollow > 0.95;
    
    const indicators = {
        lowfWHR: f.fwhr < 1.85,
        asymmetry: f.symmetry < 92,
        flatMaxilla: f.maxillaryDepth < 0.35,
        softJawline: !isLeannessHigh,
        longMidface: f.thirds.middle > 0.38,
        shortChin: f.philtrumChin > 0.55
    };

    const recs = [];
    
    // Archetype: Structural Mass
    if (indicators.lowfWHR && indicators.flatMaxilla) {
        recs.push({ t: "Structural Framework Expansion", d: "Combined fWHR and Projection indicators suggest under-developed maxillary support. Priority: Resistance chewing and posture correction." });
    } else if (indicators.flatMaxilla) {
        recs.push({ t: "Maxillary Projection", d: "Profile projection tracks lower than frontal volume. Focus on face-pulling or orthotropic tongue posture." });
    }

    // Archetype: Definition & Tissue
    if (indicators.softJawline) {
        recs.push({ t: "Soft Tissue Management", d: "Jawline definition is obscured. Recommended: Body fat percentage reduction relative to bone structural width." });
    }

    // Archetype: Harmony
    if (indicators.longMidface) recs.push({ t: "Midface Compression", d: "Vertical midface height exceeds optimal ratios. Focus on visual consolidation through grooming." });
    if (f.symmetry < 95) recs.push({ t: "Dynamic Symmetry", d: "Structural asymmetry visible. Priority: Unilateral chewing correction." });
    if (indicators.shortChin) recs.push({ t: "Mentalis Support", d: "Chin projection is insufficient relative to the upper-lip region." });

    if (recs.length === 0) recs.push({ t: "Elite Structural Lock", d: "Biometric harmony detected across all three angles." });

    // High-Rigor Composite Scoring
    let score = (f.symmetry * 0.3) + 
                (f.fwhr > 1.8 ? 20 : 10) + 
                (isLeannessHigh ? 15 : 5) + 
                (avgProjection > 35 ? 15 : 5) + 
                (f.thirds.middle < 0.35 ? 20 : 10);

    return {
        version: "5.1.0-v5-restored",
        score: Math.min(100, Math.round(score)),
        confidence: f.confidence,
        metrics: {
            symmetry: f.symmetry.toFixed(1),
            fwhr: f.fwhr.toFixed(2),
            projection: avgProjection.toFixed(1),
            leanness: isLeannessHigh ? "High" : "Moderate",
            midfaceRatio: f.midface.toFixed(2),
            facialThirds: `${(f.thirds.upper*100).toFixed(0)}% | ${(f.thirds.middle*100).toFixed(0)}% | ${(f.thirds.lower*100).toFixed(0)}%`
        },
        recommendations: recs
    };
};

// Backwards compatibility for single image
export const processLandmarks = (landmarks, box) => {
    return processMultiAngle({ front: { landmarks, box } });
};
