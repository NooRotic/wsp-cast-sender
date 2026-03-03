import React, { useMemo, useRef, useEffect, useState } from 'react';

interface CategoryButtonsProps {
  m3uGroups: string[];
  selectedGroup: string;
  onGroupSelect: (group: string) => void;
  onScrollToLibrary?: () => void;
}

// Most popular categories in priority order - most common/important first
// (This list is now only used for sorting priority, not filtering)
const PRIORITY_CATEGORIES = [
  'News', 'Sports', 'Movies', 'General', 'Entertainment', 'Music', 'Kids', 'Documentary'
];

// Popular categories to show as buttons (reduced to 6 for better layout)
const POPULAR_CATEGORIES = ['News', 'Sports', 'Entertainment', 'General', 'Kids', 'Movies'];

const CategoryButtons: React.FC<CategoryButtonsProps> = React.memo(({ 
  m3uGroups, 
  selectedGroup, 
  onGroupSelect, 
  onScrollToLibrary 
}) => {
  console.log('🎬 CategoryButtons props received:', {
    groupsCount: m3uGroups?.length || 0,
    groups: m3uGroups?.slice(0, 10), // Show first 10 for debugging
    selectedGroup
  });

  // HARD LIMIT: Only process popular categories, max 8 buttons
  const visibleCategories = useMemo(() => {
    if (!m3uGroups || m3uGroups.length === 0) {
      console.log('⚠️ CategoryButtons: No groups available');
      return [];
    }

    console.log('🔍 Processing m3uGroups for popular categories...');
    
    // Extract first group from semicolon-separated and find matches
    const matches: string[] = [];
    
    for (const popular of POPULAR_CATEGORIES) {
      if (matches.length >= 8) break; // HARD STOP at 8
      
      const matchedGroup = m3uGroups.find(group => {
        const firstGroup = group.includes(';') ? group.split(';')[0].trim() : group.trim();
        return firstGroup.toLowerCase() === popular.toLowerCase() ||
               firstGroup.toLowerCase().includes(popular.toLowerCase()) ||
               popular.toLowerCase().includes(firstGroup.toLowerCase());
      });
      
      if (matchedGroup) {
        const firstGroup = matchedGroup.includes(';') ? matchedGroup.split(';')[0].trim() : matchedGroup.trim();
        if (!matches.includes(firstGroup)) {
          matches.push(firstGroup);
        }
      }
    }
    
    console.log('� CategoryButtons final matches (max 8):', matches);
    return matches.slice(0, 8); // ABSOLUTE MAX 8
  }, [m3uGroups]);

  console.log('🔍 CategoryButtons render - visibleCategories:', visibleCategories);

  if (visibleCategories.length === 0) {
    console.log('❌ CategoryButtons: Not rendering, no visible categories');
    return null;
  }

  const handleGroupClick = (category: string) => {
    console.log('🖱️ CategoryButtons: Clicked category:', category);
    console.log('🖱️ Available m3uGroups:', m3uGroups);
    
    // Find the actual M3U group that matches this category
    const matchedGroup = m3uGroups.find(group => {
      const firstGroup = group.includes(';') ? group.split(';')[0].trim() : group.trim();
      return firstGroup === category || 
             firstGroup.toLowerCase().includes(category.toLowerCase()) || 
             category.toLowerCase().includes(firstGroup.toLowerCase());
    });
    
    console.log('🎯 Matched group:', matchedGroup || 'none found');
    
    if (matchedGroup) {
      onGroupSelect(matchedGroup);
    } else {
      // Fallback to the category name itself
      onGroupSelect(category);
    }
    
    if (onScrollToLibrary) {
      onScrollToLibrary();
    }
  };

  return (
    <div className="w-full">
      {/* Single row on large screens, 2 rows on smaller screens */}
      <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start lg:flex-nowrap lg:overflow-x-auto lg:-mr-4 lg:-ml-4">
        {visibleCategories.map(category => {
          // Check if this category matches the selected group
          const matchedGroup = m3uGroups.find(group => {
            const firstGroup = group.includes(';') ? group.split(';')[0].trim() : group.trim();
            return firstGroup === category || 
                   firstGroup.toLowerCase().includes(category.toLowerCase()) || 
                   category.toLowerCase().includes(firstGroup.toLowerCase());
          });
          
          const isSelected = matchedGroup === selectedGroup || category === selectedGroup;

          return (
            <button
              key={category}
              onClick={() => handleGroupClick(category)}
              className={`px-3 py-1.5 text-sm font-semibold rounded-lg border-2 transition-all duration-300 matrix-glass-tab flex-shrink-0 whitespace-nowrap lg:px-5 ${
                isSelected 
                  ? 'bg-[#39FF14]/25 text-[#39FF14] border-[#39FF14] shadow-lg shadow-[#39FF14]/30 selected' 
                  : 'bg-black/60 text-gray-100 border-[#39FF14]/40 hover:bg-[#39FF14]/15 hover:border-[#39FF14]/70 hover:text-[#39FF14]'
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>
    </div>
  );
});

// Add display name for debugging
CategoryButtons.displayName = 'CategoryButtons';

export default CategoryButtons;
