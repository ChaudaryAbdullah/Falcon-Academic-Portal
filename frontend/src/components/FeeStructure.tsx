"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Badge } from "./ui/badge";
import { Pencil, Trash2, Plus, Save, X, Table2 } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
const BACKEND = import.meta.env.VITE_BACKEND; // your backend URL

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

interface FeeStructureForm {
  className: string;
  tutionFee: string;
  examFee: string;
  paperFund: string;
  miscFee: string;
}

interface FeeStructureProps {
  feeStructures: FeeStructure[];
  setFeeStructures: (feeStuctures: FeeStructure[]) => void;
}

export default function FeeStructure({
  feeStructures,
  setFeeStructures,
}: FeeStructureProps) {
  // const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("list");
  const [formData, setFormData] = useState<FeeStructureForm>({
    className: "",
    tutionFee: "",
    examFee: "",
    paperFund: "",
    miscFee: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const feeData = {
        className: formData.className,
        tutionFee: Number.parseFloat(formData.tutionFee),
        examFee: Number.parseFloat(formData.examFee),
        paperFund: Number.parseFloat(formData.paperFund),
        miscFee: Number.parseFloat(formData.miscFee),
      };

      if (editingId) {
        // 🔹 Update existing fee structure
        const res = await axios.put(
          `${BACKEND}/api/fee-structures/${editingId}`,
          feeData
        );

        setFeeStructures(((prev: FeeStructure[]) =>
          prev.map((structure: FeeStructure) =>
            structure._id === editingId ? res.data : structure
          )) as unknown as FeeStructure[]);
        setEditingId(null);
        toast.success("Fee structure updated successfully");
      } else {
        // 🔹 Add new fee structure
        const res = await axios.post(`${BACKEND}/api/fee-structures`, feeData);

        setFeeStructures(((prev: FeeStructure[]) => [
          res.data as FeeStructure,
          ...prev,
        ]) as unknown as FeeStructure[]);
        toast.success("Fee structure created successfully");
      }

      // Reset form
      setFormData({
        className: "",
        tutionFee: "",
        examFee: "",
        paperFund: "",
        miscFee: "",
      });
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to save fee structure"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (structure: FeeStructure) => {
    setEditingId(structure._id);
    setFormData({
      className: structure.className,
      tutionFee: structure.tutionFee.toString(),
      examFee: structure.examFee.toString(),
      paperFund: structure.paperFund.toString(),
      miscFee: structure.miscFee.toString(),
    });

    // 👇 Auto-switch to Add/Edit tab
    setActiveTab("add");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({
      className: "",
      tutionFee: "",
      examFee: "",
      paperFund: "",
      miscFee: "",
    });
    // 👇 Switch back to list after cancel
    setActiveTab("list");
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${BACKEND}/api/fee-structures/${id}`);
      setFeeStructures(((prev: FeeStructure[]) =>
        prev.filter(
          (structure: FeeStructure) => structure._id !== id
        )) as unknown as FeeStructure[]);
      toast.success("Fee structure deleted successfully");
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to delete fee structure"
      );
    }
  };

  const getTotalFee = (structure: FeeStructure) => {
    return (
      structure.tutionFee +
      structure.examFee +
      structure.paperFund +
      structure.miscFee
    );
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 pt-20 md:pt-6 relative z-10">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Fee Structure Management
        </h1>
        <p className="text-gray-600 mt-2">
          Manage fee structures for different classes
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="add" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            {editingId ? "Edit Structure" : "Add Structure"}
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <Table2 className="w-4 h-4" />
            All Structures
          </TabsTrigger>
        </TabsList>

        {/* Add / Edit Tab */}
        <TabsContent value="add">
          <Card>
            <CardHeader>
              <CardTitle>
                {editingId ? "Edit Fee Structure" : "Add New Fee Structure"}
              </CardTitle>
              <CardDescription>
                {editingId
                  ? "Update the fee structure details"
                  : "Create a new fee structure for a class"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="className">Class</Label>
                    <select
                      id="className"
                      name="className"
                      value={formData.className}
                      onChange={handleInputChange} // ✅ now works same as Input
                      required
                      className="border border-gray-250 shadow-xs rounded-lg px-3 py-1.5 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Select Class --</option>
                      <option value="Play">Play</option>
                      <option value="Nursery">Nursery</option>
                      <option value="Prep">Prep</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                      <option value="5">5</option>
                      <option value="6">6</option>
                      <option value="7">7</option>
                      <option value="8">8</option>
                      <option value="9">9</option>
                      <option value="10">10</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tutionFee">Tuition Fee (PKR)</Label>
                    <Input
                      id="tutionFee"
                      name="tutionFee"
                      type="number"
                      value={formData.tutionFee}
                      onChange={handleInputChange}
                      placeholder="5000"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="examFee">Exam Fee (PKR)</Label>
                    <Input
                      id="examFee"
                      name="examFee"
                      type="number"
                      value={formData.examFee}
                      onChange={handleInputChange}
                      placeholder="500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paperFund">Paper Fund (PKR)</Label>
                    <Input
                      id="paperFund"
                      name="paperFund"
                      type="number"
                      value={formData.paperFund}
                      onChange={handleInputChange}
                      placeholder="200"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="miscFee">Miscellaneous Fee (PKR)</Label>
                    <Input
                      id="miscFee"
                      name="miscFee"
                      type="number"
                      value={formData.miscFee}
                      onChange={handleInputChange}
                      placeholder="300"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {loading
                      ? "Saving..."
                      : editingId
                      ? "Update Structure"
                      : "Add Structure"}
                  </Button>
                  {editingId && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={cancelEdit}
                      className="flex items-center gap-2 bg-transparent"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* List Tab */}
        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>Fee Structures</CardTitle>
              <CardDescription>
                All fee structures for different classes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {feeStructures.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No fee structures found</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Add a new fee structure to get started
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Class Name</TableHead>
                        <TableHead>Tuition Fee</TableHead>
                        <TableHead>Exam Fee</TableHead>
                        <TableHead>Paper Fund</TableHead>
                        <TableHead>Misc Fee</TableHead>
                        <TableHead>Total Fee</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {feeStructures.map((structure) => (
                        <TableRow key={structure._id}>
                          <TableCell className="font-medium">
                            {structure.className}
                          </TableCell>
                          <TableCell>
                            PKR {structure.tutionFee.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            PKR {structure.examFee.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            PKR {structure.paperFund.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            PKR {structure.miscFee.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              PKR {getTotalFee(structure).toLocaleString()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(structure)}
                                className="flex items-center gap-1"
                              >
                                <Pencil className="w-3 h-3" />
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDelete(structure._id)}
                                className="flex items-center gap-1"
                              >
                                <Trash2 className="w-3 h-3" />
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
