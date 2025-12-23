import { useState, useCallback } from 'react';
import { JobFilters, defaultFilters } from '@/types/filters';

export const useFilters = () => {
  const [filters, setFilters] = useState<JobFilters>(defaultFilters);
  const [isFilterActive, setIsFilterActive] = useState(false);

  const updateFilters = useCallback((newFilters: Partial<JobFilters>) => {
    setFilters(prev => {
      const updated = { ...prev, ...newFilters };
      const hasActiveFilters = 
        (updated.locations && updated.locations.length > 0) ||
        updated.salaryRange ||
        updated.remote !== null ||
        updated.visaSponsorship !== null ||
        updated.jobType !== null;
      setIsFilterActive(hasActiveFilters);
      return updated;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(defaultFilters);
    setIsFilterActive(false);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
    setIsFilterActive(false);
  }, []);

  return {
    filters,
    isFilterActive,
    updateFilters,
    clearFilters,
    resetFilters,
  };
};

