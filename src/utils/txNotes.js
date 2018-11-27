// @flow
export function extractTxNotesFromMessages(txNotesRaw: Object[] = []): Object[] {
  const txNotes = [];
  if (txNotesRaw && txNotesRaw.length > 0) {
    txNotesRaw.forEach(({ messages = [] }) => {
      if (Array.isArray(messages)) {
        messages.forEach(({ content }) => {
          const txNote = JSON.parse(content);
          txNotes.push(txNote);
        });
      } else {
        messages.messages.forEach(({ content }) => {
          const txNote = JSON.parse(content);
          txNotes.push(txNote);
        });
      }
    });
  }
  return txNotes;
}
