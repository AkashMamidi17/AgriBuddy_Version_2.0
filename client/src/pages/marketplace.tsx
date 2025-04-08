import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertProductSchema } from "@/lib/schema";
import ProductCard from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Upload, Eye, Trash2, Gavel } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { z } from "zod";
import { MarketplaceProduct } from '../types';
import { useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

const defaultProducts = [
  {
    id: 1,
    name: "Organic Tomatoes",
    description: "Fresh organic tomatoes from local farm. Perfect for salads and cooking. Grown without pesticides.",
    price: 120,
    imageUrl: "https://images.unsplash.com/photo-1546470427-e26264fde376",
    category: "Vegetables",
    status: "active",
    currentBid: 120,
    biddingEndTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    userId: 1
  },
  {
    id: 2,
    name: "Fresh Carrots",
    description: "Sweet and crunchy carrots. Freshly harvested from our organic farm. Rich in vitamins.",
    price: 80,
    imageUrl: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37",
    category: "Vegetables",
    status: "active",
    currentBid: 80,
    biddingEndTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    userId: 2
  }
];

type CreateProductInput = {
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
};

export default function MarketplacePage() {
  const { user } = useAuth();
  const form = useForm({
    resolver: zodResolver(insertProductSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      imageUrl: "https://images.unsplash.com/photo-1518977676601-b53f82aba655",
      category: "produce"
    }
  });

  const { data: products = [], isLoading, error } = useQuery<MarketplaceProduct[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await apiRequest('/products', {
        method: 'GET',
      });
      return response;
    },
  });

  useEffect(() => {
    if (error) {
      console.error('Error fetching products:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  }, [error]);

  const getDefaultImageUrl = (productName: string) => {
    const name = productName.toLowerCase();
    if (name.includes("tomato")) {
      return "https://images.unsplash.com/photo-1546470427-e26264fde376";
    } else if (name.includes("carrot")) {
      return "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37";
    } else if (name.includes("potato")) {
      return "https://images.unsplash.com/photo-1518977676601-b53f82aba655";
    }
    return "https://images.unsplash.com/photo-1610348725531-843dff563e2c";
  };

  const createProductMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; price: number; imageUrl: string; category: string }) => {
      if (!user) {
        throw new Error('You must be logged in to create a product');
      }

      const productData = {
        title: data.name,
        description: data.description,
        price: Number(data.price),
        images: [data.imageUrl],
        userId: user.id,
        status: "active",
        currentBid: Number(data.price),
        biddingEndTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      };

      const response = await apiRequest('/api/products', {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create product');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: 'Success',
        description: 'Product created successfully',
      });
      form.reset();
    },
    onError: (error: Error) => {
      console.error('Error creating product:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create product',
        variant: 'destructive',
      });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: number) => {
      const response = await apiRequest(`/products/${productId}`, { 
        method: "DELETE"
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete product",
        variant: "destructive",
      });
    }
  });

  const placeBidMutation = useMutation({
    mutationFn: async ({ productId, amount }: { productId: number; amount: number }) => {
      if (!user) {
        throw new Error('You must be logged in to place a bid');
      }

      const response = await apiRequest(`/api/products/${productId}/bid`, {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({ amount }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to place bid');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: 'Success',
        description: 'Bid placed successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to place bid',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: CreateProductInput) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to create a product',
        variant: 'destructive',
      });
      return;
    }

    if (user.userType !== 'farmer') {
      toast({
        title: 'Error',
        description: 'Only farmers can create products',
        variant: 'destructive',
      });
      return;
    }

    createProductMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">Error loading products</h2>
          <p className="text-gray-600">Please try again later</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-green-700">Marketplace</h1>

          {user?.userType === "farmer" && (
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-green-700 hover:bg-green-800 text-white transition-colors duration-200">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Product</DialogTitle>
                  <DialogDescription>
                    Fill in the details to list your product in the marketplace.
                  </DialogDescription>
                </DialogHeader>
                <form
                  onSubmit={form.handleSubmit((data) => {
                    onSubmit(data);
                  })}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="name">Product Name</Label>
                    <Input id="name" {...form.register("name")} />
                    {form.formState.errors.name && (
                      <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      {...form.register("description")}
                    />
                    {form.formState.errors.description && (
                      <p className="text-sm text-red-500">{form.formState.errors.description.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="price">Price (in Rs)</Label>
                    <Input
                      id="price"
                      type="number"
                      {...form.register("price", { valueAsNumber: true })}
                    />
                    {form.formState.errors.price && (
                      <p className="text-sm text-red-500">{form.formState.errors.price.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="imageUrl">Image URL</Label>
                    <Input
                      id="imageUrl"
                      {...form.register("imageUrl")}
                    />
                    {form.formState.errors.imageUrl && (
                      <p className="text-sm text-red-500">{form.formState.errors.imageUrl.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      {...form.register("category")}
                    />
                    {form.formState.errors.category && (
                      <p className="text-sm text-red-500">{form.formState.errors.category.message}</p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    disabled={createProductMutation.isPending}
                  >
                    {createProductMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Create Product
                      </>
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="p-6 hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-green-800">{product.name}</CardTitle>
                <CardDescription className="text-gray-600">{product.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {product.imageUrl && (
                  <div className="mt-4 rounded-lg overflow-hidden">
                    <img 
                      src={product.imageUrl} 
                      alt={product.name} 
                      className="w-full h-[300px] object-cover hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                )}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Current Price:</span>
                    <span className="text-green-600 font-bold text-lg">₹{product.currentBid || product.price}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Starting Price:</span>
                    <span>₹{product.price}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Category:</span>
                    <span className="capitalize bg-green-100 px-2 py-1 rounded-full text-green-800">{product.category}</span>
                  </div>
                  {product.biddingEndTime && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Bidding Ends:</span>
                      <span className="text-orange-600">
                        {new Date(product.biddingEndTime).toLocaleDateString()} ({Math.ceil((new Date(product.biddingEndTime).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days left)
                      </span>
                    </div>
                  )}
                  {product.status === 'active' && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Status:</span>
                      <span className="text-green-600 capitalize flex items-center">
                        <span className="h-2 w-2 bg-green-500 rounded-full mr-2"></span>
                        {product.status}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <div className="flex justify-between w-full">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = `/products/${product.id}`}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </Button>
                  {user?.id === product.userId ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteProductMutation.mutate(product.id)}
                      disabled={deleteProductMutation.isPending}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  ) : (
                    product.status === 'active' && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="default"
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Gavel className="mr-2 h-4 w-4" />
                            Place Bid
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Place a Bid</DialogTitle>
                            <DialogDescription>
                              Current highest bid: ₹{product.currentBid || product.price}
                              <br />
                              Minimum bid increment: ₹10
                            </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            const bidAmount = Number(formData.get('bidAmount'));
                            
                            if (bidAmount <= (product.currentBid || product.price)) {
                              toast({
                                title: "Error",
                                description: "Bid amount must be higher than current bid",
                                variant: "destructive"
                              });
                              return;
                            }

                            placeBidMutation.mutate({ 
                              productId: product.id, 
                              amount: bidAmount 
                            });
                          }} className="space-y-4">
                            <div>
                              <Label htmlFor="bidAmount">Your Bid Amount (₹)</Label>
                              <Input
                                id="bidAmount"
                                name="bidAmount"
                                type="number"
                                min={Math.ceil((product.currentBid || product.price) + 10)}
                                required
                                defaultValue={Math.ceil((product.currentBid || product.price) + 10)}
                              />
                              <p className="text-sm text-muted-foreground mt-1">
                                Enter an amount higher than the current bid
                              </p>
                            </div>
                            <Button 
                              type="submit" 
                              className="w-full bg-green-600 hover:bg-green-700"
                              disabled={placeBidMutation.isPending}
                            >
                              {placeBidMutation.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Processing...
                                </>
                              ) : (
                                'Confirm Bid'
                              )}
                            </Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                    )
                  )}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}