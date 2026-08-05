export interface CourseSeoInput {
  id?: string;
  title: string;
  description?: string;
  trainerName?: string;
  category?: string;
  subCategory?: string;
  level?: string;
  duration?: string;
  estimatedDuration?: string;
  price?: number;
  promoPrice?: number;
  coverImage?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoSlug?: string;
  seoShareImage?: string;
  hasCertificate?: boolean;
  skillsAcquired?: string[];
  tags?: string[];
}

export interface CourseSeoOutput {
  title: string;
  description: string;
  canonicalUrl: string;
  image: string;
  type: string;
  keywords: string;
  jsonLd: any;
}

/**
 * Automatically generates optimized Meta Title, Description, and Structured Data (Schema.org)
 * for course pages on Dekel.Formation based on course metadata.
 */
export function generateCourseSeoMeta(
  course: CourseSeoInput,
  options?: { baseUrl?: string; hostUrl?: string }
): CourseSeoOutput {
  const host = options?.baseUrl || options?.hostUrl || 'https://formation.dekel-dev.com';
  const cleanHost = host.replace(/\/$/, '');
  const slug = course.seoSlug || course.id || 'cours';
  const canonicalUrl = `${cleanHost}/formation/${encodeURIComponent(slug)}`;

  // 1. Auto-generate Meta Title if not explicitly provided
  let title = course.seoTitle?.trim();
  if (!title) {
    const mainTitle = course.title?.trim() || 'Formation en ligne';
    const levelText = course.level ? ` (${course.level})` : '';
    title = `${mainTitle}${levelText} | Formation en Ligne • Dekel.Formation`;
  } else if (!title.toLowerCase().includes('dekel')) {
    title = `${title} | Dekel.Formation`;
  }

  // 2. Auto-generate Meta Description if not explicitly provided
  let description = course.seoDescription?.trim();
  if (!description) {
    const rawDesc = course.description?.replace(/<[^>]*>?/gm, '').trim() || '';
    const truncatedDesc = rawDesc.length > 120 ? rawDesc.substring(0, 117) + '...' : rawDesc;
    
    const trainerPart = course.trainerName ? ` avec ${course.trainerName}` : '';
    const certifPart = course.hasCertificate ? ' Certificat de réussite inclus.' : '';
    const catPart = course.category ? ` [Catégorie : ${course.category}]` : '';

    if (truncatedDesc) {
      description = `Formation "${course.title}"${trainerPart}.${catPart} ${truncatedDesc}${certifPart} Accédez aux cours en ligne dès maintenant.`;
    } else {
      description = `Apprenez avec la formation "${course.title}"${trainerPart} sur Dekel.Formation.${catPart} Cours en ligne complet, accès illimité et suivi de progression.${certifPart}`;
    }
  }

  // Ensure description length is optimal for search engines (150-165 chars max)
  if (description.length > 165) {
    description = description.substring(0, 162) + '...';
  }

  // 3. Fallback Share / OG Image
  const image = course.seoShareImage || course.coverImage || `${cleanHost}/og-image.jpg`;

  // 4. Auto-generate Keywords from category, tags, and title
  const keywordSet = new Set<string>([
    'formation en ligne',
    'cours en ligne',
    'Dekel.Formation',
    'apprendre en ligne'
  ]);
  if (course.title) keywordSet.add(course.title.toLowerCase());
  if (course.category) keywordSet.add(course.category.toLowerCase());
  if (course.subCategory) keywordSet.add(course.subCategory.toLowerCase());
  if (course.trainerName) keywordSet.add(`formation ${course.trainerName.toLowerCase()}`);
  if (course.tags && Array.isArray(course.tags)) {
    course.tags.forEach(t => t && keywordSet.add(t.toLowerCase()));
  }
  if (course.skillsAcquired && Array.isArray(course.skillsAcquired)) {
    course.skillsAcquired.slice(0, 3).forEach(s => s && keywordSet.add(s.toLowerCase()));
  }
  const keywords = Array.from(keywordSet).join(', ');

  // 5. Schema.org Course JSON-LD Structured Data
  const effectivePrice = course.promoPrice && course.promoPrice > 0 ? course.promoPrice : (course.price || 0);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": course.seoTitle || course.title,
    "description": description,
    "provider": {
      "@type": "EducationalOrganization",
      "name": "Dekel.Formation",
      "sameAs": cleanHost
    },
    "author": {
      "@type": "Person",
      "name": course.trainerName || "Formateur Dekel.Formation"
    },
    "hasCourseInstance": {
      "@type": "CourseInstance",
      "courseMode": "Online",
      "inLanguage": "fr"
    },
    "offers": {
      "@type": "Offer",
      "category": effectivePrice > 0 ? "Paid" : "Free",
      "price": effectivePrice,
      "priceCurrency": "XAF",
      "availability": "https://schema.org/InStock",
      "url": canonicalUrl
    }
  };

  return {
    title,
    description,
    canonicalUrl,
    image,
    type: 'website',
    keywords,
    jsonLd
  };
}
