import * as XLSX from 'xlsx';

export const downloadStudentExcelTemplate = () => {
  const data = [
    {
      'NIS': '20241099',
      'Nama Siswa': 'Budi Pratama',
      'Kelas': 'X IPA 1',
      'Jurusan': 'IPA (MIPA)',
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

export const parseExcelFile = async (file: File): Promise<Record<string, unknown>[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);
        resolve(json);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};
