'use client';

import { useEffect, useState } from 'react';

export function CustomCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPointer, setIsPointer] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateCursor = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      setIsVisible(true);
      
      const target = e.target as HTMLElement;
      const computedStyle = window.getComputedStyle(target);
      
      setIsPointer(
        computedStyle.cursor === 'pointer' ||
        target.tagName.toLowerCase() === 'a' ||
        target.tagName.toLowerCase() === 'button' ||
        target.closest('a') !== null ||
        target.closest('button') !== null
      );
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', updateCursor);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', updateCursor);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <>
      <style jsx global>{`
        * {
          cursor: none !important;
        }
      `}</style>
      <div
        className="fixed top-0 left-0 w-3 h-3 bg-gray-900 rounded-full pointer-events-none z-[9999] transition-transform duration-150 ease-out"
        style={{
          transform: `translate(${position.x - 6}px, ${position.y - 6}px) scale(${isPointer ? 2.5 : 1})`,
          opacity: 0.8
        }}
      />
      <div
        className="fixed top-0 left-0 w-8 h-8 border border-gray-400 rounded-full pointer-events-none z-[9998] transition-transform duration-300 ease-out"
        style={{
          transform: `translate(${position.x - 16}px, ${position.y - 16}px) scale(${isPointer ? 1.5 : 1})`,
          opacity: 0.4
        }}
      />
    </>
  );
}
