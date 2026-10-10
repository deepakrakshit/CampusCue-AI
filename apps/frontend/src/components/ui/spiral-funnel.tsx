import React, { useEffect, useRef, useState } from 'react';

export interface SpiralFunnelProps {
  className?: string;
  strands?: number;
  speed?: number;
  interactive?: boolean;
  paused?: boolean;
  quality?: number;
  glowColor?: string;
  accentColor?: string;
}

/**
 * SpiralFunnel - Luminous turning vortex animation with fine threads of light.
 * Supports interactive pointer response, swell physics, and high-DPI canvas rendering.
 */
export const SpiralFunnel: React.FC<SpiralFunnelProps> = ({
  className = '',
  strands = 140,
  speed = 0.8,
  interactive = true,
  paused = false,
  quality = 1,
  glowColor = '#8b5cf6', // Violet glow
  accentColor = '#06b6d4', // Cyan accent
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mouseRef = useRef<{ x: number; y: number; active: boolean; swell: number }>({
    x: 0.5,
    y: 0.5,
    active: false,
    swell: 0,
  });
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      const media = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(media.matches);
      const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let rotation = 0;

    const handleResize = () => {
      const rect = container.getBoundingClientRect ? container.getBoundingClientRect() : { width: 400, height: 400 };
      const dpr = Math.min((typeof window !== 'undefined' ? window.devicePixelRatio : 1) || 1, 2) * quality;
      width = rect.width || 400;
      height = rect.height || 400;
      canvas.width = Math.max(width * dpr, 100);
      canvas.height = Math.max(height * dpr, 100);
      if (ctx.setTransform) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    };

    handleResize();
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(container);
    }

    const onPointerMove = (e: PointerEvent) => {
      if (!interactive) return;
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      mouseRef.current.x = Math.max(0, Math.min(1, x));
      mouseRef.current.y = Math.max(0, Math.min(1, y));
      mouseRef.current.active = true;
      mouseRef.current.swell = Math.min(mouseRef.current.swell + 0.15, 1.0);
    };

    const onPointerLeave = () => {
      mouseRef.current.active = false;
    };

    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('pointerleave', onPointerLeave);

    // Particle/dust streamlines
    const dustParticles: Array<{
      angle: number;
      radius: number;
      height: number;
      speed: number;
      size: number;
      alpha: number;
    }> = [];

    const dustCount = 80;
    for (let i = 0; i < dustCount; i++) {
      dustParticles.push({
        angle: Math.random() * Math.PI * 2,
        radius: 20 + Math.random() * 260,
        height: Math.random() * 500,
        speed: 0.2 + Math.random() * 0.8,
        size: 0.7 + Math.random() * 1.8,
        alpha: 0.2 + Math.random() * 0.7,
      });
    }

    let lastTime = performance.now();

    const render = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      if (!paused && !prefersReducedMotion) {
        // Swell decay
        mouseRef.current.swell *= 0.95;
        const currentSpeed = speed * (1 + mouseRef.current.swell * 0.8);
        rotation += dt * currentSpeed;
      }

      ctx.clearRect(0, 0, width, height);

      const centerX = width * 0.5 + (mouseRef.current.active ? (mouseRef.current.x - 0.5) * 60 : 0);
      const centerY = height * 0.55 + (mouseRef.current.active ? (mouseRef.current.y - 0.5) * 40 : 0);
      const maxRadius = Math.min(width, height) * 0.48;

      // Draw subtle ambient glow in center
      const radialGlow = ctx.createRadialGradient(
        centerX,
        centerY,
        10,
        centerX,
        centerY,
        maxRadius * 1.2
      );
      radialGlow.addColorStop(0, 'rgba(139, 92, 246, 0.16)');
      radialGlow.addColorStop(0.35, 'rgba(6, 182, 212, 0.08)');
      radialGlow.addColorStop(0.7, 'rgba(16, 185, 129, 0.03)');
      radialGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = radialGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, maxRadius * 1.2, 0, Math.PI * 2);
      ctx.fill();

      // Render fine spiral threads (streamlines)
      ctx.lineWidth = 1;
      const strandCount = Math.max(20, strands);

      for (let s = 0; s < strandCount; s++) {
        const strandPhase = (s / strandCount) * Math.PI * 2;
        const baseAngle = strandPhase + rotation;
        const points = 45;

        ctx.beginPath();

        for (let p = 0; p < points; p++) {
          const t = p / (points - 1); // 0 at center/funnel neck, 1 at wide crown
          // Funnel profile: hyperbolic / exponential flare
          const r = Math.pow(t, 1.8) * maxRadius;
          const funnelDepth = (1 - t) * 180; // depth offset
          const angle = baseAngle + t * 4.2 + (mouseRef.current.swell * 0.4 * (1 - t));

          // 3D perspective projection onto 2D
          const cosA = Math.cos(angle);
          const sinA = Math.sin(angle);

          // Oval projection to simulate vortex tilt
          const px = centerX + cosA * r;
          const py = centerY + sinA * r * 0.38 - funnelDepth * 0.5;

          if (p === 0) {
            ctx.moveTo(px, py);
          } else {
            ctx.lineTo(px, py);
          }
        }

        // Color gradient along strand from neck (hot violet/cyan) to outer rim (faded space)
        const alpha = 0.08 + 0.35 * Math.sin((s / strandCount) * Math.PI);
        const strokeColor =
          s % 3 === 0
            ? `rgba(168, 85, 247, ${alpha.toFixed(3)})` // violet
            : s % 3 === 1
            ? `rgba(6, 182, 212, ${alpha.toFixed(3)})` // cyan
            : `rgba(52, 211, 153, ${(alpha * 0.8).toFixed(3)})`; // emerald

        ctx.strokeStyle = strokeColor;
        ctx.stroke();
      }

      // Render swirling luminescent dust particles
      for (let i = 0; i < dustParticles.length; i++) {
        const particle = dustParticles[i];
        if (!paused && !prefersReducedMotion) {
          particle.angle += dt * (0.4 + particle.speed * 0.3);
          particle.height += dt * 35 * particle.speed;
          if (particle.height > 320) {
            particle.height = 0;
            particle.radius = 15 + Math.random() * maxRadius * 0.9;
          }
        }

        const t = Math.min(1, particle.height / 320);
        const currentR = particle.radius * (0.2 + t * 0.8);
        const px = centerX + Math.cos(particle.angle) * currentR;
        const py = centerY + Math.sin(particle.angle) * currentR * 0.38 - (1 - t) * 80;

        const pAlpha = particle.alpha * (1 - t) * (0.6 + mouseRef.current.swell * 0.4);
        ctx.beginPath();
        ctx.arc(px, py, particle.size, 0, Math.PI * 2);
        ctx.fillStyle =
          i % 2 === 0
            ? `rgba(196, 181, 253, ${pAlpha.toFixed(2)})`
            : `rgba(103, 232, 249, ${pAlpha.toFixed(2)})`;
        ctx.fill();
      }

      // Center core vortex glow
      const coreGrad = ctx.createRadialGradient(centerX, centerY - 40, 2, centerX, centerY - 40, 60);
      coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
      coreGrad.addColorStop(0.3, 'rgba(168, 85, 247, 0.3)');
      coreGrad.addColorStop(0.7, 'rgba(6, 182, 212, 0.1)');
      coreGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY - 40, 60, 0, Math.PI * 2);
      ctx.fill();

      if (typeof requestAnimationFrame !== 'undefined') {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    if (typeof requestAnimationFrame !== 'undefined') {
      animationFrameId = requestAnimationFrame(render);
    }

    return () => {
      if (animationFrameId && typeof cancelAnimationFrame !== 'undefined') {
        cancelAnimationFrame(animationFrameId);
      }
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerleave', onPointerLeave);
    };
  }, [strands, speed, interactive, paused, quality, glowColor, accentColor, prefersReducedMotion]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden pointer-events-auto select-none ${className}`}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
};

export default SpiralFunnel;
