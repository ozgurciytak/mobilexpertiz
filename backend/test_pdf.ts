import { createReportPDFBuffer } from './src/services/pdf.service';
import fs from 'fs';

async function test() {
  const mockReport = {
    id: 1,
    requestId: 1,
    content: 'Test content with Turkish: şıüğçöİI',
    createdAt: new Date(),
    expert: { name: 'Ahmet Uzman' },
    request: { title: 'Test Title' },
    vehicleParts: { "Part": "Status" }
  };
  
  try {
    const buffer = await createReportPDFBuffer(mockReport);
    fs.writeFileSync('test_report.pdf', buffer);
    fs.writeFileSync('error_debug.log', 'Success');
  } catch (err: any) {
    fs.writeFileSync('error_debug.log', err.stack || err.message);
  }
}

test();
