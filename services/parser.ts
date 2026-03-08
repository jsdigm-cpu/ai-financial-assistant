
import { Transaction } from '../types';

// Worker script as a string to avoid needing a separate file.
// This moves the heavy XLSX parsing off the main UI thread, preventing freezes.
const workerScript = `
  // The xlsx library is loaded via a script tag in the main page, but workers have
  // their own scope. We need to load it explicitly in the worker's scope.
  self.importScripts('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');

  // --- Start of duplicated code from constants.ts and parser.ts helper functions ---
  // We have to duplicate this because workers can't import modules in this simple environment.
  
  const DEFAULT_CATEGORY_INCOME = '기타매출';
  const DEFAULT_CATEGORY_EXPENSE = '기타사업비';

  const COLUMN_MAPPINGS = {
    date: ['거래일시', '거래일', '일시', 'date', 'transaction date'],
    description: ['적요', '내용', '거래내역', 'description', 'details'],
    debit: ['출금액', '출금', 'debit', 'withdraw'],
    credit: ['입금액', '입금', 'credit', 'deposit'],
    balance: ['잔액', 'balance'],
  };

  const normalizeHeader = (header) => {
    if (!header) return '';
    const lowerHeader = String(header).toLowerCase().replace(/\\s+/g, '');
    for (const key in COLUMN_MAPPINGS) {
      if (COLUMN_MAPPINGS[key].some(alias => lowerHeader.includes(alias))) {
        return key;
      }
    }
    return String(header);
  };

  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    // XLSX's cellDates:true sometimes returns a Date object.
    if (dateStr instanceof Date) return dateStr.toISOString();
    
    let str = String(dateStr);
    
    // Handle Excel serial date number
    if (typeof dateStr === 'number' && dateStr > 1 && dateStr < 100000) {
       const excelEpoch = new Date(1899, 11, 30);
       const excelDate = new Date(excelEpoch.getTime() + dateStr * 86400000);
       const timeFraction = dateStr - Math.floor(dateStr);
       if (timeFraction > 0) {
           const totalSeconds = Math.round(timeFraction * 86400);
           excelDate.setSeconds(totalSeconds);
       }
       return excelDate.toISOString(); // Return ISO string to pass through worker boundary
    }
    
    // Handle "YYYY.MM.DD HH:mm:ss" and other formats
    str = str.replace(/\\./g, '-');
    const date = new Date(str);
    if (!isNaN(date.getTime())) {
      return date.toISOString(); // Return ISO string
    }
    
    return null;
  };

  const parseAmount = (amount) => {
    if (typeof amount === 'number') return amount;
    if (!amount || typeof amount !== 'string') return 0;
    return Number(String(amount).replace(/[^\\d.-]/g, '')) || 0;
  };

  // --- End of duplicated code ---

  self.onmessage = (event) => {
    const { file, title } = event.data;
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target.result;
        // Access the XLSX global object loaded by importScripts
        const workbook = self.XLSX.read(data, { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = self.XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });

        const errors = [];
        let headerRow = -1;
        let headers = [];

        for (let i = 0; i < Math.min(json.length, 10); i++) {
            const row = json[i];
            const foundHeaders = row.filter(cell => cell && typeof cell === 'string' && Object.values(COLUMN_MAPPINGS).flat().some(h => String(cell).toLowerCase().includes(h)));
            if(foundHeaders.length > 2) {
                headerRow = i;
                headers = row.map(h => normalizeHeader(String(h || '')));
                break;
            }
        }

        if (headerRow === -1) {
          errors.push(\`\${title}: 헤더를 찾을 수 없습니다. '거래일시', '적요', '입금액', '출금액' 등의 컬럼이 있는지 확인해주세요.\`);
          self.postMessage({ transactions: [], errors });
          return;
        }

        const dataRows = json.slice(headerRow + 1);
        const transactions = [];

        dataRows.forEach((row, index) => {
          const rowData = {};
          headers.forEach((header, i) => {
            rowData[header] = row[i];
          });

          const dateISO = parseDate(rowData.date);
          const description = rowData.description || '';
          
          if (!dateISO || !description) {
            errors.push(\`\${title} (Row \${headerRow + index + 2}): 날짜 또는 적요 필드가 비어있어 건너뜁니다.\`);
            return;
          }

          const credit = parseAmount(rowData.credit);
          const debit = parseAmount(rowData.debit);
          
          if (credit === 0 && debit === 0) {
             errors.push(\`\${title} (Row \${headerRow + index + 2}): 입금액과 출금액이 모두 0입니다.\`);
             return;
          }
          
          const initialCategory = credit > 0 ? DEFAULT_CATEGORY_INCOME : DEFAULT_CATEGORY_EXPENSE;

          transactions.push({
            id: \`\${title}-\${dateISO}-\${index}\`,
            date: dateISO, // Send as ISO string
            description: String(description),
            debit,
            credit,
            balance: parseAmount(rowData.balance),
            bank: title,
            category: initialCategory,
          });
        });

        self.postMessage({ transactions, errors });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        self.postMessage({ transactions: [], errors: [\`\${title}: 파일 파싱 중 오류 발생 - \${errorMessage}\`] });
      }
    };

    reader.onerror = (error) => {
       self.postMessage({ transactions: [], errors: [\`\${title}: 파일을 읽는 중 오류가 발생했습니다.\`] });
    };

    reader.readAsArrayBuffer(file);
  };
`;

export const parseFile = (file: File, title: string): Promise<{ transactions: Transaction[], errors: string[] }> => {
  return new Promise((resolve, reject) => {
    if (!window.Worker) {
      reject(new Error("브라우저가 백그라운드 처리를 지원하지 않아 대용량 파일을 분석할 수 없습니다."));
      return;
    }

    const blob = new Blob([workerScript], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    const worker = new Worker(workerUrl);

    worker.onmessage = (event) => {
      const { transactions, errors } = event.data;
      
      // Convert date strings from worker back to Date objects
      const typedTransactions: Transaction[] = transactions.map((tx: any) => ({
        ...tx,
        date: new Date(tx.date),
      }));

      resolve({ transactions: typedTransactions, errors });
      
      // Clean up the worker and object URL
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
    };

    worker.onerror = (error) => {
      const errorMessage = `파일 분석 중 오류가 발생했습니다: ${error.message}`;
      console.error(errorMessage, error);
      reject(new Error(errorMessage));
      
      // Clean up
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
    };

    // Send the file to the worker to start processing
    worker.postMessage({ file, title });
  });
};
