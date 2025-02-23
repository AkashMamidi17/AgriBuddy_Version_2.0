import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wrench, Tractor, AlertCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const equipmentData = [
  {
    id: 1,
    name: "Tractor",
    status: "Available",
    nextMaintenance: "2024-03-15",
    condition: "Good"
  },
  {
    id: 2,
    name: "Harvester",
    status: "In Use",
    nextMaintenance: "2024-03-20",
    condition: "Fair"
  },
  {
    id: 3,
    name: "Sprayer",
    status: "Maintenance",
    nextMaintenance: "2024-02-25",
    condition: "Needs Repair"
  }
];

export default function EquipmentSection() {
  const [selectedEquipment, setSelectedEquipment] = useState<number | null>(null);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-gray-600" />
          Equipment Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Equipment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Next Maintenance</TableHead>
              <TableHead>Condition</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {equipmentData.map((equipment) => (
              <TableRow key={equipment.id}>
                <TableCell className="font-medium">{equipment.name}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      equipment.status === "Available"
                        ? "bg-green-100 text-green-800"
                        : equipment.status === "In Use"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {equipment.status}
                  </span>
                </TableCell>
                <TableCell>{equipment.nextMaintenance}</TableCell>
                <TableCell>
                  <span
                    className={`${
                      equipment.condition === "Good"
                        ? "text-green-600"
                        : equipment.condition === "Fair"
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {equipment.condition}
                  </span>
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedEquipment(equipment.id)}
                  >
                    Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {selectedEquipment && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">Maintenance Tips:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              <li>Check oil levels before each use</li>
              <li>Clean equipment after usage</li>
              <li>Regular inspection of moving parts</li>
              <li>Report any unusual sounds or behavior</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}