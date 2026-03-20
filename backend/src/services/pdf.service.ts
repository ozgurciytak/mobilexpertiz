import PDFDocument from 'pdfkit';
import path from 'path';
import QRCode from 'qrcode';

const createDoc = () => {
  const doc = new PDFDocument({ margin: 50 });
  
  const fontsPath = path.resolve(__dirname, '../assets/fonts');
  const regularFont = path.join(fontsPath, 'Roboto-Regular.ttf');
  const boldFont = path.join(fontsPath, 'Roboto-Bold.ttf');
  
  doc.registerFont('Roboto', regularFont);
  doc.registerFont('Roboto-Bold', boldFont);
  doc.font('Roboto');
  
  return doc;
};

export const createPDFBuffer = (title: string, content: string): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const doc = createDoc();
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', (err) => {
        console.error('PDF Doc Error:', err);
        reject(err);
    });

    // Add content to PDF
    doc.fontSize(25).text(title, { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(content, { align: 'left' });
    
    doc.end();
  });
};

export const createReportPDFBuffer = (reportData: any): Promise<Buffer> => {
    return new Promise(async (resolve, reject) => {
      const doc = createDoc();
      const chunks: Buffer[] = [];
  
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));
  
      // Generate QR Code Buffer
      let qrCodeBuffer: Buffer | null = null;
      try {
          const verifyUrl = `http://192.168.1.166:3001/verify-report/${reportData.requestId}`; 
          qrCodeBuffer = await QRCode.toBuffer(verifyUrl, {
              margin: 1,
              width: 80,
              color: { dark: '#1e293b', light: '#ffffff' }
          });
      } catch (err) {
          console.error('QR Code generation error:', err);
      }

      // 1. Header with Logo (Left) and QR (Right)
      try {
        const logoPath = path.resolve(__dirname, '../assets/logo.png');
        doc.image(logoPath, 50, 40, { width: 50 });
      } catch (e) {}

      doc.fillColor('#1e293b').fontSize(18).font('Roboto-Bold').text('Mobil Expertiz', 110, 45, { align: 'left' });
      doc.fontSize(9).font('Roboto').fillColor('#64748b').text('Profesyonel Ekspertiz ve Denetim', 110, 65, { align: 'left' });
      
      if (qrCodeBuffer) {
        doc.image(qrCodeBuffer, 480, 25, { width: 60 });
        doc.fontSize(7).fillColor('#1e293b').text('RAPORU DOĞRULA', 480, 88, { width: 60, align: 'center' });
      }

      doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(50, 105).lineTo(560, 105).stroke();
      doc.moveDown(3);

      doc.fillColor('black').fontSize(16).font('Roboto-Bold').text('Ekspertiz Raporu', 50, 125, { align: 'left' });
      doc.moveDown(0.5);
      
      const request = reportData.request || {};
      const user = request.user || {};
      const expert = reportData.expert || {};
      
      doc.fontSize(11).font('Roboto-Bold').text('Araç ve Müşteri Bilgileri:', 50, doc.y, { align: 'left', underline: true });
      doc.moveDown(0.3);
      
      // Plaka & Sase
      doc.fontSize(10).font('Roboto-Bold').text('Plaka:', 50, doc.y, { continued: true });
      doc.font('Roboto').text(` ${request.plate || 'Belirtilmedi'}`);
      
      doc.fontSize(10).font('Roboto-Bold').text('Şase No:', 50, doc.y, { continued: true });
      doc.font('Roboto').text(` ${request.chassisNumber || 'Belirtilmedi'}`);
      
      doc.fontSize(10).font('Roboto-Bold').text('Müşteri:', 50, doc.y, { continued: true });
      doc.font('Roboto').text(` ${user.name || 'Belirtilmedi'} (${user.phone || ''})`);

      doc.moveDown(0.5);
      doc.fontSize(11).font('Roboto-Bold').text('Ekspertiz Sorumlusu:', 50, doc.y, { align: 'left', underline: true });
      doc.moveDown(0.3);
      doc.fontSize(10).font('Roboto-Bold').text('Uzman:', 50, doc.y, { continued: true });
      doc.font('Roboto').text(` ${expert.name || 'Bilinmiyor'}`);
      doc.fontSize(10).font('Roboto-Bold').text('Uzman Tel:', 50, doc.y, { continued: true });
      doc.font('Roboto').text(` ${expert.phone || 'Bilinmiyor'}`);
      doc.fontSize(10).font('Roboto-Bold').text('Rapor Tarihi:', 50, doc.y, { continued: true });
      doc.font('Roboto').text(` ${new Date(reportData.createdAt).toLocaleDateString('tr-TR')}`);
      
      doc.moveDown();
      doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(50, doc.y).lineTo(560, doc.y).stroke();
      doc.moveDown();

      // EVALUATION SECTION
      doc.fontSize(14).font('Roboto-Bold').text('EKSPERTİZ DEĞERLENDİRMESİ', 50, doc.y, { align: 'left' });
      doc.moveDown(0.5);
      doc.fontSize(11).font('Roboto').fillColor('#1e293b').text(reportData.content || 'Uzman görüşü girilmedi.', { align: 'left' });
      doc.moveDown();

      doc.strokeColor('#e2e8f0').lineWidth(0.5).moveTo(50, doc.y).lineTo(560, doc.y).stroke();
      doc.moveDown();

      if (reportData.vehicleParts) {
          doc.fontSize(13).font('Roboto-Bold').fillColor('black').text('Rapor Sonucu:', 50, doc.y, { align: 'left' });
          doc.moveDown(1);
          
          try {
              const partsRaw = typeof reportData.vehicleParts === 'string' 
                ? JSON.parse(reportData.vehicleParts) 
                : reportData.vehicleParts;
              
              const partEntries = Object.entries(partsRaw).filter(([_, data]) => {
                  const val = data as any;
                  const status = typeof val === 'object' ? val.status : data;
                  return status !== null && status !== undefined;
              });

              if (partEntries.length > 0) {
                  const colCount = 3;
                  const colWidth = 175;
                  const imgWidth = 160;
                  const imgHeight = 110;
                  const startX = 50;

                  for (let i = 0; i < partEntries.length; i += colCount) {
                      const rowItems = partEntries.slice(i, i + colCount);
                      
                      if (doc.y > 600) {
                          doc.addPage();
                      }
                      
                      const currentRowY = doc.y;

                      rowItems.forEach((item, idx) => {
                          const [part, data] = item;
                          const x = startX + (idx * colWidth);
                          const val = data as any;
                          const status = typeof val === 'object' ? val.status : data;
                          
                          doc.fontSize(9).font('Roboto-Bold').fillColor('#1e293b').text(`${part}:`, x, currentRowY, { width: colWidth - 10, align: 'left' });
                          const statusColor = status === 'Değişen' ? '#ef4444' : (status === 'Orijinal' ? '#22c55e' : '#f59e0b');
                          doc.fillColor(statusColor).font('Roboto').text(`${status}`, x, currentRowY + 11, { width: colWidth - 10, align: 'left' });
                      });

                      rowItems.forEach((item, idx) => {
                          const [_, data] = item;
                          const x = startX + (idx * colWidth);
                          const val = data as any;
                          const imageUrl = typeof val === 'object' ? val.imageUrl : null;
                          
                          if (imageUrl) {
                              try {
                                  const imgPath = path.resolve(__dirname, '../../', imageUrl.replace(/^\//, ''));
                                  doc.image(imgPath, x, currentRowY + 30, { width: imgWidth, height: imgHeight });
                              } catch (e) {
                                  doc.rect(x, currentRowY + 30, imgWidth, imgHeight).strokeColor('#cbd5e1').stroke();
                              }
                          }
                      });

                      doc.y = currentRowY + 30 + imgHeight + 25;
                  }
              }
          } catch (e) {
              console.error('Grid generation error:', e);
          }
      }

      doc.moveDown(3);
      doc.fontSize(9).fillColor('#94a3b8').font('Roboto').text(`Bu rapor ${expert.name || 'Uzman'} tarafından dijital ortamda mühürlenerek üretilmiştir.`, 50, doc.y, { align: 'left' });
  
      doc.end();
    });
};

export const createUserProfilePDFBuffer = (userData: any): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
        const doc = createDoc();
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', (err) => reject(err));

        doc.fontSize(18).font('Roboto-Bold').text('Kullanıcı Bilgi Formu', { align: 'center' });
        doc.moveDown(2);

        doc.fontSize(12).font('Roboto-Bold').text(`Ad Soyad: `, { continued: true }).font('Roboto').text(userData.name);
        doc.fontSize(12).font('Roboto-Bold').text(`E-posta: `, { continued: true }).font('Roboto').text(userData.email);

        doc.end();
    });
};

export const createRequestDetailPDFBuffer = (requestData: any): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
        const doc = createDoc();
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', (err) => reject(err));

        doc.fontSize(18).font('Roboto-Bold').text('Ekspertiz Talebi Detayları', { align: 'center' });
        doc.moveDown(2);

        doc.fontSize(14).font('Roboto-Bold').text(`Başlık: ${requestData.title}`);

        doc.end();
    });
};
