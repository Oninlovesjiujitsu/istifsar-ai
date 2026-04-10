export type ContentionClaim = {
  documentId: string;
  documentTitle: string;
  scholarName: string;
  scholarUsername: string;
  claim: string;
  excerpt: string | null;
};

export type ContentionMeta = {
  contentionId: string;
  title: string;
  description: string | null;
  topic: string | null;
  claims: ContentionClaim[];
  status: 'open' | 'resolved' | 'disputed';
  documentIds: string[];
  documentTitles: string[];
  scholarNames: string[];
  scholarUsernames: string[];
};
