/**
 * Statistical Biometric Analysis Algorithm (v3.3)
 * Isolated from FaceScan.jsx
 */

/**
 * Checks if the face is occluded based on landmark ratios.
 * @param {Object} landmarks face-api.js landmarks object
 * @returns {Boolean} true if occluded
 */
export const checkOcclusion = (landmarks) => {
    const pts = landmarks.positions;
    const jawWidth = Math.abs(pts[16].x - pts[0].x);
    const eyeDist = Math.abs(pts[45].x - pts[36].x);
    return eyeDist < jawWidth * 0.25;
};

/**
 * Processes facial landmarks to calculate morphological metrics and recommendations.
 * @param {Object} landmarks face-api.js landmarks object
 * @param {Object} box face-api.js detection box
 * @returns {Object} analysis results including metrics and recommendations
 */
export const processLandmarks = (landmarks, box) => {
    const points = landmarks.positions;

    // v3.3: High-Phenotype Depth Calibration (Targeting 15% expansion for true chin depth)
    const mentonY = box.bottom + (box.height * 0.12);
    const hairlineY = box.top;

    const glabellaY = (points[21].y + points[22].y) / 2;
    const subnasaleY = points[33].y;
    const midlineX = (points[27].x + points[28].x + points[29].x + points[30].x) / 4;

    // Proportions
    const totalHeight = mentonY - hairlineY;
    const upperThird = (glabellaY - hairlineY) / totalHeight;
    const middleThird = (subnasaleY - glabellaY) / totalHeight;
    const lowerThird = (mentonY - subnasaleY) / totalHeight;

    // Analytic Ratios
    const bizygomaticWidth = Math.abs(points[16].x - points[0].x);
    const bigonialWidth = Math.abs(points[12].x - points[4].x);
    const jawCheekRatio = bigonialWidth / bizygomaticWidth;

    const philtrumHeight = Math.abs(points[51].y - points[33].y);
    const chinHeight = Math.max(0.1, Math.abs(mentonY - points[57].y));
    const philtrumChinRatio = philtrumHeight / chinHeight;

    const leftPupil = { x: (points[37].x + points[40].x) / 2, y: (points[37].y + points[40].y) / 2 };
    const rightPupil = { x: (points[43].x + points[46].x) / 2, y: (points[43].y + points[46].y) / 2 };
    const ipd = Math.sqrt(Math.pow(rightPupil.x - leftPupil.x, 2) + Math.pow(rightPupil.y - leftPupil.y, 2));
    const midfaceRatio = ipd / Math.abs(points[51].y - ((leftPupil.y + rightPupil.y) / 2));

    const leftTilt = Math.atan2(points[39].y - points[36].y, points[39].x - points[36].x) * (180 / Math.PI);
    const rightTilt = Math.atan2(points[42].y - points[45].y, points[45].x - points[42].x) * (180 / Math.PI);
    const avgTilt = (leftTilt + rightTilt) / 2;

    // v3.3.1: Mathematical fWHR Standardization
    // Width: Bizygomatic (Cheekbone to Cheekbone)
    // Height: Upper-Face (Brow [L27] to Upper Lip [L51])
    const upperFaceHeight = Math.abs(points[51].y - points[27].y);
    const fwhrValue = bizygomaticWidth / upperFaceHeight;

    let symmetryDiff = 0;
    [[36, 45], [39, 42], [31, 35], [48, 54]].forEach(([l, r]) => {
        symmetryDiff += Math.abs(Math.abs(points[l].x - midlineX) - Math.abs(points[r].x - midlineX));
    });
    const symmetryValue = Math.max(0, 100 - (symmetryDiff * 1.5));

    const a = points[4], b = points[8], c = points[0];
    const angle = Math.abs(Math.atan2(c.y - a.y, c.x - a.x) - Math.atan2(b.y - a.y, b.x - a.x)) * (180 / Math.PI);
    const gonialFix = angle > 180 ? 360 - angle : angle;

    // GENERATE RECOMMENDATIONS
    const recs = [];
    if (fwhrValue < 1.7) recs.push({ t: "FWHR Optimization", d: "Lower facial height exceeds width. Focus on Masseter development through resistance chewing (Hard gum) to widen bigonial breadth." });
    if (symmetryValue < 90) recs.push({ t: "Symmetry Alignment", d: "Bilateral variance detected. Ensure uniform mastication (chewing on both sides) and avoid side-sleeping to prevent soft tissue compression." });
    if (gonialFix > 130) recs.push({ t: "Jawline Definition", d: "Obtuse gonial angle detected. Implement orthotropic 'Mewing' (correct tongue posture) to encourage forward maxilla growth and sharpen ramus definition." });
    if (philtrumChinRatio > 0.6) recs.push({ t: "Vertical Diminishment", d: "Philtrum height is excessive relative to chin. Beard styling (leaving length on the chin) can visually compensate for a shorter mentum." });
    if (avgTilt < 0) recs.push({ t: "Canthal Alignment", d: "Negative canthal tilt detected. Focus on 'Hollow Cheek' exercises and eyebrow grooming (lifting the tail) to create a more predatory, positive tilt vector." });

    if (recs.length === 0) recs.push({ t: "Elite Structural Lock", d: "No major morphological deficiencies detected. Maintain current skeletal alignment and dental health." });

    return {
        fwhrValue: fwhrValue,
        fwhr: fwhrValue.toFixed(2),
        symmetryValue: symmetryValue,
        symmetry: symmetryValue.toFixed(1),
        gonial: Math.round(gonialFix),
        thirds: `${Math.round(upperThird * 100)}:${Math.round(middleThird * 100)}:${Math.round(lowerThird * 100)}`,
        philtrum: philtrumChinRatio.toFixed(2),
        midface: midfaceRatio.toFixed(2),
        tilt: avgTilt.toFixed(1) + "°",
        tiltValue: avgTilt,
        jawCheek: jawCheekRatio.toFixed(2),
        score: Math.floor((symmetryValue * 0.35) + (fwhrValue > 1.8 ? 20 : 10) + (gonialFix > 120 && gonialFix < 130 ? 25 : 10) + (philtrumChinRatio < 0.5 ? 20 : 0)),
        recommendations: recs,
        landmarks: landmarks,
        clinicalPoints: { hairline: hairlineY, glabella: glabellaY, subnasale: subnasaleY, menton: mentonY, midlineX: midlineX }
    };
};
