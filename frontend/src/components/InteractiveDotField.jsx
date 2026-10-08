import { useEffect, useRef } from 'react';

const GREEN = { r: 0, g: 133, b: 63 };
const NEUTRAL = { r: 25, g: 48, b: 38 };

export default function InteractiveDotField({ containerRef }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef?.current;

    if (!canvas || !container) return undefined;

    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let spacing = 18;
    let baseSize = 0.75;
    let baseAlpha = 0.09;
    let dots = [];
    let ripples = [];
    let animationFrame = null;
    let resizeTimer = null;
    let visible = true;
    let lastRipple = 0;
    let lastPoint = { x: -1000, y: -1000 };
    let ambientTimer = 0;

    const pointer = {
      x: -1000,
      y: -1000,
      active: false,
    };

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    );

    const resize = () => {
      width = container.clientWidth;
      height = container.clientHeight;

      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      const mobile = width <= 640;
      spacing = mobile ? 20 : 18;
      baseSize = mobile ? 0.65 : 0.75;
      baseAlpha = mobile ? 0.075 : 0.09;

      dots = [];

      const columns = Math.ceil(width / spacing) + 1;
      const rows = Math.ceil(height / spacing) + 1;

      for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < columns; column += 1) {
          const x = column * spacing + spacing / 2;
          const y = row * spacing + spacing / 2;

          dots.push({
            originX: x,
            originY: y,
            x,
            y,
            size: baseSize,
            alpha: baseAlpha,
            glow: 0,
          });
        }
      }
    };

    const emitRipple = (x, y, strength = 1) => {
      const now = performance.now();
      const distanceFromLast = Math.hypot(
        x - lastPoint.x,
        y - lastPoint.y,
      );

      if (distanceFromLast < 55 && now - lastRipple < 220) {
        return;
      }

      lastRipple = now;
      lastPoint = { x, y };

      if (ripples.length >= 3) {
        ripples.shift();
      }

      const mobile = width <= 640;

      ripples.push({
        x,
        y,
        radius: 0,
        maxRadius: mobile ? 210 : 290,
        speed: mobile ? 3.2 : 4.2,
        strength: strength * (mobile ? 0.7 : 0.9),
      });
    };

    const handlePointerMove = (event) => {
      const rect = container.getBoundingClientRect();

      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active = true;

      emitRipple(pointer.x, pointer.y);
    };

    const handlePointerEnter = (event) => {
      handlePointerMove(event);
      emitRipple(pointer.x, pointer.y, 1.1);
    };

    const handlePointerLeave = () => {
      pointer.active = false;
      pointer.x = -1000;
      pointer.y = -1000;
      lastPoint = { x: -1000, y: -1000 };
    };

    const handleClick = (event) => {
      const rect = container.getBoundingClientRect();

      emitRipple(
        event.clientX - rect.left,
        event.clientY - rect.top,
        1.35,
      );
    };

    const handleTouch = (event) => {
      const touch = event.touches?.[0];
      if (!touch) return;

      const rect = container.getBoundingClientRect();

      pointer.x = touch.clientX - rect.left;
      pointer.y = touch.clientY - rect.top;
      pointer.active = true;

      emitRipple(pointer.x, pointer.y);
    };

    const handleTouchEnd = () => {
      pointer.active = false;
      pointer.x = -1000;
      pointer.y = -1000;
      lastPoint = { x: -1000, y: -1000 };
    };

    const animate = () => {
      if (!visible) {
        animationFrame = null;
        return;
      }

      ctx.clearRect(0, 0, width, height);

      if (!reducedMotion.matches) {
        ambientTimer += 16;

        if (
          !pointer.active &&
          ambientTimer > 5200 &&
          ripples.length === 0
        ) {
          ambientTimer = 0;
          emitRipple(width * 0.72, height * 0.38, 0.5);
        }
      }

      for (let index = ripples.length - 1; index >= 0; index -= 1) {
        const ripple = ripples[index];

        ripple.radius += ripple.speed;
        ripple.strength *= 0.975;

        if (ripple.radius > ripple.maxRadius || ripple.strength < 0.012) {
          ripples.splice(index, 1);
        }
      }

      const interactionRadius = width <= 640 ? 90 : 115;

      dots.forEach((dot) => {
        let targetX = dot.originX;
        let targetY = dot.originY;
        let targetSize = baseSize;
        let targetAlpha = baseAlpha;
        let glow = 0;

        if (pointer.active && !reducedMotion.matches) {
          const dx = dot.originX - pointer.x;
          const dy = dot.originY - pointer.y;
          const distance = Math.hypot(dx, dy);

          if (distance > 0.5 && distance < interactionRadius) {
            const influence = 1 - distance / interactionRadius;
            const force = influence ** 1.8 * 16;
            const angle = Math.atan2(dy, dx);

            targetX += Math.cos(angle) * force;
            targetY += Math.sin(angle) * force;
            targetSize += influence * 0.7;
            targetAlpha += influence * 0.28;
            glow = influence;
          }
        }

        ripples.forEach((ripple) => {
          const dx = dot.originX - ripple.x;
          const dy = dot.originY - ripple.y;
          const distance = Math.hypot(dx, dy);
          const ringWidth =
            14 + (ripple.radius / ripple.maxRadius) * 30;
          const delta = Math.abs(distance - ripple.radius);

          if (delta < ringWidth) {
            const normalized = delta / ringWidth;
            const envelope =
              0.5 * (1 + Math.cos(Math.PI * normalized));
            const progress = Math.min(
              1,
              ripple.radius / ripple.maxRadius,
            );
            const fade = (1 - progress) ** 1.2;
            const influence = envelope * ripple.strength * fade;

            if (influence > 0) {
              const angle = Math.atan2(dy, dx);
              const push = influence * 7;

              targetX += Math.cos(angle) * push;
              targetY += Math.sin(angle) * push;
              targetSize = Math.max(
                targetSize,
                baseSize + influence * 0.75,
              );
              targetAlpha = Math.min(
                0.42,
                targetAlpha + influence * 0.3,
              );
              glow = Math.max(glow, influence);
            }
          }
        });

        dot.x += (targetX - dot.x) * 0.18;
        dot.y += (targetY - dot.y) * 0.18;
        dot.size += (targetSize - dot.size) * 0.16;
        dot.alpha += (targetAlpha - dot.alpha) * 0.16;
        dot.glow = dot.glow * 0.85 + glow * 0.15;

        const intensity = Math.min(1, dot.glow * 1.25);
        const r = Math.round(
          NEUTRAL.r + (GREEN.r - NEUTRAL.r) * intensity,
        );
        const g = Math.round(
          NEUTRAL.g + (GREEN.g - NEUTRAL.g) * intensity,
        );
        const b = Math.round(
          NEUTRAL.b + (GREEN.b - NEUTRAL.b) * intensity,
        );

        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${dot.alpha})`;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrame = requestAnimationFrame(animate);
    };

    resize();

    const resizeObserver = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 80);
    });

    resizeObserver.observe(container);

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;

        if (visible && !animationFrame) {
          animationFrame = requestAnimationFrame(animate);
        }

        if (!visible && animationFrame) {
          cancelAnimationFrame(animationFrame);
          animationFrame = null;
        }
      },
      { threshold: 0.01 },
    );

    intersectionObserver.observe(container);

    container.addEventListener('mouseenter', handlePointerEnter);
    container.addEventListener('mousemove', handlePointerMove);
    container.addEventListener('mouseleave', handlePointerLeave);
    container.addEventListener('click', handleClick);
    container.addEventListener('touchstart', handleTouch, {
      passive: true,
    });
    container.addEventListener('touchmove', handleTouch, {
      passive: true,
    });
    container.addEventListener('touchend', handleTouchEnd, {
      passive: true,
    });

    animationFrame = requestAnimationFrame(animate);

    return () => {
      clearTimeout(resizeTimer);

      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }

      resizeObserver.disconnect();
      intersectionObserver.disconnect();

      container.removeEventListener('mouseenter', handlePointerEnter);
      container.removeEventListener('mousemove', handlePointerMove);
      container.removeEventListener('mouseleave', handlePointerLeave);
      container.removeEventListener('click', handleClick);
      container.removeEventListener('touchstart', handleTouch);
      container.removeEventListener('touchmove', handleTouch);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [containerRef]);

  return (
    <canvas
      ref={canvasRef}
      className="interactive-dot-field"
      aria-hidden="true"
    />
  );
}
