import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import VoiceAssistant from "@/components/voice-assistant";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sprout, Tractor, Sun, Cloud } from "lucide-react"; // Changed Plant to Sprout

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
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <Sprout className="w-8 h-8 text-green-600" />
                <CardTitle>Crop Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Track your crops and get personalized recommendations
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Tractor className="w-8 h-8 text-green-600" />
                <CardTitle>Equipment</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Modern farming techniques and equipment guides
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Sun className="w-8 h-8 text-yellow-500" />
                <CardTitle>Weather Updates</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Real-time weather forecasts for better planning
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Cloud className="w-8 h-8 text-blue-500" />
                <CardTitle>Market Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Latest market trends and pricing information
                </p>
              </CardContent>
            </Card>
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