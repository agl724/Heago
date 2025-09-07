import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ProfileImageUpload } from './ProfileImageUpload';
import { EditProfile } from './EditProfile';
import { User, Camera } from 'lucide-react';
import { format } from 'date-fns';

interface Player {
  level: number;
  xp: number;
  hp: number;
  gold: number;
}

interface ProfilePopoverProps {
  player: Player;
}

export function ProfilePopover({ player }: ProfilePopoverProps) {
  const { user, signOut } = useAuth();
  const { profile, updateProfile } = useProfile();
  const [showImageUpload, setShowImageUpload] = useState(false);

  if (!user) return null;

  const displayName = profile?.username || user.email?.split('@')[0] || 'User';
  const avatarUrl = profile?.avatar_url || '';
  const joinedDate = user.created_at ? new Date(user.created_at) : new Date();
  const daysSinceJoined = Math.floor((Date.now() - joinedDate.getTime()) / (1000 * 60 * 60 * 24));
  const userInitials = displayName.substring(0, 2).toUpperCase() || 'U';

  const handleImageChange = (url: string) => {
    updateProfile({ avatar_url: url });
    setShowImageUpload(false);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-2 p-2 rounded-xl bg-muted hover:bg-muted/80 transition-colors">
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <User className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          {showImageUpload ? (
            <ProfileImageUpload
              currentImageUrl={avatarUrl}
              onImageChange={handleImageChange}
              onClose={() => setShowImageUpload(false)}
            />
          ) : (
            <>
              {/* User Info Header */}
              <div className="flex items-center gap-3 pb-3 border-b border-border">
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    onClick={() => setShowImageUpload(true)}
                    className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary hover:bg-primary/80 rounded-full flex items-center justify-center transition-colors"
                    title="Change profile image"
                  >
                    <Camera className="h-3 w-3 text-primary-foreground" />
                  </button>
                </div>
                <div className="min-w-0">
                  <div className="font-semibold truncate">
                    {displayName}
                  </div>
                  <div className="text-sm text-muted-foreground truncate">
                    {user.email}
                  </div>
                  {profile?.phone && (
                    <div className="text-xs text-muted-foreground truncate">
                      {profile.phone}
                    </div>
                  )}
                </div>
              </div>

              {/* Edit Profile Button */}
              <div className="pb-3 border-b border-border">
                <EditProfile>
                  <Button variant="outline" size="sm" className="w-full">
                    Edit Profile
                  </Button>
                </EditProfile>
              </div>

          {/* Game Stats */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Game Progress</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="text-lg font-bold text-primary">LV {player.level}</div>
                <div className="text-xs text-muted-foreground">Current Level</div>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="text-lg font-bold text-yellow-500">{player.gold}</div>
                <div className="text-xs text-muted-foreground">Gold Earned</div>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="text-lg font-bold text-green-500">{player.hp}</div>
                <div className="text-xs text-muted-foreground">Health Points</div>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="text-lg font-bold text-blue-500">{player.xp}</div>
                <div className="text-xs text-muted-foreground">Total XP</div>
              </div>
            </div>
          </div>

          {/* Account Info */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Account Info</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Joined:</span>
                <span>{format(joinedDate, 'MMM dd, yyyy')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Days Active:</span>
                <span>{daysSinceJoined} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Account Type:</span>
                <span className="capitalize">{user.app_metadata?.provider || 'Email'}</span>
              </div>
            </div>
          </div>

              {/* Sign Out Button */}
              <button 
                onClick={signOut}
                className="w-full p-2 rounded-lg bg-destructive hover:bg-destructive/90 text-destructive-foreground text-sm font-medium transition-colors"
              >
                Sign Out
              </button>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
