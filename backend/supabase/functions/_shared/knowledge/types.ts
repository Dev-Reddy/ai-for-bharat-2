export type KnowledgeDocumentProviderInput = {
  id: string;
  title: string;
  content: string;
  documentType: string;
  sourceFileName: string | null;
  isActive: boolean;
};

export type KnowledgeSyncResult = {
  syncStatus: "queued" | "inactive";
  sectionCount: number;
  eventIds: string[];
};

export type KnowledgeSystemContext = {
  id: string;
  name: string;
  description: string | null;
  promptTemplate: string;
  isActive: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type KnowledgeProvider = {
  retrieveSnippets(queries: string[]): Promise<string[]>;
  syncDocument(document: KnowledgeDocumentProviderInput): Promise<KnowledgeSyncResult>;
  deleteDocument(documentId: string): Promise<void>;
  getActiveContext(): Promise<KnowledgeSystemContext>;
};
