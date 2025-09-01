("use client");
import axios from "axios";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { GeneratePaperFundTab } from "./tabs/GeneratePaperFund";
import { SubmitPaperFundPaymentTab } from "./tabs/SubmitPaperFund";
import { ViewPaperFundRecordsTab } from "./tabs/ViewPaperFund";

const BACKEND = import.meta.env.VITE_BACKEND;

interface Student {
  _id: string;
  studentName: string;
  fatherName: string;
  fatherCnic: string;
  bform: string;
  dateOfBirth: string;
  fPhoneNumber: string;
  fatherOccupation: string;
  motherName: string;
  motherOccupation: string;
  rollNumber: string;
  class: string;
  section: string;
}

interface ClassFeeStructure {
  className: string;
  paperFund: number;
}

interface paperFundChallan {
  id: string;
  studentId: {
    _id: string;
    rollNumber: string;
    studentName: string;
    fatherName: string;
    fPhoneNumber: string;
    class: string;
  };
  month: string;
  year: string;
  paperFund: number;
  dueDate: string;
  status: "pending" | "paid" | "overdue";
  generatedDate: string;
  sentToWhatsApp: boolean;
}

interface PaperFundManagementProps {
  students: Student[];
  feeStructure: ClassFeeStructure[];
  challans: paperFundChallan[];
  setChallans: (challans: paperFundChallan[]) => void;
}

export function PaperFundManagement({
  students,
  feeStructure,
  challans,
  setChallans,
}: PaperFundManagementProps) {
  const [whatsappMessage, setWhatsappMessage] = useState("");

  useEffect(() => {
    const updatedChallans = updateOverdueStatuses(challans);
    setChallans(updatedChallans);
    syncOverdueStatusesWithBackend(updatedChallans);
  }, []);

  const updateOverdueStatuses = (challansData: any[]) => {
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

  const syncOverdueStatusesWithBackend = async (updatedChallans: any[]) => {
    try {
      const overdueChallans = updatedChallans.filter((challan, index) => {
        const originalChallan = challans[index];
        return (
          originalChallan &&
          originalChallan.status === "pending" &&
          challan.status === "overdue"
        );
      });

      if (overdueChallans.length > 0) {
        const feeIdsToUpdate = overdueChallans.map((c) => c.id);
        await axios.patch(
          `${BACKEND}/api/fees/bulk-update`,
          {
            feeIds: feeIdsToUpdate,
            status: "overdue",
          },
          { withCredentials: true }
        );
      }
    } catch (error) {
      console.error("Error syncing overdue statuses with backend:", error);
    }
  };

  useEffect(() => {
    const checkOverdueInterval = setInterval(() => {
      setChallans((prevChallans: any[]) => {
        const updatedChallans = updateOverdueStatuses(prevChallans);
        const hasChanges = updatedChallans.some(
          (challan, index) => challan.status !== prevChallans[index]?.status
        );

        if (hasChanges) {
          syncOverdueStatusesWithBackend(updatedChallans);
          return updatedChallans;
        }
        return prevChallans;
      });
    }, 10 * 60 * 1000);

    return () => clearInterval(checkOverdueInterval);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Fee Management</h1>
        <p className="text-muted-foreground">
          Generate fee challans with discounts and arrears, submit payments, and
          send notifications
        </p>
      </div>

      <Tabs defaultValue="generate" className="space-y-4">
        <TabsList>
          <TabsTrigger value="generate">Generate Fee Challans</TabsTrigger>
          <TabsTrigger value="submit">Submit Fee Payment</TabsTrigger>
          <TabsTrigger value="list">View Fee Records</TabsTrigger>
        </TabsList>

        <TabsContent value="generate">
          <GeneratePaperFundTab
            students={students}
            feeStructure={feeStructure}
            challans={challans}
            setChallans={setChallans}
          />
        </TabsContent>

        <TabsContent value="submit">
          <SubmitPaperFundPaymentTab
            students={students}
            challans={challans}
            setChallans={setChallans}
          />
        </TabsContent>

        <TabsContent value="list">
          <ViewPaperFundRecordsTab
            challans={challans}
            setChallans={setChallans}
            whatsappMessage={whatsappMessage}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
