import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, Plus, Heart, Share2, Bookmark, Upload, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { ThumbsUp } from "lucide-react";
import { useState } from "react";

interface CommunityPost {
  id: number;
  title: string;
  content: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  userId: number;
  likes: number;
  shares: number;
  saves: number;
  createdAt: Date;
}

const defaultPosts: CommunityPost[] = [
  {
    id: 1,
    title: "Modern Farming Techniques",
    content: "Check out these innovative farming methods that can help increase crop yield while being environmentally sustainable. Learn about hydroponics, vertical farming, and smart irrigation systems.",
    videoUrl: "https://www.youtube.com/embed/VkQpP9JO2F0",
    thumbnailUrl: "https://img.youtube.com/vi/VkQpP9JO2F0/maxresdefault.jpg",
    userId: 1,
    likes: 45,
    shares: 12,
    saves: 8,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
  {
    id: 2,
    title: "Organic Farming Success Story",
    content: "Learn how I transformed my traditional farm into a successful organic farming business. The journey and challenges faced in sustainable agriculture.",
    videoUrl: "https://www.youtube.com/embed/nXYxHAeE2_0",
    thumbnailUrl: "https://img.youtube.com/vi/nXYxHAeE2_0/maxresdefault.jpg",
    userId: 2,
    likes: 32,
    shares: 8,
    saves: 15,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: 3,
    title: "Smart Farming Technology",
    content: "Discover how IoT and AI are revolutionizing agriculture. From automated tractors to drone monitoring, see the future of farming.",
    videoUrl: "https://www.youtube.com/embed/Qmla9NLFBvU",
    thumbnailUrl: "https://img.youtube.com/vi/Qmla9NLFBvU/maxresdefault.jpg",
    userId: 3,
    likes: 56,
    shares: 23,
    saves: 19,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  }
];

export default function CommunityPage() {
  const { user } = useAuth();
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const { data: posts = defaultPosts, isLoading } = useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      try {
        const response = await apiRequest('/posts');
        return response.length > 0 ? response : defaultPosts;
      } catch (error) {
        console.error('Error fetching posts:', error);
        return defaultPosts;
      }
    },
  });

  const createPostMutation = useMutation({
    mutationFn: async (data: { title: string; content: string; videoUrl?: string }) => {
      const response = await apiRequest('/posts', {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({
          ...data,
          userId: user?.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create post');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast({
        title: 'Success',
        description: 'Post created successfully',
      });
      setIsCreatePostOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create post',
        variant: 'destructive',
      });
    },
  });

  const likePostMutation = useMutation({
    mutationFn: (post: CommunityPost) =>
      apiRequest(`/posts/${post.id}/like`, {
        method: "POST",
        credentials: 'include'
      }),
    onSuccess: (updatedPost) => {
      queryClient.setQueryData<CommunityPost[]>(["posts"], (oldPosts = []) =>
        oldPosts.map((p) => (p.id === updatedPost.id ? updatedPost : p))
      );
      toast({
        title: "Success",
        description: "Post liked successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to like post",
        variant: "destructive",
      });
    },
  });

  const sharePostMutation = useMutation({
    mutationFn: (post: CommunityPost) =>
      apiRequest(`/posts/${post.id}/share`, {
        method: "POST",
        credentials: 'include'
      }),
    onSuccess: (updatedPost) => {
      queryClient.setQueryData<CommunityPost[]>(["posts"], (oldPosts = []) =>
        oldPosts.map((p) => (p.id === updatedPost.id ? updatedPost : p))
      );
      toast({
        title: "Success",
        description: "Post shared successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to share post",
        variant: "destructive",
      });
    },
  });

  const savePostMutation = useMutation({
    mutationFn: (post: CommunityPost) =>
      apiRequest(`/posts/${post.id}/save`, {
        method: "POST",
        credentials: 'include'
      }),
    onSuccess: (updatedPost) => {
      queryClient.setQueryData<CommunityPost[]>(["posts"], (oldPosts = []) =>
        oldPosts.map((p) => (p.id === updatedPost.id ? updatedPost : p))
      );
      toast({
        title: "Success",
        description: "Post saved successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save post",
        variant: "destructive",
      });
    },
  });

  const deletePostMutation = useMutation<void, Error, CommunityPost>({
    mutationFn: (post: CommunityPost) =>
      apiRequest(`/api/posts/${post.id}`, {
        method: "DELETE",
      }),
    onSuccess: (_: void, post: CommunityPost) => {
      queryClient.setQueryData<CommunityPost[]>(["/api/posts"], (oldPosts = []) =>
        oldPosts.filter((p) => p.id !== post.id)
      );
    },
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
          <h1 className="text-3xl font-bold text-green-700">Community</h1>
          {user && (
            <Button
              onClick={() => setIsCreatePostOpen(true)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Post
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {posts.map((post) => (
              <Card key={post.id} className="overflow-hidden">
                <CardHeader>
                  <CardTitle>{post.title}</CardTitle>
                  <CardDescription>
                    Posted {new Date(post.createdAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-4">{post.content}</p>
                  {post.videoUrl && (
                    <div className="relative aspect-video rounded-lg overflow-hidden">
                      <iframe
                        src={post.videoUrl}
                        className="absolute inset-0 w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title={post.title}
                      />
                    </div>
                  )}
                  <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                    <span>Posted by {post.userId === user?.id ? 'You' : `User ${post.userId}`}</span>
                    <div className="flex items-center space-x-4">
                      <span>{post.likes} likes</span>
                      <span>{post.shares} shares</span>
                      <span>{post.saves} saves</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => likePostMutation.mutate(post)}
                      disabled={likePostMutation.isPending}
                      className={post.likes > 0 ? 'text-green-600' : ''}
                    >
                      <Heart className={`mr-1 h-4 w-4 ${post.likes > 0 ? 'fill-green-500 stroke-green-500' : ''}`} />
                      Like
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => sharePostMutation.mutate(post)}
                      disabled={sharePostMutation.isPending}
                    >
                      <Share2 className="mr-1 h-4 w-4" />
                      Share
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => savePostMutation.mutate(post)}
                      disabled={savePostMutation.isPending}
                      className={post.saves > 0 ? 'text-yellow-600' : ''}
                    >
                      <Bookmark className={`mr-1 h-4 w-4 ${post.saves > 0 ? 'fill-yellow-500 stroke-yellow-500' : ''}`} />
                      Save
                    </Button>
                  </div>
                  {user?.id === post.userId && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deletePostMutation.mutate(post)}
                      disabled={deletePostMutation.isPending}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={isCreatePostOpen} onOpenChange={setIsCreatePostOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Post</DialogTitle>
              <DialogDescription>
                Share your farming experience or knowledge with the community
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const videoUrl = formData.get('videoUrl') as string;
                const youtubeId = videoUrl ? getYoutubeVideoId(videoUrl) : null;
                
                createPostMutation.mutate({
                  title: formData.get('title') as string,
                  content: formData.get('content') as string,
                  videoUrl: youtubeId ? `https://www.youtube.com/embed/${youtubeId}` : undefined,
                });
              }}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" required />
              </div>
              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea id="content" name="content" required className="min-h-[100px]" />
              </div>
              <div>
                <Label htmlFor="videoUrl">YouTube Video URL (Optional)</Label>
                <Input 
                  id="videoUrl" 
                  name="videoUrl" 
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Paste any YouTube video URL - it will be automatically converted to the correct format
                </p>
              </div>
              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={createPostMutation.isPending}
              >
                {createPostMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Post'
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// Helper function to extract YouTube video ID
function getYoutubeVideoId(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}