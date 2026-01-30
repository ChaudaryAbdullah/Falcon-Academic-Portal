"use client";
import axios from "axios";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { GeneratePaperFundTab } from "./tabs/GeneratePaperFund";
import { SubmitPaperFundPaymentTab } from "./tabs/SubmitPaperFund";
import { ViewPaperFundRecordsTab } from "./tabs/ViewPaperFund";

const BACKEND = import.meta.env.VITE_BACKEND;

interface Student {
  _id: string;
  rollNumber: string;
  studentName: string;
  fatherName: string;
  fatherCnic: string;
  motherCnic: string;
  bform: string;
  dob: string;
  section: string;
  gender: string;
  fPhoneNumber: string;
  mPhoneNumber: string;
  fatherOccupation: string;
  motherName: string;
  motherOccupation: string;
  class: string;
  email: string;
  password: string;
  address: string;
  img?: {
    data: string;
    contentType: string;
  };
}

interface FeeStructure {
  _id: string;
  className: string;
  tutionFee: number;
  examFee: number;
  paperFund: number;
  miscFee: number;
  createdAt: string;
  updatedAt: string;
}

interface PaperFundChallan {
  id: string;
  studentId: {
    _id: string;
    rollNumber: string;
    studentName: string;
    fatherName: string;
    mPhoneNumber: string;
    class: string;
    section: string;
  };
  year: string;
  paperFund: number;
  dueDate: string;
  status: "pending" | "paid" | "overdue";
  generatedDate: string;
  sentToWhatsApp: boolean;
  paidDate?: string;
}

interface PaperFundManagementProps {
  students: Student[];
  feeStructure: FeeStructure[];
  challans: PaperFundChallan[];
  setChallans: (
    challans:
      | PaperFundChallan[]
      | ((prev: PaperFundChallan[]) => PaperFundChallan[]),
  ) => void;
}

export function PaperFundManagement({
  students,
  feeStructure,
  challans,
  setChallans,
}: PaperFundManagementProps) {
  const [whatsappMessage] = useState(
    "Dear {fatherName}, this is a reminder that the paper fund for {studentName} (Roll No: {rollNumber}) is due on {dueDate}. The amount due is {paperFundAmount}. Please ensure timely payment to avoid any inconvenience. Thank you.",
  );
  
  const hasInitialized = useRef(false);
  const overdueCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 🚀 OPTIMIZATION 1: Memoize the overdue update function to prevent recreations
  const updateOverdueStatuses = useCallback(
    (challansData: PaperFundChallan[]): PaperFundChallan[] => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let hasChanges = false;
      const updated = challansData.map((challan) => {
        if (challan.status === "pending" && challan.dueDate) {
          const dueDate = new Date(challan.dueDate);
          dueDate.setHours(0, 0, 0, 0);

          if (dueDate < today) {
            hasChanges = true;
            return {
              ...challan,
              status: "overdue" as const,
            };
          }
        }
        return challan;
      });

      // Only return new array if there are actual changes
      return hasChanges ? updated : challansData;
    },
    [],
  );

  // 🚀 OPTIMIZATION 2: Debounced backend sync to prevent excessive API calls
  const syncOverdueStatusesWithBackend = useCallback(
    async (updatedChallans: PaperFundChallan[]) => {
      try {
        const overdueChallans = updatedChallans.filter(
          (challan) => challan.status === "overdue",
        );

        if (overdueChallans.length > 0) {
          const feeIdsToUpdate = overdueChallans.map((c) => c.id);
          
          // Use AbortController for cleanup
          const controller = new AbortController();
          
          await axios.patch(
            `${BACKEND}/api/paperFund/bulk-update`,
            {
              ids: feeIdsToUpdate,
              status: "overdue",
            },
            { 
              withCredentials: true,
              signal: controller.signal 
            },
          );

          console.log(
            `✅ Updated ${overdueChallans.length} paper fund challans to overdue status`,
          );
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error("❌ Error syncing overdue statuses with backend:", error);
        }
      }
    },
    [],
  );

  // 🚀 OPTIMIZATION 3: Initialize overdue statuses only once on mount
  useEffect(() => {
    if (!challans || challans.length === 0 || hasInitialized.current) {
      return;
    }

    hasInitialized.current = true;
    
    // Use requestIdleCallback if available for non-critical updates
    const checkOverdue = () => {
      const updatedChallans = updateOverdueStatuses(challans);
      
      // Only update if there are actual changes
      if (updatedChallans !== challans) {
        setChallans(updatedChallans);
        syncOverdueStatusesWithBackend(updatedChallans);
      }
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(checkOverdue);
    } else {
      setTimeout(checkOverdue, 0);
    }
  }, [challans, updateOverdueStatuses, setChallans, syncOverdueStatusesWithBackend]);

  // 🚀 OPTIMIZATION 4: Use longer interval and cleanup properly
  useEffect(() => {
    // Clear existing interval
    if (overdueCheckIntervalRef.current) {
      clearInterval(overdueCheckIntervalRef.current);
    }

    // Check overdue statuses every 5 minutes instead of 60 (still frequent enough)
    overdueCheckIntervalRef.current = setInterval(() => {
      setChallans((prevChallans: PaperFundChallan[]) => {
        if (!prevChallans || prevChallans.length === 0) {
          return prevChallans;
        }

        const updatedChallans = updateOverdueStatuses(prevChallans);
        
        // Only update if there are actual changes
        if (updatedChallans !== prevChallans) {
          // Use requestIdleCallback for non-critical backend sync
          if ('requestIdleCallback' in window) {
            requestIdleCallback(() => syncOverdueStatusesWithBackend(updatedChallans));
          } else {
            syncOverdueStatusesWithBackend(updatedChallans);
          }
          return updatedChallans;
        }
        
        return prevChallans;
      });
    }, 5 * 60 * 1000); // 5 minutes

    // Cleanup on unmount
    return () => {
      if (overdueCheckIntervalRef.current) {
        clearInterval(overdueCheckIntervalRef.current);
      }
    };
  }, [updateOverdueStatuses, syncOverdueStatusesWithBackend, setChallans]);

  // 🚀 OPTIMIZATION 5: Memoize component props to prevent unnecessary re-renders
  const generateTabProps = useMemo(() => ({
    students,
    feeStructure,
    challans,
    setChallans,
  }), [students, feeStructure, challans, setChallans]);

  const submitTabProps = useMemo(() => ({
    students,
    challans,
    setChallans,
  }), [students, challans, setChallans]);

  const viewTabProps = useMemo(() => ({
    challans,
    setChallans,
    whatsappMessage,
  }), [challans, setChallans, whatsappMessage]);

  return (
    <div className="space-y-6 p-4 sm:p-6 pt-20 md:pt-6 relative z-10">
      <div className="px-4 sm:px-0">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Paper Fund Management
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Generate paper fund challans, submit payments, and manage records
        </p>
      </div>

      <Tabs defaultValue="generate" className="space-y-4 w-full">
        <div className="px-4 sm:px-0">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
            <TabsTrigger value="generate" className="text-xs sm:text-sm">
              Generate Challans
            </TabsTrigger>
            <TabsTrigger value="submit" className="text-xs sm:text-sm">
              Submit Payment
            </TabsTrigger>
            <TabsTrigger value="list" className="text-xs sm:text-sm">
              View Records
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="generate" className="space-y-0 m-0">
          <GeneratePaperFundTab {...generateTabProps} />
        </TabsContent>

        <TabsContent value="submit" className="space-y-0 m-0">
          <SubmitPaperFundPaymentTab {...submitTabProps} />
        </TabsContent>

        <TabsContent value="list" className="space-y-0 m-0">
          <ViewPaperFundRecordsTab {...viewTabProps} />
        </TabsContent>
      </Tabs>
    </div>
  );
}