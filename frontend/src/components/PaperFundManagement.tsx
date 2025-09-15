"use client";
import axios from "axios";
import { useEffect, useState } from "react";
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
    fPhoneNumber: string;
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
      | ((prev: PaperFundChallan[]) => PaperFundChallan[])
  ) => void;
}

export function PaperFundManagement({
  students,
  feeStructure,
  challans,
  setChallans,
}: PaperFundManagementProps) {
  const [whatsappMessage] = useState(
    "Dear {fatherName}, this is a reminder that the paper fund for {studentName} (Roll No: {rollNumber}) is due on {dueDate}. The amount due is {paperFundAmount}. Please ensure timely payment to avoid any inconvenience. Thank you."
  );

  useEffect(() => {
    // Only run if challans exist
    if (!challans || challans.length === 0) {
      return;
    }

    const updatedChallans = updateOverdueStatuses(challans);

    // Only update if there are actual changes
    const hasChanges = updatedChallans.some(
      (challan, index) => challan.status !== challans[index]?.status
    );

    if (hasChanges) {
      setChallans(updatedChallans);
      syncOverdueStatusesWithBackend(updatedChallans, challans);
    }

    // Set up interval for checking overdue statuses every hour
    const checkOverdueInterval = setInterval(() => {
      setChallans((prevChallans: PaperFundChallan[]) => {
        if (!prevChallans || prevChallans.length === 0) {
          return prevChallans;
        }

        const updatedChallans = updateOverdueStatuses(prevChallans);
        const hasChanges = updatedChallans.some(
          (challan, index) => challan.status !== prevChallans[index]?.status
        );

        if (hasChanges) {
          syncOverdueStatusesWithBackend(updatedChallans, prevChallans);
          return updatedChallans;
        }
        return prevChallans;
      });
    }, 60 * 60 * 1000); // Check every hour instead of 100 * 60 * 1000

    return () => clearInterval(checkOverdueInterval);
  }, [challans]); // Only re-run when challans array length changes

  const updateOverdueStatuses = (
    challansData: PaperFundChallan[]
  ): PaperFundChallan[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return challansData.map((challan) => {
      if (challan.status === "pending" && challan.dueDate) {
        const dueDate = new Date(challan.dueDate);
        dueDate.setHours(0, 0, 0, 0);

        if (dueDate < today) {
          return {
            ...challan,
            status: "overdue" as const,
          };
        }
      }
      return challan;
    });
  };

  const syncOverdueStatusesWithBackend = async (
    updatedChallans: PaperFundChallan[],
    originalChallans: PaperFundChallan[]
  ) => {
    try {
      const overdueChallans = updatedChallans.filter((challan, index) => {
        const originalChallan = originalChallans[index];
        return (
          originalChallan &&
          originalChallan.status === "pending" &&
          challan.status === "overdue"
        );
      });

      if (overdueChallans.length > 0) {
        const feeIdsToUpdate = overdueChallans.map((c) => c.id);
        await axios.patch(
          `${BACKEND}/api/paperFund/bulk-update`,
          {
            ids: feeIdsToUpdate,
            status: "overdue",
          },
          { withCredentials: true }
        );

        console.log(
          `Updated ${overdueChallans.length} paper fund challans to overdue status`
        );
      }
    } catch (error) {
      console.error("Error syncing overdue statuses with backend:", error);
      // Optionally show user notification about sync failure
    }
  };

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
          <GeneratePaperFundTab
            students={students}
            feeStructure={feeStructure}
            challans={challans}
            setChallans={setChallans}
          />
        </TabsContent>

        <TabsContent value="submit" className="space-y-0 m-0">
          <SubmitPaperFundPaymentTab
            students={students}
            challans={challans}
            setChallans={setChallans}
          />
        </TabsContent>

        <TabsContent value="list" className="space-y-0 m-0">
          <ViewPaperFundRecordsTab
            challans={challans}
            setChallans={setChallans}
            whatsappMessage={whatsappMessage}
            // setWhatsappMessage={setWhatsappMessage}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
