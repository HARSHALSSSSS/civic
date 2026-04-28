import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { HelpCircle, Book, FileText, MessageSquare, ExternalLink, Camera, MapPin, Mic } from "lucide-react";

export const HelpFAQ = () => {
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">Help & FAQ</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Everything you need to know about using Civiconnect
        </p>
      </div>

      <Card className="bg-gradient-subtle">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Book className="h-5 w-5 text-primary" />
            </div>
            Quick Start Guide
          </CardTitle>
          <CardDescription>
            Follow these simple steps to report a civic issue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold shrink-0">
                1
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Take a Photo
                </h3>
                <p className="text-sm text-muted-foreground">
                  Use your phone's camera to capture a clear photo of the issue. Good lighting and multiple angles help authorities understand the problem better.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold shrink-0">
                2
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Pin the Location
                </h3>
                <p className="text-sm text-muted-foreground">
                  Enable location services to automatically pin the issue on the map. You can also adjust the pin if the auto-detected location is slightly off.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold shrink-0">
                3
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Describe the Issue
                </h3>
                <p className="text-sm text-muted-foreground">
                  Provide a clear description of what you observed. Include details like how long the issue has existed and any safety concerns.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold shrink-0">
                4
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Submit & Track
                </h3>
                <p className="text-sm text-muted-foreground">
                  Submit your report and track its progress through the dashboard. You'll receive updates as the status changes.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <HelpCircle className="h-5 w-5 text-primary" />
            Frequently Asked Questions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>How long does it take for my report to be reviewed?</AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground mb-2">
                  Once submitted, your report is typically reviewed within 24-48 hours. Reports are prioritized based on the severity of the issue and public safety concerns.
                </p>
                <p className="text-muted-foreground">
                  You can track the status of your report by logging into your dashboard and viewing your submitted issues.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger>Can I report issues anonymously?</AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground mb-2">
                  Yes, you can choose to submit reports anonymously. However, creating an account allows you to track your submitted reports and receive updates.
                </p>
                <p className="text-muted-foreground">
                  Anonymous reports still contain location information to help authorities address the issue.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger>What categories of issues can I report?</AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground mb-2">
                  You can report various civic issues including:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li><strong>Pothole</strong> - Road damage and pavement issues</li>
                  <li><strong>Waste</strong> - Garbage, litter, and sanitation problems</li>
                  <li><strong>Street Light</strong> - Broken or flickering public lighting</li>
                  <li><strong>Water</strong> - Water supply, drainage, and flooding issues</li>
                  <li><strong>Traffic</strong> - Traffic signs, signals, and road markings</li>
                  <li><strong>Other</strong> - Any other civic infrastructure concerns</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger>How is my privacy protected?</AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">
                  Your personal information is protected and only shared with relevant government staff who need access to process your report. Location data is used solely to identify and address civic issues. You can review our full privacy policy for more details.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger>Can I attach multiple photos to one report?</AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">
                  Yes, you can attach up to 3 photos per report. Multiple photos from different angles help authorities better understand the issue and prioritize resources for resolution.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6">
              <AccordionTrigger>What happens after I submit a report?</AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground mb-2">
                  After submission, your report goes through the following stages:
                </p>
                <ol className="list-decimal list-inside text-muted-foreground space-y-1">
                  <li><strong>Submitted</strong> - Your report is received and queued for review</li>
                  <li><strong>Assigned</strong> - A staff member is assigned to handle your report</li>
                  <li><strong>In Progress</strong> - Work has begun to address the issue</li>
                  <li><strong>Resolved</strong> - The issue has been fixed</li>
                  <li><strong>Closed</strong> - Report is confirmed resolved and closed</li>
                </ol>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7">
              <AccordionTrigger>Is there a mobile app available?</AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground mb-2">
                  Civiconnect works seamlessly on mobile web browsers. For the best experience, you can add it to your home screen just like a native app.
                </p>
                <p className="text-muted-foreground">
                  A dedicated mobile app for iOS and Android is coming soon!
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-8">
              <AccordionTrigger>How can I escalate an unresolved issue?</AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">
                  If your report has been pending for an extended period, you can contact our support team through the dashboard. Provide your report ID and we'll investigate the status with the relevant department.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Additional Resources</CardTitle>
          <CardDescription>
            Links to external help and documentation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-between">
            <span className="flex items-center gap-2">
              <Book className="h-4 w-4" />
              User Manual
            </span>
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button variant="outline" className="w-full justify-between">
            <span className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Community Forum
            </span>
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button variant="outline" className="w-full justify-between">
            <span className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              API Documentation
            </span>
            <ExternalLink className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Still have questions?</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Our support team is here to help. Reach out to us anytime.
              </p>
              <Button variant="civic" size="sm">
                Contact Support
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
