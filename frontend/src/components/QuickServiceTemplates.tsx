import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sparkles, Check, Edit2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ServiceTemplate {
  name: string;
  duration: number;
  price: string;
  description: string;
}

interface QuickServiceTemplatesProps {
  salonType: "men" | "women" | "unisex";
  salonId: string;
  onServicesAdded: () => void;
}

export default function QuickServiceTemplates({
  salonType,
  salonId,
  onServicesAdded,
}: QuickServiceTemplatesProps) {
  const { toast } = useToast();
  const [selectedTemplates, setSelectedTemplates] = useState<Set<number>>(new Set());
  const [isAdding, setIsAdding] = useState(false);
  const [templates, setTemplates] = useState<ServiceTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<ServiceTemplate>({
    name: "",
    duration: 0,
    price: "",
    description: "",
  });

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const baseURL = import.meta.env.VITE_API_URL || 'https://no-production-d4fc.up.railway.app';
      const response = await fetch(`${baseURL}/api/service-templates/${salonType}`);
      if (!response.ok) throw new Error('Failed to load templates');
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load service templates",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTemplate = (index: number) => {
    const newSelected = new Set(selectedTemplates);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedTemplates(newSelected);
  };

  const openEditDialog = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingIndex(index);
    setEditForm({ ...templates[index] });
  };

  const closeEditDialog = () => {
    setEditingIndex(null);
    setEditForm({
      name: "",
      duration: 0,
      price: "",
      description: "",
    });
  };

  const saveEdit = () => {
    if (editingIndex === null) return;

    // Validate form
    if (!editForm.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Service name is required",
        variant: "destructive",
      });
      return;
    }

    if (editForm.duration <= 0) {
      toast({
        title: "Validation Error",
        description: "Duration must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    if (!editForm.price || parseFloat(editForm.price) <= 0) {
      toast({
        title: "Validation Error",
        description: "Price must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    // Update the template
    const updatedTemplates = [...templates];
    updatedTemplates[editingIndex] = editForm;
    setTemplates(updatedTemplates);

    toast({
      title: "Template Updated",
      description: "Service template has been customized",
    });

    closeEditDialog();
  };

  const addSelectedServices = async () => {
    if (selectedTemplates.size === 0) {
      toast({
        title: "No services selected",
        description: "Please select at least one service to add",
        variant: "destructive",
      });
      return;
    }

    setIsAdding(true);
    try {
      const token = localStorage.getItem('smartq_token');
      const baseURL = import.meta.env.VITE_API_URL || 'https://no-production-d4fc.up.railway.app';

      const selectedServices = Array.from(selectedTemplates).map(index => templates[index]);

      for (const service of selectedServices) {
        const response = await fetch(`${baseURL}/api/services`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...service,
            salonId,
            isActive: true,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to add ${service.name}`);
        }
      }

      toast({
        title: "Success!",
        description: `Added ${selectedTemplates.size} service${selectedTemplates.size > 1 ? 's' : ''} successfully`,
      });

      setSelectedTemplates(new Set());
      setTemplates([]);
      onServicesAdded();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add services",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  if (templates.length === 0 && !isLoading) {
    return (
      <div className="bg-gradient-to-br from-teal-50 to-blue-50 border border-teal-200 rounded-2xl p-4 mb-4">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-teal-900 mb-1">Quick Add Services</h3>
            <p className="text-sm text-teal-700 mb-3">
              Get started faster with pre-configured services for {salonType === "men" ? "men's" : salonType === "women" ? "women's" : "unisex"} salons
            </p>
            <Button
              onClick={loadTemplates}
              className="bg-teal-600 text-white hover:bg-teal-700 rounded-xl text-sm"
              size="sm"
            >
              View Templates
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-4">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-teal-50 to-blue-50 border border-teal-200 rounded-2xl p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-teal-600" />
          <h3 className="font-semibold text-teal-900">Quick Add Services</h3>
        </div>
        <Badge variant="outline" className="bg-white border-teal-300 text-teal-700">
          {selectedTemplates.size} selected
        </Badge>
      </div>

      <div className="space-y-2 mb-3 max-h-64 overflow-y-auto">
        {templates.map((template, index) => (
          <button
            key={index}
            onClick={() => toggleTemplate(index)}
            className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
              selectedTemplates.has(index)
                ? "border-teal-500 bg-teal-100"
                : "border-gray-200 bg-white hover:border-teal-300"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900">{template.name}</span>
                  {selectedTemplates.has(index) && (
                    <Check className="h-4 w-4 text-teal-600" />
                  )}
                </div>
                <div className="flex items-center space-x-3 mt-1">
                  <span className="text-sm text-gray-600">{template.duration} min</span>
                  <span className="text-sm font-medium text-teal-700">₹{template.price}</span>
                </div>
                {template.description && (
                  <p className="text-xs text-gray-500 mt-1">{template.description}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => openEditDialog(index, e)}
                className="ml-2 p-2 h-8 w-8 hover:bg-teal-100 rounded-lg"
              >
                <Edit2 className="h-4 w-4 text-teal-600" />
              </Button>
            </div>
          </button>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editingIndex !== null} onOpenChange={(open) => !open && closeEditDialog()}>
        <DialogContent className="mx-2 max-w-[95vw] sm:max-w-md w-full rounded-3xl">
          <DialogHeader>
            <DialogTitle>Edit Service Template</DialogTitle>
            <DialogDescription>
              Customize the service details before adding
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium text-gray-900 mb-1 block">
                Service Name
              </label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="e.g., Haircut"
                className="rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-900 mb-1 block">
                  Duration (min)
                </label>
                <Input
                  type="number"
                  value={editForm.duration}
                  onChange={(e) => setEditForm({ ...editForm, duration: parseInt(e.target.value) || 0 })}
                  placeholder="30"
                  className="rounded-xl"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-900 mb-1 block">
                  Price (₹)
                </label>
                <Input
                  type="number"
                  step="1"
                  value={editForm.price}
                  onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                  placeholder="0"
                  className="rounded-xl"
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-medium text-gray-900">
                  Description
                </label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  className="text-xs flex items-center gap-1 h-7 px-2 text-teal-600 border-teal-300 hover:bg-teal-50"
                  onClick={async () => {
                    if (!editForm.name) {
                      toast({
                        title: "Service name required",
                        description: "Please enter a service name first",
                        variant: "destructive",
                      });
                      return;
                    }
                    
                    try {
                      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/generate-description`, {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ serviceName: editForm.name }),
                      });
                      
                      if (!response.ok) {
                        throw new Error("Failed to generate description");
                      }
                      
                      const data = await response.json();
                      setEditForm({ ...editForm, description: data.description });
                      
                      toast({
                        title: "Description generated",
                        description: "AI has created a description for your service",
                        variant: "default",
                      });
                    } catch (error) {
                      console.error("Error generating description:", error);
                      toast({
                        title: "Generation failed",
                        description: "Could not generate description. Please try again.",
                        variant: "destructive",
                      });
                    }
                  }}
                  disabled={!editForm.name}
                >
                  <Sparkles className="h-3 w-3" />
                  Generate with AI
                </Button>
              </div>
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Service description..."
                className="rounded-xl resize-none"
                rows={3}
              />
            </div>
            <div className="flex space-x-2 pt-2">
              <Button
                onClick={saveEdit}
                className="flex-1 bg-teal-600 text-white hover:bg-teal-700 rounded-xl"
              >
                Save Changes
              </Button>
              <Button
                onClick={closeEditDialog}
                variant="outline"
                className="rounded-xl border-gray-300"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex space-x-2">
        <Button
          onClick={addSelectedServices}
          disabled={selectedTemplates.size === 0 || isAdding}
          className="flex-1 bg-teal-600 text-white hover:bg-teal-700 rounded-xl"
        >
          {isAdding ? "Adding..." : `Add ${selectedTemplates.size} Service${selectedTemplates.size !== 1 ? 's' : ''}`}
        </Button>
        <Button
          onClick={() => {
            setTemplates([]);
            setSelectedTemplates(new Set());
          }}
          variant="outline"
          className="rounded-xl border-gray-300"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
