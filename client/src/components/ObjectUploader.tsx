import { useState, useRef } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";

interface ObjectUploaderProps {
  onGetUploadUrl: () => Promise<string>;
  onComplete?: (uploadUrl: string) => void;
  onError?: (error: Error) => void;
  accept?: string;
  maxFileSize?: number;
  buttonClassName?: string;
  buttonVariant?: "default" | "outline" | "ghost" | "secondary";
  buttonSize?: "default" | "sm" | "lg" | "icon";
  children?: ReactNode;
}

export function ObjectUploader({
  onGetUploadUrl,
  onComplete,
  onError,
  accept = "image/*",
  maxFileSize = 5242880,
  buttonClassName,
  buttonVariant = "outline",
  buttonSize = "default",
  children,
}: ObjectUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxFileSize) {
      onError?.(new Error(`File size exceeds ${Math.round(maxFileSize / 1024 / 1024)}MB limit`));
      return;
    }

    setIsUploading(true);
    try {
      const uploadUrl = await onGetUploadUrl();
      
      const response = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      onComplete?.(uploadUrl);
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error("Upload failed"));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        data-testid="input-file-upload"
      />
      <Button 
        type="button"
        onClick={handleClick} 
        className={buttonClassName}
        variant={buttonVariant}
        size={buttonSize}
        disabled={isUploading}
        data-testid="button-upload-photo"
      >
        {isUploading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Uploading...
          </>
        ) : (
          children || (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload Photo
            </>
          )
        )}
      </Button>
    </div>
  );
}
