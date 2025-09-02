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

interface paperFundChallan {
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
      setChallans(((prevChallans: paperFundChallan[]) => {
        const updatedChallans = updateOverdueStatuses(prevChallans);
        const hasChanges = updatedChallans.some(
          (challan, index) => challan.status !== prevChallans[index]?.status
        );

        if (hasChanges) {
          syncOverdueStatusesWithBackend(updatedChallans);
          return updatedChallans;
        }
        return prevChallans;
      }) as unknown as paperFundChallan[]);
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
