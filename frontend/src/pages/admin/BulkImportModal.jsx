import { useState } from 'react';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import DataTable from '../../components/DataTable';
import { bulkImportStudents } from '../../services/student.service';
import { getErrorMessage } from '../../services/api';
import { useToast } from '../../components/Toast';

function parseCSV(text) {
  const lines = text.split(/\r\n|\n|\r/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
  const rows = [];

  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i];
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let c = 0; c < line.length; c += 1) {
      const char = line[c];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const row = {};
    headers.forEach((h, idx) => {
      let val = values[idx] || '';
      val = val.replace(/^["']|["']$/g, '').trim();
      row[h] = val;
    });
    rows.push(row);
  }
  return rows;
}

export default function BulkImportModal({ onClose, onSuccess }) {
  const { push } = useToast();
  const [rows, setRows] = useState([]);
  const [fileName, setFileName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const downloadTemplate = () => {
    const csvContent =
      'studentCode,name,email,department,year,semester,section,phone,password\n' +
      '1MS21CS099,Rohan Verma,rohan.v@student.college.edu,CSE,2,3,A,9876543210,Rohan@123\n' +
      '1MS21EC045,Sneha Rao,sneha.r@student.college.edu,ECE,2,3,B,9876543211,Sneha@123';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'student_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const parsed = parseCSV(text);
        if (parsed.length === 0) {
          push('The uploaded CSV file is empty or missing headers.', 'error');
          return;
        }
        setRows(parsed);
      } catch (err) {
        push('Failed to parse CSV file: ' + err.message, 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (rows.length === 0) return;
    setSubmitting(true);
    try {
      const res = await bulkImportStudents(rows);
      const data = res.data?.data;
      setResult(data);
      if (data?.importedCount > 0) {
        push(`Successfully imported ${data.importedCount} student(s).`, 'success');
        onSuccess?.();
      } else {
        push('No students were imported. Check validation errors below.', 'error');
      }
    } catch (err) {
      push(getErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Bulk Import Students via CSV" onClose={onClose} size="lg">
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--space-4)',
            padding: '12px 16px',
            background: 'var(--color-surface-subtle)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>CSV Template Required</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)' }}>
              Columns: studentCode, name, email, department, year, semester, section, phone, password
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            📄 Download CSV Template
          </Button>
        </div>

        {/* Upload Field */}
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 6 }}>
            Choose CSV File
          </label>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            style={{
              display: 'block',
              width: '100%',
              padding: '8px 12px',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
            }}
          />
          {fileName && (
            <div style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)', marginTop: 4 }}>
              Selected file: <strong>{fileName}</strong> ({rows.length} rows detected)
            </div>
          )}
        </div>

        {/* Preview Table */}
        {rows.length > 0 && !result && (
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                Data Preview (First {Math.min(rows.length, 5)} of {rows.length} rows)
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-faint)' }}>
                Review before submitting
              </span>
            </div>
            <DataTable
              columns={[
                { key: 'studentCode', header: 'USN / Code' },
                { key: 'name', header: 'Full Name' },
                { key: 'email', header: 'Email' },
                { key: 'department', header: 'Dept' },
                { key: 'year', header: 'Yr' },
                { key: 'semester', header: 'Sem' },
              ]}
              rows={rows.slice(0, 5).map((r, i) => ({ ...r, _id: i }))}
            />
          </div>
        )}

        {/* Result Summary */}
        {result && (
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-sm)',
                background: result.importedCount > 0 ? 'var(--color-stable-tint)' : 'var(--color-critical-tint)',
                border: `1px solid ${result.importedCount > 0 ? 'var(--color-stable)' : 'var(--color-critical)'}`,
                marginBottom: 'var(--space-3)',
              }}
            >
              <strong>Import Results:</strong> {result.importedCount} successful, {result.failedCount} failed.
            </div>

            {result.failed && result.failed.length > 0 && (
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-critical)', marginBottom: 6 }}>
                  Failed Records ({result.failed.length}):
                </div>
                <div
                  style={{
                    maxHeight: 180,
                    overflowY: 'auto',
                    background: 'var(--color-surface-subtle)',
                    padding: 8,
                    borderRadius: 'var(--radius-xs)',
                    fontSize: '0.8rem',
                  }}
                >
                  {result.failed.map((f, i) => (
                    <div key={i} style={{ padding: '4px 0', borderBottom: '1px solid var(--color-border-subtle)' }}>
                      <strong>Row {f.row}</strong> ({f.studentCode} / {f.email}): <span style={{ color: 'var(--color-critical)' }}>{f.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
          <Button variant="secondary" onClick={onClose}>
            {result ? 'Close' : 'Cancel'}
          </Button>
          {!result && (
            <Button
              variant="primary"
              loading={submitting}
              disabled={rows.length === 0}
              onClick={handleImport}
            >
              Import {rows.length} Students
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
