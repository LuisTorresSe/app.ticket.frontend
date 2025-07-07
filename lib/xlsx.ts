
// This file uses the SheetJS library loaded via a script tag in index.html
// The global variable is `XLSX`.

declare var XLSX: any;

export const exportToExcel = (data: Record<string, any>[], fileName: string): void => {
  if (typeof XLSX === 'undefined') {
    console.error('SheetJS library (XLSX) is not loaded.');
    alert('La funcionalidad de exportación no está disponible. Asegúrese de que la librería externa se haya cargado.');
    return;
  }
  
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos');

  // Auto-size columns for better readability
  const objectMaxLength = [];
  if (data.length > 0) {
      const fieldKeys = Object.keys(data[0]);
      for (let i = 0; i < fieldKeys.length; i++) {
        objectMaxLength.push(
          Math.max(
            fieldKeys[i].length,
            ...data.map(obj => (obj[fieldKeys[i]] ? String(obj[fieldKeys[i]]).length : 0))
          )
        );
      }
      worksheet['!cols'] = objectMaxLength.map(w => ({ wch: w + 2 })); // Add a little extra padding
  }

  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};
