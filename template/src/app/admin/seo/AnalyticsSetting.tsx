"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/src/ui/card";
import { Input } from "@/src/ui/input";
import { Label } from "@/src/ui/label";
import { Button } from "@/src/ui/button";
import { Badge } from "@/src/ui/badge";
import { Textarea } from "@/src/ui/textarea";
import { Container, BarChart3, Facebook, BadgeDollarSign } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/src/ui/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/src/lib/axios";

export default function AnalyticsSettingsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [form, setForm] = useState({
    gtmId: "",
    gtmHeadScript: "",
    gtmBodyScript: "",

    gaMeasurementId: "",
    gaHeadScript: "",

    facebookPixelId: "",
    facebookHeadScript: "",

    googleAdsId: "",
    googleAdsHeadScript: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["analytics-settings"],
    queryFn: async () => {
      const res = await api.get("/api/analytics");
      return res.data.data;
    },
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (!data) return;

    setForm({
      gtmId: data.gtmId || "",
      gtmHeadScript: data.gtmHeadScript || "",
      gtmBodyScript: data.gtmBodyScript || "",

      gaMeasurementId: data.gaMeasurementId || "",
      gaHeadScript: data.gaHeadScript || "",

      facebookPixelId: data.facebookPixelId || "",
      facebookHeadScript: data.facebookHeadScript || "",

      googleAdsId: data.googleAdsId || "",
      googleAdsHeadScript: data.googleAdsHeadScript || "",
    });
  }, [data]);
  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await api.put("/api/analytics", form);
      return res.data;
    },

    onSuccess() {
      toast({
        title: "Success",
        description: "Analytics settings updated.",
      });

      queryClient.invalidateQueries({
        queryKey: ["analytics-settings"],
      });
    },

    onError(error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  return (
    <div className="space-y-6 p-11">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Analytics & Tracking</h1>
        <p className="text-muted-foreground mt-1">
          Configure analytics and advertising integrations used across your
          website.
        </p>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-100">
        <p className="font-semibold">How it works</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <strong>Recommended:</strong> Enter only the tracking ID such as
            GTM-ABC1234, G-ABCD123456, 123456789012345, or AW-123456789. The CMS
            will generate the code for you.
          </li>
          <li>
            <strong>Advanced:</strong> If you already have the full tracking
            code from Google or Meta, paste it into the script box.
          </li>
          <li>
            <strong>Priority:</strong> If custom scripts are provided, they will
            be used instead of the automatically generated ones.
          </li>
        </ul>
      </div>

      {/* Google Tag Manager */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Container className="h-5 w-5" />
              Google Tag Manager
            </CardTitle>
            <CardDescription>Configure Google Tag Manager.</CardDescription>
          </div>

          <Badge variant="secondary">Not Configured</Badge>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Container ID</Label>
            <Input
              placeholder="GTM-XXXXXXX"
              value={form.gtmId}
              onChange={(e) => setForm({ ...form, gtmId: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Head Script</Label>
            <Textarea
              value={form.gtmHeadScript}
              onChange={(e) =>
                setForm({ ...form, gtmHeadScript: e.target.value })
              }
              placeholder="Paste your head script here..."
              className="font-mono text-sm"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Body Script</Label>
            <Textarea
              value={form.gtmBodyScript}
              onChange={(e) =>
                setForm({ ...form, gtmBodyScript: e.target.value })
              }
              placeholder="Paste your body script here..."
              className="font-mono text-sm"
              rows={4}
            />
          </div>

          <div className="rounded-md border bg-muted/50 p-3 text-sm text-muted-foreground space-y-3">
            <div>
              <p className="font-semibold text-foreground">What to enter</p>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                <li>
                  <strong>Recommended:</strong> Enter only your Container ID,
                  for example <code>GTM-ABC1234</code>.
                </li>
                <li>
                  <strong>Advanced:</strong> Paste the full Head and Body
                  scripts if Google Tag Manager gave them to you.
                </li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-foreground">Example</p>
              <p className="mt-1">
                Container ID: <code>GTM-ABC1234</code>
              </p>
              <p>
                Head script: <code>{"<script>...</script>"}</code> (optional)
              </p>
              <p>
                Body script: <code>{"<noscript>...</noscript>"}</code>{" "}
                (optional)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Google Analytics 4 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Google Analytics 4
            </CardTitle>
            <CardDescription>Configure Google Analytics.</CardDescription>
          </div>

          <Badge variant="secondary">Not Configured</Badge>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Measurement ID</Label>
            <Input
              placeholder="G-XXXXXXXXXX"
              value={form.gaMeasurementId}
              onChange={(e) =>
                setForm({ ...form, gaMeasurementId: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Head Script</Label>
            <Textarea
              value={form.gaHeadScript}
              onChange={(e) =>
                setForm({ ...form, gaHeadScript: e.target.value })
              }
              placeholder="Paste your head script here..."
              className="font-mono text-sm"
              rows={4}
            />
          </div>

          <div className="rounded-md border bg-muted/50 p-3 text-sm text-muted-foreground space-y-3">
            <div>
              <p className="font-semibold text-foreground">What to enter</p>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                <li>
                  <strong>Recommended:</strong> Enter only your Measurement ID,
                  for example <code>G-ABCD123456</code>.
                </li>
                <li>
                  <strong>Advanced:</strong> Paste the full tracking code if you
                  already copied it from Google Analytics.
                </li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-foreground">Example</p>
              <p className="mt-1">
                Measurement ID: <code>G-ABCD123456</code>
              </p>
              <p>
                Head script:{" "}
                <code>
                  {
                    '<script async src="https://www.googletagmanager.com/gtag/js?id=G-ABCD123456"></script>'
                  }
                </code>{" "}
                (optional)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Facebook Pixel */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Facebook className="h-5 w-5" />
              Facebook Pixel
            </CardTitle>

            <CardDescription>Configure Facebook Pixel.</CardDescription>
          </div>

          <Badge variant="secondary">Not Configured</Badge>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Pixel ID</Label>
            <Input
              value={form.facebookPixelId}
              onChange={(e) =>
                setForm({ ...form, facebookPixelId: e.target.value })
              }
              placeholder="123456789012345"
            />
          </div>

          <div className="space-y-2">
            <Label>Head Script</Label>
            <Textarea
              value={form.facebookHeadScript}
              onChange={(e) =>
                setForm({ ...form, facebookHeadScript: e.target.value })
              }
              placeholder="Paste your head script here..."
              className="font-mono text-sm"
              rows={4}
            />
          </div>

          <div className="rounded-md border bg-muted/50 p-3 text-sm text-muted-foreground space-y-3">
            <div>
              <p className="font-semibold text-foreground">What to enter</p>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                <li>
                  <strong>Recommended:</strong> Enter only your Pixel ID, for
                  example <code>123456789012345</code>.
                </li>
                <li>
                  <strong>Advanced:</strong> Paste the full Meta Pixel code if
                  you already have it.
                </li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-foreground">Example</p>
              <p className="mt-1">
                Pixel ID: <code>123456789012345</code>
              </p>
              <p>
                Head script: <code>{"<script>...</script>"}</code> (optional)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Google Ads */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <BadgeDollarSign className="h-5 w-5" />
              Google Ads
            </CardTitle>

            <CardDescription>Configure Google Ads.</CardDescription>
          </div>

          <Badge variant="secondary">Not Configured</Badge>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Conversion ID</Label>
            <Input
              placeholder="AW-XXXXXXXXX"
              value={form.googleAdsId}
              onChange={(e) =>
                setForm({ ...form, googleAdsId: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Head Script</Label>
            <Textarea
              value={form.googleAdsHeadScript}
              onChange={(e) =>
                setForm({ ...form, googleAdsHeadScript: e.target.value })
              }
              placeholder="Paste your head script here..."
              className="font-mono text-sm"
              rows={4}
            />
          </div>

          <div className="rounded-md border bg-muted/50 p-3 text-sm text-muted-foreground space-y-3">
            <div>
              <p className="font-semibold text-foreground">What to enter</p>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                <li>
                  <strong>Recommended:</strong> Enter only your Conversion ID,
                  for example <code>AW-123456789</code>.
                </li>
                <li>
                  <strong>Advanced:</strong> Paste the full Google Ads tag code
                  if you already have it.
                </li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-foreground">Example</p>
              <p className="mt-1">
                Conversion ID: <code>AW-123456789</code>
              </p>
              <p>
                Head script:{" "}
                <code>
                  {
                    '<script async src="https://www.googletagmanager.com/gtag/js?id=AW-123456789"></script>'
                  }
                </code>{" "}
                (optional)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline">Cancel</Button>
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>{" "}
      </div>
    </div>
  );
}
