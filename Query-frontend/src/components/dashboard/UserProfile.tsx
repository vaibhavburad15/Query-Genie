import { Button } from '@/components/ui/button';
import { Trash2, User, LogOut } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useChatSession } from '@/hooks/useChatSession';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import ProfileModal from './ProfileModal';

const UserProfile = () => {
  const { user, logout } = useAuth();
  const { deleteAllChats } = useChatSession();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const handleDeleteAllChats = async () => {
    try {
      await deleteAllChats();
      toast({
        title: "Chat History Deleted",
        description: "All chat sessions have been deleted.",
      });
    } catch (error) {
      toast({
        title: "Error deleting chat history",
        description: "Could not delete chat history. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = () => {
    logout();
    navigate('/auth');
  };

  if (!user) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 bg-white border-gray-200 hover:bg-gray-50 shadow-sm"
          >
            <User className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">
              {user.firstName} {user.lastName}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => setIsProfileModalOpen(true)}>
            <User className="h-4 w-4 mr-2" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        userId={user.id}
      />
    </>
  );
};

export default UserProfile;