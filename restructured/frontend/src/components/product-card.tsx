import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Product } from "@shared/schema";
import { MessageSquare, Timer } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ProductCardProps {
  product: Product;
  onBidPlaced?: () => void;
}

export default function ProductCard({ product, onBidPlaced }: ProductCardProps) {
  const [bidAmount, setBidAmount] = useState(
    product.currentBid ? product.currentBid + 100 : product.price
  );
  const { toast } = useToast();
  const defaultImage = "https://images.unsplash.com/photo-1492496913980-501348b61469?auto=format&fit=crop&w=800&q=80";

  const timeLeft = product.biddingEndTime 
    ? new Date(product.biddingEndTime).getTime() - new Date().getTime()
    : 0;

  const formatTimeLeft = () => {
    if (!timeLeft || timeLeft <= 0) return "Bidding ended";
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m left`;
  };

  const handleBid = async () => {
    try {
      await apiRequest("POST", `/api/products/${product.id}/bid`, { amount: bidAmount });
      toast({
        title: "Bid placed successfully!",
        description: `Your bid of ₹${bidAmount} has been placed.`,
      });
      onBidPlaced?.();
    } catch (error) {
      toast({
        title: "Failed to place bid",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-lg">
      <AspectRatio ratio={16 / 9}>
        <img
          src={product.images[0] || defaultImage}
          alt={product.title}
          className="object-cover w-full h-full"
        />
      </AspectRatio>

      <CardHeader>
        <CardTitle className="flex justify-between items-start">
          <span className="text-xl">{product.title}</span>
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
          <div className="flex gap-2">
            <Input
              type="number"
              value={bidAmount}
              onChange={(e) => setBidAmount(Number(e.target.value))}
              min={product.currentBid ? product.currentBid + 100 : product.price}
              step={100}
              className="flex-1"
            />
            <Button 
              onClick={handleBid}
              className="bg-gradient-to-r from-green-500 to-blue-500 text-white hover:from-green-600 hover:to-blue-600"
              disabled={timeLeft <= 0}
            >
              Place Bid
            </Button>
          </div>
          <Button variant="outline" className="w-full">
            <MessageSquare className="h-4 w-4 mr-2" />
            Contact Seller
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}