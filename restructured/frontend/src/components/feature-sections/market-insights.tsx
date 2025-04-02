import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, AlertCircle } from "lucide-react";

const mockPriceData = [
  { date: "Feb 18", rice: 2100, cotton: 5600, vegetables: 1800 },
  { date: "Feb 19", rice: 2150, cotton: 5500, vegetables: 1850 },
  { date: "Feb 20", rice: 2200, cotton: 5650, vegetables: 1750 },
  { date: "Feb 21", rice: 2180, cotton: 5700, vegetables: 1900 },
  { date: "Feb 22", rice: 2250, cotton: 5800, vegetables: 1950 },
  { date: "Feb 23", rice: 2300, cotton: 5750, vegetables: 2000 },
];

const marketAlerts = [
  {
    crop: "Rice",
    message: "Price expected to rise due to increased export demand",
    type: "positive"
  },
  {
    crop: "Cotton",
    message: "Stable prices with moderate trading volume",
    type: "neutral"
  },
  {
    crop: "Vegetables",
    message: "Local market showing strong demand",
    type: "positive"
  }
];

export default function MarketInsights() {
  const [selectedCrop, setSelectedCrop] = useState("rice");
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-500" />
          Market Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Price Chart */}
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockPriceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="rice"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={false}
                  name="Rice (₹/quintal)"
                />
                <Line
                  type="monotone"
                  dataKey="cotton"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  name="Cotton (₹/quintal)"
                />
                <Line
                  type="monotone"
                  dataKey="vegetables"
                  stroke="#eab308"
                  strokeWidth={2}
                  dot={false}
                  name="Vegetables (₹/quintal)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Market Alerts */}
          <div>
            <h3 className="text-lg font-medium mb-3">Market Alerts</h3>
            <div className="space-y-3">
              {marketAlerts.map((alert, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg flex items-start gap-2 ${
                    alert.type === "positive"
                      ? "bg-green-50 text-green-800"
                      : alert.type === "negative"
                      ? "bg-red-50 text-red-800"
                      : "bg-gray-50 text-gray-800"
                  }`}
                >
                  {alert.type === "positive" ? (
                    <TrendingUp className="h-5 w-5 flex-shrink-0" />
                  ) : alert.type === "negative" ? (
                    <TrendingDown className="h-5 w-5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  )}
                  <div>
                    <p className="font-medium">{alert.crop}</p>
                    <p className="text-sm">{alert.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trading Tips */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-2 text-blue-800">Trading Tips</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-blue-700">
              <li>Consider storing rice for better prices next month</li>
              <li>Cotton prices showing positive trend</li>
              <li>Local vegetable markets are most profitable currently</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}