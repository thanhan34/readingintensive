"use client";

import { useState, useRef } from "react";
import Papa from "papaparse";

import { Question } from "../src/types";

type Props = {
  onQuestionsLoaded: (questions: Question[]) => void;
};

interface CSVRow {
  [key: string]: string;  // Allow string indexing
}

export default function ExcelUploader({ onQuestionsLoaded }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    try {
      /* eslint-disable @typescript-eslint/no-unused-vars */
      Papa.parse<CSVRow>(file, {
      /* eslint-enable @typescript-eslint/no-unused-vars */
        header: true,
        complete: (results) => {
          console.log("CSV Headers:", results.meta.fields);
          console.log("First row:", results.data[0]);
          
          const questions = results.data.map((row) => {
            // Convert column names to lowercase for case-insensitive matching
            const normalizedRow = Object.keys(row).reduce((acc, key) => {
              acc[key.toLowerCase()] = row[key];
              return acc;
            }, {} as Record<string, string>);

            return {
              id: crypto.randomUUID(),
              title: normalizedRow.title || "",
              content: normalizedRow.content || "",
              text: normalizedRow.text || "",
              type: (normalizedRow.type || "RWFIB") as "RWFIB" | "RFIB",
            };
          });

          // Validate each question and collect validation errors
          const validQuestions: Question[] = [];
          const errors: string[] = [];

          questions.forEach((q, index) => {
            const rowNum = index + 1;
            if (!q.title) {
              errors.push(`Row ${rowNum}: Missing title`);
            }
            if (!q.content) {
              errors.push(`Row ${rowNum}: Missing content`);
            }
            if (!q.text) {
              errors.push(`Row ${rowNum}: Missing text`);
            }
            if (q.type !== "RWFIB" && q.type !== "RFIB") {
              errors.push(`Row ${rowNum}: Invalid type "${q.type}" (must be RWFIB or RFIB)`);
            }

            if (q.title && q.content && q.text && (q.type === "RWFIB" || q.type === "RFIB")) {
              validQuestions.push(q);
            }
          });

          console.log("Parsed questions:", questions);
          console.log("Valid questions:", validQuestions);
          console.log("Validation errors:", errors);

          if (validQuestions.length === 0) {
            const errorMessage = errors.length > 0 
              ? `No valid questions found:\n${errors.join('\n')}`
              : "No valid questions found in the CSV file";
            throw new Error(errorMessage);
          }

          onQuestionsLoaded(validQuestions);
          setError(null);

          // Reset file input
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        },
        error: (error: Error, file: File) => {
          console.error("Error parsing CSV file:", error);
          setError("Failed to parse CSV file. Please check the format and try again.");
        }
      });
    } catch (err) {
      console.error("Error handling file:", err);
      setError(err instanceof Error ? err.message : "Failed to process file. Please check the format and try again.");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) {
      await handleFileUpload(file);
    } else {
      setError("Please upload a CSV file");
    }
  };

  return (
    <div className="p-6">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center ${
          isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="space-y-4">
          <div>
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <div className="mt-4">
              <label htmlFor="file-upload" className="cursor-pointer">
                <span className="mt-2 block text-sm font-medium text-gray-900">
                  Drop your CSV file here, or{" "}
                  <span className="text-blue-600 hover:text-blue-500">browse</span>
                </span>
                <input
                  ref={fileInputRef}
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  accept=".csv"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileUpload(file);
                    }
                  }}
                />
              </label>
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm whitespace-pre-line p-4 bg-red-50 rounded-lg border border-red-200">
              {error.split('\n').map((line, i) => (
                <div key={i} className="mb-1">{line}</div>
              ))}
            </div>
          )}

          <div className="text-xs text-gray-500">
            <p>Expected CSV format:</p>
            <table className="mt-2 mx-auto text-left">
              <thead>
                <tr>
                  <th className="px-4 py-2 border">Column</th>
                  <th className="px-4 py-2 border">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-2 border">title</td>
                  <td className="px-4 py-2 border">Question title</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border">content</td>
                  <td className="px-4 py-2 border">Full paragraph text</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border">text</td>
                  <td className="px-4 py-2 border">Line-by-line explanations</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border">type</td>
                  <td className="px-4 py-2 border">RWFIB or RFIB</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
