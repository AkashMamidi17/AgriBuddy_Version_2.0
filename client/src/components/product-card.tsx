import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Product } from "@shared/schema";
import { MessageSquare, ShoppingCart } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const defaultImage = "https://images.unsplash.com/photo-1492496913980-501348b61469?auto=format&fit=crop&w=800&q=80";

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
            ₹{product.price}
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <p className="text-gray-600 mb-4 line-clamp-2">
          {product.description}
        </p>

        <div className="flex gap-2">
          <Button className="flex-1">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Buy Now
          </Button>
          <Button variant="outline">
            <MessageSquare className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
