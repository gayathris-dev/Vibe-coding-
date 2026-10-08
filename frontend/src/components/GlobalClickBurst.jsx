import { useEffect, useRef } from 'react';

const BURST_COLOR = '0, 133, 63';

export default function GlobalClickBurst({ disabled = false }) {
  const layerRef = useRef(null);

  useEffect(() => {
    if (disabled) return undefined;

    const layer = layerRef.current;
    if (!layer) return undefined;

    const handlePointerDown = (event) => {
      if (event.button !== undefined && event.button !== 0) return;

      const burst = document.createElement('span');
      burst.className = 'click-burst';

      burst.style.left = `${event.clientX}px`;
      burst.style.top = `${event.clientY}px`;

      for (let index = 0; index < 5; index += 1) {
        const ray = document.createElement('span');
        ray.className = 'click-burst__ray';
        ray.style.setProperty('--burst-angle', `${index * 72}deg`);
        burst.appendChild(ray);
      }

      layer.appendChild(burst);

      window.setTimeout(() => {
        burst.remove();
      }, 520);
    };

    window.addEventListener('pointerdown', handlePointerDown);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [disabled]);

  return (
    <div
      ref={layerRef}
      className="click-burst-layer"
      aria-hidden="true"
      style={{ '--burst-color': BURST_COLOR }}
    />
  );
}
