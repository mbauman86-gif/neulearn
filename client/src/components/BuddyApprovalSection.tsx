import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Users, Check, X, Shield, Clock, UserPlus } from "lucide-react";
import { AvatarRenderer } from "./AvatarRenderer";
import { defaultAvatarTraits } from "@shared/schema";
import type { AvatarTraits } from "@shared/schema";

interface BuddyRequest {
  id: string;
  requesterId: string;
  receiverId: string;
  status: string;
  requesterApproved: boolean;
  receiverApproved: boolean;
  createdAt: string;
  requester: {
    id: string;
    name: string;
    username: string;
    avatarTraits: AvatarTraits | null;
  };
  receiver: {
    id: string;
    name: string;
    username: string;
    avatarTraits: AvatarTraits | null;
  };
  myChildRole: "requester" | "receiver";
  myChildId: string;
  myChildName: string;
}

function getAvatarTraits(child: { avatarTraits: AvatarTraits | null }): AvatarTraits {
  if (child.avatarTraits && typeof child.avatarTraits === 'object') {
    return child.avatarTraits;
  }
  return defaultAvatarTraits;
}

export function BuddyApprovalSection() {
  const { toast } = useToast();

  const { data: pendingRequests = [], isLoading } = useQuery<BuddyRequest[]>({
    queryKey: ['/api/parent/social/buddy-requests'],
  });

  const approveMutation = useMutation({
    mutationFn: async (buddyLinkId: string) => {
      const res = await apiRequest("POST", `/api/parent/social/buddy-requests/${buddyLinkId}/approve`);
      return res.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/parent/social/buddy-requests'] });
      toast({
        title: "Request Approved",
        description: "The buddy request has been approved.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Could not approve the request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const declineMutation = useMutation({
    mutationFn: async (buddyLinkId: string) => {
      const res = await apiRequest("POST", `/api/parent/social/buddy-requests/${buddyLinkId}/decline`);
      return res.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/parent/social/buddy-requests'] });
      toast({
        title: "Request Declined",
        description: "The buddy request has been declined.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Could not decline the request. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return null;
  }

  if (pendingRequests.length === 0) {
    return null;
  }

  return (
    <Card className="mb-8" data-testid="buddy-approval-section">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-[var(--neulearn-teal)]" />
          Buddy Requests Needing Approval
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Review and approve buddy connections for your children. Both families must approve before children can become buddies.
        </p>
        <div className="space-y-4">
          {pendingRequests.map((request) => {
            const otherChild = request.myChildRole === "requester" 
              ? request.receiver 
              : request.requester;
            
            const waitingForOther = request.myChildRole === "requester" 
              ? !request.receiverApproved 
              : !request.requesterApproved;
            
            const needsMyApproval = request.myChildRole === "requester"
              ? !request.requesterApproved
              : !request.receiverApproved;

            return (
              <div 
                key={request.id} 
                className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg"
                data-testid={`buddy-request-${request.id}`}
              >
                <AvatarRenderer traits={getAvatarTraits(otherChild)} size={56} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-lg">{otherChild.name}</p>
                  <p className="text-sm text-muted-foreground">@{otherChild.username}</p>
                  <div className="flex flex-col gap-1 mt-2">
                    <div className="flex items-center gap-1 text-sm">
                      <UserPlus className="w-3.5 h-3.5 text-[var(--neulearn-teal)]" />
                      <span className="font-medium">
                        {request.myChildRole === "requester" 
                          ? `Your child ${request.myChildName} wants to be buddies`
                          : `${otherChild.name} wants to be buddies with your child ${request.myChildName}`
                        }
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground pl-5">
                      Buddies can see each other's learning achievements and send encouraging reactions (no messaging).
                    </p>
                  </div>
                </div>

                {needsMyApproval ? (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => declineMutation.mutate(request.id)}
                      disabled={declineMutation.isPending}
                      data-testid={`button-decline-${request.id}`}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Decline
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => approveMutation.mutate(request.id)}
                      disabled={approveMutation.isPending}
                      data-testid={`button-approve-${request.id}`}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                  </div>
                ) : waitingForOther ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>Waiting for other family</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <Check className="w-4 h-4" />
                    <span>Approved</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
