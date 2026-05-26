import React, { createContext, useCallback, useContext, useReducer } from "react";
import { ExcelRow, ValidationResult } from "@/services/excel";
import { MatchResult } from "@/utils/matching";
import { TemplateRules, CloudinarySettings } from "@/utils/storage";

export interface UploadState {
  step: number;
  templateRules: TemplateRules | null;
  cloudinarySettings: CloudinarySettings | null;
  excelFile: { uri: string; name: string } | null;
  zipFile: { uri: string; name: string } | null;
  parsedRows: ExcelRow[];
  validation: ValidationResult | null;
  extractedFiles: Map<string, string>;
  imageCount: number;
  matchResults: MatchResult[];
  unmatchedImages: string[];
  processingLog: string[];
  uploadProgress: number;
  isProcessing: boolean;
  outputExcelPath: string | null;
  sessionId: string | null;
}

type Action =
  | { type: "SET_STEP"; payload: number }
  | { type: "SET_TEMPLATE_RULES"; payload: TemplateRules }
  | { type: "SET_CLOUDINARY_SETTINGS"; payload: CloudinarySettings }
  | { type: "SET_EXCEL_FILE"; payload: { uri: string; name: string } | null }
  | { type: "SET_ZIP_FILE"; payload: { uri: string; name: string } | null }
  | { type: "SET_PARSED_DATA"; payload: { rows: ExcelRow[]; validation: ValidationResult } }
  | { type: "SET_EXTRACTED_FILES"; payload: { files: Map<string, string>; imageCount: number } }
  | { type: "SET_MATCH_RESULTS"; payload: { results: MatchResult[]; unmatchedImages: string[] } }
  | { type: "UPDATE_MATCH_RESULT"; payload: { index: number; result: Partial<MatchResult> } }
  | { type: "ADD_LOG"; payload: string }
  | { type: "SET_UPLOAD_PROGRESS"; payload: number }
  | { type: "SET_IS_PROCESSING"; payload: boolean }
  | { type: "SET_OUTPUT_EXCEL"; payload: string }
  | { type: "SET_SESSION_ID"; payload: string }
  | { type: "RESET" };

const initialState: UploadState = {
  step: 0,
  templateRules: null,
  cloudinarySettings: null,
  excelFile: null,
  zipFile: null,
  parsedRows: [],
  validation: null,
  extractedFiles: new Map(),
  imageCount: 0,
  matchResults: [],
  unmatchedImages: [],
  processingLog: [],
  uploadProgress: 0,
  isProcessing: false,
  outputExcelPath: null,
  sessionId: null,
};

function reducer(state: UploadState, action: Action): UploadState {
  switch (action.type) {
    case "SET_STEP": return { ...state, step: action.payload };
    case "SET_TEMPLATE_RULES": return { ...state, templateRules: action.payload };
    case "SET_CLOUDINARY_SETTINGS": return { ...state, cloudinarySettings: action.payload };
    case "SET_EXCEL_FILE": return { ...state, excelFile: action.payload, parsedRows: [], validation: null };
    case "SET_ZIP_FILE": return { ...state, zipFile: action.payload, extractedFiles: new Map(), imageCount: 0 };
    case "SET_PARSED_DATA": return { ...state, parsedRows: action.payload.rows, validation: action.payload.validation };
    case "SET_EXTRACTED_FILES": return { ...state, extractedFiles: action.payload.files, imageCount: action.payload.imageCount };
    case "SET_MATCH_RESULTS": return { ...state, matchResults: action.payload.results, unmatchedImages: action.payload.unmatchedImages };
    case "UPDATE_MATCH_RESULT": {
      const updated = [...state.matchResults];
      updated[action.payload.index] = { ...updated[action.payload.index], ...action.payload.result };
      return { ...state, matchResults: updated };
    }
    case "ADD_LOG": return { ...state, processingLog: [...state.processingLog, action.payload] };
    case "SET_UPLOAD_PROGRESS": return { ...state, uploadProgress: action.payload };
    case "SET_IS_PROCESSING": return { ...state, isProcessing: action.payload };
    case "SET_OUTPUT_EXCEL": return { ...state, outputExcelPath: action.payload };
    case "SET_SESSION_ID": return { ...state, sessionId: action.payload };
    case "RESET": return { ...initialState };
    default: return state;
  }
}

interface UploadContextValue {
  state: UploadState;
  dispatch: React.Dispatch<Action>;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
}

const UploadContext = createContext<UploadContextValue | null>(null);

export function UploadProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const nextStep = useCallback(() => {
    dispatch({ type: "SET_STEP", payload: Math.min(state.step + 1, 5) });
  }, [state.step]);

  const prevStep = useCallback(() => {
    dispatch({ type: "SET_STEP", payload: Math.max(state.step - 1, 0) });
  }, [state.step]);

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  return (
    <UploadContext.Provider value={{ state, dispatch, nextStep, prevStep, reset }}>
      {children}
    </UploadContext.Provider>
  );
}

export function useUpload(): UploadContextValue {
  const ctx = useContext(UploadContext);
  if (!ctx) throw new Error("useUpload must be used within UploadProvider");
  return ctx;
}
