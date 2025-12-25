
import React, { useEffect, useRef } from 'react';

interface SphereAnimationProps {
  isSpeaking?: boolean;
  isListening?: boolean;
}

export const SphereAnimation: React.FC<SphereAnimationProps> = ({ isSpeaking = false, isListening = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const parentRef = useRef<HTMLDivElement>(null);

  // Audio Analysis Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioDataRef = useRef<Uint8Array | null>(null);

  // Interaction State
  const mouseRef = useRef({ x: -1000, y: -1000, active: false, isDown: false });
  // Scatter now includes variant types for dynamic effects
  const scatterRef = useRef({ active: false, intensity: 0, variant: 0, dirX: 0, dirY: 0 });

  // --- Audio Context Management ---
  useEffect(() => {
    let isMounted = true;

    const cleanupAudio = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (audioContextRef.current) {
        if (audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close().catch(err => console.warn('AudioContext close error:', err));
        }
        audioContextRef.current = null;
      }
      analyserRef.current = null;
    };

    if (isListening) {
      const initAudio = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          if (!isMounted) {
            stream.getTracks().forEach(t => t.stop());
            return;
          }

          cleanupAudio();

          streamRef.current = stream;

          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          const audioCtx = new AudioContextClass();
          audioContextRef.current = audioCtx;

          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          analyserRef.current = analyser;

          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);

          audioDataRef.current = new Uint8Array(analyser.frequencyBinCount);
        } catch (e) {
          console.error("Sphere Audio Error:", e);
        }
      };
      initAudio();
    } else {
      cleanupAudio();
    }

    return () => {
      isMounted = false;
      cleanupAudio();
    };
  }, [isListening]);

  // --- Canvas Loop ---
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = parentRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      // Ensure minimum dimensions to avoid errors
      canvas.width = Math.max(1, rect.width);
      canvas.height = Math.max(1, rect.height);
    };

    updateSize();
    const resizeObserver = new ResizeObserver(() => updateSize());
    resizeObserver.observe(container);

    // --- Configuration ---
    const dotCount = 600;
    let globeRadius = 0;
    const dotRadius = 1.6;

    // Physics Constants - TUNED FOR ORGANIC FLUIDITY
    const springStrength = 0.02; // Stronger spring for faster return
    const friction = 0.94 // Slightly more friction

    interface Dot {
      x: number; y: number; z: number;
      baseX: number; baseY: number; baseZ: number;
      vx: number; vy: number; vz: number;
      phase: number;
    }

    const dots: Dot[] = [];
    const goldenRatio = (1 + Math.sqrt(5)) / 2;

    // Initialize dots
    for (let i = 0; i < dotCount; i++) {
      const theta = 2 * Math.PI * i / goldenRatio;
      const phi = Math.acos(1 - 2 * (i + 0.5) / dotCount);

      const x = Math.sin(phi) * Math.cos(theta);
      const y = Math.sin(phi) * Math.sin(theta);
      const z = Math.cos(phi);

      dots.push({
        x: x * 100, y: y * 100, z: z * 100,
        baseX: x, baseY: y, baseZ: z,
        vx: 0, vy: 0, vz: 0,
        phase: Math.random() * Math.PI * 2
      });
    }

    let angleY = 0;
    let angleX = 0;
    let time = 0;
    let animationId: number;

    const animate = () => {
      if (!canvas || !ctx) return;
      time += 0.015;

      // Responsive Radius
      const minDim = Math.min(canvas.width, canvas.height);
      globeRadius = minDim * 0.32;
      if (window.innerWidth < 768) globeRadius = minDim * 0.40;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Audio Energy Calculation
      let audioEnergy = 0;
      if (isListening && analyserRef.current && audioDataRef.current) {
        analyserRef.current.getByteFrequencyData(audioDataRef.current);
        let sum = 0;
        const binCount = audioDataRef.current.length;
        for (let i = 0; i < binCount / 2; i++) sum += audioDataRef.current[i];
        audioEnergy = (sum / (binCount / 2));
      } else if (isSpeaking) {
        audioEnergy = 80 + Math.sin(time * 20) * 40 + Math.cos(time * 43) * 20;
      }

      // Slow idle rotation
      angleY += 0.002;
      angleX = Math.sin(time * 0.2) * 0.1;

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Decay Scatter
      if (scatterRef.current.intensity > 0) {
        scatterRef.current.intensity *= 0.92;
        if (scatterRef.current.intensity < 0.01) scatterRef.current.active = false;
      }

      const breath = Math.sin(time * 0.5) * 6;
      const audioScale = (audioEnergy / 255);

      // Check interaction
      let isMouseNear = false;
      if (mouseRef.current.active) {
        const dxM = mouseRef.current.x - cx;
        const dyM = mouseRef.current.y - cy;
        const distM = Math.sqrt(dxM * dxM + dyM * dyM);
        if (distM < globeRadius * 2.5) {
          isMouseNear = true;
        }
      }

      dots.forEach(dot => {
        if (!isFinite(dot.x)) {
          dot.x = dot.baseX * globeRadius; dot.y = dot.baseY * globeRadius; dot.z = dot.baseZ * globeRadius;
          dot.vx = 0; dot.vy = 0; dot.vz = 0;
        }

        // 1. Target Position
        let rx = dot.baseX * Math.cos(angleY) - dot.baseZ * Math.sin(angleY);
        let rz = dot.baseZ * Math.cos(angleY) + dot.baseX * Math.sin(angleY);
        let ry = dot.baseY * Math.cos(angleX) - rz * Math.sin(angleX);
        rz = rz * Math.cos(angleX) + dot.baseY * Math.sin(angleX);

        const drift = 6 * Math.sin(time * 0.8 + dot.phase) + 3 * Math.cos(time * 0.4 + dot.phase * 1.5);
        let currentRadius = globeRadius + breath + drift + (audioEnergy * 0.2);

        const targetX = rx * currentRadius;
        const targetY = ry * currentRadius;
        const targetZ = rz * currentRadius;

        // 2. Spring Force
        dot.vx += (targetX - dot.x) * springStrength;
        dot.vy += (targetY - dot.y) * springStrength;
        dot.vz += (targetZ - dot.z) * springStrength;

        // 3. Interaction: Liquid Ripple
        if (isMouseNear) {
          const perspective = 800;
          const depth = perspective + dot.z + 400;
          if (depth > 0) {
            const scale = perspective / depth;
            const screenX = cx + dot.x * scale;
            const screenY = cy + dot.y * scale;

            const dx = screenX - mouseRef.current.x;
            const dy = screenY - mouseRef.current.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // WIDER interaction radius for smoother gradient
            const repelRadius = 220;

            if (dist < repelRadius) {
              // Cosine-based smooth interpolation for organic feel
              // 0 at dist=repelRadius, 1 at dist=0
              const t = dist / repelRadius;
              const falloff = Math.cos(t * Math.PI * 0.5);

              const force = falloff * 0.8;
              const angle = Math.atan2(dy, dx);

              // Radial push (Repel)
              dot.vx += Math.cos(angle) * force * 3.0;
              dot.vy += Math.sin(angle) * force * 3.0;

              // Tangential push (Swirl) - Increased for fluid vorticity
              dot.vx -= Math.sin(angle) * force * 1.2;
              dot.vy += Math.cos(angle) * force * 1.2;

              // Z-Axis Ripple
              dot.vz -= force * 6;
            }
          }
        }

        // 4. Dynamic Scatter
        if (scatterRef.current.active && scatterRef.current.intensity > 0.1) {
          const { intensity, variant, dirX, dirY } = scatterRef.current;

          if (variant === 0) {
            // Supernova
            dot.vx += dot.baseX * intensity * 4;
            dot.vy += dot.baseY * intensity * 4;
            dot.vz += dot.baseZ * intensity * 4;
          } else if (variant === 1) {
            // Vortex
            dot.vx += dot.baseY * intensity * 4;
            dot.vy -= dot.baseX * intensity * 4;
            dot.vz += dot.baseZ * intensity * 2;
          } else {
            // Directional
            dot.vx += (dot.baseX + dirX) * intensity * 4;
            dot.vy += (dot.baseY + dirY) * intensity * 4;
            dot.vz += dot.baseZ * intensity * 4;
          }
        }

        // Apply Friction
        dot.vx *= friction;
        dot.vy *= friction;
        dot.vz *= friction;

        // Update Position
        dot.x += dot.vx;
        dot.y += dot.vy;
        dot.z += dot.vz;

        // Draw
        const perspective = 800;
        const depth = perspective + dot.z + 400;
        if (depth <= 0) return;

        const scale = perspective / depth;
        if (!isFinite(scale) || scale <= 0) return;

        const x2d = cx + dot.x * scale;
        const y2d = cy + dot.y * scale;

        // Color Calculation
        const speed = Math.sqrt(dot.vx * dot.vx + dot.vy * dot.vy);
        let r, g, b;

        if (isSpeaking) {
          const intensity = Math.min(1, audioScale);
          r = 120 + 135 * intensity; g = 120; b = 255;
        } else if (isListening) {
          const intensity = Math.min(1, audioScale);
          r = 50; g = 220 + 35 * intensity; b = 255;
        } else {
          // Idle
          const bright = Math.min(100, speed * 60);
          r = 110 + bright;
          g = 110 + bright;
          b = 245;
        }

        const alpha = Math.min(1, (scale * 0.7) + (audioEnergy / 600) + 0.3);
        const radius = Math.max(0.1, dotRadius * scale);

        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x2d, y2d, radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    // Event Handlers
    const handleMouseMove = (e: MouseEvent) => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
      mouseRef.current.active = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.touches[0].clientX - rect.left;
      mouseRef.current.y = e.touches[0].clientY - rect.top;
      mouseRef.current.active = true;
    };

    const handleInteractionEnd = () => {
      // CRITICAL: Reset mouse state so particles spring back
      mouseRef.current.active = false;
      mouseRef.current.x = -1000;
      mouseRef.current.y = -1000;
    };

    const handleMouseDown = () => {
      mouseRef.current.isDown = true;
      const variant = Math.floor(Math.random() * 3);
      const intensity = 3 + Math.random() * 5;
      const dirX = (Math.random() - 0.5) * 2;
      const dirY = (Math.random() - 0.5) * 2;
      scatterRef.current = { active: true, intensity, variant, dirX, dirY };
    };

    const handleMouseUp = () => { mouseRef.current.isDown = false; };

    // Proper touch start - sets position AND triggers scatter
    const handleTouchStart = (e: TouchEvent) => {
      if (!canvas || !e.touches[0]) return;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.touches[0].clientX - rect.left;
      mouseRef.current.y = e.touches[0].clientY - rect.top;
      mouseRef.current.active = true;
      mouseRef.current.isDown = true;
      // Trigger scatter effect
      const variant = Math.floor(Math.random() * 3);
      const intensity = 3 + Math.random() * 5;
      const dirX = (Math.random() - 0.5) * 2;
      const dirY = (Math.random() - 0.5) * 2;
      scatterRef.current = { active: true, intensity, variant, dirX, dirY };
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleInteractionEnd); // Use document for reliability
    document.addEventListener('touchcancel', handleInteractionEnd);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleInteractionEnd);
      document.removeEventListener('touchcancel', handleInteractionEnd);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchstart', handleTouchStart);
      cancelAnimationFrame(animationId);
    };
  }, [isSpeaking, isListening]);

  return (
    <div ref={parentRef} className="w-full h-full absolute inset-0 overflow-hidden">
      <canvas ref={canvasRef} className="block w-full h-full" style={{ touchAction: 'none' }} />
    </div>
  );
};
