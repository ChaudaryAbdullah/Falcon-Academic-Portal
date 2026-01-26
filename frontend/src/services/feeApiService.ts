// services/feeApiService.ts
import axios from "axios";

const BACKEND = import.meta.env.VITE_BACKEND;

export interface PaginationParams {
  page?: number;
  limit?: number;
  status?: string;
  month?: string;
  year?: string;
  search?: string;
  whatsapp?: string;
  studentClass?: string;
  section?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  startRecord: number;
  endRecord: number;
}

export interface FeeChallan {
  id: string;
  studentId: {
    _id: string;
    img?: { data: string; contentType: string };
    rollNumber: string;
    studentName: string;
    fatherName: string;
    mPhoneNumber: string;
    class: string;
    section: string;
    discountCode: string;
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

export interface FeeApiResponse {
  success: boolean;
  data: FeeChallan[];
  pagination: PaginationMeta;
}

export interface FilterOptions {
  months: string[];
  years: string[];
  statuses: string[];
}

export interface ChallanStats {
  overall: {
    pending: number;
    paid: number;
    overdue: number;
    totalPendingAmount: number;
    totalPaidAmount: number;
    totalOverdueAmount: number;
  };
  today: {
    generated: number;
  };
  currentMonth: {
    totalGenerated: number;
    totalAmount: number;
    collected: number;
    pending: number;
  };
}

class FeeApiService {
  private baseUrl = `${BACKEND}/api/fees`;

  // Get paginated fees
  async getFees(params: PaginationParams = {}): Promise<FeeApiResponse> {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== "" &&
        value !== "all"
      ) {
        queryParams.append(key, String(value));
      }
    });

    const response = await axios.get(
      `${this.baseUrl}?${queryParams.toString()}`,
      { withCredentials: true },
    );

    return response.data;
  }

  // Get fees for printing (bulk)
  async getFeesForPrint(params: {
    generatedDate?: string;
    studentClass?: string;
    section?: string;
    feeIds?: string[];
  }): Promise<{ success: boolean; data: FeeChallan[]; count: number }> {
    const queryParams = new URLSearchParams();

    if (params.generatedDate)
      queryParams.append("generatedDate", params.generatedDate);
    if (params.studentClass)
      queryParams.append("studentClass", params.studentClass);
    if (params.section) queryParams.append("section", params.section);
    if (params.feeIds?.length)
      queryParams.append("feeIds", params.feeIds.join(","));

    const response = await axios.get(
      `${this.baseUrl}/print?${queryParams.toString()}`,
      { withCredentials: true },
    );

    return response.data;
  }

  // Get filter options
  async getFilterOptions(): Promise<{ success: boolean; data: FilterOptions }> {
    const response = await axios.get(`${this.baseUrl}/filter-options`, {
      withCredentials: true,
    });
    return response.data;
  }

  // Get challan stats
  async getChallanStats(): Promise<{ success: boolean; data: ChallanStats }> {
    const response = await axios.get(`${this.baseUrl}/stats`, {
      withCredentials: true,
    });
    return response.data;
  }

  // Get pending fees for a student
  async getPendingFees(studentId: string): Promise<{
    success: boolean;
    data: any[];
    totalOutstanding: number;
  }> {
    const response = await axios.get(`${this.baseUrl}/pending/${studentId}`, {
      withCredentials: true,
    });
    return response.data;
  }

  // Generate bulk fees
  async generateBulkFees(challans: any[]): Promise<{
    success: boolean;
    data: FeeChallan[];
    errors?: any[];
  }> {
    const response = await axios.post(
      `${this.baseUrl}/generate-bulk`,
      { challans },
      { withCredentials: true },
    );
    return response.data;
  }

  // Bulk update status
  async bulkUpdateStatus(
    feeIds: string[],
    status: string,
  ): Promise<{
    success: boolean;
    modifiedCount: number;
  }> {
    const response = await axios.patch(
      `${this.baseUrl}/bulk-update`,
      { feeIds, status },
      { withCredentials: true },
    );
    return response.data;
  }

  // Update WhatsApp status
  async updateWhatsAppStatus(
    feeId: string,
    sentToWhatsApp: boolean,
  ): Promise<void> {
    await axios.patch(
      `${this.baseUrl}/${feeId}/whatsapp`,
      { sentToWhatsApp },
      { withCredentials: true },
    );
  }

  // Submit partial payment
  async submitPartialPayment(data: {
    studentId: string;
    selectedFeeIds: string[];
    partialAmount: number;
    lateFees?: Record<string, number>;
  }): Promise<any> {
    const response = await axios.post(`${this.baseUrl}/partial-payment`, data, {
      withCredentials: true,
    });
    return response.data;
  }
}

export const feeApiService = new FeeApiService();
