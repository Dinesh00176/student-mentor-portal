// Minimal dependency-free CSV conversion for report exports.
function toCsv(rows, columns) {
  const escape = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };
  const header = columns.map((c) => escape(c.label)).join(',');
  const lines = rows.map((row) => columns.map((c) => escape(typeof c.value === 'function' ? c.value(row) : row[c.value])).join(','));
  return [header, ...lines].join('\n');
}

// Sends either the normal JSON envelope or a CSV file download, based on
// req.query.export === 'csv'. Keeps every report endpoint's contract
// backward-compatible (JSON by default) while adding export support.
function sendReport(req, res, filename, rows, columns, jsonPayload, message) {
  if (req.query.export === 'csv') {
    const csv = toCsv(rows, columns);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csv);
  }
  const { sendSuccess } = require('./apiResponse');
  return sendSuccess(res, 200, jsonPayload, message);
}

module.exports = { toCsv, sendReport };
