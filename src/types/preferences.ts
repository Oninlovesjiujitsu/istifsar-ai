export type CitationStyle = 'chicago' | 'apa' | 'mla';
export type AiResponseDepth = 'academic_rigour' | 'concise_overview';

export interface UserPreferences {
  citation_style: CitationStyle;
  ai_response_depth: AiResponseDepth;
}

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  citation_style: 'chicago',
  ai_response_depth: 'academic_rigour',
};
