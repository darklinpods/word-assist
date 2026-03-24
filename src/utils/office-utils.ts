/**
 * Reads the currently selected text in the Word document.
 */
export async function getSelectedText(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof Office === 'undefined') {
      return reject(new Error('Office SDK is not loaded. Please run inside Microsoft Word.'));
    }
    Office.context.document.getSelectedDataAsync(Office.CoercionType.Text, (result) => {
      if (result.status === Office.AsyncResultStatus.Failed) {
        reject(new Error(result.error.message));
      } else {
        resolve(result.value as string);
      }
    });
  });
}

/**
 * Inserts suggestion text after the current selection
 */
export async function insertSuggestion(text: string): Promise<void> {
  if (typeof Word === 'undefined') {
    throw new Error('Word.js API is not loaded.');
  }
  return Word.run(async (context) => {
    const selection = context.document.getSelection();
    // Insert text at the end of the selection
    const insertedRange = selection.insertText(`\n[AI审查建议: ${text}]\n`, Word.InsertLocation.after);
    insertedRange.font.color = "red";
    insertedRange.font.bold = true;
    await context.sync();
  });
}
