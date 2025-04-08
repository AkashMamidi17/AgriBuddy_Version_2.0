import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VoiceAssistant } from "@/components/voice-assistant";
import CropManagement from "@/components/feature-sections/crop-management";
import EquipmentSection from "@/components/feature-sections/equipment-section";
import WeatherUpdates from "@/components/feature-sections/weather-updates";
import MarketInsights from "@/components/feature-sections/market-insights";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8">
          {/* Welcome Section */}
          <Card className="bg-gradient-to-r from-green-100 to-blue-100">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                  <h1 className="text-3xl font-bold text-green-800">
                    Welcome {user?.name}!
                  </h1>
                  <p className="mt-2 text-gray-600">
                    Your one-stop platform for farming success
                  </p>
                </div>
                <VoiceAssistant />
              </div>
            </CardContent>
          </Card>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            <CropManagement />
            <EquipmentSection />
            <WeatherUpdates />
            <MarketInsights />
          </div>

          {/* Knowledge Base */}
          <Card>
            <CardHeader>
              <CardTitle>Knowledge Base</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="telangana">
                <TabsList>
                  <TabsTrigger value="telangana">Telangana Farming</TabsTrigger>
                  <TabsTrigger value="organic">Organic Farming</TabsTrigger>
                  <TabsTrigger value="modern">Modern Techniques</TabsTrigger>
                </TabsList>
                <ScrollArea className="h-[300px] mt-4 rounded-md border p-4">
                  <TabsContent value="telangana">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Telangana Agriculture Guide</h3>
                      <p>Learn about traditional farming methods specific to Telangana region...</p>
                      <ul className="list-disc pl-5 space-y-2">
                        <li>Major crops: Rice, Cotton, Sugarcane</li>
                        <li>Best practices for local climate</li>
                        <li>Government schemes and support</li>
                      </ul>
                    </div>
                  </TabsContent>
                  <TabsContent value="organic">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Organic Farming Techniques</h3>
                      <p>Discover sustainable and chemical-free farming methods...</p>
                    </div>
                  </TabsContent>
                  <TabsContent value="modern">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Modern Agriculture</h3>
                      <p>Explore the latest in farming technology and innovation...</p>
                    </div>
                  </TabsContent>
                </ScrollArea>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}