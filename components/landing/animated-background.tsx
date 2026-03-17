"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "@/lib/theme-provider";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseVx: number;
  baseVy: number;
}

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    // Initialize particles
    const initParticles = () => {
      const particleCount = Math.floor((canvas.width * canvas.height) / 20000);
      particlesRef.current = [];

      for (let i = 0; i < particleCount; i++) {
        const baseVx = (Math.random() - 0.5) * 0.6;
        const baseVy = (Math.random() - 0.5) * 0.6;
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: baseVx,
          vy: baseVy,
          baseVx: baseVx,
          baseVy: baseVy,
          radius: Math.random() * 2 + 1,
        });
      }
    };

    // Mouse move handler
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: e.clientX,
        y: e.clientY,
      };
    };

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Warm stone tones in light mode, soft white in dark
      const particleColor = theme === "dark" ? "rgba(255, 255, 255, 0.45)" : "rgba(120, 100, 80, 0.35)";

      // Update and draw particles
      particlesRef.current.forEach((particle, i) => {
        // Mouse interaction - subtle repel effect
        const dx = mouseRef.current.x - particle.x;
        const dy = mouseRef.current.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 150;

        if (distance < maxDistance && distance > 0) {
          const force = (1 - distance / maxDistance) * 0.8;
          // Gentle repel away from mouse
          particle.vx -= (dx / distance) * force * 0.2;
          particle.vy -= (dy / distance) * force * 0.2;
        } else {
          // Return to base velocity when not near mouse
          particle.vx += (particle.baseVx - particle.vx) * 0.02;
          particle.vy += (particle.baseVy - particle.vy) * 0.02;
        }

        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Add subtle friction
        particle.vx *= 0.99;
        particle.vy *= 0.99;

        // Wrap around edges for continuous movement
        if (particle.x < -10) particle.x = canvas.width + 10;
        if (particle.x > canvas.width + 10) particle.x = -10;
        if (particle.y < -10) particle.y = canvas.height + 10;
        if (particle.y > canvas.height + 10) particle.y = -10;

        // Draw particle - simple and subtle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = particleColor;
        ctx.fill();

        // Draw connections to nearby particles with distance-based opacity
        for (let j = i + 1; j < particlesRef.current.length; j++) {
          const other = particlesRef.current[j];
          const dx = particle.x - other.x;
          const dy = particle.y - other.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const maxLineDistance = 120;

          if (distance < maxLineDistance) {
            const opacity = (1 - (distance / maxLineDistance)) * 0.5;
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(other.x, other.y);
            const isDark = theme === "dark";
            ctx.strokeStyle = isDark
              ? `rgba(255, 255, 255, ${opacity * 0.15})`
              : `rgba(120, 100, 80, ${opacity * 0.15})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Initialize
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("mousemove", handleMouseMove);
    animate();

    // Cleanup
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handleMouseMove);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.5 }}
    />
  );
}
