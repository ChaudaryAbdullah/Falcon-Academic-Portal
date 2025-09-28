("use client");
import axios from "axios";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { GenerateFeeTab } from "./tabs/GenerateFee";
import { SubmitPaymentTab } from "./tabs/SubmitFee";
import { ViewRecordsTab } from "./tabs/ViewFee";
import { SettingsTab } from "./tabs/WhatsappSetting";

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

interface ClassFeeStructure {
  _id: string;
  className: string;
  tutionFee: number;
  examFee: number;
  paperFund: number;
  miscFee: number;
  createdAt: string;
  updatedAt: string;
}

interface StudentDiscount {
  _id: string;
  studentId: {
    _id: string;
    studentName: string;
    rollNumber: string;
  };
  discount: number;
}

interface FeeChallan {
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
  month: string;
  year: string;
  tutionFee: number;
  examFee: number;
  miscFee: number;
  totalAmount: number;
  remainingBalance: number;
  arrears: number;
  discount: number;
  dueDate: string;
  status: "pending" | "paid" | "overdue";
  generatedDate: string;
  sentToWhatsApp: boolean;
}

interface FeeManagementProps {
  students: Student[];
  feeStructure: ClassFeeStructure[];
  setFeeStructure: (feeStuctures: ClassFeeStructure[]) => void;
  studentDiscounts: StudentDiscount[];
  challans: FeeChallan[];
  setChallans: (challans: FeeChallan[]) => void;
}

export function FeeManagement({
  students,
  feeStructure,
  setFeeStructure,
  studentDiscounts,
  challans,
  setChallans,
}: FeeManagementProps) {
  const [whatsappMessage, setWhatsappMessage] = useState("");

  useEffect(() => {
    const updatedChallans = updateOverdueStatuses(challans);
    setChallans(updatedChallans);
    syncOverdueStatusesWithBackend(updatedChallans);
  }, []);

  const updateOverdueStatuses = (challansData: FeeChallan[]): FeeChallan[] => {
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
    updatedChallans: FeeChallan[]
  ) => {
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
      setChallans(((prevChallans: FeeChallan[]) => {
        const updatedChallans = updateOverdueStatuses(prevChallans);
        const hasChanges = updatedChallans.some(
          (challan, index) => challan.status !== prevChallans[index]?.status
        );

        if (hasChanges) {
          syncOverdueStatusesWithBackend(updatedChallans);
          return updatedChallans;
        }
        return prevChallans;
      }) as unknown as FeeChallan[]);
    }, 10 * 60 * 1000);

    return () => clearInterval(checkOverdueInterval);
  }, []);

  return (
    <div className="space-y-6 p-4 sm:p-6 pt-20 md:pt-6 relative z-10">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Fee Management
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Generate fee challans with discounts and arrears, submit payments, and
          send notifications
        </p>
      </div>

      <Tabs defaultValue="generate" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
          <TabsTrigger
            value="generate"
            className="text-xs sm:text-sm py-2 px-2 sm:px-4"
          >
            Generate Fee
          </TabsTrigger>
          <TabsTrigger
            value="submit"
            className="text-xs sm:text-sm py-2 px-2 sm:px-4"
          >
            Submit Payment
          </TabsTrigger>
          <TabsTrigger
            value="list"
            className="text-xs sm:text-sm py-2 px-2 sm:px-4"
          >
            View Records
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            className="text-xs sm:text-sm py-2 px-2 sm:px-4"
          >
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="mt-4 sm:mt-6">
          <GenerateFeeTab
            students={students}
            feeStructure={feeStructure}
            studentDiscounts={studentDiscounts}
            challans={challans}
            setChallans={setChallans}
          />
        </TabsContent>

        <TabsContent value="submit" className="mt-4 sm:mt-6">
          <SubmitPaymentTab
            students={students}
            challans={challans}
            setChallans={setChallans}
          />
        </TabsContent>

        <TabsContent value="list" className="mt-4 sm:mt-6">
          <ViewRecordsTab
            challans={challans}
            setChallans={setChallans}
            whatsappMessage={whatsappMessage}
          />
        </TabsContent>

        <TabsContent value="settings" className="mt-4 sm:mt-6">
          <SettingsTab
            feeStructure={feeStructure}
            setFeeStructure={setFeeStructure}
            whatsappMessage={whatsappMessage}
            setWhatsappMessage={setWhatsappMessage}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
