import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Leaf, Calendar, Droplet, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const cropData = {
  rice: {
    waterNeeds: "High",
    season: "Kharif",
    nextActivity: "Fertilization due in 5 days",
    tips: "Maintain water level at 5cm for optimal growth"
  },
  cotton: {
    waterNeeds: "Moderate",
    season: "Rabi",
    nextActivity: "Pest control check needed",
    tips: "Monitor for bollworm infestation"
  },
  vegetables: {
    waterNeeds: "Regular",
    season: "Year-round",
    nextActivity: "Harvesting in 2 days",
    tips: "Consider crop rotation for soil health"
  }
};

export default function CropManagement() {
  const [selectedCrop, setSelectedCrop] = useState<keyof typeof cropData>("rice");
  const [loading, setLoading] = useState(false);

  const updateCropInfo = async (crop: keyof typeof cropData) => {
    setLoading(true);
    setSelectedCrop(crop);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    setLoading(false);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Leaf className="h-5 w-5 text-green-600" />
          Crop Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Select
            value={selectedCrop}
            onValueChange={(value: keyof typeof cropData) => updateCropInfo(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select crop" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rice">Rice</SelectItem>
              <SelectItem value="cotton">Cotton</SelectItem>
              <SelectItem value="vegetables">Vegetables</SelectItem>
            </SelectContent>
          </Select>

          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Droplet className="h-4 w-4 text-blue-500" />
                  Water Needs:
                </span>
                <span>{cropData[selectedCrop].waterNeeds}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-green-500" />
                  Growing Season:
                </span>
                <span>{cropData[selectedCrop].season}</span>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-yellow-800">
                  Next Activity: {cropData[selectedCrop].nextActivity}
                </p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-sm text-green-800">
                  Tip: {cropData[selectedCrop].tips}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}