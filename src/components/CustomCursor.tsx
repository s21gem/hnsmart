import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

export default function CustomCursor() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      
      const target = e.target as HTMLElement;
      if (target.tagName.toLowerCase() === 'button' || target.tagName.toLowerCase() === 'a' || target.closest('button') || target.closest('a')) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener('mousemove', updateMousePosition);
    return () => window.removeEventListener('mousemove', updateMousePosition);
  }, []);

  return (
    <>
      <motion.div
        className="fixed top-0 left-0 w-3 h-3 bg-gold-500 rounded-full pointer-events-none z-[9999] mix-blend-difference"
        animate={{ 
          x: mousePosition.x - 6, 
          y: mousePosition.y - 6,
          scale: isHovering ? 1.5 : 1
        }}
        transition={{ type: 'tween', ease: 'backOut', duration: 0 }}
      />
      <motion.div
        className="fixed top-0 left-0 w-10 h-10 border border-gold-500 rounded-full pointer-events-none z-[9998] bg-gold-500/10 backdrop-blur-sm"
        animate={{ 
          x: mousePosition.x - 20, 
          y: mousePosition.y - 20,
          scale: isHovering ? 1.5 : 1
        }}
        transition={{ type: 'spring', stiffness: 150, damping: 15, mass: 0.5 }}
      />
    </>
  );
}
