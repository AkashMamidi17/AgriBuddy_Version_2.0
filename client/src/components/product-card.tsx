import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Timer, Loader2, Trash2 } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

interface MarketplaceProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  status: string;
  currentBid: number | null;
  biddingEndTime: Date | null;
  userId: number;
}

interface ProductCardProps {
  product: MarketplaceProduct;
  onDelete?: () => void;
}

export default function ProductCard({ product, onDelete }: ProductCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bidAmount, setBidAmount] = useState<string>((product.currentBid || product.price).toString());
  const [isPlacingBid, setIsPlacingBid] = useState(false);

  const timeLeft = product.biddingEndTime 
    ? Math.max(0, Math.ceil((new Date(product.biddingEndTime).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const formatTimeLeft = () => {
    if (!timeLeft || timeLeft <= 0) return "Bidding ended";
    return `${timeLeft} days left`;
  };

  const handlePlaceBid = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "Please login to place a bid",
        variant: "destructive",
      });
      return;
    }

    const bid = parseFloat(bidAmount);
    if (isNaN(bid) || bid <= (product.currentBid || product.price)) {
      toast({
        title: "Error",
        description: "Bid amount must be higher than current bid",
        variant: "destructive",
      });
      return;
    }

    setIsPlacingBid(true);
    try {
      await apiRequest(`/products/${product.id}/bid`, {
        method: "POST",
        body: JSON.stringify({ amount: bid }),
      });
      toast({
        title: "Success",
        description: "Bid placed successfully",
      });
      setBidAmount("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsPlacingBid(false);
    }
  };

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-lg">
      <AspectRatio ratio={16 / 9}>
        <img
          src={product.imageUrl || "https://images.unsplash.com/photo-1492496913980-501348b61469?auto=format&fit=crop&w=800&q=80"}
          alt={product.name}
          className="object-cover w-full h-full"
        />
      </AspectRatio>

      <CardHeader>
        <CardTitle className="flex justify-between items-start">
          <span className="text-lg font-bold text-green-700">{product.name}</span>
          <span className="text-lg font-bold text-green-600">
            ₹{product.currentBid || product.price}
          </span>
        </CardTitle>
        {product.biddingEndTime && (
          <div className="flex items-center text-sm text-gray-500">
            <Timer className="h-4 w-4 mr-1" />
            {formatTimeLeft()}
          </div>
        )}
      </CardHeader>

      <CardContent>
        <p className="text-gray-600 mb-4 line-clamp-2">
          {product.description}
        </p>

        <div className="space-y-3">
          {product.status === "active" && timeLeft > 0 && (
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Enter bid amount"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                min={product.currentBid || product.price}
                className="flex-1"
              />
              <Button 
                onClick={handlePlaceBid}
                className="bg-green-700 hover:bg-green-800 text-white transition-colors duration-200"
                disabled={!user || isPlacingBid}
              >
                {isPlacingBid ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Place Bid"
                )}
              </Button>
            </div>
          )}
          {(!product.status || product.status !== "active" || timeLeft <= 0) && (
            <div className="text-center text-gray-500">
              Bidding has ended
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex justify-between items-center">
        <div className="flex items-center text-sm text-gray-500">
          <MessageSquare className="h-4 w-4 mr-1" />
          <span>Contact seller</span>
        </div>
        {user && user.id === product.userId && onDelete && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}