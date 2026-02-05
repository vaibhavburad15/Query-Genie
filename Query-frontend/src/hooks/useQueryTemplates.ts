// src/hooks/useQueryTemplates.ts - NEW FILE

import { useState, useEffect } from 'react';

const QUERY_TEMPLATES = [
  
];

export const useQueryTemplates = () => {
  const [templates] = useState(QUERY_TEMPLATES);

  return {
    templates,
    getTemplatesByCategory: (category: string) =>
      templates.filter(t => t.category === category),
    getRandomTemplate: () =>
      templates[Math.floor(Math.random() * templates.length)],
  };
};