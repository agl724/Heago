import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ProfileImageUpload } from './ProfileImageUpload';
import { Edit, User } from 'lucide-react';

interface EditProfileProps {
  children?: React.ReactNode;
}

export const EditProfile: React.FC<EditProfileProps> = ({ children }) => {
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    username: profile?.username || '',
    phone: profile?.phone || '',
  });
  const [showImageUpload, setShowImageUpload] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
            const updates = {
              username: formData.username || null,
              phone: formData.phone || null,
            };

    const { error } = await updateProfile(updates);
    if (!error) {
      setOpen(false);
    }
  };

  const handleImageChange = (url: string) => {
    updateProfile({ avatar_url: url });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Profile Picture Section */}
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile?.avatar_url || ''} />
              <AvatarFallback className="text-lg">
                <User className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            
            {showImageUpload ? (
              <div className="w-full">
                <ProfileImageUpload
                  currentImageUrl={profile?.avatar_url || ''}
                  onImageChange={handleImageChange}
                  onClose={() => setShowImageUpload(false)}
                />
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowImageUpload(true)}
              >
                Change Picture
              </Button>
            )}
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ''}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Email cannot be changed here
              </p>
            </div>

            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                placeholder="Enter your username"
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Enter your phone number"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
