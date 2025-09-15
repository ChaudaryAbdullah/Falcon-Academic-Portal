"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";

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

interface SettingsTabProps {
  feeStructure: ClassFeeStructure[];
  setFeeStructure: (feeStructures: ClassFeeStructure[]) => void;
  whatsappMessage: string;
  setWhatsappMessage: (message: string) => void;
}

export function SettingsTab({
  feeStructure,
  setFeeStructure,
  whatsappMessage,
  setWhatsappMessage,
}: SettingsTabProps) {
  return (
    <Card className="w-full max-w-7xl mx-auto">
      <CardHeader className="px-4 sm:px-6">
        <CardTitle className="text-lg sm:text-xl lg:text-2xl">
          WhatsApp Reminder Template
        </CardTitle>
        <CardDescription className="text-sm sm:text-base">
          Customize the reminder message sent to parents via WhatsApp
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        <div className="space-y-4 sm:space-y-6">
          <div className="space-y-2 sm:space-y-3">
            <Label
              htmlFor="whatsappTemplate"
              className="text-sm sm:text-base font-medium"
            >
              Reminder Message Template
            </Label>
            <Textarea
              id="whatsappTemplate"
              placeholder="Enter custom WhatsApp reminder message template..."
              value={whatsappMessage}
              onChange={(e) => setWhatsappMessage(e.target.value)}
              rows={8}
              className="min-h-[120px] sm:min-h-[200px] text-sm sm:text-base resize-y"
            />
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Leave empty to use default template. The template will
              automatically include: student name, father name, fees breakdown,
              arrears, discounts, total amount, due date, and payment status.
            </p>
          </div>
          <Button
            onClick={() => setWhatsappMessage("")}
            variant="outline"
            className="w-full sm:w-auto text-sm sm:text-base h-9 sm:h-10"
          >
            Reset to Default Template
          </Button>
        </div>

        {/* Fee Structure Management */}
        <div className="mt-6 sm:mt-8 lg:mt-10">
          <h3 className="text-base sm:text-lg lg:text-xl font-semibold mb-3 sm:mb-4 lg:mb-6">
            Fee Structure by Class
          </h3>

          {/* Desktop Table Header - Hidden on Mobile */}
          <div className="hidden lg:grid grid-cols-6 gap-2 xl:gap-4 items-center p-3 xl:p-4 bg-gray-50 rounded-t-lg border-b font-medium text-sm xl:text-base">
            <div>Class</div>
            <div>Tuition Fee</div>
            <div>Paper Fund</div>
            <div>Exam Fee</div>
            <div>Misc Fee</div>
            <div>Total Amount</div>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {feeStructure?.map((classFee, index) => (
              <div key={classFee.className}>
                {/* Mobile/Tablet Layout */}
                <div className="lg:hidden border rounded-lg p-3 sm:p-4 space-y-3 sm:space-y-4 bg-white">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-base sm:text-lg text-gray-900">
                      {classFee.className}
                    </h4>
                    <div className="text-right">
                      <div className="text-xs sm:text-sm text-gray-500">
                        Total
                      </div>
                      <div className="text-sm sm:text-base font-bold text-green-600">
                        Rs.{" "}
                        {classFee.tutionFee +
                          classFee.paperFund +
                          classFee.examFee +
                          classFee.miscFee}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1 sm:space-y-2">
                      <Label className="text-xs sm:text-sm font-medium text-gray-600">
                        Tuition Fee
                      </Label>
                      <Input
                        type="number"
                        value={classFee.tutionFee}
                        onChange={(e) => {
                          const updated = [...feeStructure];
                          updated[index].tutionFee = Number(e.target.value);
                          setFeeStructure(updated);
                        }}
                        placeholder="Tuition"
                        className="h-9 sm:h-10 text-sm sm:text-base"
                      />
                    </div>

                    <div className="space-y-1 sm:space-y-2">
                      <Label className="text-xs sm:text-sm font-medium text-gray-600">
                        Paper Fund
                      </Label>
                      <Input
                        type="number"
                        value={classFee.paperFund}
                        onChange={(e) => {
                          const updated = [...feeStructure];
                          updated[index].paperFund = Number(e.target.value);
                          setFeeStructure(updated);
                        }}
                        placeholder="Paper Fund"
                        className="h-9 sm:h-10 text-sm sm:text-base"
                      />
                    </div>

                    <div className="space-y-1 sm:space-y-2">
                      <Label className="text-xs sm:text-sm font-medium text-gray-600">
                        Exam Fee
                      </Label>
                      <Input
                        type="number"
                        value={classFee.examFee}
                        onChange={(e) => {
                          const updated = [...feeStructure];
                          updated[index].examFee = Number(e.target.value);
                          setFeeStructure(updated);
                        }}
                        placeholder="Exam Fee"
                        className="h-9 sm:h-10 text-sm sm:text-base"
                      />
                    </div>

                    <div className="space-y-1 sm:space-y-2">
                      <Label className="text-xs sm:text-sm font-medium text-gray-600">
                        Misc Fee
                      </Label>
                      <Input
                        type="number"
                        value={classFee.miscFee}
                        onChange={(e) => {
                          const updated = [...feeStructure];
                          updated[index].miscFee = Number(e.target.value);
                          setFeeStructure(updated);
                        }}
                        placeholder="Misc Fee"
                        className="h-9 sm:h-10 text-sm sm:text-base"
                      />
                    </div>
                  </div>
                </div>

                {/* Desktop Layout */}
                <div className="hidden lg:grid grid-cols-6 gap-2 xl:gap-4 items-center p-3 xl:p-4 border-b hover:bg-gray-50/50 transition-colors">
                  <div className="font-medium text-sm xl:text-base text-gray-900">
                    {classFee.className}
                  </div>
                  <Input
                    type="number"
                    value={classFee.tutionFee}
                    onChange={(e) => {
                      const updated = [...feeStructure];
                      updated[index].tutionFee = Number(e.target.value);
                      setFeeStructure(updated);
                    }}
                    placeholder="Tuition"
                    className="h-8 xl:h-9 text-sm xl:text-base"
                  />
                  <Input
                    type="number"
                    value={classFee.paperFund}
                    onChange={(e) => {
                      const updated = [...feeStructure];
                      updated[index].paperFund = Number(e.target.value);
                      setFeeStructure(updated);
                    }}
                    placeholder="Paper Fund"
                    className="h-8 xl:h-9 text-sm xl:text-base"
                  />
                  <Input
                    type="number"
                    value={classFee.examFee}
                    onChange={(e) => {
                      const updated = [...feeStructure];
                      updated[index].examFee = Number(e.target.value);
                      setFeeStructure(updated);
                    }}
                    placeholder="Exam Fee"
                    className="h-8 xl:h-9 text-sm xl:text-base"
                  />
                  <Input
                    type="number"
                    value={classFee.miscFee}
                    onChange={(e) => {
                      const updated = [...feeStructure];
                      updated[index].miscFee = Number(e.target.value);
                      setFeeStructure(updated);
                    }}
                    placeholder="Misc Fee"
                    className="h-8 xl:h-9 text-sm xl:text-base"
                  />
                  <div className="text-sm xl:text-base font-semibold text-green-600">
                    Rs.{" "}
                    {classFee.tutionFee +
                      classFee.paperFund +
                      classFee.examFee +
                      classFee.miscFee}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table Border */}
          <div className="hidden lg:block border-l border-r border-b rounded-b-lg"></div>
        </div>
      </CardContent>
    </Card>
  );
}
