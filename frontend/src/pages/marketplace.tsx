import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Product, insertProductSchema } from "@shared/schema";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";

export default function MarketplacePage() {
  const { user } = useAuth();
  const form = useForm({
    resolver: zodResolver(insertProductSchema),
    defaultValues: {
      title: "",
      description: "",
      price: 0,
      images: [] as string[]
    }
  });

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"]
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/products", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-green-800">Marketplace</h1>

          {user?.userType === "farmer" && (
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  List Product
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Product</DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={form.handleSubmit((data) =>
                    createProductMutation.mutate(data)
                  )}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="title">Product Title</Label>
                    <Input id="title" {...form.register("title")} />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      {...form.register("description")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">Price (in Rs)</Label>
                    <Input
                      id="price"
                      type="number"
                      {...form.register("price", { valueAsNumber: true })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="images">Image URLs</Label>
                    <Input
                      id="images"
                      placeholder="Enter image URLs separated by commas"
                      onChange={(e) =>
                        form.setValue(
                          "images",
                          e.target.value.split(",").map((url) => url.trim())
                        )
                      }
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={createProductMutation.isPending}
                  >
                    {createProductMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Add Product"
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products?.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}