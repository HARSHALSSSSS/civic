import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Camera,
  MapPin,
  Loader2,
  CheckCircle,
  Mic,
  Upload,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Shield,
  X,
} from "lucide-react";
import { mockAIService } from "@/services/mockData";
import { apiService } from "@/services/apiService";
import { Report } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { MapPicker } from "@/components/MapPicker";
import {
  REPORT_CATEGORIES,
  URGENCY_LEVELS,
  AFFECTED_AREAS,
  CONTACT_PREFERENCES,
  PRIORITY_LABELS,
  urgencyToPriority,
  getCategoryConfig,
} from "@/constants/categories";
import { transformBackendReport, extractCreatedReport } from "@/lib/reportUtils";
import { cn } from "@/lib/utils";

interface ReportIssueProps {
  userId: string;
  onReportSubmitted: (report: Report) => void;
}

const STEPS = ["Category", "Location", "Evidence", "Review"];

export const ReportIssue = ({ userId, onReportSubmitted }: ReportIssueProps) => {
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [urgencyLevel, setUrgencyLevel] = useState("medium");
  const [priority, setPriority] = useState(3);
  const [affectedArea, setAffectedArea] = useState("street");
  const [contactPreference, setContactPreference] = useState("app");
  const [isPublic, setIsPublic] = useState(true);
  const [landmark, setLandmark] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [location, setLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<{ category: string; priority: number; suggestedTitle?: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const selectedCategory = getCategoryConfig(category);

  const handleCategoryChange = (val: string) => {
    setCategory(val);
    setSubcategory("");
    const config = getCategoryConfig(val);
    if (config) {
      setPriority(config.defaultPriority as Report["priority"]);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 3 - photos.length;
    const toAdd = files.slice(0, remaining);
    if (toAdd.length === 0) {
      toast({ title: "Maximum 3 photos allowed", variant: "destructive" });
      return;
    }
    setPhotos((prev) => [...prev, ...toAdd]);
    toAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPhotoPreviews((prev) => [...prev, ev.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const getCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      if (navigator.geolocation) {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
        });
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLocation({ lat, lng, address: `GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}` });
        toast({ title: "Location captured", description: "You can fine-tune on the map below." });
      } else {
        throw new Error("Geolocation not supported");
      }
    } catch {
      setLocation({ lat: 28.6139, lng: 77.209, address: "Connaught Place, New Delhi (default)" });
      toast({ title: "Using default location", description: "Enable GPS or pin manually on map." });
    }
    setIsGettingLocation(false);
  };

  const analyzeWithAI = async () => {
    if (!description.trim()) return;
    setIsAnalyzing(true);
    try {
      const result = await mockAIService.categorizeReport(description, photoPreviews[0]);
      setAiResult(result);
      if (result.category) handleCategoryChange(result.category);
      if (result.suggestedTitle && !title) setTitle(result.suggestedTitle);
      if (result.priority) setPriority(result.priority as Report["priority"]);
    } catch {
      toast({ title: "AI analysis unavailable", variant: "destructive" });
    }
    setIsAnalyzing(false);
  };

  const startVoiceRecording = () => {
    const SpeechRecognition = (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognition }).webkitSpeechRecognition
      || (window as unknown as { SpeechRecognition?: new () => SpeechRecognition }).SpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    setIsListening(true);
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      setDescription((prev) => prev + (prev ? " " : "") + event.results[0][0].transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const canProceed = () => {
    if (step === 0) return title.trim().length >= 5 && description.trim().length >= 10 && category;
    if (step === 1) return !!location;
    if (step === 2) return true;
    return true;
  };

  const submitReport = async () => {
    if (!location || !category) return;
    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        category,
        subcategory: subcategory || undefined,
        priority: priority || urgencyToPriority(urgencyLevel),
        urgencyLevel,
        affectedArea,
        contactPreference,
        isPublic,
        longitude: location.lng,
        latitude: location.lat,
        address: location.address,
        landmark: landmark.trim() || undefined,
      };

      let response;
      if (photos.length > 0) {
        const formData = new FormData();
        Object.entries(payload).forEach(([key, val]) => {
          if (val !== undefined) formData.append(key, String(val));
        });
        photos.forEach((photo) => formData.append("photos", photo));
        response = await apiService.createReport(formData);
      } else {
        response = await apiService.createReportJson(payload);
      }

      if (response?.success === false) {
        throw new Error((response.message as string) || "Failed to submit report");
      }

      const reportData = extractCreatedReport(response as Record<string, unknown>);
      onReportSubmitted(transformBackendReport(reportData));
      toast({
        title: "Report submitted!",
        description: `Reference: ${(reportData.reportId as string) || "saved"}`,
      });
      setStep(0);
      setTitle("");
      setDescription("");
      setCategory("");
      setPhotos([]);
      setPhotoPreviews([]);
      setLocation(null);
      setAiResult(null);
    } catch (error: unknown) {
      toast({
        title: "Submission failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Report a Civic Issue</h1>
        <p className="text-muted-foreground">Help your city improve — report in under 2 minutes</p>
      </div>

      {/* Step indicator */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground px-1">
          {STEPS.map((s, i) => (
            <span key={s} className={cn(i <= step && "text-primary font-medium")}>{s}</span>
          ))}
        </div>
        <Progress value={((step + 1) / STEPS.length) * 100} className="h-1.5" />
      </div>

      <Card className="border-primary/10 shadow-civic">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {step === 0 && <><Sparkles className="h-5 w-5 text-primary" /> Issue Details</>}
            {step === 1 && <><MapPin className="h-5 w-5 text-primary" /> Location</>}
            {step === 2 && <><Camera className="h-5 w-5 text-primary" /> Photo Evidence</>}
            {step === 3 && <><CheckCircle className="h-5 w-5 text-primary" /> Review & Submit</>}
          </CardTitle>
          <CardDescription>
            {step === 0 && "Describe the issue and select the appropriate category"}
            {step === 1 && "Pin the exact location on the map"}
            {step === 2 && "Add up to 3 photos to help officials assess faster"}
            {step === 3 && "Verify details before submitting to the government portal"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Step 0: Details */}
          {step === 0 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="title">Issue Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g. Large pothole near school gate"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={200}
                />
              </div>

              <div className="space-y-2">
                <Label>Category *</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {REPORT_CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => handleCategoryChange(cat.value)}
                      className={cn(
                        "p-3 rounded-lg border text-left text-sm transition-all hover:border-primary/50",
                        category === cat.value
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border"
                      )}
                    >
                      <span className="text-lg">{cat.icon}</span>
                      <p className="font-medium mt-1 leading-tight">{cat.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {selectedCategory && selectedCategory.subcategories.length > 0 && (
                <div className="space-y-2">
                  <Label>Subcategory</Label>
                  <Select value={subcategory} onValueChange={setSubcategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select specific issue type" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedCategory.subcategories.map((sub) => (
                        <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="description">Description *</Label>
                  <Button variant="outline" size="sm" onClick={startVoiceRecording} disabled={isListening} className="ml-auto h-7">
                    {isListening ? <Loader2 className="h-3 w-3 animate-spin" /> : <Mic className="h-3 w-3" />}
                    <span className="ml-1">{isListening ? "Listening" : "Voice"}</span>
                  </Button>
                </div>
                <Textarea
                  id="description"
                  placeholder="What happened? When did you notice it? Who is affected?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
                {description.length > 20 && (
                  <Button variant="outline" size="sm" onClick={analyzeWithAI} disabled={isAnalyzing}>
                    {isAnalyzing ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
                    AI Suggest Category
                  </Button>
                )}
                {aiResult && (
                  <div className="p-3 rounded-lg bg-primary/5 flex gap-2 flex-wrap">
                    <Badge>Suggested: {aiResult.category}</Badge>
                    <Badge variant="outline">P{aiResult.priority}</Badge>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Urgency Level</Label>
                  <Select value={urgencyLevel} onValueChange={(v) => { setUrgencyLevel(v); setPriority(urgencyToPriority(v) as Report["priority"]); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {URGENCY_LEVELS.map((u) => (
                        <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority (1–5)</Label>
                  <Select value={String(priority)} onValueChange={(v) => setPriority(Number(v) as Report["priority"])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((p) => (
                        <SelectItem key={p} value={String(p)}>P{p} — {PRIORITY_LABELS[p]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Who is affected?</Label>
                <Select value={affectedArea} onValueChange={setAffectedArea}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AFFECTED_AREAS.map((a) => (
                      <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Preferred contact method</Label>
                <Select value={contactPreference} onValueChange={setContactPreference}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CONTACT_PREFERENCES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Show in community feed</p>
                    <p className="text-xs text-muted-foreground">Others can see and support this issue</p>
                  </div>
                </div>
                <Switch checked={isPublic} onCheckedChange={setIsPublic} />
              </div>
            </>
          )}

          {/* Step 1: Location */}
          {step === 1 && (
            <>
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={getCurrentLocation} disabled={isGettingLocation}>
                  {isGettingLocation ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <MapPin className="h-3 w-3 mr-1" />}
                  Use My Location
                </Button>
              </div>
              <div className="space-y-2">
                <Label htmlFor="landmark">Nearby Landmark</Label>
                <Input
                  id="landmark"
                  placeholder="e.g. Opposite City Mall, near Bus Stop #42"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Street Address</Label>
                <Input
                  placeholder="Enter address or area name"
                  value={location?.address || ""}
                  onChange={(e) => setLocation((prev) => prev ? { ...prev, address: e.target.value } : { lat: 28.6139, lng: 77.209, address: e.target.value })}
                />
              </div>
              <MapPicker
                initialLocation={location ? { lat: location.lat, lng: location.lng } : undefined}
                onLocationSelect={(lat, lng) => {
                  setLocation((prev) => ({
                    lat,
                    lng,
                    address: prev?.address || "Selected on map",
                  }));
                }}
              />
              {location && (
                <div className="bg-success/10 rounded-lg p-3 flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span>{location.lat.toFixed(5)}, {location.lng.toFixed(5)}</span>
                </div>
              )}
            </>
          )}

          {/* Step 2: Photos */}
          {step === 2 && (
            <>
              <div className="grid grid-cols-3 gap-2">
                {photoPreviews.map((preview, i) => (
                  <div key={i} className="relative aspect-square">
                    <img src={preview} alt="" className="w-full h-full object-cover rounded-lg border" />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {photos.length < 3 && (
                  <div
                    className="aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-accent/50"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground mt-1">Add photo</span>
                  </div>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" multiple onChange={handlePhotoChange} className="hidden" />
              <p className="text-xs text-muted-foreground text-center">Photos are optional but help resolve issues 40% faster</p>
            </>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50 space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Title</span><span className="font-medium text-right max-w-[60%]">{title}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Category</span><span>{selectedCategory?.icon} {category}</span></div>
                {subcategory && <div className="flex justify-between"><span className="text-muted-foreground">Subcategory</span><span>{subcategory}</span></div>}
                <div className="flex justify-between"><span className="text-muted-foreground">Priority</span><Badge>P{priority}</Badge></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Department</span><span>{selectedCategory?.department}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Location</span><span className="text-right max-w-[60%]">{location?.address}</span></div>
                {landmark && <div className="flex justify-between"><span className="text-muted-foreground">Landmark</span><span>{landmark}</span></div>}
                <div className="flex justify-between"><span className="text-muted-foreground">Photos</span><span>{photos.length} attached</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Community visible</span><span>{isPublic ? "Yes" : "No"}</span></div>
              </div>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 pt-2">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
              </Button>
            )}
            {step < STEPS.length - 1 ? (
              <Button variant="civic" onClick={() => setStep(step + 1)} disabled={!canProceed()} className="flex-1">
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button variant="civic" size="lg" onClick={submitReport} disabled={isSubmitting} className="flex-1">
                {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Submitting...</> : "Submit Report"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
