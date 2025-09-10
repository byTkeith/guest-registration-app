import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

// Convert mm → points (1 mm ≈ 2.835 pt)
const toPt = (mm: number) => mm * 2.835;

export async function fillGuestForms(
  templateFile: File,
  guests: any[],
  unitNumber: string
) {
  const templateBytes = await templateFile.arrayBuffer();
  const results: File[] = [];

  for (let i = 0; i < guests.length; i++) {
    const pdfDoc = await PDFDocument.load(templateBytes);
    const page = pdfDoc.getPages()[0];
    const pageHeight = page.getSize().height;
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 11;

    const g = guests[i];

    // helper to place text with top-based mm coordinates
    const placeText = (text: string, mmX: number, mmY: number, size = fontSize) => {
      const xPt = toPt(mmX);
      const yPt = pageHeight - toPt(mmY) - size * 0.15;
      page.drawText(text || "", { x: xPt, y: yPt, size, font: helvetica, color: rgb(0, 0, 0) });
    };

    // 📝 Coordinates from your PDF-XChange measurements
    placeText(unitNumber, 79.15, 95.98);
    placeText(g.name || "", 76.59, 106.0);
    placeText(g.idNumber || "", 89.18, 115.81);
    placeText(g.contactNumber || "", 98.14, 126.05);
    placeText(`${g.vehicleMake || ""} ${g.vehicleReg || ""}`, 114.05, 137.75);
    placeText(g.parkingBay || "", 99.99, 146.9);
    placeText(g.checkIn || "", 86.72, 157.13);
    placeText(g.checkOut || "", 89.48, 167.06);

    // Signature = guest’s full name
    placeText(g.name || "", 69.82, 236.53, 10);

    // Date signed = today
    placeText(new Date().toLocaleDateString(), 64.06, 247.04, 11);

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });

    results.push(
      new File([blob], `GuestForm_Unit${unitNumber}_Guest${i + 1}.pdf`, {
        type: "application/pdf",
      })
    );
  }

  return results;
}
