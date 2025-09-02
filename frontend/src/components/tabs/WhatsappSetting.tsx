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
    <Card>
      <CardHeader>
        <CardTitle>WhatsApp Reminder Template</CardTitle>
        <CardDescription>
          Customize the reminder message sent to parents via WhatsApp
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="whatsappTemplate">Reminder Message Template</Label>
            <Textarea
              id="whatsappTemplate"
              placeholder="Enter custom WhatsApp reminder message template..."
              value={whatsappMessage}
              onChange={(e) => setWhatsappMessage(e.target.value)}
              rows={12}
            />
            <p className="text-sm text-muted-foreground">
              Leave empty to use default template. The template will
              automatically include: student name, father name, fees breakdown,
              arrears, discounts, total amount, due date, and payment status.
            </p>
          </div>
          <Button onClick={() => setWhatsappMessage("")} variant="outline">
            Reset to Default Template
          </Button>
        </div>

        {/* Fee Structure Management */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Fee Structure by Class</h3>
          <div className="space-y-4">
            {feeStructure?.map((classFee, index) => (
              <div
                key={classFee.className}
                className="grid grid-cols-6 gap-2 items-center p-3 border rounded"
              >
                <div className="font-medium">{classFee.className}</div>
                <Input
                  type="number"
                  value={classFee.tutionFee}
                  onChange={(e) => {
                    const updated = [...feeStructure];
                    updated[index].tutionFee = Number(e.target.value);
                    setFeeStructure(updated);
                  }}
                  placeholder="Tuition"
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
                />
                <div className="text-sm font-medium">
                  Total: Rs.{" "}
                  {classFee.tutionFee +
                    classFee.paperFund +
                    classFee.examFee +
                    classFee.miscFee}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
