export {
  getDocumentText,
  getSelectedText,
  locateTextInDocument,
} from './office/environment';

export { insertTemplate } from './office/template';

export {
  insertSuggestion,
  replaceAmountInDocument,
  replaceAllAmounts,
} from './office/annotation';

export {
  insertPartiesIntoTemplate,
  insertFullExtractionIntoTemplate,
} from './office/parties-template';

export { formatTraditionalComplaint } from './office/formatting';

export {
  exportCompensationTable,
  type CompensationExportItem,
  type CompensationExportMeta,
} from './office/compensation-export';
