import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export function VideoUploadDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [video, setVideo] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideo(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!video) return;

    try {
      setUploading(true);

      // First, upload the video file to get the URL
      const formData = new FormData();
      formData.append("video", video);
      const uploadResponse = await fetch("http://localhost:5000/api/upload", {
        method: "POST",
        body: formData,
        credentials: "include"
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload video");
      }

      const { videoUrl, videoThumbnail, videoDuration } = await uploadResponse.json();

      // Then, create the post with the video URL
      const postResponse = await fetch("http://localhost:5000/api/posts/video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title,
          content,
          videoUrl,
          videoThumbnail,
          videoDuration
        }),
        credentials: "include"
      });

      if (!postResponse.ok) {
        throw new Error("Failed to create post");
      }

      // Reset form and close dialog
      setTitle("");
      setContent("");
      setVideo(null);
      setIsOpen(false);

      // Refresh posts list
      queryClient.invalidateQueries(["posts"]);
    } catch (error) {
      console.error("Error uploading video:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Upload className="w-4 h-4" />
          Upload Video
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Video</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="content">Description</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="video">Video</Label>
            <Input
              id="video"
              type="file"
              accept="video/*"
              onChange={handleVideoChange}
              required
            />
          </div>
          <Button type="submit" disabled={uploading}>
            {uploading ? "Uploading..." : "Upload"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
} 