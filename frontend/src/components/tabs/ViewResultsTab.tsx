import React, { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  CheckCircle,
  Users,
  Loader2,
  Eye,
  Trophy,
  AlertCircle,
  Download,
  ChevronLeft,
  ChevronRight,
  Printer,
  FileText,
  XCircle,
  Calculator,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import axios from "axios";
import { toast } from "sonner";

const BACKEND = import.meta.env.VITE_BACKEND;

// School Configuration
const SCHOOL_CONFIG = {
  name: "Falcon House High School System",
  address: "P-1443 St # 7 Nisar Colony Faisalabad",
  phone: "+92-41-1234567",
  email: "info@falconhouse.edu.pk",
  logo: "/results.jpeg", // Path to your logo in public folder
  motto: "Excellence in Education",
};

const allClasses = [
  { value: "Play", label: "Play" },
  { value: "Nursery", label: "Nursery" },
  { value: "Prep", label: "Prep" },
  { value: "1", label: "Class 1" },
  { value: "2", label: "Class 2" },
  { value: "3", label: "Class 3" },
  { value: "4", label: "Class 4" },
  { value: "5", label: "Class 5" },
  { value: "6", label: "Class 6" },
  { value: "7", label: "Class 7" },
  { value: "8", label: "Class 8" },
  { value: "9", label: "Class 9" },
  { value: "10", label: "Class 10" },
];

const sections = [
  { value: "Red", label: "Red" },
  { value: "Blue", label: "Blue" },
  { value: "Pink", label: "Pink" },
  { value: "Green", label: "Green" },
  { value: "Yellow", label: "Yellow" },
  { value: "White", label: "White" },
];

// ==================== INTERFACES ====================

interface Exam {
  _id: string;
  examName: string;
  examType: string;
  academicYear: string;
  startDate: string;
  endDate: string;
  classes: string[];
  status: "scheduled" | "ongoing" | "completed" | "cancelled";
  isActive: boolean;
}

interface ResultSubject {
  subjectId: {
    _id: string;
    subjectName: string;
    subjectCode: string;
  };
  totalMarks: number;
  obtainedMarks: number;
  passingMarks: number;
  grade: string;
  remarks: string;
}

interface SubjectGroup {
  code: string;
  displayName: string;
  subjects: ResultSubject[];
  totalMaxMarks: number;
  totalPassingMarks: number;
  totalObtainedMarks: number;
  isGrouped: boolean;
  isPassed: boolean;
  percentage: number;
  grade: string;
}

interface Result {
  _id: string;
  studentId: {
    _id: string;
    studentName: string;
    fatherName: string;
    rollNumber: string;
    class: string;
    section: string;
    photo?: string;
  };
  examId: {
    _id: string;
    examName: string;
    examType: string;
    academicYear: string;
  };
  class: string;
  section: string;
  subjects: ResultSubject[];
  totalMarks: number;
  totalObtainedMarks: number;
  percentage: number;
  grade: string;
  result: "Pass" | "Fail" | "Pending";
  position?: number;
  isPublished: boolean;
}

interface ViewResultsTabProps {
  exams: Exam[];
  viewResults: Result[];
  setViewResults: React.Dispatch<React.SetStateAction<Result[]>>;
}

// ==================== HELPER FUNCTIONS ====================

const getClassLabel = (value: string): string => {
  const classObj = allClasses.find((c) => c.value === value);
  return classObj ? classObj.label : value;
};

const getSectionLabel = (value: string): string => {
  const sectionObj = sections.find((s) => s.value === value);
  return sectionObj ? sectionObj.label : value;
};

const getNextClass = (currentClass: string): string => {
  const classOrder = [
    "Play",
    "Nursery",
    "Prep",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
  ];
  const currentIndex = classOrder.indexOf(currentClass);
  if (currentIndex === -1 || currentIndex === classOrder.length - 1)
    return currentClass;
  return classOrder[currentIndex + 1];
};

const getOrdinalSuffix = (n: number): string => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
};

// Calculate grade based on percentage
const calculateGrade = (percentage: number): string => {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B";
  if (percentage >= 60) return "C";
  if (percentage >= 50) return "D";
  if (percentage >= 40) return "E";
  return "F";
};

const getGradeColor = (grade: string): string => {
  const colors: Record<string, string> = {
    "A+": "#059669", // Emerald
    A: "#10b981", // Green
    B: "#3b82f6", // Blue
    C: "#8b5cf6", // Purple
    D: "#f59e0b", // Amber
    E: "#f97316", // Orange
    F: "#ef4444", // Red
  };
  return colors[grade] || "#6b7280";
};

// Group subjects by subject code
const groupSubjectsByCode = (subjects: ResultSubject[]): SubjectGroup[] => {
  if (!subjects || subjects.length === 0) return [];

  const groupMap = new Map<string, SubjectGroup>();

  subjects.forEach((subject) => {
    const code = subject.subjectId?.subjectCode || "OTHER";

    if (!groupMap.has(code)) {
      groupMap.set(code, {
        code,
        displayName: code,
        subjects: [],
        totalMaxMarks: 0,
        totalPassingMarks: 0,
        totalObtainedMarks: 0,
        isGrouped: false,
        isPassed: false,
        percentage: 0,
        grade: "",
      });
    }

    const group = groupMap.get(code)!;
    group.subjects.push(subject);
    group.totalMaxMarks += subject.totalMarks;
    group.totalPassingMarks += subject.passingMarks;
    group.totalObtainedMarks += subject.obtainedMarks ?? 0;
  });

  // Calculate group stats
  groupMap.forEach((group) => {
    group.isGrouped = group.subjects.length > 1;
    group.percentage =
      group.totalMaxMarks > 0
        ? (group.totalObtainedMarks / group.totalMaxMarks) * 100
        : 0;
    group.grade = calculateGrade(group.percentage);
    group.isPassed = group.totalObtainedMarks >= group.totalPassingMarks;
  });

  return Array.from(groupMap.values());
};

// Check if marks are entered (0 is valid, null/undefined is not)
export const isMarksEntered = (
  obtainedMarks: number | null | undefined
): boolean => {
  return obtainedMarks !== null && obtainedMarks !== undefined;
};

// Calculate overall result using GROUPED LOGIC
export const calculateOverallResult = (
  subjects: ResultSubject[]
): "Pass" | "Fail" | "Pending" => {
  if (!subjects || subjects.length === 0) return "Pending";

  const groups = groupSubjectsByCode(subjects);

  // Check if all marks are entered
  const allMarksEntered = subjects.every((s) =>
    isMarksEntered(s.obtainedMarks)
  );

  if (!allMarksEntered) return "Pending";

  // Check each group
  for (const group of groups) {
    if (group.isGrouped) {
      // Grouped subjects - check group total only
      if (group.totalObtainedMarks < group.totalPassingMarks) {
        return "Fail";
      }
    } else {
      // Single subject - check individual pass/fail
      const s = group.subjects[0];
      if (s.obtainedMarks < s.passingMarks) {
        return "Fail";
      }
    }
  }

  return "Pass";
};

// Calculate result with partial marks entered
export const calculatePartialResult = (
  subjects: ResultSubject[]
): "Pass" | "Fail" | "Pending" => {
  if (!subjects || subjects.length === 0) return "Pending";

  const groups = groupSubjectsByCode(subjects);

  // Check if any marks are entered
  const hasAnyMarks = subjects.some((s) => isMarksEntered(s.obtainedMarks));
  if (!hasAnyMarks) return "Pending";

  // Check each group
  for (const group of groups) {
    const enteredSubjects = group.subjects.filter((s) =>
      isMarksEntered(s.obtainedMarks)
    );

    if (enteredSubjects.length === 0) continue;

    if (group.isGrouped) {
      // Grouped - only check if ALL subjects in group are entered
      if (enteredSubjects.length === group.subjects.length) {
        const totalObt = enteredSubjects.reduce(
          (sum, s) => sum + (s.obtainedMarks ?? 0),
          0
        );
        const totalPass = enteredSubjects.reduce(
          (sum, s) => sum + s.passingMarks,
          0
        );
        if (totalObt < totalPass) {
          return "Fail";
        }
      }
    } else {
      // Single subject - check individual
      if (enteredSubjects[0].obtainedMarks < enteredSubjects[0].passingMarks) {
        return "Fail";
      }
    }
  }

  // Check if all marks entered
  const allEntered = subjects.every((s) => isMarksEntered(s.obtainedMarks));
  if (allEntered) {
    return calculateOverallResult(subjects);
  }

  return "Pending";
};

// ==================== GENERATE RESULT CARD HTML ====================

const generateResultCardHTML = (
  result: Result,
  serialNumber: number
): string => {
  const examName = result.examId?.examName || "Examination";
  const academicYear =
    result.examId?.academicYear || new Date().getFullYear().toString();
  const groups = groupSubjectsByCode(result.subjects);
  serialNumber = serialNumber || 1;
  // Generate subject rows
  let subjectRowsHTML = "";
  let rowIndex = 0;

  groups.forEach((group) => {
    if (!group.isGrouped) {
      // Single subject
      const s = group.subjects[0];
      const pct =
        s.totalMarks > 0
          ? ((s.obtainedMarks / s.totalMarks) * 100).toFixed(1)
          : "0";
      const displayGrade = s.grade || calculateGrade(parseFloat(pct));
      const isPassed = s.obtainedMarks >= s.passingMarks;
      const bgColor = rowIndex % 2 === 0 ? "#ffffff" : "#f8fafc";
      rowIndex++;

      subjectRowsHTML += `
        <tr style="background-color: ${bgColor};">
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 500; color: #1e293b;">
            ${s.subjectId?.subjectName || group.code}
          </td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #64748b;">
            ${s.totalMarks}
          </td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: 700; color: #0f172a; font-size: 11pt;">
            ${s.obtainedMarks?.toFixed(1) ?? "-"}
          </td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #64748b;">
            ${pct}%
          </td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">
            <span style="background-color: ${getGradeColor(
              displayGrade
            )}15; color: ${getGradeColor(
        displayGrade
      )}; padding: 2px 8px; border-radius: 4px; font-weight: 600; font-size: 9pt;">
              ${displayGrade}
            </span>
          </td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">
            <span style="background-color: ${
              isPassed ? "#dcfce7" : "#fee2e2"
            }; color: ${
        isPassed ? "#166534" : "#991b1b"
      }; padding: 3px 10px; border-radius: 12px; font-weight: 600; font-size: 8pt; text-transform: uppercase;">
              ${isPassed ? "✓ Pass" : "✗ Fail"}
            </span>
          </td>
        </tr>
      `;
    } else {
      // Grouped subjects
      group.subjects.forEach((s, idx) => {
        const pct =
          s.totalMarks > 0
            ? ((s.obtainedMarks / s.totalMarks) * 100).toFixed(1)
            : "0";
        const individualGrade = s.grade || calculateGrade(parseFloat(pct));
        const isFirst = idx === 0;

        subjectRowsHTML += `
          <tr style="background-color: #f0f9ff;">
            <td style="padding: 6px 12px; padding-left: ${
              isFirst ? "12px" : "28px"
            }; border-bottom: 1px solid #e0f2fe; color: #0369a1; font-size: 9pt;">
              ${
                isFirst
                  ? `<span style="font-weight: 700; color: #0c4a6e; font-size: 10pt;">📚 ${group.code}</span><br/>`
                  : ""
              }
              <span style="color: #0284c7;">↳ ${
                s.subjectId?.subjectName || ""
              }</span>
            </td>
            <td style="padding: 6px 12px; border-bottom: 1px solid #e0f2fe; text-align: center; color: #64748b; font-size: 9pt;">
              ${s.totalMarks}
            </td>
            <td style="padding: 6px 12px; border-bottom: 1px solid #e0f2fe; text-align: center; font-weight: 600; color: #0f172a; font-size: 10pt;">
              ${s.obtainedMarks?.toFixed(1) ?? "-"}
            </td>
            <td style="padding: 6px 12px; border-bottom: 1px solid #e0f2fe; text-align: center; color: #64748b; font-size: 9pt;">
              ${pct}%
            </td>
            <td style="padding: 6px 12px; border-bottom: 1px solid #e0f2fe; text-align: center;">
              <span style="color: ${getGradeColor(
                individualGrade
              )}; font-size: 9pt; font-weight: 500;">
                ${individualGrade}
              </span>
            </td>
            <td style="padding: 6px 12px; border-bottom: 1px solid #e0f2fe; text-align: center; color: #94a3b8; font-size: 8pt;">
              —
            </td>
          </tr>
        `;
      });

      // Group total row
      const groupPct = group.percentage.toFixed(1);
      rowIndex++;

      subjectRowsHTML += `
        <tr style="background-color: #0ea5e9; color: white;">
          <td style="padding: 8px 12px; border-bottom: 2px solid #0284c7; font-weight: 700;">
            ${group.code} — Combined Total
          </td>
          <td style="padding: 8px 12px; border-bottom: 2px solid #0284c7; text-align: center; font-weight: 600;">
            ${group.totalMaxMarks}
          </td>
          <td style="padding: 8px 12px; border-bottom: 2px solid #0284c7; text-align: center; font-weight: 700; font-size: 11pt;">
            ${group.totalObtainedMarks.toFixed(1)}
          </td>
          <td style="padding: 8px 12px; border-bottom: 2px solid #0284c7; text-align: center; font-weight: 600;">
            ${groupPct}%
          </td>
          <td style="padding: 8px 12px; border-bottom: 2px solid #0284c7; text-align: center;">
            <span style="background-color: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 4px; font-weight: 700;">
              ${group.grade}
            </span>
          </td>
          <td style="padding: 8px 12px; border-bottom: 2px solid #0284c7; text-align: center;">
            <span style="background-color: ${
              group.isPassed ? "rgba(255,255,255,0.9)" : "rgba(254,202,202,0.9)"
            }; color: ${
        group.isPassed ? "#166534" : "#991b1b"
      }; padding: 3px 10px; border-radius: 12px; font-weight: 700; font-size: 8pt;">
              ${group.isPassed ? "✓ PASS" : "✗ FAIL"}
            </span>
          </td>
        </tr>
      `;
    }
  });

  // Promotion/Result Message
  let resultMessageHTML = "";
  if (result.result === "Pass") {
    const nextClass = getNextClass(result.class);
    resultMessageHTML = `
      <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 15px; border-radius: 12px; text-align: center; color: white; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);">
        <div style="font-size: 24pt; margin-bottom: 5px;">🎉</div>
        <div style="font-size: 12pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Congratulations!</div>
        <div style="font-size: 9pt; margin: 8px 0; opacity: 0.9;">Outstanding performance! Keep up the great work!</div>
        <div style="background: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px; display: inline-block; margin-top: 5px;">
          <span style="font-size: 10pt; font-weight: 600;">📈 Promoted to: ${getClassLabel(
            nextClass
          )}</span>
        </div>
      </div>
    `;
  } else if (result.result === "Fail") {
    resultMessageHTML = `
      <div style="background: linear-gradient(135deg, #dc2626 0%, #f87171 100%); padding: 15px; border-radius: 12px; text-align: center; color: white; box-shadow: 0 4px 15px rgba(220, 38, 38, 0.3);">
        <div style="font-size: 24pt; margin-bottom: 5px;">📚</div>
        <div style="font-size: 12pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Needs Improvement</div>
        <div style="font-size: 9pt; margin: 8px 0; opacity: 0.9;">Don't give up! Work harder and you'll succeed!</div>
        <div style="background: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px; display: inline-block; margin-top: 5px;">
          <span style="font-size: 10pt; font-weight: 600;">💪 Stay in: ${getClassLabel(
            result.class
          )}</span>
        </div>
      </div>
    `;
  } else {
    resultMessageHTML = `
      <div style="background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%); padding: 15px; border-radius: 12px; text-align: center; color: white; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);">
        <div style="font-size: 24pt; margin-bottom: 5px;">⏳</div>
        <div style="font-size: 14pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Result Pending</div>
        <div style="font-size: 9pt; margin: 8px 0; opacity: 0.9;">Some marks are yet to be entered</div>
      </div>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        @page { 
          size: A4 landscape; 
          margin: 0; 
        }
        @media print {
          body { 
            margin: 0; 
            padding: 0; 
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
        * { 
          box-sizing: border-box; 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
      </style>
    </head>
    <body>
      <div style="width: 297mm; height: 210mm; padding: 10mm; margin: 0 auto; background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%); position: relative; overflow: hidden;">
        
        <!-- Decorative Elements -->
        <div style="position: absolute; top: -50px; right: -50px; width: 200px; height: 200px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); border-radius: 50%; opacity: 0.1;"></div>
        <div style="position: absolute; bottom: -30px; left: -30px; width: 150px; height: 150px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 50%; opacity: 0.1;"></div>
        
        <!-- Main Card -->
        <div style="background: white; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); height: 100%; display: flex; flex-direction: column; overflow: hidden; border: 1px solid #e2e8f0;">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #1e40af 100%); padding: 15px 25px; display: flex; align-items: center; justify-content: space-between; position: relative;">
            
            <!-- Decorative pattern -->
            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; opacity: 0.1; background-image: url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 80 80\"><path fill=\"white\" d=\"M0 0h80v80H0z\"/><path fill=\"none\" stroke=\"white\" stroke-width=\"1\" d=\"M0 40h80M40 0v80\"/></svg>'</div>
            
            <!-- Logo & School Info -->
            <div style="display: flex; align-items: center; gap: 15px; z-index: 1;">
              <div style="width: auto; height: auto; background: white; border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(0,0,0,0.2); overflow: hidden;">
                <img src="${
                  SCHOOL_CONFIG.logo
                }" alt="Logo" style="width: 60px; height: 60px; object-fit: contain;" onerror="this.style.display='none'; this.parentElement.innerHTML='<span style=\\'font-size: 28pt; color: #3b82f6;\\'>🏫</span>';" />
              </div>
              <div>
                <h1 style="margin: 0; font-size: 20pt; font-weight: 800; color: white; text-shadow: 0 2px 4px rgba(0,0,0,0.2); letter-spacing: 0.5px;">
                  ${SCHOOL_CONFIG.name}
                </h1>
                <p style="margin: 3px 0 0 0; font-size: 9pt; color: rgba(255,255,255,0.9);">
                  📍 ${SCHOOL_CONFIG.address}
                </p>
               
              </div>
            </div>
            
            <!-- Title -->
            <div style="text-align: center; z-index: 1;">
              <div style="background: rgba(255,255,255,0.15); backdrop-filter: blur(10px); padding: 10px 30px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.2);">
                <div style="font-size: 16pt; font-weight: 800; color: white; text-transform: uppercase; letter-spacing: 3px;">
                  📋 Result Card
                </div>
                <div style="font-size: 10pt; color: rgba(255,255,255,0.9); margin-top: 4px; font-weight: 500;">
                  ${examName} — ${academicYear}
                </div>
              </div>
            </div>
            
            <!-- Student Photo -->
            <div style="z-index: 1;">
              <div style="width: 85px; height: 100px; background: white; border-radius: 10px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(0,0,0,0.2); overflow: hidden; border: 3px solid rgba(255,255,255,0.3);">
                ${
                  result.studentId?.photo
                    ? `<img src="${result.studentId.photo}" alt="Photo" style="width: 100%; height: 100%; object-fit: cover;" />`
                    : `<div style="text-align: center; color: #94a3b8;"><div style="font-size: 28pt;">👤</div><div style="font-size: 7pt;">Photo</div></div>`
                }
              </div>
            </div>
          </div>
          
          <!-- Student Info Bar -->
          <div style="background: linear-gradient(90deg, #f8fafc 0%, #f1f5f9 100%); padding: 12px 25px; display: grid; grid-template-columns: repeat(6, 1fr); gap: 15px; border-bottom: 2px solid #e2e8f0;">
            <div style="display: flex; flex-direction: column;">
              <span style="font-size: 7pt; color: #64748b; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Student Name</span>
              <span style="font-size: 11pt; color: #0f172a; font-weight: 700; margin-top: 2px;">${
                result.studentId?.studentName || "-"
              }</span>
            </div>
            <div style="display: flex; flex-direction: column;">
              <span style="font-size: 7pt; color: #64748b; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Father's Name</span>
              <span style="font-size: 10pt; color: #334155; font-weight: 500; margin-top: 2px;">${
                result.studentId?.fatherName || "-"
              }</span>
            </div>
            <div style="display: flex; flex-direction: column;">
              <span style="font-size: 7pt; color: #64748b; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Reg Number</span>
              <span style="font-size: 11pt; color: #0f172a; font-weight: 700; margin-top: 2px;">${
                result.studentId?.rollNumber || "-"
              }</span>
            </div>
            <div style="display: flex; flex-direction: column;">
              <span style="font-size: 7pt; color: #64748b; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Class & Section</span>
              <span style="font-size: 11pt; color: #0f172a; font-weight: 700; margin-top: 2px;">${getClassLabel(
                result.class
              )} — ${getSectionLabel(result.section)}</span>
            </div>

            <div style="display: flex; flex-direction: column;">
              <span style="font-size: 7pt; color: #64748b; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Exam Type</span>
              <span style="font-size: 10pt; color: #334155; font-weight: 500; margin-top: 2px;">${
                result.examId?.examType || "Annual"
              }</span>
            </div>
          </div>
          
          <!-- Main Content -->
          <div style="flex: 1; display: flex; gap: 20px; padding: 15px 25px; min-height: 0; overflow: hidden;">
            
            <!-- Marks Table -->
            <div style="flex: 1; display: flex; flex-direction: column; min-width: 0;">
              <div style="flex: 1; overflow: auto; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
                <table style="width: 100%; border-collapse: collapse; font-size: 9pt;">
                  <thead>
                    <tr style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%);">
                      <th style="padding: 12px 12px; text-align: left; color: white; font-weight: 600; font-size: 9pt; text-transform: uppercase; letter-spacing: 0.5px;">
                        Subject
                      </th>
                      <th style="padding: 12px 12px; text-align: center; color: white; font-weight: 600; font-size: 9pt; text-transform: uppercase; letter-spacing: 0.5px; width: 70px;">
                        Total
                      </th>
                      <th style="padding: 12px 12px; text-align: center; color: white; font-weight: 600; font-size: 9pt; text-transform: uppercase; letter-spacing: 0.5px; width: 80px;">
                        Obtained
                      </th>
                      <th style="padding: 12px 12px; text-align: center; color: white; font-weight: 600; font-size: 9pt; text-transform: uppercase; letter-spacing: 0.5px; width: 70px;">
                        %
                      </th>
                      <th style="padding: 12px 12px; text-align: center; color: white; font-weight: 600; font-size: 9pt; text-transform: uppercase; letter-spacing: 0.5px; width: 60px;">
                        Grade
                      </th>
                      <th style="padding: 12px 12px; text-align: center; color: white; font-weight: 600; font-size: 9pt; text-transform: uppercase; letter-spacing: 0.5px; width: 80px;">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    ${subjectRowsHTML}
                  </tbody>
                  <tfoot>
                    <tr style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);">
                      <td style="padding: 12px 12px; color: white; font-weight: 700; font-size: 11pt;">
                        🏆 GRAND TOTAL
                      </td>
                      <td style="padding: 12px 12px; text-align: center; color: white; font-weight: 600; font-size: 11pt;">
                        ${result.totalMarks}
                      </td>
                      <td style="padding: 12px 12px; text-align: center; color: #fbbf24; font-weight: 800; font-size: 13pt;">
                        ${result.totalObtainedMarks?.toFixed(1)}
                      </td>
                      <td style="padding: 12px 12px; text-align: center; color: #fbbf24; font-weight: 700; font-size: 11pt;">
                        ${result.percentage?.toFixed(1)}%
                      </td>
                      <td style="padding: 12px 12px; text-align: center;">
                        <span style="background: ${getGradeColor(
                          result.grade
                        )}; color: white; padding: 4px 12px; border-radius: 6px; font-weight: 700; font-size: 11pt;">
                          ${result.grade}
                        </span>
                      </td>
                      <td style="padding: 12px 12px; text-align: center;">
                        <span style="background: ${
                          result.result === "Pass"
                            ? "#10b981"
                            : result.result === "Fail"
                            ? "#ef4444"
                            : "#f59e0b"
                        }; color: white; padding: 5px 14px; border-radius: 20px; font-weight: 700; font-size: 10pt; text-transform: uppercase;">
                          ${result.result}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
            
            <!-- Right Panel -->
            <div style="width: 200px; display: flex; flex-direction: column; gap: 12px;">
              
              <!-- Performance Card -->
              <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 12px; padding: 15px; border: 1px solid #bbf7d0;">
                <h4 style="margin: 0 0 12px 0; font-size: 11pt; color: #166534; font-weight: 700; display: flex; align-items: center; gap: 6px;">
                  📊 Performance
                </h4>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 8pt; color: #166534;">Total Marks</span>
                    <span style="font-size: 11pt; font-weight: 700; color: #14532d;">${result.totalObtainedMarks?.toFixed(
                      1
                    )} / ${result.totalMarks}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 8pt; color: #166534;">Percentage</span>
                    <span style="font-size: 14pt; font-weight: 800; color: #14532d;">${result.percentage?.toFixed(
                      2
                    )}%</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 8pt; color: #166534;">Grade</span>
                    <span style="font-size: 18pt; font-weight: 800; color: ${getGradeColor(
                      result.grade
                    )};">${result.grade}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed #86efac; padding-top: 8px; margin-top: 4px;">
                    <span style="font-size: 8pt; color: #166534;">Position</span>
                    <span style="font-size: 14pt; font-weight: 800; color: #f59e0b;">
                      ${
                        result.position
                          ? `${result.position}${getOrdinalSuffix(
                              result.position
                            )}`
                          : "—"
                      }
                    </span>
                  </div>
                </div>
              </div>
              
              <!-- Result Message -->
              ${resultMessageHTML}
              
              <!-- Grading Scale -->
              <div style="background: #f8fafc; border-radius: 10px; padding: 12px; border: 1px solid #e2e8f0; flex: 1;">
                <h4 style="margin: 0 0 8px 0; font-size: 8pt; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                  📋 Grading Scale
                </h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 3px; font-size: 7pt;">
                  <span style="color: #059669; font-weight: 600;">A+ : 90-100%</span>
                  <span style="color: #10b981; font-weight: 600;">A : 80-89%</span>
                  <span style="color: #3b82f6; font-weight: 600;">B : 70-79%</span>
                  <span style="color: #8b5cf6; font-weight: 600;">C : 60-69%</span>
                  <span style="color: #f59e0b; font-weight: 600;">D : 50-59%</span>
                  <span style="color: #f97316; font-weight: 600;">E : 40-49%</span>
                  <span style="color: #ef4444; font-weight: 600;">F : Below 40%</span>
                </div>
              </div>
              
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background: linear-gradient(90deg, #f8fafc 0%, #f1f5f9 100%); padding: 12px 25px; border-top: 2px solid #e2e8f0; display: flex; justify-content: space-between; align-items: flex-end;">
            
            <!-- Signatures -->
            <div style="display: flex; gap: 50px;">
              <div style="text-align: center;">
                <div style="width: 120px; border-top: 2px solid #1e293b; padding-top: 5px;">
                  <span style="font-size: 8pt; color: #475569; font-weight: 600;">Class Teacher</span>
                </div>
              </div>
              <div style="text-align: center;">
                <div style="width: 120px; border-top: 2px solid #1e293b; padding-top: 5px;">
                  <span style="font-size: 8pt; color: #475569; font-weight: 600;">Principal</span>
                </div>
              </div>
              <div style="text-align: center;">
                <div style="width: 120px; border-top: 2px solid #1e293b; padding-top: 5px;">
                  <span style="font-size: 8pt; color: #475569; font-weight: 600;">Parent's Signature</span>
                </div>
              </div>
            </div>
            
            <!-- Print Info -->
            <div style="text-align: right;">
              <div style="font-size: 7pt; color: #94a3b8;">
                <div>🖨️ Computer Generated Result Card</div>
                <div>📅 Printed: ${new Date().toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })} at ${new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })}</div>
                <div style="margin-top: 3px; color: #64748b; font-weight: 500;">"${
                  SCHOOL_CONFIG.motto
                }"</div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </body>
    </html>
  `;
};

// ==================== PAGINATION COMPONENT ====================

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
}) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-2 py-4">
      <div className="text-sm text-gray-700">
        Showing {startItem} to {endItem} of {totalItems} results
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ==================== MAIN COMPONENT ====================

export default function ViewResultsTab({
  exams,
  viewResults,
  setViewResults,
}: ViewResultsTabProps) {
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [selectedExam, setSelectedExam] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedSection, setSelectedSection] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const currentExam = useMemo(() => {
    return exams.find((exam) => exam._id === selectedExam);
  }, [exams, selectedExam]);

  const availableClasses = useMemo(() => {
    if (
      !currentExam ||
      !currentExam.classes ||
      currentExam.classes.length === 0
    ) {
      return allClasses;
    }
    return allClasses.filter((cls) => currentExam.classes.includes(cls.value));
  }, [currentExam]);

  const handleExamChange = (examId: string) => {
    setSelectedExam(examId);
    setSelectedClass("all");
    setSelectedSection("all");
    setViewResults([]);
  };

  const loadResults = async () => {
    if (!selectedExam) {
      toast.error("Please select an exam");
      return;
    }

    try {
      setLoading(true);

      const params: Record<string, string> = { examId: selectedExam };

      if (selectedClass && selectedClass !== "all") {
        if (
          currentExam?.classes &&
          !currentExam.classes.includes(selectedClass)
        ) {
          toast.error(
            `${getClassLabel(selectedClass)} is not included in this exam`
          );
          setLoading(false);
          return;
        }
        params.class = selectedClass;
      }

      if (selectedSection && selectedSection !== "all") {
        params.section = selectedSection;
      }

      const response = await axios.get(`${BACKEND}/api/results/exam-class`, {
        params,
        withCredentials: true,
      });

      const loadedResults = response.data.data || [];
      setViewResults(loadedResults);
      setCurrentPage(1);

      console.log("Loaded results:", loadedResults);

      if (loadedResults.length === 0) {
        toast.info("No results found for the selected filters");
      } else {
        toast.success(`Loaded ${loadedResults.length} results!`);
      }
    } catch (err: any) {
      console.error("Error loading results:", err);
      toast.error(err.response?.data?.message || "Failed to load results");
    } finally {
      setLoading(false);
    }
  };

  // NEW: Calculate results (Pass/Fail) for all loaded results
  // Helper function to check if marks are entered
  const isMarksEntered = (
    obtainedMarks: number | null | undefined
  ): boolean => {
    return obtainedMarks !== null && obtainedMarks !== undefined;
  };

  const handleCalculateResults = async () => {
    if (viewResults.length === 0) {
      toast.error("No results to calculate. Load results first.");
      return;
    }

    try {
      setCalculating(true);

      const payload: Record<string, string> = { examId: selectedExam };
      if (selectedClass && selectedClass !== "all")
        payload.class = selectedClass;
      if (selectedSection && selectedSection !== "all")
        payload.section = selectedSection;

      // Try backend first
      try {
        const response = await axios.post(
          `${BACKEND}/api/results/calculate`,
          payload,
          { withCredentials: true }
        );

        if (response.data.success) {
          toast.success(
            response.data.message || "Results calculated successfully!"
          );
          await loadResults();
          return;
        }
      } catch (err: any) {
        if (err.response?.status !== 404) {
          throw err;
        }
        // 404 means endpoint doesn't exist, calculate locally
      }

      toast.info("Calculating results locally with grouped logic...");

      // Calculate results on frontend with GROUPED LOGIC
      const updatedResults = viewResults.map((result) => {
        // Check marks status
        const hasAnyMarksEntered = result.subjects?.some((s) =>
          isMarksEntered(s.obtainedMarks)
        );
        const allMarksEntered = result.subjects?.every((s) =>
          isMarksEntered(s.obtainedMarks)
        );

        if (!hasAnyMarksEntered) {
          return { ...result, result: "Pending" as const };
        }

        // Calculate totals
        const totalMarks =
          result.subjects?.reduce((sum, s) => sum + s.totalMarks, 0) || 0;
        const totalObtainedMarks =
          result.subjects?.reduce(
            (sum, s) => sum + (s.obtainedMarks ?? 0),
            0
          ) || 0;
        const percentage =
          totalMarks > 0 ? (totalObtainedMarks / totalMarks) * 100 : 0;
        const grade = calculateGrade(percentage);

        // Use GROUPED LOGIC for result determination
        let resultStatus: "Pass" | "Fail" | "Pending";

        if (allMarksEntered) {
          resultStatus = calculateOverallResult(result.subjects);
        } else {
          resultStatus = calculatePartialResult(result.subjects);
        }

        // Update subject grades (for display)
        const updatedSubjects = result.subjects?.map((s) => {
          if (!isMarksEntered(s.obtainedMarks)) {
            return { ...s, remarks: "Pending", grade: "" };
          }
          const subjectPct =
            s.totalMarks > 0
              ? ((s.obtainedMarks ?? 0) / s.totalMarks) * 100
              : 0;
          return {
            ...s,
            grade: calculateGrade(subjectPct),
          };
        });

        return {
          ...result,
          subjects: updatedSubjects,
          totalMarks,
          totalObtainedMarks,
          percentage,
          grade,
          result: resultStatus,
        };
      });

      // Assign positions to passed students
      const passedResults = updatedResults
        .filter((r) => r.result === "Pass")
        .sort((a, b) => {
          if (b.percentage !== a.percentage) return b.percentage - a.percentage;
          return b.totalObtainedMarks - a.totalObtainedMarks;
        });

      const resultWithPositions = updatedResults.map((result) => {
        if (result.result === "Pass") {
          const position =
            passedResults.findIndex((r) => r._id === result._id) + 1;
          return { ...result, position };
        }
        return { ...result, position: undefined };
      });

      setViewResults(resultWithPositions);
      toast.success("Results calculated with grouped subject logic!");
    } catch (err: any) {
      console.error("Error calculating results:", err);
      toast.error(err.response?.data?.message || "Failed to calculate results");
    } finally {
      setCalculating(false);
    }
  };

  const handlePublishResults = async () => {
    if (!selectedExam) {
      toast.error("Please select an exam");
      return;
    }

    if (viewResults.length === 0) {
      toast.error("No results to publish. Load results first.");
      return;
    }

    // Check if results are calculated
    const pendingResults = viewResults.filter((r) => r.result === "Pending");
    if (pendingResults.length > 0) {
      toast.error(
        `${pendingResults.length} result(s) are still pending. Please calculate results first.`
      );
      return;
    }

    try {
      setPublishing(true);

      const payload: Record<string, string> = { examId: selectedExam };
      if (selectedClass && selectedClass !== "all")
        payload.class = selectedClass;
      if (selectedSection && selectedSection !== "all")
        payload.section = selectedSection;

      console.log("Publishing with payload:", payload);

      const publishResponse = await axios.post(
        `${BACKEND}/api/results/publish`,
        payload,
        { withCredentials: true }
      );

      console.log("Publish response:", publishResponse.data);

      if (publishResponse.data) {
        toast.success("Results published successfully!");

        // Update state locally
        setViewResults((prevResults) =>
          prevResults.map((result) => ({
            ...result,
            isPublished: true,
          }))
        );
      }
    } catch (err: any) {
      console.error("Error publishing results:", err);
      toast.error(err.response?.data?.message || "Failed to publish results");
    } finally {
      setPublishing(false);
    }
  };

  const handlePrintSingle = (result: Result, index: number) => {
    if (result.result === "Pending") {
      toast.error("Cannot print result card. Result is still pending.");
      return;
    }

    const cardHTML = generateResultCardHTML(result, index + 1);
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(cardHTML);
      printWindow.document.close();
      printWindow.document.title = `Result Card - ${
        result.studentId?.studentName || "Student"
      }`;

      printWindow.onload = function () {
        setTimeout(() => {
          printWindow.print();
        }, 500); // Small delay for images to load
      };
    }
  };

  const handlePrintAll = () => {
    if (viewResults.length === 0) {
      toast.error("No results to print");
      return;
    }

    const pendingResults = viewResults.filter((r) => r.result === "Pending");
    if (pendingResults.length > 0) {
      toast.error(`${pendingResults.length} result(s) are still pending.`);
      return;
    }

    const allCardsHTML = viewResults
      .map((result, index) => {
        const html = generateResultCardHTML(result, index + 1);
        // Extract just the body content for multiple pages
        const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        return bodyMatch ? bodyMatch[1] : html;
      })
      .join('<div style="page-break-after: always;"></div>');

    const fullHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        @page { size: A4 landscape; margin: 0; }
        @media print {
          body { margin: 0; padding: 0; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
        * { box-sizing: border-box; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
      </style>
    </head>
    <body>${allCardsHTML}</body>
    </html>
  `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(fullHTML);
      printWindow.document.close();
      printWindow.document.title = `Result Cards - ${
        currentExam?.examName || "Exam"
      }`;

      printWindow.onload = function () {
        setTimeout(() => {
          printWindow.print();
        }, 1000); // Longer delay for multiple cards
      };
    }
  };

  const handleExportPDF = async () => {
    if (viewResults.length === 0) {
      toast.error("No results to export");
      return;
    }

    const pendingResults = viewResults.filter((r) => r.result === "Pending");
    if (pendingResults.length > 0) {
      toast.error(
        `${pendingResults.length} result(s) are still pending. Please calculate results first.`
      );
      return;
    }

    toast.info("Generating PDF... Please wait.");

    try {
      const { default: jsPDF } = await import("jspdf");
      const html2canvas = (await import("html2canvas")).default;

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });
      const pageWidth = 297;
      const pageHeight = 210;

      const container = document.createElement("div");
      container.style.position = "absolute";
      container.style.left = "-9999px";
      container.style.top = "0";
      document.body.appendChild(container);

      for (let i = 0; i < viewResults.length; i++) {
        const result = viewResults[i];
        if (i > 0) pdf.addPage();

        const cardContainer = document.createElement("div");
        cardContainer.innerHTML = generateResultCardHTML(result, i + 1);
        container.appendChild(cardContainer);

        const cardElement = cardContainer.querySelector(
          ".result-card-landscape"
        ) as HTMLElement;

        if (cardElement) {
          const canvas = await html2canvas(cardElement, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: "#ffffff",
            width: 1122,
            height: 793,
          });
          const imgData = canvas.toDataURL("image/jpeg", 0.95);
          pdf.addImage(imgData, "JPEG", 0, 0, pageWidth, pageHeight);
        }

        container.removeChild(cardContainer);
        toast.info(`Processing ${i + 1}/${viewResults.length}...`);
      }

      document.body.removeChild(container);

      const fileName = `Results_${
        currentExam?.examName?.replace(/\s+/g, "_") || "Exam"
      }_${new Date().toISOString().split("T")[0]}.pdf`;
      pdf.save(fileName);
      toast.success("PDF exported successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF. Try the Print option instead.");
    }
  };

  const totalPages = Math.ceil(viewResults.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedResults = viewResults.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const stats = useMemo(() => {
    if (viewResults.length === 0) {
      return {
        total: 0,
        passed: 0,
        failed: 0,
        pending: 0,
        avgPercentage: 0,
        published: 0,
        unpublished: 0,
      };
    }
    return {
      total: viewResults.length,
      passed: viewResults.filter((r) => r.result === "Pass").length,
      failed: viewResults.filter((r) => r.result === "Fail").length,
      pending: viewResults.filter((r) => r.result === "Pending").length,
      avgPercentage:
        viewResults.reduce((sum, r) => sum + (r.percentage || 0), 0) /
        viewResults.length,
      published: viewResults.filter((r) => r.isPublished).length,
      unpublished: viewResults.filter((r) => !r.isPublished).length,
    };
  }, [viewResults]);

  const allPublished = stats.published === stats.total && stats.total > 0;
  const hasPendingResults = stats.pending > 0;

  return (
    <div className="space-y-6">
      {/* Filter Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Filter Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Select Exam</Label>
              <Select value={selectedExam} onValueChange={handleExamChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select exam" />
                </SelectTrigger>
                <SelectContent>
                  {exams.map((exam) => (
                    <SelectItem key={exam._id} value={exam._id}>
                      {exam.examName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Select Class (Optional)</Label>
              <Select
                value={selectedClass}
                onValueChange={setSelectedClass}
                disabled={!selectedExam}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {availableClasses.map((cls) => (
                    <SelectItem key={cls.value} value={cls.value}>
                      {cls.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Select Section (Optional)</Label>
              <Select
                value={selectedSection}
                onValueChange={setSelectedSection}
                disabled={!selectedExam}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All sections" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sections</SelectItem>
                  {sections.map((section) => (
                    <SelectItem key={section.value} value={section.value}>
                      {section.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={loadResults}
                className="w-full"
                disabled={loading || !selectedExam}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "View Results"
                )}
              </Button>
            </div>
          </div>

          {currentExam &&
            currentExam.classes &&
            currentExam.classes.length > 0 && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">Exam Classes:</span>
                  {currentExam.classes.map((cls) => (
                    <Badge key={cls} variant="outline" className="text-xs">
                      {getClassLabel(cls)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

          {viewResults.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-blue-900">
                    <strong>{viewResults.length}</strong> result
                    {viewResults.length !== 1 ? "s" : ""} loaded
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {stats.pending > 0 && (
                    <Badge
                      variant="outline"
                      className="bg-yellow-100 text-yellow-800 border-yellow-300"
                    >
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {stats.pending} Pending
                    </Badge>
                  )}
                  {stats.passed > 0 && (
                    <Badge
                      variant="default"
                      className="bg-green-500 hover:bg-green-600"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {stats.passed} Passed
                    </Badge>
                  )}
                  {stats.failed > 0 && (
                    <Badge variant="destructive">
                      <XCircle className="h-3 w-3 mr-1" />
                      {stats.failed} Failed
                    </Badge>
                  )}
                  {stats.published > 0 && (
                    <Badge variant="secondary">
                      {stats.published}/{stats.total} Published
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Table */}
      {viewResults.length > 0 ? (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center flex-wrap gap-4">
              <CardTitle>
                Results ({viewResults.length} student
                {viewResults.length !== 1 ? "s" : ""})
              </CardTitle>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Per page:</Label>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => {
                      setItemsPerPage(parseInt(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {/* Calculate Button - Only show if there are pending results */}
                  {hasPendingResults && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCalculateResults}
                      disabled={calculating}
                      className="bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                    >
                      {calculating ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Calculator className="h-4 w-4 mr-2" />
                      )}
                      Calculate Results
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrintAll}
                    disabled={hasPendingResults}
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Print All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportPDF}
                    disabled={hasPendingResults}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                  <Button
                    size="sm"
                    onClick={handlePublishResults}
                    disabled={
                      publishing || loading || allPublished || hasPendingResults
                    }
                    className={
                      allPublished ? "bg-green-600 hover:bg-green-600" : ""
                    }
                  >
                    {publishing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    {allPublished ? "All Published" : "Publish"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Warning for pending results */}
            {hasPendingResults && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-800">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">
                    {stats.pending} result(s) are pending. Click "Calculate
                    Results" to process them before printing or publishing.
                  </span>
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Roll No</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Obtained</TableHead>
                    <TableHead>%</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedResults.map((result, index) => (
                    <TableRow key={result._id}>
                      <TableCell>
                        {result.studentId?.rollNumber || "-"}
                      </TableCell>
                      <TableCell className="font-medium">
                        {result.studentId?.studentName || "-"}
                      </TableCell>
                      <TableCell>
                        {getClassLabel(result.class)}-
                        {getSectionLabel(result.section)}
                      </TableCell>
                      <TableCell>{result.totalMarks || 0}</TableCell>
                      <TableCell className="font-semibold">
                        {(result.totalObtainedMarks || 0).toFixed(1)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`font-semibold ${
                            (result.percentage || 0) >= 80
                              ? "text-green-600"
                              : (result.percentage || 0) >= 60
                              ? "text-blue-600"
                              : (result.percentage || 0) >= 40
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {(result.percentage || 0).toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{result.grade || "-"}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {result.position && result.position <= 3 && (
                            <Trophy
                              className={`h-4 w-4 ${
                                result.position === 1
                                  ? "text-yellow-500"
                                  : result.position === 2
                                  ? "text-gray-400"
                                  : "text-orange-400"
                              }`}
                            />
                          )}
                          <span className="font-semibold">
                            {result.position || "-"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            result.result === "Pass"
                              ? "default"
                              : result.result === "Fail"
                              ? "destructive"
                              : "outline"
                          }
                          className={
                            result.result === "Pending"
                              ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                              : ""
                          }
                        >
                          {result.result || "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {result.isPublished ? (
                          <Badge
                            variant="default"
                            className="bg-green-500 hover:bg-green-600"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Published
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <XCircle className="h-3 w-3 mr-1" />
                            Draft
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handlePrintSingle(result, startIndex + index)
                          }
                          title={
                            result.result === "Pending"
                              ? "Calculate results first"
                              : "Print Result Card"
                          }
                          disabled={result.result === "Pending"}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={viewResults.length}
              itemsPerPage={itemsPerPage}
            />

            {/* Stats */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.total}
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Passed</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.passed}
                </p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.failed}
                </p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.pending}
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600">Avg %</p>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.avgPercentage.toFixed(1)}%
                </p>
              </div>
              <div className="p-4 bg-emerald-50 rounded-lg">
                <p className="text-sm text-gray-600">Published</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {stats.published}/{stats.total}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {!selectedExam && (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-gray-500">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="font-medium">Select an exam to view results</p>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedExam && !loading && viewResults.length === 0 && (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-gray-500">
                  <Eye className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="font-medium">No results found</p>
                  <p className="text-sm mt-2">Click "View Results" to load</p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
