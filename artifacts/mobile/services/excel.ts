import * as FileSystem from "expo-file-system/legacy";
import { TemplateRules } from "@/utils/storage";
import { MatchResult } from "@/utils/matching";

export interface ExcelRow {
  rowIndex: number;
  productName: string;
  imageName: string;
  imageUrl: string;
  rawRow: Record<string, unknown>;
}

export interface ValidationResult {
  isValid: boolean;
  foundColumns: string[];
  missingRequired: string[];
  missingOptional: string[];
  detectedHeaders: string[];
  duplicateHeaders: string[];
  emptyHeaders: string[];
}

export async function parseExcelFile(
  uri: string,
  rules: TemplateRules
): Promise<{ rows: ExcelRow[]; validation: ValidationResult }> {
  // Lightweight fallback: only CSV files are supported in the minimal mobile build.
  // For XLSX files, processing must be done server-side.
  const isCsv = uri.toLowerCase().endsWith(".csv") || uri.toLowerCase().includes("text/csv");
  if (!isCsv) {
    throw new Error("Excel (XLS/XLSX) parsing is disabled in the minimal mobile build. Please upload an Excel file to the server for processing.");
  }

  const csv = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const lines = csv.split(/\r?\n/).filter(Boolean);
  const rawData = lines.map((line) => {
    // Very small, permissive CSV split. Does not fully support quoted commas.
    return line.split(",");
  }) as unknown[][];

  if (!rawData || rawData.length === 0) {
    throw new Error("Excel file is empty");
  }

  const headers = (rawData[0] as unknown[]).map((h) => String(h ?? "").trim());

  const duplicateHeaders: string[] = [];
  const headerCount: Record<string, number> = {};
  headers.forEach((h) => {
    headerCount[h] = (headerCount[h] ?? 0) + 1;
  });
  Object.entries(headerCount).forEach(([h, count]) => {
    if (count > 1) duplicateHeaders.push(h);
  });

  const emptyHeaders = headers.filter((h) => !h);

  const normalize = (s: string) =>
    rules.caseSensitive ? s : s.toLowerCase();

  const findCol = (name: string): number => {
    const normName = normalize(name);
    return headers.findIndex((h) => {
      let hh = h;
      if (rules.ignoreExtraSpaces) hh = hh.replace(/\s+/g, " ").trim();
      return normalize(hh) === normName;
    });
  };

  const productNameIdx = findCol(rules.productNameColumn);
  const imageNameIdx = findCol(rules.imageNameColumn);
  const imageUrlIdx = findCol(rules.imageUrlColumn);
  const extraColumns = (rules.extraColumns ?? []).map((column) => column.trim()).filter(Boolean);

  const required = [
    { name: rules.productNameColumn, idx: productNameIdx },
    { name: rules.imageNameColumn, idx: imageNameIdx },
    { name: rules.imageUrlColumn, idx: imageUrlIdx },
  ];

  const optionalCols = [rules.priceColumn, rules.categoryColumn, rules.brandColumn].filter(Boolean);
  const allOptionalCols = [...optionalCols, ...extraColumns].filter(Boolean);
  const missingRequired = required.filter((r) => r.idx === -1).map((r) => r.name);
  const foundColumns = required.filter((r) => r.idx !== -1).map((r) => r.name);
  const missingOptional = allOptionalCols.filter((c) => findCol(c) === -1);

  const isValid = missingRequired.length === 0 && duplicateHeaders.length === 0;

  const validation: ValidationResult = {
    isValid,
    foundColumns,
    missingRequired,
    missingOptional,
    detectedHeaders: headers.filter(Boolean),
    duplicateHeaders,
    emptyHeaders,
  };

  if (!isValid && rules.strictMode) {
    return { rows: [], validation };
  }

  const rows: ExcelRow[] = [];
  for (let i = 1; i < rawData.length; i++) {
    const row = rawData[i] as unknown[];
    const productName = String(row[productNameIdx] ?? "").trim();
    const imageName = String(row[imageNameIdx] ?? "").trim();
    if (!productName && !imageName) continue;

    const rawRow: Record<string, unknown> = {};
    headers.forEach((h, idx) => {
      rawRow[h] = row[idx] ?? "";
    });

    extraColumns.forEach((column) => {
      if (!(column in rawRow)) rawRow[column] = "";
    });

    rows.push({
      rowIndex: i,
      productName,
      imageName,
      imageUrl: String(row[imageUrlIdx] ?? "").trim(),
      rawRow,
    });
  }

  return { rows, validation };
}

export async function generateOutputExcel(
  originalUri: string,
  matchResults: MatchResult[],
  rules: TemplateRules
): Promise<string> {
  // Only CSV output supported in this minimal mobile build.
  const isCsv = originalUri.toLowerCase().endsWith(".csv") || originalUri.toLowerCase().includes("text/csv");
  if (!isCsv) {
    throw new Error("Generating XLSX is disabled in the minimal mobile build. Use server-side processing to generate Excel files.");
  }

  const csv = await FileSystem.readAsStringAsync(originalUri, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const lines = csv.split(/\r?\n/).filter(Boolean);
  const rows = lines.map((l) => l.split(","));

  const headers = (rows[0] ?? []).map((h) => String(h ?? "").trim());
  const normalize = (s: string) => (rules.caseSensitive ? s : s.toLowerCase());
  const findCol = (name: string) => headers.findIndex((h) => normalize(h) === normalize(name));

  const imageUrlIdx = findCol(rules.imageUrlColumn);
  if (imageUrlIdx === -1) throw new Error("Image URL column not found");

  for (const result of matchResults) {
    if (result.status === "matched" && result.cloudinaryUrl && result.rowIndex < rows.length) {
      const row = rows[result.rowIndex];
      while (row.length <= imageUrlIdx) row.push("");
      row[imageUrlIdx] = result.cloudinaryUrl;
    }
  }

  const outputCsv = rows.map((r) => r.join(",")).join("\n");
  const outputPath = `${FileSystem.documentDirectory}grozio_output_${Date.now()}.csv`;
  await FileSystem.writeAsStringAsync(outputPath, outputCsv, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  return outputPath;
}
