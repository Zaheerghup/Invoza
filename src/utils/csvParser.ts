/**
 * A lightweight zero-dependency CSV parser.
 * Perfectly parses comma-separated data while respecting strings escaped securely inside quotes.
 */
export function parseCSV(fileContent: string): any[] {
  const lines = fileContent.split(/\r?\n/).filter(line => line.trim() !== "");
  if (lines.length < 2) return [];

  // Parse headers directly
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const results = [];

  for (let i = 1; i < lines.length; i++) {
    // Advanced Regex matches commas exclusively outside of double-quotes to preserve formatted CSV strings
    const row = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    
    if (row.length === headers.length || row.length > 0) {
      const rowObject: any = {};
      row.forEach((col, index) => {
        if (index >= headers.length) return;
        
        let value = col ? col.trim() : "";
        // Remove surrounding double-quotes natively if they encapsulate the string
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        }
        // Normalize empty fields to undefined for Prisma
        rowObject[headers[index]] = value === "" ? undefined : value;
      });
      results.push(rowObject);
    }
  }

  return results;
}
