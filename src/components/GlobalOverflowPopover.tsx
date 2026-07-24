import React, { useEffect, useState } from 'react';

interface PopoverData {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export const GlobalOverflowPopover: React.FC = () => {
  const [popover, setPopover] = useState<PopoverData | null>(null);

  useEffect(() => {
    let timeoutId: any = null;

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      // Find closest element with text overflow or truncate class or overflow: hidden
      const el = target.closest('.truncate, [data-truncate], p, span, h1, h2, h3, h4, h5, h6, a, button, div, td, th') as HTMLElement | null;
      
      if (!el) {
        setPopover(null);
        return;
      }

      // Check if text is truncated or scrollWidth > clientWidth
      const isScrollTruncated = el.scrollWidth > el.clientWidth + 1;
      const isHeightTruncated = el.scrollHeight > el.clientHeight + 1;
      const style = window.getComputedStyle(el);
      const isTextOverflowed = style.textOverflow === 'ellipsis' || style.overflow === 'hidden' || el.classList.contains('truncate');

      if ((isScrollTruncated || isHeightTruncated) && isTextOverflowed) {
        const textContent = el.getAttribute('title') || el.innerText || el.textContent || '';
        const trimmed = textContent.trim();

        if (trimmed && trimmed.length > 0) {
          const rect = el.getBoundingClientRect();
          
          // Clear previous timer and set popover
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            setPopover({
              text: trimmed,
              x: rect.left + rect.width / 2,
              y: rect.top,
              width: rect.width,
              height: rect.height,
            });
          }, 150);
          return;
        }
      }

      setPopover(null);
    };

    const handleMouseOut = () => {
      clearTimeout(timeoutId);
      setPopover(null);
    };

    const handleScroll = () => {
      setPopover(null);
    };

    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, []);

  if (!popover || !popover.text) return null;

  // Calculate top/bottom positioning
  const showOnBottom = popover.y < 60;
  const topPos = showOnBottom ? popover.y + popover.height + 8 : popover.y - 8;

  return (
    <div
      style={{
        position: 'fixed',
        left: `${popover.x}px`,
        top: `${topPos}px`,
        transform: showOnBottom ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
      }}
      className="z-[99999] pointer-events-none animate-fade-in max-w-sm sm:max-w-md w-max"
    >
      <div className="bg-slate-900 text-slate-100 text-[11px] font-medium px-3 py-2 rounded-xl shadow-2xl border border-slate-700/80 break-words text-center leading-snug whitespace-normal backdrop-blur-md max-w-xs sm:max-w-sm">
        {popover.text}
      </div>
      <div
        className={`w-2.5 h-2.5 mx-auto ${
          showOnBottom
            ? '-mt-1 order-first border-l border-t'
            : '-mt-1.5 border-r border-b'
        } rotate-45 bg-slate-900 border-slate-700/80`}
      ></div>
    </div>
  );
};

export default GlobalOverflowPopover;
