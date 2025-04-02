import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cloud, Sun, Droplet, Wind } from "lucide-react";

const mockWeatherData = {
  current: {
    temp: 28,
    humidity: 65,
    windSpeed: 12,
    condition: "Partly Cloudy",
  },
  forecast: [
    { day: "Tomorrow", temp: 27, condition: "Sunny" },
    { day: "Day 2", temp: 29, condition: "Cloudy" },
    { day: "Day 3", temp: 26, condition: "Rain" },
  ]
};

export default function WeatherUpdates() {
  const [weather, setWeather] = useState(mockWeatherData);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const updateWeather = async () => {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLoading(false);
    };

    updateWeather();
    // Update every 30 minutes
    const interval = setInterval(updateWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sun className="h-5 w-5 text-yellow-500" />
          Weather Updates
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Current Weather */}
          <div className="bg-gradient-to-br from-blue-50 to-green-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <Sun className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{weather.current.temp}°C</p>
                <p className="text-sm text-gray-600">Temperature</p>
              </div>
              <div className="text-center">
                <Droplet className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{weather.current.humidity}%</p>
                <p className="text-sm text-gray-600">Humidity</p>
              </div>
              <div className="text-center">
                <Wind className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{weather.current.windSpeed} km/h</p>
                <p className="text-sm text-gray-600">Wind Speed</p>
              </div>
              <div className="text-center">
                <Cloud className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-lg font-medium">{weather.current.condition}</p>
                <p className="text-sm text-gray-600">Condition</p>
              </div>
            </div>
          </div>

          {/* Forecast */}
          <div>
            <h3 className="text-lg font-medium mb-3">3-Day Forecast</h3>
            <div className="grid grid-cols-3 gap-4">
              {weather.forecast.map((day, index) => (
                <div
                  key={index}
                  className="text-center p-3 bg-gray-50 rounded-lg"
                >
                  <p className="font-medium">{day.day}</p>
                  <p className="text-2xl font-bold my-2">{day.temp}°C</p>
                  <p className="text-sm text-gray-600">{day.condition}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Farming Tips */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-2 text-green-800">Weather-based Farming Tips</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-green-700">
              <li>Ideal conditions for rice cultivation</li>
              <li>Consider harvesting in the next 2 days</li>
              <li>Protect crops from strong winds expected</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}