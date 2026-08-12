import { trafficAccidentComplaintDefinition } from './complaint/definition';
import type { ElementalComplaintDraft } from './complaint/types';
import type { DocumentDefinition } from './core/types';

interface DocumentDraftMap {
  'traffic-accident-elemental-complaint': ElementalComplaintDraft;
}

export type RegisteredDocumentId = keyof DocumentDraftMap;

const documentRegistry: {
  [K in RegisteredDocumentId]: DocumentDefinition<DocumentDraftMap[K]>;
} = {
  'traffic-accident-elemental-complaint': trafficAccidentComplaintDefinition,
};

export function getDocumentDefinition<K extends RegisteredDocumentId>(
  id: K,
): DocumentDefinition<DocumentDraftMap[K]> {
  return documentRegistry[id];
}

export const registeredDocumentMetadata = Object.values(documentRegistry).map((definition) => ({
  id: definition.id,
  title: definition.title,
  description: definition.description,
}));
