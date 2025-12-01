const Tesseract = require('tesseract.js');
const path = require('path');
const OcrRecord = require('../models/OcrRecord');

/**
 * Process OCR on uploaded image
 */
exports.processOCR = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // --- Resolve userId safely from multiple possible locations ---
    const userId = req.userId || req.user?.id || req.user?.userId || req.body?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: Missing userId from request' });
    }

    const imagePath = req.file.path;
    console.log('🧩 OCR Start:', { userId, imagePath });

    // --- Create initial record with "processing" status ---
    const record = await OcrRecord.create({
      userId,
      imagePath,
      status: 'processing',
      language: 'eng'
    });

       // --- Perform OCR recognition ---
    const result = await Tesseract.recognize(imagePath, 'eng', {
      logger: info => console.log(info)
    });

     // result.data may contain: text, confidence, words, lines, blocks, etc.
    const { data } = result;
    const rawText = (data && data.text) ? data.text.trim() : '';

    let formattedText = '';

    if (data && Array.isArray(data.words) && data.words.length > 0) {
      // Build rows grouped by approximate Y coordinate (spatial layout)
      const linesMap = data.words.reduce((acc, word) => {
        // use rounded y0 to cluster words into same line
        const yKey = Math.round(word.bbox.y0 / 10);
        if (!acc[yKey]) acc[yKey] = [];
        acc[yKey].push(word);
        return acc;
      }, {});

      // Sort rows top→bottom and words left→right; then build monospaced-ish alignment
      const sortedRowKeys = Object.keys(linesMap).map(k => parseInt(k, 10)).sort((a, b) => a - b);
      for (const key of sortedRowKeys) {
        const wordsOnLine = linesMap[key].sort((a, b) => a.bbox.x0 - b.bbox.x0);
        // build a line using x0 positions as spacing hints
        let line = '';
        let lastX = 0;
        wordsOnLine.forEach(word => {
          const x = word.bbox.x0;
          // estimate gap in characters based on pixel difference (adjust divisor to taste)
          const gap = Math.max(1, Math.round((x - lastX) / 20));
          line = line.padEnd(line.length + gap, ' ');
          line += word.text;
          lastX = x + (word.text?.length || 0) * 7; // rough advance
        });
        formattedText += line.trimEnd() + '\n';
      }
      formattedText = formattedText.trim();
    } else if (rawText) {
      // FALLBACK: No words array — try to heuristically format the plain text into columns
      // First preserve headings and blank lines
      const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter((l,i)=>!(l==='' && i===0));
      // If it's a stock table, many rows have numeric values at start — attempt simple spacing
      const formattedLines = lines.map(line => {
        // split by 2+ spaces or by tabs if available
        if (/\t/.test(line) || /\s{2,}/.test(line)) {
          // keep columns roughly as is
          return line.replace(/\t/g, '    ');
        }
        // otherwise try to insert spacing between number groups and text
        // e.g. "9.19 6.89 ABX Air n 7.52 -0.10" -> preserve single spaces, but pad columns
        const parts = line.split(/\s+/);
        if (parts.length >= 4) {
          // assume columns: col1 col2 col3 ... -> build columns with fixed widths
          const colWidths = [10, 10, 20, 10, 10]; // tweak as needed
          let out = '';
          for (let i = 0; i < parts.length; i++) {
            const p = parts[i];
            const width = colWidths[Math.min(i, colWidths.length - 1)];
            out += p.padEnd(width, ' ');
          }
          return out.trimEnd();
        }
        return line;
      });

      formattedText = formattedLines.join('\n').trim();
    } else {
      // nothing to format — fall back to empty
      formattedText = '';
    }

    // If formattedText ended up empty, use raw text
    const finalText = (formattedText && formattedText.length > 0) ? formattedText : rawText;

    // Update DB record
    await record.update({
      extractedText: finalText,
      confidence: data?.confidence || 0,
      status: 'completed'
    });

    console.log('✅ OCR Completed for record:', record.id);

    res.json({
      message: 'OCR processing completed successfully',
      recordId: record.id,
      text: finalText,
      confidence: data?.confidence,
      imagePath: `/uploads/${req.file.filename}`
    });
  } catch (error) {
    console.error('❌ OCR processing error:', error);

    // Optional: Mark record as failed if partially created
    if (req.file && (req.userId || req.user?.id || req.user?.userId)) {
      try {
        await OcrRecord.create({
          userId: req.userId || req.user?.id || req.user?.userId,
          imagePath: req.file.path,
          status: 'failed'
        });
      } catch (e) {
        console.error('⚠️ Failed to create fallback failed-status record:', e);
      }
    }

    res.status(500).json({ error: 'Error processing image' });
  }
};

/**
 * Fetch all OCR history for the logged-in user
 */
exports.getHistory = async (req, res) => {
  try {
    const userId = req.userId || req.user?.id || req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized: Missing userId' });

    const records = await OcrRecord.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']]
    });

    res.json({ records });
  } catch (error) {
    console.error('❌ Error fetching OCR history:', error);
    res.status(500).json({ error: 'Error fetching OCR history' });
  }
};

/**
 * Delete a specific OCR record
 */
exports.deleteRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId || req.user?.id || req.user?.userId;

    if (!userId) return res.status(401).json({ error: 'Unauthorized: Missing userId' });

    const deleted = await OcrRecord.destroy({
      where: { id, userId }
    });

    if (deleted === 0) {
      return res.status(404).json({ error: 'Record not found or not owned by user' });
    }

    res.json({ message: 'Record deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting record:', error);
    res.status(500).json({ error: 'Error deleting record' });
  }
};
