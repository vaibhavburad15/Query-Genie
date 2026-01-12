import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useChatSession } from '@/hooks/useChatSession';
import { useToast } from '@/hooks/use-toast';

const UserProfile = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { deleteAllChats } = useChatSession();
  const { toast } = useToast();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-24 rounded bg-brand-100 hover:bg-brand-200 transition-colors flex items-center justify-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <DropdownMenuItem 
              onClick={(e) => e.preventDefault()}
              className="cursor-pointer flex items-center"
            >
              <Trash2 className="mr-2 h-4 w-4 text-destructive" />
              <span className="text-destructive">Delete All Chats</span>
            </DropdownMenuItem>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete All Chat History</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete all your chat sessions and messages.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteAllChats} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="flex items-center">
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserProfile;
