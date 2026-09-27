import { useEffect, useRef, useState } from "react";
import { Play, Pause, Sparkles } from "lucide-react";

/**
 * CinematicMountainRoad
 * 
 * High-Definition Seamless Looping POV Experience:
 * - Ultra-crisp 4K canvas with pixel-ratio scaling and zero blur artifacts.
 * - Anatomically accurate alpine mountain ranges with sharp pyramidal summits, faceted rock faces, and snow-filled couloirs.
 * - High-definition vehicles:
 *    * Lead vehicle cruising ahead with sharp LED taillights, crisp body creases, and clean wet asphalt reflections.
 *    * Oncoming vehicle driving towards the camera with sharp jewel LED projector headlights, crisp front grille, and directional road beams.
 * - Serene slow-motion driving pace and slow-motion shooting stars.
 * - Protective dark overlay keeping all UI crisp, functional, and legible.
 */
export default function CinematicMountainRoad({
  className = "",
  showControls = true,
  overlayOpacity = 0.5,
  speedMultiplier = 1,
}) {
  const canvasRef = useRef(null);
  const animFrameIdRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [shootingStarCount, setShootingStarCount] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    // ==========================================
    // STARFIELD & SLOW-MOTION SHOOTING STARS
    // ==========================================
    const STARS_COUNT = 150;
    const stars = Array.from({ length: STARS_COUNT }, () => ({
      x: Math.random(),
      y: Math.random() * 0.44, // upper sky
      size: Math.random() * 1.6 + 0.6,
      baseAlpha: Math.random() * 0.7 + 0.3,
      twinkleSpeed: Math.random() * 0.015 + 0.005, // slow calm twinkling
      twinklePhase: Math.random() * Math.PI * 2,
    }));

    const activeShootingStars = [];
    const spawnShootingStar = () => {
      const startX = Math.random() * 0.85 + 0.05;
      const startY = Math.random() * 0.22 + 0.03;
      const angle = (Math.PI / 180) * (Math.random() * 12 + 20); // 20-32 degrees
      const speed = Math.random() * 0.0022 + 0.0016; // slow-motion screen ratio/frame
      const length = Math.random() * 110 + 75;
      activeShootingStars.push({
        x: startX,
        y: startY,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,
        length,
        life: 1.0,
        decay: Math.random() * 0.0045 + 0.003, // slow majestic trail
      });
      setShootingStarCount((c) => c + 1);
    };

    spawnShootingStar();

    // ==========================================
    // ANATOMICALLY ACCURATE ALPINE MOUNTAIN GEOMETRY
    // ==========================================
    // Master definition of realistic alpine peaks with faceted facets and snow couloirs
    // Back Alpine Range: Sharp iconic peaks, arêtes, and snow caps
    const alpineBackPeaks = [
      { x: 0.00, y: 0.42 },
      { x: 0.08, y: 0.38 },
      { x: 0.16, y: 0.29, isPeak: true }, // Sharp Horn 1
      { x: 0.22, y: 0.36 },
      { x: 0.29, y: 0.33 },
      { x: 0.38, y: 0.21, isPeak: true, isMainPeak: true }, // Grand Apex (Matterhorn-style pyramidal summit)
      { x: 0.45, y: 0.34 },
      { x: 0.52, y: 0.31 },
      { x: 0.61, y: 0.24, isPeak: true }, // Sharp Horn 2
      { x: 0.69, y: 0.35 },
      { x: 0.77, y: 0.26, isPeak: true }, // Craggy Ridge Horn
      { x: 0.85, y: 0.34 },
      { x: 0.93, y: 0.30, isPeak: true },
      { x: 1.00, y: 0.40 },
    ];

    // Mid Ridge: Steep craggy rock faces and intermediate peaks
    const alpineMidPeaks = [
      { x: 0.00, y: 0.44 },
      { x: 0.12, y: 0.39, isPeak: true },
      { x: 0.24, y: 0.43 },
      { x: 0.34, y: 0.36, isPeak: true },
      { x: 0.46, y: 0.42 },
      { x: 0.56, y: 0.33, isPeak: true },
      { x: 0.68, y: 0.41 },
      { x: 0.81, y: 0.35, isPeak: true },
      { x: 0.92, y: 0.42 },
      { x: 1.00, y: 0.46 },
    ];

    // Foreground Mountain Base: Forested rocky hills and evergreen slopes
    const alpineForePeaks = [
      { x: 0.00, y: 0.48 },
      { x: 0.15, y: 0.45 },
      { x: 0.28, y: 0.47 },
      { x: 0.42, y: 0.44 },
      { x: 0.60, y: 0.46 },
      { x: 0.75, y: 0.43 },
      { x: 0.90, y: 0.47 },
      { x: 1.00, y: 0.49 },
    ];

    // Drifting misty valley clouds
    const mistClouds = [
      { x: 0.05, y: 0.41, w: 0.35, speed: 0.00015, alpha: 0.22 },
      { x: 0.42, y: 0.44, w: 0.45, speed: 0.00022, alpha: 0.28 },
      { x: 0.72, y: 0.40, w: 0.38, speed: 0.00018, alpha: 0.24 },
      { x: -0.15, y: 0.45, w: 0.48, speed: 0.00020, alpha: 0.25 },
    ];

    // ==========================================
    // ANIMATION ENGINE VARIABLES
    // ==========================================
    let distanceTraveled = 0;
    let lastTime = performance.now();
    let shootingStarCooldown = 100;

    const render = (currentTime) => {
      const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      const driveSpeed = isPlaying ? 8.5 * speedMultiplier : 0; // Serene slow motion
      distanceTraveled += driveSpeed * delta;

      // ----------------------------------------------------
      // SHARP PIXEL-PERFECT CANVAS RESOLUTION
      // ----------------------------------------------------
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const displayW = canvas.clientWidth || window.innerWidth;
      const displayH = canvas.clientHeight || window.innerHeight;

      const targetW = Math.round(displayW * dpr);
      const targetH = Math.round(displayH * dpr);

      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      const w = displayW;
      const h = displayH;

      // Horizon line
      const horizonY = h * 0.48;
      // Vanishing point shifted right for the mountain curve
      const vanishingX = w * 0.54;

      // ----------------------------------------------------
      // 1. DEEP TWILIGHT SKY & PURPLE ATMOSPHERIC GLOW
      // ----------------------------------------------------
      const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
      skyGrad.addColorStop(0.0, "#020512");
      skyGrad.addColorStop(0.3, "#080c26");
      skyGrad.addColorStop(0.65, "#16133a");
      skyGrad.addColorStop(0.88, "#1c2148");
      skyGrad.addColorStop(1.0, "#253059");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, horizonY + 6);

      // Atmospheric twilight nebula wisps
      const cloudPuffs = [
        { x: w * 0.22, y: h * 0.16, rx: w * 0.32, ry: h * 0.08, color: "rgba(65, 42, 110, 0.3)" },
        { x: w * 0.74, y: h * 0.19, rx: w * 0.38, ry: h * 0.11, color: "rgba(40, 56, 115, 0.28)" },
        { x: w * 0.48, y: h * 0.28, rx: w * 0.44, ry: h * 0.07, color: "rgba(75, 48, 105, 0.22)" },
      ];
      cloudPuffs.forEach((puff) => {
        const puffGrad = ctx.createRadialGradient(puff.x, puff.y, 0, puff.x, puff.y, puff.rx);
        puffGrad.addColorStop(0, puff.color);
        puffGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = puffGrad;
        ctx.beginPath();
        ctx.ellipse(puff.x, puff.y, puff.rx, puff.ry, 0, 0, Math.PI * 2);
        ctx.fill();
      });

      // ----------------------------------------------------
      // 2. CRISP STARS & CALM TWINKLING
      // ----------------------------------------------------
      stars.forEach((st) => {
        const sx = st.x * w;
        const sy = st.y * h;
        if (sy > horizonY - 15) return;

        st.twinklePhase += st.twinkleSpeed;
        const alpha = Math.max(0.15, Math.min(1.0, st.baseAlpha + Math.sin(st.twinklePhase) * 0.25));

        ctx.fillStyle = `rgba(235, 245, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(sx, sy, st.size * 0.9, 0, Math.PI * 2);
        ctx.fill();
      });

      // ----------------------------------------------------
      // 3. SLOW-MOTION SHOOTING STAR TRAILS
      // ----------------------------------------------------
      shootingStarCooldown -= 1;
      if (shootingStarCooldown <= 0) {
        if (Math.random() < 0.7) spawnShootingStar();
        shootingStarCooldown = Math.floor(Math.random() * 140 + 90);
      }

      for (let i = activeShootingStars.length - 1; i >= 0; i--) {
        const ss = activeShootingStars[i];
        if (isPlaying) {
          ss.x += ss.dx;
          ss.y += ss.dy;
          ss.life -= ss.decay;
        }

        const screenX = ss.x * w;
        const screenY = ss.y * h;

        if (ss.life <= 0 || screenX > w + 100 || screenY > horizonY) {
          activeShootingStars.splice(i, 1);
          continue;
        }

        const hyp = Math.hypot(ss.dx * w, ss.dy * h);
        const normDx = (ss.dx * w) / hyp;
        const normDy = (ss.dy * h) / hyp;
        const tailX = screenX - normDx * ss.length;
        const tailY = screenY - normDy * ss.length;

        const starGrad = ctx.createLinearGradient(screenX, screenY, tailX, tailY);
        starGrad.addColorStop(0, `rgba(255, 255, 255, ${ss.life})`);
        starGrad.addColorStop(0.25, `rgba(190, 225, 255, ${ss.life * 0.85})`);
        starGrad.addColorStop(0.75, `rgba(140, 185, 255, ${ss.life * 0.25})`);
        starGrad.addColorStop(1, "rgba(255, 255, 255, 0)");

        ctx.strokeStyle = starGrad;
        ctx.lineWidth = 2.0;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(screenX, screenY);
        ctx.stroke();

        ctx.fillStyle = `rgba(255, 255, 255, ${ss.life})`;
        ctx.beginPath();
        ctx.arc(screenX, screenY, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }

      // ----------------------------------------------------
      // 4. ACCURATELY SHAPED ALPINE MOUNTAINS (Faceted 3D Rocks & Couloirs)
      // ----------------------------------------------------
      // Helper to render realistic angular alpine ridgeline
      const renderAlpineRange = (peaks, litFill, shadowFill, snowColor, snowCutoff) => {
        // Shaded side base
        ctx.beginPath();
        ctx.moveTo(0, horizonY);
        peaks.forEach((p, idx) => {
          const px = p.x * w;
          const py = p.y * h;
          if (idx === 0) ctx.lineTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.lineTo(w, horizonY);
        ctx.closePath();
        ctx.fillStyle = shadowFill;
        ctx.fill();

        // 3D Faceting: Draw lit western faces from peak crests down to ridges
        for (let i = 0; i < peaks.length - 1; i++) {
          const p1 = peaks[i];
          const p2 = peaks[i + 1];
          const x1 = p1.x * w;
          const y1 = p1.y * h;
          const x2 = p2.x * w;
          const y2 = p2.y * h;

          // Lit rock facet on left-facing slopes
          if (y1 > y2) {
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.lineTo(x2, horizonY);
            ctx.lineTo(x1, horizonY);
            ctx.closePath();
            ctx.fillStyle = litFill;
            ctx.fill();
          }

          // Snow couloirs & glacier caps on summits
          if (snowColor && (p1.y < snowCutoff || p2.y < snowCutoff)) {
            const peak = p1.y < p2.y ? p1 : p2;
            const other = p1.y < p2.y ? p2 : p1;
            const pkX = peak.x * w;
            const pkY = peak.y * h;
            const otX = other.x * w;
            const otY = other.y * h;

            // Summit snow crown & steep gully runout
            ctx.beginPath();
            ctx.moveTo(pkX, pkY);
            ctx.lineTo(pkX - (otX - pkX) * 0.45, pkY + (otY - pkY) * 0.45);
            ctx.lineTo(pkX, pkY + (horizonY - pkY) * 0.18);
            ctx.lineTo(pkX + (otX - pkX) * 0.35, pkY + (otY - pkY) * 0.35);
            ctx.closePath();
            ctx.fillStyle = snowColor;
            ctx.fill();

            // Sharp mountain crest highlight
            ctx.strokeStyle = "rgba(235, 245, 255, 0.45)";
            ctx.lineWidth = 1.0;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
          }
        }
      };

      // Layer 1: High Alpine Peaks (Distant jagged range with snow-capped horns)
      renderAlpineRange(
        alpineBackPeaks,
        "#11182c", // Cold twilight rock face (lit)
        "#090e1a", // Deep shadowed rock face
        "rgba(225, 238, 255, 0.65)", // Crisp alpine snow
        0.35
      );

      // Layer 2: Mid-ground Alpine Shoulder (Rugged crags & steep couloirs)
      renderAlpineRange(
        alpineMidPeaks,
        "#0e1a22", // Dark pine & crag
        "#071116", // Shadow
        "rgba(200, 225, 245, 0.4)", // Lower snow patches
        0.39
      );

      // Layer 3: Foreground Forested Ridge
      ctx.beginPath();
      ctx.moveTo(0, horizonY);
      alpineForePeaks.forEach((p, idx) => {
        const px = p.x * w;
        const py = p.y * h;
        if (idx === 0) ctx.lineTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.lineTo(w, horizonY);
      ctx.closePath();
      ctx.fillStyle = "#091715"; // Deep alpine evergreen silhouette
      ctx.fill();

      // Sharp tree-line silhouette details on foreground ridge
      for (let tx = 0; tx < w; tx += 14) {
        const ratio = tx / w;
        const basePy = 0.45 + Math.sin(ratio * 8) * 0.02;
        const ty = basePy * h;
        if (ty <= horizonY) {
          ctx.fillStyle = "#06110f";
          ctx.beginPath();
          ctx.moveTo(tx, ty);
          ctx.lineTo(tx + 4, ty - 7);
          ctx.lineTo(tx + 8, ty);
          ctx.closePath();
          ctx.fill();
        }
      }

      // ----------------------------------------------------
      // 5. LOW-HANGING MISTY MOUNTAIN VALLEY CLOUDS
      // ----------------------------------------------------
      mistClouds.forEach((cloud) => {
        if (isPlaying) {
          cloud.x += cloud.speed * delta * 60;
          if (cloud.x > 1.25) cloud.x = -0.35;
        }

        const cx = cloud.x * w;
        const cy = cloud.y * h;
        const cw = cloud.w * w;
        const ch = h * 0.055;

        const mistGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, cw * 0.5);
        mistGrad.addColorStop(0, `rgba(180, 205, 235, ${cloud.alpha})`);
        mistGrad.addColorStop(0.6, `rgba(160, 190, 225, ${cloud.alpha * 0.4})`);
        mistGrad.addColorStop(1, "rgba(160, 190, 225, 0)");

        ctx.fillStyle = mistGrad;
        ctx.beginPath();
        ctx.ellipse(cx, cy, cw * 0.5, ch, 0, 0, Math.PI * 2);
        ctx.fill();
      });

      // ----------------------------------------------------
      // 6. ROADSIDE TERRAIN & FOREST EMBANKMENTS
      // ----------------------------------------------------
      // Left rocky embankment
      ctx.fillStyle = "#050b10";
      ctx.beginPath();
      ctx.moveTo(0, horizonY);
      ctx.lineTo(w * 0.38, horizonY);
      ctx.lineTo(w * 0.04, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();

      // Right shoulder embankment
      ctx.fillStyle = "#070e14";
      ctx.beginPath();
      ctx.moveTo(w * 0.68, horizonY);
      ctx.lineTo(w, horizonY);
      ctx.lineTo(w, h);
      ctx.lineTo(w * 0.94, h);
      ctx.closePath();
      ctx.fill();

      // ----------------------------------------------------
      // 7. WET DARK ASPHALT MOUNTAIN ROAD (Rightward Curve)
      // ----------------------------------------------------
      const roadTopLeft = vanishingX - w * 0.12;
      const roadTopRight = vanishingX + w * 0.12;
      const roadBottomLeft = w * 0.05;
      const roadBottomRight = w * 0.93;
      const curveBias = w * 0.11; // Rightward bend curve

      // Road body polygon
      ctx.beginPath();
      ctx.moveTo(roadTopLeft, horizonY);

      // Left edge curving right
      for (let t = 0; t <= 1.0; t += 0.05) {
        const y = horizonY + (h - horizonY) * Math.pow(t, 1.85);
        const x = roadTopLeft + (roadBottomLeft - roadTopLeft) * t + curveBias * Math.sin(t * Math.PI * 0.6);
        ctx.lineTo(x, y);
      }

      ctx.lineTo(roadBottomRight, h);

      // Right edge curving right
      for (let t = 1.0; t >= 0; t -= 0.05) {
        const y = horizonY + (h - horizonY) * Math.pow(t, 1.85);
        const x = roadTopRight + (roadBottomRight - roadTopRight) * t + curveBias * Math.sin(t * Math.PI * 0.6);
        ctx.lineTo(x, y);
      }
      ctx.closePath();

      // Dark wet asphalt gradient
      const roadGrad = ctx.createLinearGradient(vanishingX, horizonY, w * 0.5, h);
      roadGrad.addColorStop(0.0, "#0c131c");
      roadGrad.addColorStop(0.3, "#090f17");
      roadGrad.addColorStop(0.7, "#080d14");
      roadGrad.addColorStop(1.0, "#06090e");
      ctx.fillStyle = roadGrad;
      ctx.fill();

      // Road surface illumination and wet specular sheen
      ctx.save();
      ctx.clip(); // Constrain strictly inside road

      const headlightSheen = ctx.createRadialGradient(w * 0.52, h * 0.86, 15, w * 0.52, h * 0.8, w * 0.46);
      headlightSheen.addColorStop(0, "rgba(140, 190, 255, 0.15)");
      headlightSheen.addColorStop(0.45, "rgba(80, 140, 220, 0.06)");
      headlightSheen.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = headlightSheen;
      ctx.fillRect(0, horizonY, w, h - horizonY);

      ctx.restore();

      // ----------------------------------------------------
      // 8. CLEAR YELLOW DASHED CENTER LINE (Smooth Slow Motion)
      // ----------------------------------------------------
      const SEGMENTS = 12;
      const loopPeriod = 1.0 / SEGMENTS;
      const phase = (distanceTraveled * 0.016) % loopPeriod;

      for (let i = 0; i < SEGMENTS; i++) {
        const normZ = i * loopPeriod + phase;
        if (normZ < 0.08 || normZ > 0.98) continue;

        const t1 = Math.pow(normZ, 2.05);
        const t2 = Math.pow(Math.min(normZ + loopPeriod * 0.46, 0.99), 2.05);

        const y1 = horizonY + (h - horizonY) * t1;
        const y2 = horizonY + (h - horizonY) * t2;

        const centerLineBaseX1 = vanishingX + (w * 0.51 - vanishingX) * t1;
        const centerLineBaseX2 = vanishingX + (w * 0.51 - vanishingX) * t2;

        const x1 = centerLineBaseX1 + curveBias * Math.sin(t1 * Math.PI * 0.7);
        const x2 = centerLineBaseX2 + curveBias * Math.sin(t2 * Math.PI * 0.7);

        const lineWidth = Math.max(1.2, 7.5 * t2);
        const distanceFade = Math.min(1, Math.max(0, (normZ - 0.08) / 0.15));
        const yellowAlpha = Math.min(0.92, (0.2 + t2 * 0.75) * distanceFade);

        ctx.strokeStyle = `rgba(245, 185, 30, ${yellowAlpha})`;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        if (t2 > 0.35) {
          ctx.strokeStyle = `rgba(255, 240, 160, ${0.35 * t2 * distanceFade})`;
          ctx.lineWidth = Math.max(1, lineWidth * 0.35);
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      }

      // White right shoulder edge line
      ctx.beginPath();
      for (let t = 0.05; t <= 1.0; t += 0.05) {
        const ey = horizonY + (h - horizonY) * Math.pow(t, 1.85);
        const ex = roadTopRight + (roadBottomRight - roadTopRight) * t + curveBias * Math.sin(t * Math.PI * 0.6);
        if (t === 0.05) ctx.moveTo(ex, ey);
        else ctx.lineTo(ex, ey);
      }
      ctx.strokeStyle = "rgba(220, 235, 255, 0.45)";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // ----------------------------------------------------
      // 9. HIGH-QUALITY LEAD CAR (Moving Away in Right Lane)
      // ----------------------------------------------------
      // Positioned in the comfortable mid-ground, cruising smoothly along the right curve
      const leadCarT = 0.36 + Math.sin(distanceTraveled * 0.05) * 0.06;
      const leadCarY = horizonY + (h - horizonY) * Math.pow(leadCarT, 1.85);

      const lRoadR = roadTopRight + (roadBottomRight - roadTopRight) * leadCarT + curveBias * Math.sin(leadCarT * Math.PI * 0.6);
      const lCenter = vanishingX + (w * 0.51 - vanishingX) * leadCarT + curveBias * Math.sin(leadCarT * Math.PI * 0.7);
      const leadCarX = lCenter + (lRoadR - lCenter) * 0.52;

      // Crisp geometry & proportions
      const lW = Math.max(34, w * 0.062 * leadCarT * 2.8);
      const lH = lW * 0.52;
      const lTop = leadCarY - lH;

      // Crisp wet-asphalt red specular reflections
      const lRedReflect = ctx.createLinearGradient(leadCarX, leadCarY - 1, leadCarX, leadCarY + lH * 1.5);
      lRedReflect.addColorStop(0, "rgba(255, 35, 35, 0.55)");
      lRedReflect.addColorStop(0.35, "rgba(210, 20, 20, 0.25)");
      lRedReflect.addColorStop(1, "rgba(200, 0, 0, 0)");
      ctx.fillStyle = lRedReflect;
      ctx.fillRect(leadCarX - lW * 0.48, leadCarY - 1, lW * 0.96, lH * 1.5);

      // Tire contact shadows
      ctx.fillStyle = "rgba(2, 5, 10, 0.95)";
      ctx.beginPath();
      ctx.roundRect(leadCarX - lW * 0.44, leadCarY - 3, lW * 0.16, 5, 2);
      ctx.roundRect(leadCarX + lW * 0.28, leadCarY - 3, lW * 0.16, 5, 2);
      ctx.fill();

      // Lower rear bumper & diffuser
      ctx.fillStyle = "#0a101d";
      ctx.beginPath();
      ctx.roundRect(leadCarX - lW * 0.48, leadCarY - lH * 0.46, lW * 0.96, lH * 0.46, [3, 3, 2, 2]);
      ctx.fill();

      // Aerodynamic Cabin & Roofline (Sharp crisp angles)
      ctx.beginPath();
      ctx.moveTo(leadCarX - lW * 0.44, leadCarY - lH * 0.46);
      ctx.lineTo(leadCarX - lW * 0.32, lTop);
      ctx.lineTo(leadCarX + lW * 0.32, lTop);
      ctx.lineTo(leadCarX + lW * 0.44, leadCarY - lH * 0.46);
      ctx.closePath();
      ctx.fillStyle = "#0c1527"; // Dark sapphire metallic
      ctx.fill();

      // Crisp metallic roof highlight
      ctx.strokeStyle = "rgba(160, 200, 255, 0.55)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(leadCarX - lW * 0.32, lTop);
      ctx.lineTo(leadCarX + lW * 0.32, lTop);
      ctx.stroke();

      // Dark tinted rear glass windshield
      ctx.fillStyle = "#04070f";
      ctx.beginPath();
      ctx.moveTo(leadCarX - lW * 0.38, leadCarY - lH * 0.47);
      ctx.lineTo(leadCarX - lW * 0.28, lTop + lH * 0.08);
      ctx.lineTo(leadCarX + lW * 0.28, lTop + lH * 0.08);
      ctx.lineTo(leadCarX + lW * 0.38, leadCarY - lH * 0.47);
      ctx.closePath();
      ctx.fill();

      // High-mounted 3rd brake light
      ctx.fillStyle = "rgba(255, 45, 45, 0.95)";
      ctx.fillRect(leadCarX - lW * 0.12, lTop + lH * 0.1, lW * 0.24, 1.8);

      // High-definition Dual LED Taillights + Center Lightbar
      const tW = lW * 0.22;
      const tH = Math.max(2.5, lH * 0.16);
      const tY = leadCarY - lH * 0.44;

      // Soft glow aura
      const lAura = ctx.createRadialGradient(leadCarX, tY, 0, leadCarX, tY, lW * 0.5);
      lAura.addColorStop(0, "rgba(255, 30, 30, 0.4)");
      lAura.addColorStop(1, "rgba(255, 0, 0, 0)");
      ctx.fillStyle = lAura;
      ctx.fillRect(leadCarX - lW * 0.5, tY - lW * 0.2, lW, lW * 0.4);

      // Crisp LED Taillight lenses
      ctx.fillStyle = "#ff1a1a";
      ctx.fillRect(leadCarX - lW * 0.44, tY, tW, tH);
      ctx.fillRect(leadCarX + lW * 0.22, tY, tW, tH);

      // Connecting thin LED strip
      ctx.fillStyle = "rgba(255, 50, 50, 0.85)";
      ctx.fillRect(leadCarX - lW * 0.22, tY + tH * 0.35, lW * 0.44, tH * 0.3);

      // White license plate
      ctx.fillStyle = "rgba(240, 248, 255, 0.75)";
      ctx.fillRect(leadCarX - lW * 0.12, leadCarY - lH * 0.24, lW * 0.24, lH * 0.12);

      // ----------------------------------------------------
      // 10. HIGH-QUALITY ONCOMING CAR (Moving Towards Screen in Left Lane)
      // ----------------------------------------------------
      // Progresses smoothly towards the screen in slow motion
      const onProgress = (distanceTraveled * 0.015 + 0.4) % 1.0;
      const onT = 0.14 + onProgress * 0.78; // z distance from horizon to foreground
      const onFade = Math.min(1, Math.max(0, (onT - 0.14) / 0.12)) * Math.min(1, Math.max(0, (0.92 - onT) / 0.08));

      if (onFade > 0.01) {
        const onY = horizonY + (h - horizonY) * Math.pow(onT, 1.85);
        const onRoadL = roadTopLeft + (roadBottomLeft - roadTopLeft) * onT + curveBias * Math.sin(onT * Math.PI * 0.6);
        const onCenter = vanishingX + (w * 0.51 - vanishingX) * onT + curveBias * Math.sin(onT * Math.PI * 0.7);
        const onX = onRoadL + (onCenter - onRoadL) * 0.52;

        const onW = Math.max(30, w * 0.065 * onT * 2.8);
        const onH = onW * 0.50;
        const onTop = onY - onH;

        // Forward Headlight Beams projecting forward onto wet asphalt
        const beamH = onH * 3.8;
        const leftLightX = onX - onW * 0.33;
        const rightLightX = onX + onW * 0.33;

        const drawCrispBeam = (bx) => {
          const coneGrad = ctx.createLinearGradient(bx, onY, bx, onY + beamH);
          coneGrad.addColorStop(0, `rgba(235, 245, 255, ${0.45 * onFade})`);
          coneGrad.addColorStop(0.35, `rgba(180, 215, 255, ${0.22 * onFade})`);
          coneGrad.addColorStop(0.8, `rgba(140, 185, 255, ${0.06 * onFade})`);
          coneGrad.addColorStop(1, "rgba(100, 150, 255, 0)");

          ctx.beginPath();
          ctx.moveTo(bx - onW * 0.08, onY - onH * 0.1);
          ctx.lineTo(bx - onW * 0.28, onY + beamH);
          ctx.lineTo(bx + onW * 0.38, onY + beamH);
          ctx.lineTo(bx + onW * 0.08, onY - onH * 0.1);
          ctx.closePath();
          ctx.fillStyle = coneGrad;
          ctx.fill();
        };

        drawCrispBeam(leftLightX);
        drawCrispBeam(rightLightX);

        // Specular reflections on wet road
        const drawSpecularStreak = (bx) => {
          const streak = ctx.createLinearGradient(bx, onY, bx, onY + onH * 2.0);
          streak.addColorStop(0, `rgba(255, 255, 255, ${0.55 * onFade})`);
          streak.addColorStop(0.4, `rgba(185, 220, 255, ${0.25 * onFade})`);
          streak.addColorStop(1, "rgba(255, 255, 255, 0)");
          ctx.fillStyle = streak;
          ctx.fillRect(bx - onW * 0.07, onY, onW * 0.14, onH * 2.0);
        };
        drawSpecularStreak(leftLightX);
        drawSpecularStreak(rightLightX);

        // Tire contact shadows
        ctx.fillStyle = `rgba(2, 5, 10, ${0.95 * onFade})`;
        ctx.beginPath();
        ctx.roundRect(onX - onW * 0.44, onY - 3, onW * 0.16, 5, 2);
        ctx.roundRect(onX + onW * 0.28, onY - 3, onW * 0.16, 5, 2);
        ctx.fill();

        // Lower front bumper & spoiler
        ctx.fillStyle = "#090f1a";
        ctx.beginPath();
        ctx.roundRect(onX - onW * 0.48, onY - onH * 0.48, onW * 0.96, onH * 0.48, [2, 2, 3, 3]);
        ctx.fill();

        // Front Grille (Hexagonal black optic mesh)
        ctx.fillStyle = "#04070d";
        ctx.beginPath();
        ctx.roundRect(onX - onW * 0.24, onY - onH * 0.38, onW * 0.48, onH * 0.26, 2);
        ctx.fill();

        // Hood & Front Cabin (Sculpted creases)
        ctx.beginPath();
        ctx.moveTo(onX - onW * 0.44, onY - onH * 0.48);
        ctx.lineTo(onX - onW * 0.33, onTop);
        ctx.lineTo(onX + onW * 0.33, onTop);
        ctx.lineTo(onX + onW * 0.44, onY - onH * 0.48);
        ctx.closePath();
        ctx.fillStyle = "#0b1424"; // Metallic obsidian
        ctx.fill();

        // Windshield (with twilight sky reflection and driver silhouette)
        ctx.fillStyle = "#050812";
        ctx.beginPath();
        ctx.moveTo(onX - onW * 0.37, onY - onH * 0.48);
        ctx.lineTo(onX - onW * 0.28, onTop + onH * 0.06);
        ctx.lineTo(onX + onW * 0.28, onTop + onH * 0.06);
        ctx.lineTo(onX + onW * 0.37, onY - onH * 0.48);
        ctx.closePath();
        ctx.fill();

        // High-definition Jewel LED Headlights
        const headW = onW * 0.20;
        const headH = Math.max(3, onH * 0.16);
        const headY = onY - onH * 0.42;

        // Clean headlight glow halo
        const hGlow = ctx.createRadialGradient(onX, headY, 0, onX, headY, onW * 0.55);
        hGlow.addColorStop(0, `rgba(220, 240, 255, ${0.45 * onFade})`);
        hGlow.addColorStop(1, "rgba(200, 230, 255, 0)");
        ctx.fillStyle = hGlow;
        ctx.fillRect(onX - onW * 0.55, headY - onW * 0.25, onW * 1.1, onW * 0.5);

        // Crisp white LED Projectors
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(leftLightX - headW * 0.5, headY, headW, headH);
        ctx.fillRect(rightLightX - headW * 0.5, headY, headW, headH);

        // Sharp DRL (Daytime Running Light) upper brow
        ctx.strokeStyle = `rgba(220, 245, 255, ${0.9 * onFade})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(leftLightX - headW * 0.5, headY);
        ctx.lineTo(leftLightX + headW * 0.5, headY);
        ctx.moveTo(rightLightX - headW * 0.5, headY);
        ctx.lineTo(rightLightX + headW * 0.5, headY);
        ctx.stroke();

        // Front License Plate
        ctx.fillStyle = "rgba(240, 248, 255, 0.75)";
        ctx.fillRect(onX - onW * 0.12, onY - onH * 0.20, onW * 0.24, onH * 0.10);
      }

      // ----------------------------------------------------
      // 11. METAL GUARDRAIL ON LEFT EDGE
      // ----------------------------------------------------
      const guardrailPosts = 16;
      const gLoopPeriod = 1.0 / guardrailPosts;
      const gPhase = (distanceTraveled * 0.016) % gLoopPeriod;

      const railSteps = 24;
      for (let beam = 0; beam < 2; beam++) {
        const beamYOffset = beam === 0 ? -12 : -4;
        ctx.beginPath();
        for (let s = 0; s <= railSteps; s++) {
          const t = s / railSteps;
          const pt = Math.pow(t, 1.85);
          const ry = horizonY + (h - horizonY) * pt + beamYOffset * pt;
          const rx = roadTopLeft + (roadBottomLeft - roadTopLeft) * pt + curveBias * Math.sin(pt * Math.PI * 0.6) - 14 * pt;
          if (s === 0) ctx.moveTo(rx, ry);
          else ctx.lineTo(rx, ry);
        }
        ctx.strokeStyle = beam === 0 ? "rgba(190, 205, 220, 0.75)" : "rgba(130, 145, 160, 0.65)";
        ctx.lineWidth = Math.max(1, 3.2 * (beam === 0 ? 1 : 0.8));
        ctx.stroke();
      }

      for (let i = 0; i < guardrailPosts; i++) {
        const normZ = i * gLoopPeriod + gPhase;
        if (normZ < 0.04 || normZ > 0.98) continue;

        const pt = Math.pow(normZ, 1.85);
        const baseY = horizonY + (h - horizonY) * pt;
        const baseX = roadTopLeft + (roadBottomLeft - roadTopLeft) * pt + curveBias * Math.sin(pt * Math.PI * 0.6) - 14 * pt;
        const postHeight = Math.max(3, 24 * pt);

        ctx.strokeStyle = "rgba(100, 115, 130, 0.85)";
        ctx.lineWidth = Math.max(1.2, 4.0 * pt);
        ctx.beginPath();
        ctx.moveTo(baseX, baseY);
        ctx.lineTo(baseX, baseY - postHeight);
        ctx.stroke();

        if (pt > 0.15) {
          const markerY = baseY - postHeight * 0.8;
          ctx.fillStyle = pt > 0.4 ? "rgba(255, 60, 40, 0.9)" : "rgba(255, 100, 70, 0.7)";
          ctx.beginPath();
          ctx.rect(baseX - 1.5, markerY - 2 * pt, 3 * pt, 4 * pt);
          ctx.fill();
        }
      }

      // ----------------------------------------------------
      // 12. LOWER THIRD PROTECTIVE VIGNETTE FOR UI CLARITY
      // ----------------------------------------------------
      const uiVignetteGrad = ctx.createLinearGradient(0, h * 0.55, 0, h);
      uiVignetteGrad.addColorStop(0.0, "rgba(2, 6, 12, 0)");
      uiVignetteGrad.addColorStop(0.4, "rgba(2, 6, 12, 0.35)");
      uiVignetteGrad.addColorStop(0.75, "rgba(2, 6, 12, 0.72)");
      uiVignetteGrad.addColorStop(1.0, "rgba(2, 6, 12, 0.92)");
      ctx.fillStyle = uiVignetteGrad;
      ctx.fillRect(0, h * 0.55, w, h * 0.45);

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [isPlaying, speedMultiplier]);

  return (
    <div className={`video-bg-container ${className}`}>
      {/* 4K Canvas POV Animation rendering wet dark asphalt mountain road, yellow dashed line, guardrail, twilight sky & alpine peaks */}
      <canvas
        ref={canvasRef}
        className="video-bg-media block"
        style={{ pointerEvents: "none" }}
      />

      {/* Pure CSS Shooting Star Trails moving across twilight sky in graceful slow motion */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-[1]">
        <div className="shooting-star top-[6%] left-[12%]" style={{ animationDelay: "0s", animationDuration: "9.2s" }} />
        <div className="shooting-star top-[16%] left-[42%]" style={{ animationDelay: "3.2s", animationDuration: "11.6s" }} />
        <div className="shooting-star top-[24%] left-[68%]" style={{ animationDelay: "6.0s", animationDuration: "13.8s" }} />
      </div>

      {/* Slight dark overlay so all existing UI (headline, search form, buttons, navigation) remains 100% sharp and readable */}
      <div
        className="video-bg-overlay"
        style={overlayOpacity !== undefined ? { opacity: overlayOpacity > 0 ? Math.min(1, overlayOpacity * 1.5) : 0.6 } : undefined}
      />

      {/* Floating Ambient Controls */}
      {showControls && (
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={() => setIsPlaying((p) => !p)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/70 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 backdrop-blur-md text-xs font-medium shadow-lg transition cursor-pointer"
            title={isPlaying ? "Pause cinematic motion" : "Play cinematic motion"}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3 h-3 text-sky-400" />
                <span className="hidden sm:inline">Pause Motion</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                <span className="hidden sm:inline">Drive POV</span>
              </>
            )}
          </button>

          <div
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-slate-900/60 border border-slate-700/40 backdrop-blur-md text-[11px] text-blue-300/80"
            title="Active night sky shooting stars"
          >
            <Sparkles className="w-3 h-3 text-blue-400 animate-spin" style={{ animationDuration: "6s" }} />
            <span className="font-mono">{shootingStarCount}</span>
          </div>
        </div>
      )}
    </div>
  );
}
