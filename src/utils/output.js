import Table from 'cli-table3';

/**
 * Format and print output in JSON or table format
 */
export function printOutput(data, format, columns) {
  if (format === 'json') {
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  // Table format
  if (Array.isArray(data)) {
    printTable(data, columns);
  } else {
    printSingleRecord(data, columns);
  }
}

function printTable(rows, columns) {
  if (rows.length === 0) {
    console.log('No results found.');
    return;
  }

  const table = new Table({
    head: columns.map(c => c.header),
    style: { head: ['cyan'] },
    wordWrap: true,
  });

  for (const row of rows) {
    table.push(columns.map(c => c.value(row)));
  }

  console.log(table.toString());

  // Show pagination info if available
  if (rows._total) {
    console.log(`\nTotal: ${rows._total} | Page: ${rows._totalPages} pages`);
  }
}

function printSingleRecord(record, columns) {
  const table = new Table({
    style: { head: ['cyan'] },
  });

  for (const col of columns) {
    const obj = {};
    obj[col.header] = col.value(record);
    table.push(obj);
  }

  console.log(table.toString());
}

/**
 * Helper to strip HTML tags for display
 */
export function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
}

/**
 * Truncate string for table display
 */
export function truncate(str, maxLen = 60) {
  if (!str) return '';
  str = String(str);
  return str.length > maxLen ? str.slice(0, maxLen - 3) + '...' : str;
}
