import jsPDF from "jspdf";
import autoTable from 'jspdf-autotable';

interface ExportColumn {
  header: string;
  dataKey: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const exportToCsv = (filename: string, columns: ExportColumn[], rows: any[]) => {
  const headerString = columns.map(col => `"${col.header}"`).join(";");
  const rowStrings = rows.map(row => 
    columns.map(col => {
      const cellData = row[col.dataKey];
      const cellString = cellData !== null && cellData !== undefined ? String(cellData) : '';
      return `"${cellString.replace(/"/g, '""')}"`;
    }).join(";")
  );

  const csvContent = [headerString, ...rowStrings].join("\n");
  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
  
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const exportToPdf = (filename: string, title: string, columns: ExportColumn[], rows: any[]) => {
  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Cabeçalho Premium
  doc.setFillColor(39, 39, 42); // bg-zinc-800
  doc.rect(0, 0, pageWidth, 40, "F");
  
  doc.setTextColor(245, 158, 11); // text-amber-500
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("MAGNATA", 14, 20);
  
  doc.setTextColor(161, 161, 170); // text-zinc-400
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("CRM & STOCK", 14, 26);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text(title, pageWidth - 14, 22, { align: "right" });
  
  doc.setFontSize(10);
  doc.setTextColor(161, 161, 170); // text-zinc-400
  doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`, pageWidth - 14, 28, { align: "right" });

  // Tabela
  const tableData = rows.map(row => 
    columns.map(col => row[col.dataKey] !== undefined && row[col.dataKey] !== null ? String(row[col.dataKey]) : "")
  );

  autoTable(doc, {
    startY: 45,
    head: [columns.map(col => col.header)],
    body: tableData,
    theme: 'grid',
    styles: { 
      font: 'helvetica', 
      fontSize: 8,
      cellPadding: 4,
      textColor: [63, 63, 70],
      lineColor: [228, 228, 231],
    },
    headStyles: { 
      fillColor: [24, 24, 27], 
      textColor: [244, 244, 245],
      fontStyle: 'bold',
      halign: 'center'
    },
    alternateRowStyles: { 
      fillColor: [250, 250, 250] 
    },
    margin: { top: 45, bottom: 20 },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    didDrawPage: (data: any) => {
      // Rodapé com numeração
      doc.setFontSize(8);
      doc.setTextColor(161, 161, 170);
      doc.text(
        `Página ${data.pageNumber}`, 
        pageWidth / 2, 
        pageHeight - 10, 
        { align: 'center' }
      );
    }
  });

  doc.save(`${filename}.pdf`);
};
