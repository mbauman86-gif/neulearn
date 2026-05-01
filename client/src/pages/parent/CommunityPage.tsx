import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Users, Search, UserPlus, MessageSquare, MapPin, Sparkles, GraduationCap, Heart, Globe, Lock, ChevronRight, Plus, ThumbsUp, Send, X, Check, Clock, Settings } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", 
  "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", 
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", 
  "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", 
  "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", 
  "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", 
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", 
  "Wisconsin", "Wyoming"
];

const HOMESCHOOL_STYLES = [
  "Classical", "Charlotte Mason", "Montessori", "Waldorf", "Unschooling", 
  "Traditional", "Eclectic", "Unit Studies", "Online/Virtual"
];

const INTERESTS = [
  "Bible Study", "Nature/Outdoor", "Science Experiments", "Arts & Crafts", 
  "Music", "Sports", "Field Trips", "Co-ops", "Book Clubs", "STEM"
];

interface ParentProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string | null;
  bio: string | null;
  city: string | null;
  state: string | null;
  homeschoolStyle: string | null;
  yearsHomeschooling: number | null;
  childAgeRanges: string[];
  interests: string[];
  showLocation: boolean;
  showInDiscovery: boolean;
  allowConnectionRequests: boolean;
  isComplete: boolean;
  createdAt: string;
}

interface CommunityGroup {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  groupType: string;
  city: string | null;
  state: string | null;
  topics: string[];
  memberCount: number;
  postCount: number;
  isPrivate: boolean;
  requiresApproval: boolean;
}

interface GroupMembership {
  id: string;
  groupId: string;
  userId: string;
  role: string;
  status: string;
}

interface ParentConnection {
  id: string;
  requesterId: string;
  receiverId: string;
  status: string;
  message: string | null;
  profile: ParentProfile;
}

export default function CommunityPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("discover");
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<CommunityGroup | null>(null);
  const [searchState, setSearchState] = useState("");

  const { data: profileData, isLoading: profileLoading } = useQuery<{ profile: ParentProfile | null }>({
    queryKey: ["/api/community/profile"],
  });

  const discoverUrl = searchState ? `/api/community/discover?state=${encodeURIComponent(searchState)}` : "/api/community/discover";
  const { data: familiesData, isLoading: familiesLoading } = useQuery<{ families: Array<ParentProfile & { childCount: number }> }>({
    queryKey: [discoverUrl],
    enabled: !!profileData?.profile?.isComplete,
  });

  const { data: myGroupsData } = useQuery<{ groups: Array<CommunityGroup & { membership: GroupMembership }> }>({
    queryKey: ["/api/community/my-groups"],
  });

  const groupsUrl = searchState ? `/api/community/groups?state=${encodeURIComponent(searchState)}` : "/api/community/groups";
  const { data: groupsData } = useQuery<{ groups: CommunityGroup[] }>({
    queryKey: [groupsUrl],
    enabled: activeTab === "groups",
  });

  const { data: connectionsData } = useQuery<{ connections: ParentConnection[] }>({
    queryKey: ["/api/community/connections?status=ACTIVE"],
    enabled: activeTab === "connections",
  });

  const { data: pendingRequestsData } = useQuery<{ requests: Array<ParentConnection & { requester: ParentProfile }> }>({
    queryKey: ["/api/community/connections/pending"],
    enabled: activeTab === "connections",
  });

  const profile = profileData?.profile;
  const needsProfileSetup = !profileLoading && (!profile || !profile.isComplete);

  if (profileLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="h-4 bg-muted rounded w-72" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-semibold mb-2" data-testid="text-community-title">Community</h1>
          <p className="text-muted-foreground">
            Connect with other Neulearn homeschool families
          </p>
        </div>
        <div className="flex gap-2">
          {profile && (
            <Button 
              variant="outline" 
              onClick={() => setShowProfileSetup(true)}
              data-testid="button-edit-profile"
            >
              <Settings className="w-4 h-4 mr-2" />
              My Profile
            </Button>
          )}
        </div>
      </div>

      {needsProfileSetup ? (
        <ProfileSetupCard onComplete={() => setShowProfileSetup(false)} profile={profile} />
      ) : (
        <>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="discover" data-testid="tab-discover">
                <Search className="w-4 h-4 mr-2" />
                Discover
              </TabsTrigger>
              <TabsTrigger value="groups" data-testid="tab-groups">
                <Users className="w-4 h-4 mr-2" />
                Groups
              </TabsTrigger>
              <TabsTrigger value="connections" data-testid="tab-connections">
                <UserPlus className="w-4 h-4 mr-2" />
                Connections
              </TabsTrigger>
            </TabsList>

            <TabsContent value="discover" className="space-y-6">
              <DiscoverTab 
                families={familiesData?.families || []}
                isLoading={familiesLoading}
                searchState={searchState}
                setSearchState={setSearchState}
                myProfile={profile!}
              />
            </TabsContent>

            <TabsContent value="groups" className="space-y-6">
              <GroupsTab 
                myGroups={myGroupsData?.groups || []}
                allGroups={groupsData?.groups || []}
                onCreateGroup={() => setShowCreateGroup(true)}
                onSelectGroup={setSelectedGroup}
                searchState={searchState}
                setSearchState={setSearchState}
              />
            </TabsContent>

            <TabsContent value="connections" className="space-y-6">
              <ConnectionsTab 
                connections={connectionsData?.connections || []}
                pendingRequests={pendingRequestsData?.requests || []}
              />
            </TabsContent>
          </Tabs>

          <ProfileSetupDialog 
            open={showProfileSetup} 
            onOpenChange={setShowProfileSetup}
            profile={profile}
          />

          <CreateGroupDialog 
            open={showCreateGroup}
            onOpenChange={setShowCreateGroup}
          />

          <GroupDetailDialog
            group={selectedGroup}
            onClose={() => setSelectedGroup(null)}
          />
        </>
      )}
    </div>
  );
}

function ProfileSetupCard({ onComplete, profile }: { onComplete: () => void; profile: ParentProfile | null }) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: profile?.firstName || "",
    lastName: profile?.lastName || "",
    bio: profile?.bio || "",
    city: profile?.city || "",
    state: profile?.state || "",
    homeschoolStyle: profile?.homeschoolStyle || "",
    yearsHomeschooling: profile?.yearsHomeschooling || 1,
    interests: profile?.interests || [] as string[],
    showLocation: profile?.showLocation ?? true,
    showInDiscovery: profile?.showInDiscovery ?? true,
    allowConnectionRequests: profile?.allowConnectionRequests ?? true,
  });

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/community/profile", { ...data, isComplete: true });
      return res.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/community/profile"] });
      await queryClient.refetchQueries({ queryKey: ["/api/community/profile"] });
      toast({ title: "Profile saved!", description: "You can now discover other families." });
      onComplete();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save profile", variant: "destructive" });
    }
  });

  const handleInterestToggle = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Set Up Your Community Profile
        </CardTitle>
        <CardDescription>
          Share a bit about your family to connect with other homeschoolers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input 
                  id="firstName"
                  value={formData.firstName}
                  onChange={e => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="Your first name"
                  data-testid="input-first-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input 
                  id="lastName"
                  value={formData.lastName}
                  onChange={e => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Optional"
                  data-testid="input-last-name"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">About Your Family</Label>
              <Textarea 
                id="bio"
                value={formData.bio}
                onChange={e => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Tell other families about your homeschool journey..."
                rows={3}
                data-testid="input-bio"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Select 
                  value={formData.state} 
                  onValueChange={v => setFormData(prev => ({ ...prev, state: v }))}
                >
                  <SelectTrigger data-testid="select-state">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map(state => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input 
                  id="city"
                  value={formData.city}
                  onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="Your city"
                  data-testid="input-city"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="style">Homeschool Style</Label>
                <Select 
                  value={formData.homeschoolStyle} 
                  onValueChange={v => setFormData(prev => ({ ...prev, homeschoolStyle: v }))}
                >
                  <SelectTrigger data-testid="select-style">
                    <SelectValue placeholder="Select style" />
                  </SelectTrigger>
                  <SelectContent>
                    {HOMESCHOOL_STYLES.map(style => (
                      <SelectItem key={style} value={style}>{style}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="years">Years Homeschooling</Label>
                <Select 
                  value={String(formData.yearsHomeschooling)} 
                  onValueChange={v => setFormData(prev => ({ ...prev, yearsHomeschooling: parseInt(v) }))}
                >
                  <SelectTrigger data-testid="select-years">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5,6,7,8,9,10].map(y => (
                      <SelectItem key={y} value={String(y)}>{y}+ years</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <Label>Interests (select all that apply)</Label>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map(interest => (
                <Badge 
                  key={interest}
                  variant={formData.interests.includes(interest) ? "default" : "outline"}
                  className="cursor-pointer toggle-elevate"
                  onClick={() => handleInterestToggle(interest)}
                  data-testid={`badge-interest-${interest.toLowerCase().replace(/[^a-z]/g, '-')}`}
                >
                  {interest}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <Label className="text-base font-medium">Privacy Settings</Label>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="showLocation">Show my location</Label>
                  <p className="text-sm text-muted-foreground">Allow others to see your city and state</p>
                </div>
                <Switch 
                  id="showLocation"
                  checked={formData.showLocation}
                  onCheckedChange={c => setFormData(prev => ({ ...prev, showLocation: c }))}
                  data-testid="switch-show-location"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="showInDiscovery">Appear in discovery</Label>
                  <p className="text-sm text-muted-foreground">Let other families find you</p>
                </div>
                <Switch 
                  id="showInDiscovery"
                  checked={formData.showInDiscovery}
                  onCheckedChange={c => setFormData(prev => ({ ...prev, showInDiscovery: c }))}
                  data-testid="switch-show-discovery"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="allowConnections">Allow connection requests</Label>
                  <p className="text-sm text-muted-foreground">Others can request to connect with you</p>
                </div>
                <Switch 
                  id="allowConnections"
                  checked={formData.allowConnectionRequests}
                  onCheckedChange={c => setFormData(prev => ({ ...prev, allowConnectionRequests: c }))}
                  data-testid="switch-allow-connections"
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={() => setStep(s => s - 1)}
          disabled={step === 1}
          data-testid="button-profile-back"
        >
          Back
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Step {step} of 4</span>
          {step < 4 ? (
            <Button 
              onClick={() => setStep(s => s + 1)}
              disabled={step === 1 && !formData.firstName}
              data-testid="button-profile-next"
            >
              Next
            </Button>
          ) : (
            <Button 
              onClick={() => mutation.mutate(formData)}
              disabled={mutation.isPending}
              data-testid="button-profile-save"
            >
              {mutation.isPending ? "Saving..." : "Complete Setup"}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

function ProfileSetupDialog({ open, onOpenChange, profile }: { open: boolean; onOpenChange: (o: boolean) => void; profile: ParentProfile | null }) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    firstName: profile?.firstName || "",
    lastName: profile?.lastName || "",
    bio: profile?.bio || "",
    city: profile?.city || "",
    state: profile?.state || "",
    homeschoolStyle: profile?.homeschoolStyle || "",
    yearsHomeschooling: profile?.yearsHomeschooling || 1,
    interests: profile?.interests || [] as string[],
    showLocation: profile?.showLocation ?? true,
    showInDiscovery: profile?.showInDiscovery ?? true,
    allowConnectionRequests: profile?.allowConnectionRequests ?? true,
  });

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/community/profile", { ...data, isComplete: true });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/profile"] });
      toast({ title: "Profile updated!" });
      onOpenChange(false);
    }
  });

  const handleInterestToggle = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Community Profile</DialogTitle>
          <DialogDescription>Update how you appear to other families</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>First Name</Label>
              <Input 
                value={formData.firstName}
                onChange={e => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                data-testid="dialog-input-first-name"
              />
            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input 
                value={formData.lastName}
                onChange={e => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                data-testid="dialog-input-last-name"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Bio</Label>
            <Textarea 
              value={formData.bio}
              onChange={e => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              rows={2}
              data-testid="dialog-input-bio"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>State</Label>
              <Select value={formData.state} onValueChange={v => setFormData(prev => ({ ...prev, state: v }))}>
                <SelectTrigger data-testid="dialog-select-state">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Input 
                value={formData.city}
                onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))}
                data-testid="dialog-input-city"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Homeschool Style</Label>
            <Select value={formData.homeschoolStyle} onValueChange={v => setFormData(prev => ({ ...prev, homeschoolStyle: v }))}>
              <SelectTrigger data-testid="dialog-select-style">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {HOMESCHOOL_STYLES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Interests</Label>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map(interest => (
                <Badge 
                  key={interest}
                  variant={formData.interests.includes(interest) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => handleInterestToggle(interest)}
                >
                  {interest}
                </Badge>
              ))}
            </div>
          </div>
          <Separator />
          <div className="space-y-3">
            <Label className="text-base font-medium">Privacy</Label>
            <div className="flex items-center justify-between">
              <Label className="font-normal">Show my location</Label>
              <Switch 
                checked={formData.showLocation}
                onCheckedChange={c => setFormData(prev => ({ ...prev, showLocation: c }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="font-normal">Appear in discovery</Label>
              <Switch 
                checked={formData.showInDiscovery}
                onCheckedChange={c => setFormData(prev => ({ ...prev, showInDiscovery: c }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="font-normal">Allow connections</Label>
              <Switch 
                checked={formData.allowConnectionRequests}
                onCheckedChange={c => setFormData(prev => ({ ...prev, allowConnectionRequests: c }))}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => mutation.mutate(formData)} disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DiscoverTab({ families, isLoading, searchState, setSearchState, myProfile }: { 
  families: Array<ParentProfile & { childCount: number }>; 
  isLoading: boolean;
  searchState: string;
  setSearchState: (s: string) => void;
  myProfile: ParentProfile;
}) {
  const { toast } = useToast();
  
  const connectMutation = useMutation({
    mutationFn: async (receiverId: string) => {
      const res = await apiRequest("POST", "/api/community/connections", { 
        receiverId, 
        connectionSource: "DISCOVERY" 
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Connection request sent!" });
      queryClient.invalidateQueries({ predicate: (query) => 
        (query.queryKey[0] as string)?.startsWith("/api/community/connections")
      });
    },
    onError: () => {
      toast({ title: "Failed to send request", variant: "destructive" });
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <Select value={searchState || "all"} onValueChange={(v) => setSearchState(v === "all" ? "" : v)}>
          <SelectTrigger className="w-48" data-testid="select-filter-state">
            <MapPin className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by state" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All States</SelectItem>
            {US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        {searchState && (
          <Button variant="ghost" size="sm" onClick={() => setSearchState("")}>
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : families.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchState 
                ? `No families found in ${searchState}. Try a different state!`
                : "No families to discover yet. Be the first in your area!"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {families.map(family => (
            <FamilyCard 
              key={family.id} 
              family={family} 
              onConnect={() => connectMutation.mutate(family.userId)}
              isConnecting={connectMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FamilyCard({ family, onConnect, isConnecting }: { 
  family: ParentProfile & { childCount: number }; 
  onConnect: () => void;
  isConnecting: boolean;
}) {
  const initials = `${family.firstName?.[0] || ''}${family.lastName?.[0] || ''}`.toUpperCase();
  
  return (
    <Card className="hover-elevate" data-testid={`card-family-${family.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="w-12 h-12">
            <AvatarFallback className="bg-primary/10 text-primary">{initials || "?"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate">
              {family.firstName} {family.lastName?.[0]}.
            </h3>
            {family.showLocation && family.city && family.state && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {family.city}, {family.state}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {family.homeschoolStyle && (
                <Badge variant="secondary" className="text-xs">
                  {family.homeschoolStyle}
                </Badge>
              )}
              {family.childCount > 0 && (
                <span className="text-xs text-muted-foreground">
                  {family.childCount} child{family.childCount !== 1 ? 'ren' : ''}
                </span>
              )}
            </div>
            {family.bio && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{family.bio}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button 
            size="sm" 
            className="flex-1" 
            onClick={onConnect}
            disabled={isConnecting || !family.allowConnectionRequests}
            data-testid={`button-connect-${family.id}`}
          >
            <UserPlus className="w-4 h-4 mr-1" />
            Connect
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function GroupsTab({ myGroups, allGroups, onCreateGroup, onSelectGroup, searchState, setSearchState }: {
  myGroups: Array<CommunityGroup & { membership: GroupMembership }>;
  allGroups: CommunityGroup[];
  onCreateGroup: () => void;
  onSelectGroup: (g: CommunityGroup) => void;
  searchState: string;
  setSearchState: (s: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Select value={searchState || "all"} onValueChange={(v) => setSearchState(v === "all" ? "" : v)}>
          <SelectTrigger className="w-48" data-testid="select-groups-state">
            <MapPin className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by state" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All States</SelectItem>
            {US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={onCreateGroup} data-testid="button-create-group">
          <Plus className="w-4 h-4 mr-2" />
          Create Group
        </Button>
      </div>

      {myGroups.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium text-lg">My Groups</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myGroups.map(group => (
              <GroupCard 
                key={group.id} 
                group={group} 
                isMember={true}
                onClick={() => onSelectGroup(group)}
              />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h3 className="font-medium text-lg">Discover Groups</h3>
        {allGroups.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Globe className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No groups found. Create one!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allGroups.filter(g => !myGroups.find(mg => mg.id === g.id)).map(group => (
              <GroupCard 
                key={group.id} 
                group={group} 
                isMember={false}
                onClick={() => onSelectGroup(group)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function GroupCard({ group, isMember, onClick }: { 
  group: CommunityGroup; 
  isMember: boolean;
  onClick: () => void;
}) {
  return (
    <Card 
      className="hover-elevate cursor-pointer" 
      onClick={onClick}
      data-testid={`card-group-${group.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium truncate">{group.name}</h3>
              {group.isPrivate && <Lock className="w-3 h-3 text-muted-foreground" />}
            </div>
            {(group.city || group.state) && (
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3" />
                {[group.city, group.state].filter(Boolean).join(", ")}
              </p>
            )}
          </div>
          {isMember && (
            <Badge variant="secondary" className="shrink-0">Member</Badge>
          )}
        </div>
        {group.description && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{group.description}</p>
        )}
        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {group.memberCount} members
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            {group.postCount} posts
          </span>
        </div>
        {group.topics && group.topics.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {group.topics.slice(0, 3).map(topic => (
              <Badge key={topic} variant="outline" className="text-xs">{topic}</Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CreateGroupDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    groupType: "VIRTUAL",
    state: "",
    city: "",
    topics: [] as string[],
    isPrivate: false,
    requiresApproval: true,
  });

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/community/groups", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (query) => 
        (query.queryKey[0] as string)?.startsWith("/api/community/groups") 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/community/my-groups"] });
      toast({ title: "Group created!" });
      onOpenChange(false);
      setFormData({ name: "", description: "", groupType: "VIRTUAL", state: "", city: "", topics: [], isPrivate: false, requiresApproval: true });
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a Group</DialogTitle>
          <DialogDescription>Start a community for homeschool families</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Group Name *</Label>
            <Input 
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Texas Charlotte Mason Families"
              data-testid="input-group-name"
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea 
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="What is this group about?"
              rows={2}
              data-testid="input-group-description"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={formData.groupType} onValueChange={v => setFormData(prev => ({ ...prev, groupType: v }))}>
                <SelectTrigger data-testid="select-group-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VIRTUAL">Virtual (Anywhere)</SelectItem>
                  <SelectItem value="LOCAL_CITY">Local (City)</SelectItem>
                  <SelectItem value="LOCAL_STATE">Statewide</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>State</Label>
              <Select value={formData.state} onValueChange={v => setFormData(prev => ({ ...prev, state: v }))}>
                <SelectTrigger data-testid="select-group-state">
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Private Group</Label>
              <p className="text-xs text-muted-foreground">Only visible to members</p>
            </div>
            <Switch 
              checked={formData.isPrivate}
              onCheckedChange={c => setFormData(prev => ({ ...prev, isPrivate: c }))}
              data-testid="switch-group-private"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Require Approval</Label>
              <p className="text-xs text-muted-foreground">Review join requests</p>
            </div>
            <Switch 
              checked={formData.requiresApproval}
              onCheckedChange={c => setFormData(prev => ({ ...prev, requiresApproval: c }))}
              data-testid="switch-group-approval"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            onClick={() => mutation.mutate(formData)} 
            disabled={!formData.name || mutation.isPending}
            data-testid="button-submit-group"
          >
            {mutation.isPending ? "Creating..." : "Create Group"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function GroupDetailDialog({ group, onClose }: { group: CommunityGroup | null; onClose: () => void }) {
  const { toast } = useToast();
  const [newPost, setNewPost] = useState({ title: "", content: "" });

  const { data: groupData } = useQuery<{ group: CommunityGroup; membership: GroupMembership | null; memberCount: number }>({
    queryKey: ["/api/community/groups", group?.id],
    enabled: !!group,
  });

  const { data: postsData } = useQuery<{ posts: any[] }>({
    queryKey: ["/api/community/groups", group?.id, "posts"],
    enabled: !!group && !!groupData?.membership,
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/community/groups/${group?.id}/join`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/groups", group?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/community/my-groups"] });
      toast({ title: "Joined group!" });
    }
  });

  const postMutation = useMutation({
    mutationFn: async (data: { title: string; content: string }) => {
      const res = await apiRequest("POST", `/api/community/groups/${group?.id}/posts`, {
        ...data,
        postType: "DISCUSSION"
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/groups", group?.id, "posts"] });
      setNewPost({ title: "", content: "" });
      toast({ title: "Post created!" });
    }
  });

  if (!group) return null;

  const isMember = groupData?.membership?.status === "ACTIVE";
  const isPending = groupData?.membership?.status === "PENDING";

  return (
    <Dialog open={!!group} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {group.name}
            {group.isPrivate && <Lock className="w-4 h-4 text-muted-foreground" />}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-3">
            {(group.city || group.state) && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {[group.city, group.state].filter(Boolean).join(", ")}
              </span>
            )}
            <span>{groupData?.memberCount || group.memberCount} members</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {group.description && (
            <p className="text-muted-foreground">{group.description}</p>
          )}

          {!isMember && !isPending && (
            <Button onClick={() => joinMutation.mutate()} disabled={joinMutation.isPending} className="w-full">
              {joinMutation.isPending ? "Joining..." : "Join Group"}
            </Button>
          )}

          {isPending && (
            <div className="bg-muted rounded-lg p-4 text-center">
              <Clock className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Your request is pending approval</p>
            </div>
          )}

          {isMember && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium">Start a Discussion</h4>
                <Input 
                  placeholder="Title (optional)"
                  value={newPost.title}
                  onChange={e => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                  data-testid="input-post-title"
                />
                <Textarea 
                  placeholder="What's on your mind?"
                  value={newPost.content}
                  onChange={e => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                  rows={2}
                  data-testid="input-post-content"
                />
                <Button 
                  size="sm" 
                  onClick={() => postMutation.mutate(newPost)}
                  disabled={!newPost.content || postMutation.isPending}
                  data-testid="button-submit-post"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Post
                </Button>
              </div>

              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium">Recent Posts</h4>
                {postsData?.posts?.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No posts yet. Start the conversation!</p>
                ) : (
                  <div className="space-y-3">
                    {postsData?.posts?.map((post: any) => (
                      <Card key={post.id}>
                        <CardContent className="p-3">
                          <div className="flex items-start gap-2">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="text-xs">
                                {post.author?.firstName?.[0] || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">
                                {post.author?.firstName} {post.author?.lastName?.[0]}.
                              </p>
                              {post.title && <p className="font-medium">{post.title}</p>}
                              <p className="text-sm">{post.content}</p>
                              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <ThumbsUp className="w-3 h-3" />
                                  {post.helpfulCount} helpful
                                </span>
                                <span className="flex items-center gap-1">
                                  <MessageSquare className="w-3 h-3" />
                                  {post.replyCount} replies
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ConnectionsTab({ connections, pendingRequests }: { 
  connections: ParentConnection[];
  pendingRequests: Array<ParentConnection & { requester: ParentProfile }>;
}) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedConnection, setSelectedConnection] = useState<ParentConnection | null>(null);
  const [messageInput, setMessageInput] = useState("");

  const connectionId = selectedConnection?.id;
  
  const { data: messagesData, refetch: refetchMessages } = useQuery<{ messages: Array<{
    id: string;
    connectionId: string;
    senderId: string;
    content: string;
    readAt: string | null;
    createdAt: string;
  }> }>({
    queryKey: ["/api/community/connections", connectionId, "messages"],
    queryFn: async () => {
      if (!connectionId) return { messages: [] };
      const res = await fetch(`/api/community/connections/${connectionId}/messages`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch messages');
      return res.json();
    },
    enabled: !!connectionId,
    refetchInterval: selectedConnection ? 5000 : false,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ connectionId, content }: { connectionId: string; content: string }) => {
      const res = await apiRequest("POST", `/api/community/connections/${connectionId}/messages`, { content });
      return res.json();
    },
    onSuccess: () => {
      setMessageInput("");
      queryClient.invalidateQueries({ queryKey: ["/api/community/connections", connectionId, "messages"] });
    },
    onError: () => {
      toast({ title: "Failed to send message", variant: "destructive" });
    }
  });

  const respondMutation = useMutation({
    mutationFn: async ({ connectionId, accept }: { connectionId: string; accept: boolean }) => {
      const res = await apiRequest("POST", `/api/community/connections/${connectionId}/respond`, { accept });
      return res.json();
    },
    onSuccess: (_, { accept }) => {
      queryClient.invalidateQueries({ predicate: (query) => 
        (query.queryKey[0] as string)?.startsWith("/api/community/connections")
      });
      toast({ title: accept ? "Connection accepted!" : "Request declined" });
    }
  });

  const handleSendMessage = () => {
    if (!selectedConnection || !messageInput.trim()) return;
    sendMessageMutation.mutate({ connectionId: selectedConnection.id, content: messageInput.trim() });
  };

  const messages = messagesData?.messages || [];

  return (
    <div className="space-y-6">
      <Dialog open={!!selectedConnection} onOpenChange={(open) => !open && setSelectedConnection(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Message {selectedConnection?.profile?.firstName || "Connection"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col h-80">
            <div className="flex-1 overflow-y-auto space-y-3 p-2 border rounded-md bg-muted/30">
              {messages.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-8">
                  No messages yet. Start the conversation!
                </p>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderId === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                        isMe ? 'bg-primary text-primary-foreground' : 'bg-card border'
                      }`}>
                        <p>{msg.content}</p>
                        <p className={`text-xs mt-1 ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="flex gap-2 mt-3">
              <Input
                placeholder="Type a message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                data-testid="input-message"
              />
              <Button 
                size="icon" 
                onClick={handleSendMessage}
                disabled={!messageInput.trim() || sendMessageMutation.isPending}
                data-testid="button-send-message"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {pendingRequests.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium text-lg flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Pending Requests ({pendingRequests.length})
          </h3>
          <div className="grid gap-3">
            {pendingRequests.map(request => (
              <Card key={request.id}>
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {request.requester?.firstName?.[0] || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {request.requester?.firstName} {request.requester?.lastName?.[0]}.
                      </p>
                      {request.requester?.city && request.requester?.state && (
                        <p className="text-sm text-muted-foreground">
                          {request.requester.city}, {request.requester.state}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => respondMutation.mutate({ connectionId: request.id, accept: false })}
                      disabled={respondMutation.isPending}
                      data-testid={`button-decline-${request.id}`}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => respondMutation.mutate({ connectionId: request.id, accept: true })}
                      disabled={respondMutation.isPending}
                      data-testid={`button-accept-${request.id}`}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Accept
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h3 className="font-medium text-lg flex items-center gap-2">
          <Heart className="w-5 h-5" />
          My Connections ({connections.length})
        </h3>
        {connections.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <UserPlus className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No connections yet. Discover families to connect!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {connections.map(conn => (
              <Card key={conn.id} data-testid={`card-connection-${conn.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {conn.profile?.firstName?.[0] || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {conn.profile?.firstName} {conn.profile?.lastName}
                      </p>
                      {conn.profile?.city && conn.profile?.state && (
                        <p className="text-sm text-muted-foreground">
                          {conn.profile.city}, {conn.profile.state}
                        </p>
                      )}
                    </div>
                    <Button 
                      size="icon" 
                      variant="ghost"
                      onClick={() => setSelectedConnection(conn)}
                      data-testid={`button-message-${conn.id}`}
                    >
                      <MessageSquare className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
