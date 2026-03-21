"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, CreditCard, Volume2, Mic } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [fullName, setFullName] = useState("");

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-heading text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and preferences.
        </p>
      </div>

      {/* Profile */}
      <Card className="bg-card border-gold/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5 text-gold" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              className="bg-surface border-gold/10"
            />
          </div>
          <Button
            onClick={() => toast.success("Profile updated")}
            className="bg-gold text-navy hover:bg-gold/90"
          >
            Save Changes
          </Button>
        </CardContent>
      </Card>

      {/* Subscription */}
      <Card className="bg-card border-gold/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="h-5 w-5 text-gold" />
            Subscription
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Current Plan</p>
              <p className="text-sm text-muted-foreground">
                Manage your subscription
              </p>
            </div>
            <Badge className="bg-gold/10 text-gold border-gold/20">Free</Badge>
          </div>
          <Separator className="bg-gold/10" />
          <Button
            variant="outline"
            className="border-gold/20 text-foreground hover:bg-gold/10"
          >
            Upgrade Plan
          </Button>
        </CardContent>
      </Card>

      {/* Voice preferences */}
      <Card className="bg-card border-gold/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Volume2 className="h-5 w-5 text-gold" />
            Voice Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Microphone</p>
              <p className="text-sm text-muted-foreground">
                Select your input device
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Mic className="h-4 w-4 text-success" />
              <span className="text-sm text-success">Connected</span>
            </div>
          </div>
          <Separator className="bg-gold/10" />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Auto-Detect Silence</p>
              <p className="text-sm text-muted-foreground">
                Automatically stop listening after 2s of silence
              </p>
            </div>
            <Badge variant="outline" className="border-gold/20 text-gold">
              Enabled
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
