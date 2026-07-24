import React, { useState, useRef, useEffect } from 'react';

interface TruncatedTextProps {
  children: React.ReactNode;
  className?: string;
  as?: 'span' | 'div' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  lines?: number;
  title?: string;
  popoverPosition?: 'top' | 'bottom';
}

export const TruncatedText: React.FC<TruncatedTextProps> = ({
  children,
  className = '',
  as = 'span',
  lines = 1,
  title,
  popoverPosition = 'top',
}) => {
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const textRef = useRef<HTMLDivElement | HTMLSpanElement>(null);

  const textString = typeof children === 'string' ? children : (title || '');

  const checkOverflow = () => {
    if (textRef.current) {
      const el = textRef.current;
      if (lines === 1) {
        setIsOverflowing(el.scrollWidth > el.clientWidth);
      } else {
        setIsOverflowing(el.scrollHeight > el.clientHeight);
      }
    }
  };

  useEffect(() => {
    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [children, lines]);

  const Component = as as any;

  const multilineStyle: React.CSSProperties = lines > 1 ? {
    display: '-webkit-box',
    WebkitLineClamp: lines,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  } : {};

  return (
    <span className="relative inline-block max-w-full align-bottom group/trunc">
      <Component
        ref={textRef}
        title={isOverflowing ? (title || textString) : undefined}
        onMouseEnter={() => {
          checkOverflow();
          if (isOverflowing) setShowTooltip(true);
        }}
        onMouseLeave={() => setShowTooltip(false)}
        className={`${lines === 1 ? 'truncate block' : ''} ${className}`}
        style={multilineStyle}
      >
        {children}
      </Component>

      {/* Interactive Popover Tooltip on Hover when text is overflowing */}
      {isOverflowing && showTooltip && (
        <span
          aria-hidden="true"
          className={`absolute ${
            popoverPosition === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
          } left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-fade-in flex flex-col items-center max-w-xs sm:max-w-sm w-max min-w-[120px]`}
        >
          <span className="bg-slate-900 text-slate-100 text-[11px] font-medium px-3 py-1.5 rounded-xl shadow-2xl border border-slate-700/80 break-words text-center leading-snug whitespace-normal backdrop-blur-md">
            {title || textString}
          </span>
          <span
            className={`w-2.5 h-2.5 ${
              popoverPosition === 'top' ? '-mt-1 border-r border-b' : '-mb-1 order-first border-l border-t'
            } rotate-45 bg-slate-900 border-slate-700/80`}
          ></span>
        </span>
      )}
    </span>
  );
};

export default TruncatedText;
