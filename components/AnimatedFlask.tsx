'use client';

import { useState } from 'react';
import { FlaskConical } from 'lucide-react';

export function AnimatedFlask() {
  const [isAnimated, setIsAnimated] = useState(false);

  const triggerAnimation = () => {
    setIsAnimated(true);
    setTimeout(() => setIsAnimated(false), 300);
  };

  return (
    <div
      onMouseEnter={triggerAnimation}
      onClick={triggerAnimation}
      className="cursor-pointer inline-flex"
    >
      <FlaskConical
        className={`w-12 h-12 transition-all duration-300 ${
          isAnimated ? 'animate-gentle-shake' : ''
        }`}
        strokeWidth={1.5}
      />
    </div>
  );
}