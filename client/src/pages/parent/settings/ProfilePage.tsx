import { User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProfilePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold mb-2">Parent Profile</h1>
        <p className="text-muted-foreground">
          Manage your account settings
        </p>
      </div>

      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-muted-foreground" />
          </div>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            Profile management is being developed.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">
          <p>You'll be able to:</p>
          <ul className="mt-2 space-y-1">
            <li>Update your email address</li>
            <li>Change your password</li>
            <li>Set notification preferences</li>
            <li>Manage account security</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
