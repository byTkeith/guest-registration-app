import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

// mm -> PDF points (1 mm ≈ 2.835 points)
const toPt = (mm: number) => mm * 2.835;

export async function fillGuestForm(
  templateFile: File,
  guests: any[],
  unitNumber: string
) {
  const templateBytes = await templateFile.arrayBuffer();
  const pdfDoc = await PDFDocument.load(templateBytes);

  const page = pdfDoc.getPages()[0];
  const pageSize = page.getSize();
  const pageHeight = pageSize.height;

  // embed a standard font so we can control size / measure if needed
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSize = 11; // tweak if you need larger/smaller text

  // ----- TUNING knobs -----
  // If fields are slightly off across the whole document, adjust these values (in mm)
  const ADJUST_X_MM = 0;   // positive moves text to the RIGHT
  const ADJUST_Y_MM = 0;   // positive moves text DOWN (because we're converting top-based y)
  const DEBUG = false;      // show small red square at each target coord (set false when happy)
  // ------------------------

  // helper to place text using mm coordinates reported by your PDF editor (top-based Y).
  const placeText = (text: string, mmX: number, mmY: number, size: number = fontSize) => {
    const xPt = toPt(mmX + ADJUST_X_MM);
    const yTopPt = toPt(mmY + ADJUST_Y_MM);

    // Convert top-based Y (measured from top) -> pdf-lib bottom-left Y
    // pageHeight - yTopPt gives the point at the same vertical spot measured from bottom.
    // We subtract a small value (like 'size * 0.15') so the text baseline falls within the box.
    const yPt = pageHeight - yTopPt - size * 0.15;

    page.drawText(text || "", {
      x: xPt,
      y: yPt,
      size,
      font: helvetica,
    });

    if (DEBUG) {
      // Draw a tiny red square at the location PDF-lib interprets as the "top" point.
      // This helps you visually check where the coordinates are pointing.
      const markSize = 4; // points
      // drawRectangle takes bottom-left corner; convert top-based to bottom-based
      const markY = pageHeight - yTopPt - markSize / 2;
      page.drawRectangle({
        x: xPt - markSize / 2,
        y: markY,
        width: markSize,
        height: markSize,
        color: rgb(1, 0, 0),
      });
    }
  };

  const g = guests[0] || {}; // currently fills the first guest; can be extended

  // Your mm coordinates (as you supplied) -> placeText will convert & invert Y for pdf-lib
  placeText(unitNumber || "", 79.15, 95.98);
  placeText(g.name || "", 76.59, 106.0);
  placeText(g.idNumber || "", 89.18, 115.81);
  placeText(g.contactNumber || "", 98.14, 126.05);
  placeText(`${g.vehicleMake || ""} ${g.vehicleReg || ""}`, 114.05, 137.75);
  placeText(g.parkingBay || "", 99.99, 146.90);
  placeText(g.checkIn || "", 86.72, 157.13);
  placeText(g.checkOut || "", 89.48, 167.06);

  // signature placeholder and date
  placeText(g.name ||  "", 69.82, 236.53, 10);
  placeText(new Date().toLocaleDateString(), 64.06, 247.04, 11);

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  return new File([blob], "CompletedGuestForm.pdf", { type: "application/pdf" });
}
