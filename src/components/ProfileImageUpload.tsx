import React, { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Camera, Upload, X, User } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface ProfileImageUploadProps {
  currentImageUrl?: string;
  onImageChange: (url: string) => void;
  onClose?: () => void;
}

// Preset avatar options
const PRESET_AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=1&backgroundColor=b6e3f4,c0aede,d1d4f9',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=2&backgroundColor=b6e3f4,c0aede,d1d4f9',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=3&backgroundColor=b6e3f4,c0aede,d1d4f9',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=4&backgroundColor=b6e3f4,c0aede,d1d4f9',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=5&backgroundColor=b6e3f4,c0aede,d1d4f9',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=6&backgroundColor=b6e3f4,c0aede,d1d4f9',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=7&backgroundColor=b6e3f4,c0aede,d1d4f9',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=8&backgroundColor=b6e3f4,c0aede,d1d4f9',
];

export const ProfileImageUpload: React.FC<ProfileImageUploadProps> = ({
  currentImageUrl,
  onImageChange,
  onClose
}) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      onImageChange(publicUrl);
      toast({
        title: "Image uploaded",
        description: "Your profile image has been updated successfully."
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload the image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const selectPresetAvatar = (avatarUrl: string) => {
    setSelectedPreset(avatarUrl);
    onImageChange(avatarUrl);
    toast({
      title: "Avatar selected",
      description: "Your profile picture has been updated."
    });
  };

  const removeImage = async () => {
    if (!currentImageUrl || !user) return;

    try {
      // Only try to remove from storage if it's not a preset avatar
      if (!PRESET_AVATARS.includes(currentImageUrl)) {
        // Extract file path from URL
        const urlParts = currentImageUrl.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const filePath = `${user.id}/${fileName}`;

        const { error } = await supabase.storage
          .from('avatars')
          .remove([filePath]);

        if (error) {
          toast({
            title: "Error removing image",
            description: error.message,
            variant: "destructive"
          });
          return;
        }
      }

      onImageChange('');
      setSelectedPreset(null);
      toast({
        title: "Image removed",
        description: "Your profile image has been removed successfully."
      });
    } catch (error) {
      toast({
        title: "Error removing image",
        description: "Failed to remove the image. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Change Profile Picture</h3>
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Preset Avatars */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground">Choose from presets</h4>
        <div className="grid grid-cols-4 gap-3">
          {PRESET_AVATARS.map((avatarUrl, index) => (
            <button
              key={index}
              onClick={() => selectPresetAvatar(avatarUrl)}
              className={`relative rounded-full p-1 transition-all hover:scale-105 ${
                selectedPreset === avatarUrl || currentImageUrl === avatarUrl
                  ? 'ring-2 ring-primary bg-primary/10'
                  : 'hover:ring-2 hover:ring-muted-foreground/50'
              }`}
            >
              <Avatar className="h-12 w-12">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback>
                  <User className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
            </button>
          ))}
        </div>
      </div>

      {/* Upload Options */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground">Or upload your own</h4>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            {uploading ? 'Uploading...' : 'Upload Image'}
          </Button>

          {currentImageUrl && (
            <Button
              onClick={removeImage}
              variant="outline"
              className="flex items-center gap-2 text-destructive hover:text-destructive"
            >
              <X className="h-4 w-4" />
              Remove Image
            </Button>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={uploadImage}
        className="hidden"
      />
    </div>
  );
};
