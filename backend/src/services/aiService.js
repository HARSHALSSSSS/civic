const Report = require('../models/Report');
const logger = require('../config/logger');

// Keyword matrix for category detection
const CATEGORY_KEYWORDS = {
  Pothole: [
    'pothole', 'potholes', 'hole', 'crater', 'road damage', 'road surface',
    'asphalt', 'road crack', 'street damage', 'rutting', 'pavement', 'roadway'
  ],
  Waste: [
    'waste', 'garbage', 'trash', 'litter', 'pollution', 'polluted', 'wastewater',
    'sewage', 'drainage', 'garbage collection', 'dustbin', 'waste management',
    'refuse', 'rubbish', 'waste disposal', 'illegal dumping', 'dump'
  ],
  Light: [
    'light', 'streetlight', 'street light', 'lamp', 'lamps', 'lighting', 'dark',
    'electricity', 'power', 'outage', 'pole', 'wire', 'electrical', 'bulb',
    'street lamp', 'public lighting', 'illumination'
  ],
  Water: [
    'water', 'water supply', 'leak', 'leakage', 'pipeline', 'pipe', 'tap',
    'drinking water', 'water tank', 'borewell', 'bore well', 'pump', 'flood',
    'flooding', 'waterlogging', 'drain', 'storm water', 'sewer', 'shortage',
    'water connection', 'contamination'
  ],
  Traffic: [
    'traffic', 'signal', 'traffic light', 'sign', 'road sign', 'signage',
    'road marking', 'congestion', 'jams', 'accident', 'intersection', 'pedestrian',
    'crosswalk', 'zebra crossing', 'speed breaker', 'speed bump', 'parking',
    'illegal parking', 'vehicle', 'congestion'
  ],
  Other: []
};

// Keywords for priority assessment
const PRIORITY_KEYWORDS = {
  // High priority (4-5)
  high: [
    'emergency', 'urgent', 'critical', 'danger', 'hazard', 'accident',
    'flood', 'flooding', 'collapse', 'electrocution', 'gas leak', 'fire',
    'injury', 'death', 'life threatening', 'severe', 'major'
  ],
  // Medium priority (3)
  medium: [
    'frequently', 'often', 'recurring', 'persistent', 'ongoing', 'multiple',
    'several', 'many', 'community', 'area', 'neighborhood'
  ],
  // Lower priority (1-2)
  low: [
    'minor', 'small', 'cosmetic', 'aesthetic', 'temporary', 'future',
    'planning', 'suggestion', 'recommendation', 'when possible', 'low priority'
  ]
};

// Category detection based on keywords
const detectCategory = (title, description) => {
  const text = `${title} ${description}`.toLowerCase();
  
  let bestMatch = { category: 'Other', confidence: 0 };
  
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (category === 'Other') continue;
    
    let matchCount = 0;
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        matchCount++;
      }
    }
    
    if (matchCount > bestMatch.confidence) {
      const confidence = Math.min(matchCount / Math.max(keywords.length * 0.1, 1), 1);
      bestMatch = { category, confidence };
    }
  }
  
  // If no matches, return Other with low confidence
  if (bestMatch.confidence === 0) {
    return { category: 'Other', confidence: 0.3 };
  }
  
  return bestMatch;
};

// Priority assessment based on keywords
const assessPriority = (title, description, userProvidedPriority) => {
  const text = `${title} ${description}`.toLowerCase();
  
  let priorityScore = 0;
  
  // Check high priority keywords
  for (const keyword of PRIORITY_KEYWORDS.high) {
    if (text.includes(keyword)) {
      priorityScore += 2;
    }
  }
  
  // Check medium priority keywords
  for (const keyword of PRIORITY_KEYWORDS.medium) {
    if (text.includes(keyword)) {
      priorityScore += 1;
    }
  }
  
  // Check low priority keywords
  for (const keyword of PRIORITY_KEYWORDS.low) {
    if (text.includes(keyword)) {
      priorityScore -= 1;
    }
  }
  
  // Combine keyword analysis with user-provided priority
  let finalPriority = userProvidedPriority;
  
  if (priorityScore >= 3) {
    finalPriority = Math.min(5, Math.max(finalPriority, 4));
  } else if (priorityScore <= -2) {
    finalPriority = Math.max(1, Math.min(finalPriority, 2));
  }
  
  // Calculate confidence based on keyword matches
  const confidence = Math.min(0.5 + (Math.abs(priorityScore) * 0.1), 1);
  
  return { priority: finalPriority, confidence };
};

// Main function to analyze and categorize a report
const analyzeReport = async (title, description, userProvidedPriority) => {
  try {
    const categoryResult = detectCategory(title, description);
    const priorityResult = assessPriority(title, description, userProvidedPriority);
    
    // Use keyword analysis weights for final confidence
    const keywordWeight = 0.4;
    const categoryConfidence = categoryResult.confidence * keywordWeight;
    const priorityConfidence = priorityResult.confidence * keywordWeight;
    
    // Base confidence for structure/data quality
    const dataQualityBonus = 0.2;
    const descriptionLengthBonus = Math.min(description.length / 200, 0.2);
    
    const overallConfidence = Math.min(
      0.5 + categoryConfidence + priorityConfidence + dataQualityBonus + descriptionLengthBonus,
      0.95
    );
    
    return {
      suggestedCategory: categoryResult.category,
      suggestedPriority: priorityResult.priority,
      confidence: Math.round(overallConfidence * 100) / 100,
      processedAt: new Date(),
      analysis: {
        categoryConfidence: categoryResult.confidence,
        priorityConfidence: priorityResult.confidence,
        keywordMatches: {
          highPriority: PRIORITY_KEYWORDS.high.filter(k => text.includes(k)),
          mediumPriority: PRIORITY_KEYWORDS.medium.filter(k => text.includes(k)),
          lowPriority: PRIORITY_KEYWORDS.low.filter(k => text.includes(k))
        }
      }
    };
  } catch (error) {
    logger.error(`AI analysis error: ${error.message}`);
    // Return default values on error
    return {
      suggestedCategory: 'Other',
      suggestedPriority: userProvidedPriority || 3,
      confidence: 0,
      processedAt: new Date(),
      analysis: null
    };
  }
};

// Check if OpenAI/Gemini API is configured for enhanced analysis
const isAdvancedAIEnabled = () => {
  return !!(process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY);
};

// Advanced analysis using external API (placeholder for future integration)
const advancedAnalysis = async (title, description) => {
  // This would integrate with OpenAI or Gemini API
  // For now, return the keyword-based analysis
  if (!isAdvancedAIEnabled()) {
    return analyzeReport(title, description, 3);
  }
  
  // Placeholder for API integration
  // In production, this would call OpenAI/Gemini API
  logger.info('Advanced AI analysis requested but API not configured, using keyword analysis');
  return analyzeReport(title, description, 3);
};

module.exports = {
  analyzeReport,
  advancedAnalysis,
  detectCategory,
  assessPriority,
  CATEGORY_KEYWORDS,
  PRIORITY_KEYWORDS,
  isAdvancedAIEnabled
};
