import React from 'react';
import { ChevronRight, Home, BookOpen, Folder } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  url?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  if (!items || items.length === 0) return null;

  // Generate Schema.org JSON-LD BreadcrumbList
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': items.map((item, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': item.label,
      'item': item.url ? (item.url.startsWith('http') ? item.url : `${window.location.origin}${item.url}`) : window.location.href
    }))
  };

  return (
    <nav aria-label="Fil d'Ariane" className={`py-2 px-1 ${className}`}>
      {/* Inject JSON-LD Schema.org for Search Engines */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <ol className="flex items-center flex-wrap gap-1.5 text-xs text-[#cbd5e1] font-medium">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center gap-1.5">
              {index > 0 && (
                <ChevronRight className="w-3.5 h-3.5 text-[#cbd5e1] shrink-0 select-none" />
              )}

              {isLast ? (
                <span className="font-bold text-[#cbd5e1] truncate max-w-[220px] sm:max-w-xs" aria-current="page">
                  {item.label}
                </span>
              ) : item.onClick ? (
                <button
                  type="button"
                  onClick={item.onClick}
                  className="hover:text-indigo-400 transition-colors flex items-center gap-1 cursor-pointer hover:underline text-[#cbd5e1]"
                >
                  {item.icon}
                  <span className="truncate max-w-[140px] sm:max-w-[200px] text-[#cbd5e1]">{item.label}</span>
                </button>
              ) : item.url ? (
                <a
                  href={item.url}
                  className="hover:text-indigo-400 transition-colors flex items-center gap-1 cursor-pointer hover:underline text-[#cbd5e1]"
                >
                  {item.icon}
                  <span className="truncate max-w-[140px] sm:max-w-[200px] text-[#cbd5e1]">{item.label}</span>
                </a>
              ) : (
                <span className="flex items-center gap-1 text-[#cbd5e1]">
                  {item.icon}
                  <span className="truncate max-w-[140px] sm:max-w-[200px] text-[#cbd5e1]">{item.label}</span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
