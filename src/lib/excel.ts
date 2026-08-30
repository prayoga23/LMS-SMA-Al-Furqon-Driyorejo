import * as XLSX from 'xlsx';

export interface TargetFieldDef {
  key: string;
  label: string;
  required?: boolean;
  description?: string;
  aliases?: string[];
  type?: 'string' | 'number' | 'boolean';
  defaultValue?: any;
}

export const STUDENT_TARGET_FIELDS: TargetFieldDef[] = [
  { key: 'nis', label: 'NIS', required: true, description: 'Nomor Induk Siswa', aliases: ['nis', 'no_induk', 'nomor_induk'] },
  { key: 'name', label: 'Nama Siswa', required: true, description: 'Nama lengkap siswa', aliases: ['nama', 'name', 'nama_siswa', 'nama_lengkap'] },
  { key: 'class', label: 'Kelas', required: false, description: 'Kelas siswa (contoh: X IPA 1)', aliases: ['kelas', 'class', 'rombel'] },
  { key: 'major', label: 'Jurusan', required: false, description: 'Jurusan (IPA, IPS, dll)', aliases: ['jurusan', 'major', 'peminatan'] },
  { key: 'entry_year', label: 'Tahun Masuk', type: 'number', required: false, description: 'Tahun angkatan masuk', aliases: ['tahun_masuk', 'angaktan', 'tahun'] },
  { key: 'is_santri', label: 'Status Santri', type: 'boolean', required: false, description: 'Apakah siswa santri pondok', aliases: ['santri', 'is_santri', 'status_santri'] },
  { key: 'residence_type', label: 'Jenis Tempat Tinggal', required: false, description: 'Asrama / Non-Asrama', aliases: ['residence', 'residence_type', 'asrama'] },
  { key: 'parent_name', label: 'Nama Wali', required: false, description: 'Nama orang tua/wali', aliases: ['nama_ortu', 'wali', 'parent_name'] },
  { key: 'parent_email', label: 'Email Wali', required: false, description: 'Email akun wali siswa', aliases: ['email_ortu', 'email_wali', 'parent_email'] },
  { key: 'parent_phone', label: 'No HP Wali', required: false, description: 'Nomor HP WhatsApp wali', aliases: ['hp_ortu', 'no_hp', 'phone', 'parent_phone'] },
];

export const TEACHER_TARGET_FIELDS: TargetFieldDef[] = [
  { key: 'nip', label: 'NIP', required: true, description: 'Nomor Induk Pegawai/Guru', aliases: ['nip', 'no_nip', 'id_guru'] },
  { key: 'name', label: 'Nama Guru', required: true, description: 'Nama lengkap beserta gelar', aliases: ['nama', 'name', 'nama_guru', 'nama_lengkap'] },
  { key: 'subject', label: 'Mata Pelajaran', required: true, description: 'Bidang studi utama', aliases: ['mapel', 'subject', 'mata_pelajaran', 'bidang'] },
  { key: 'phone', label: 'No HP / WhatsApp', required: false, description: 'Nomor telepon aktif', aliases: ['phone', 'no_hp', 'telp', 'wa'] },
  { key: 'email', label: 'Email Login', required: false, description: 'Email akun portal guru', aliases: ['email', 'email_guru', 'mail'] },
  { key: 'status', label: 'Status Kepegawaian', required: false, description: 'Aktif / Non-Aktif', aliases: ['status', 'status_guru'] },
];

export const downloadStudentExcelTemplate = () => {
  const data = [
    {
      'NIS': '20241099',
      'Nama Siswa': 'Budi Pratama',
      'Kelas': 'X IPA 1',
      'Jurusan': 'IPA',
      'Tahun Masuk': 2024,
      'Nama Orang Tua': 'Hendra Pratama',
      'Email Orang Tua': 'budi.ortu@gmail.com',
      'No HP Orang Tua': '081234567890',
    },
    {
      'NIS': '20241100',
      'Nama Siswa': 'Siti Anisa',
      'Kelas': 'XI IPS 1',
      'Jurusan': 'IPS',
      'Tahun Masuk': 2023,
      'Nama Orang Tua': 'Ahmad Dahlan',
      'Email Orang Tua': 'anisa.ortu@gmail.com',
      'No HP Orang Tua': '082198765432',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Siswa');
  XLSX.writeFile(workbook, 'Template_Import_Siswa_SMA_AL_FURQON.xlsx');
};

export const downloadTeacherExcelTemplate = () => {
  const data = [
    {
      'NIP': '198501012010011001',
      'Nama Guru': 'Dr. Irwan Setiawan, M.Pd',
      'Mata Pelajaran': 'Fisika Komputasi',
      'No HP': '081345678901',
      'Email': 'irwan@sekolah.sch.id',
      'Status': 'Aktif',
    },
    {
      'NIP': '199105122019032011',
      'Nama Guru': 'Dewi Anggraini, S.Pd',
      'Mata Pelajaran': 'Bahasa Indonesia',
      'No HP': '085711223344',
      'Email': 'dewi@sekolah.sch.id',
      'Status': 'Aktif',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Guru');
  XLSX.writeFile(workbook, 'Template_Import_Guru_SMA_AL_FURQON.xlsx');
};

/**
 * Backward compatibility parser
 */
export const parseExcelFile = async (file: File): Promise<Record<string, unknown>[]> => {
  const { rawRows } = await parseExcelSheetData(file);
  return rawRows;
};

/**
 * Extract sheet names from an Excel file
 */
export const getExcelSheets = async (file: File): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        resolve(workbook.SheetNames || []);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Parse an Excel sheet into headers and raw row objects
 */
export const parseExcelSheetData = async (
  file: File,
  sheetName?: string
): Promise<{ headers: string[]; rawRows: Record<string, any>[] }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true, cellText: false });
        const targetSheetName = sheetName && workbook.SheetNames.includes(sheetName)
          ? sheetName
          : workbook.SheetNames[0];

        if (!targetSheetName) {
          throw new Error('Sheet tidak ditemukan dalam file Excel.');
        }

        const worksheet = workbook.Sheets[targetSheetName];

        // Convert worksheet to array of arrays to find header row cleanly
        const rawJsonArray = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: '' });

        if (!rawJsonArray || rawJsonArray.length === 0) {
          return resolve({ headers: [], rawRows: [] });
        }

        // Find header row (first non-empty row)
        let headerRowIndex = 0;
        for (let i = 0; i < rawJsonArray.length; i++) {
          const row = rawJsonArray[i];
          if (Array.isArray(row) && row.some((cell) => cell !== null && cell !== undefined && String(cell).trim() !== '')) {
            headerRowIndex = i;
            break;
          }
        }

        const rawHeaders = (rawJsonArray[headerRowIndex] || []).map((h: any, idx: number) => {
          const trimmed = String(h || '').trim();
          return trimmed !== '' ? trimmed : `Kolom_${idx + 1}`;
        });

        // Parse rows as JSON objects keyed by sheet headers
        const rawRowsJson = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
          defval: '',
          range: headerRowIndex,
          raw: false,
        });

        // Filter out empty rows
        const cleanedRows = rawRowsJson.filter((row) =>
          Object.values(row).some((v) => v !== null && v !== undefined && String(v).trim() !== '')
        );

        resolve({ headers: rawHeaders, rawRows: cleanedRows });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Clean cell values (handles numeric floats like 123.0, exponential notation, numbers as text, whitespace)
 */
export const cleanCellValue = (val: any): string => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'number') {
    // Check if integer
    if (Number.isInteger(val)) {
      return String(val);
    }
    return String(val);
  }
  return String(val).trim();
};

/**
 * Auto-match Excel header columns to target system fields using alias dictionary
 */
export const autoMatchColumns = (
  excelHeaders: string[],
  targetFields: TargetFieldDef[]
): Record<string, string> => {
  const mapping: Record<string, string> = {};

  targetFields.forEach((field) => {
    const candidates = [
      field.key.toLowerCase(),
      field.label.toLowerCase(),
      ...(field.aliases || []).map((a) => a.toLowerCase()),
    ];

    // Find best header match
    const matchedHeader = excelHeaders.find((header) => {
      const hLower = header.toLowerCase().trim();
      const hNormalized = hLower.replace(/[^a-z0-9]/g, '');
      return candidates.some((cand) => {
        const cLower = cand.trim();
        const cNormalized = cLower.replace(/[^a-z0-9]/g, '');
        return hLower === cLower || hNormalized === cNormalized || hLower.includes(cLower) || cLower.includes(hLower);
      });
    });

    mapping[field.key] = matchedHeader || '';
  });

  return mapping;
};

/**
 * Map raw excel rows using the selected column mapping dictionary
 */
export const mapExcelRowsToSchema = (
  rawRows: Record<string, any>[],
  columnMapping: Record<string, string>,
  targetFields: TargetFieldDef[]
): Record<string, any>[] => {
  return rawRows.map((row) => {
    const mappedObj: Record<string, any> = {};

    targetFields.forEach((field) => {
      const selectedExcelColumn = columnMapping[field.key];
      const rawVal = selectedExcelColumn ? row[selectedExcelColumn] : undefined;
      const cleaned = cleanCellValue(rawVal);

      if (field.type === 'number') {
        const numVal = Number(cleaned.replace(/[^0-9.-]/g, ''));
        mappedObj[field.key] = !isNaN(numVal) && cleaned !== '' ? numVal : field.defaultValue ?? null;
      } else if (field.type === 'boolean') {
        const lower = cleaned.toLowerCase();
        mappedObj[field.key] = ['ya', 'yes', 'true', '1', 'santri', 'aktif'].includes(lower);
      } else {
        mappedObj[field.key] = cleaned || (field.defaultValue !== undefined ? field.defaultValue : '');
      }
    });

    return mappedObj;
  });
};
