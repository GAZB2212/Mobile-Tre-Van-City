import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Search } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Van } from "@shared/schema";

interface VanFormProps {
  van?: Van;
  onSubmit: (formData: FormData) => void;
  isLoading: boolean;
}

export function VanFormNew({ van, onSubmit, isLoading }: VanFormProps) {
  const { toast } = useToast();
  const [registration, setRegistration] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);

  // Refs for direct DOM manipulation
  const titleRef = useRef<HTMLInputElement>(null);
  const slugRef = useRef<HTMLInputElement>(null);
  const makeRef = useRef<HTMLInputElement>(null);
  const modelRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);
  const [transmission, setTransmission] = useState(van?.specs.transmission || 'Manual');
  const [size, setSize] = useState(van?.specs.size || 'MWB');
  const [fuel, setFuel] = useState(van?.specs.fuel || 'Diesel');
  const doorsRef = useRef<HTMLInputElement>(null);
  const engineRef = useRef<HTMLInputElement>(null);

  const handleLookup = async () => {
    if (!registration.trim()) return;
    
    setIsLookingUp(true);
    try {
      const response = await apiRequest('POST', '/api/admin/vehicle-lookup', { registration });
      const data = await response.json();
      
      const slug = `${data.make}-${data.model}-${data.year}`.toLowerCase().replace(/\s+/g, '-');
      
      // Directly update DOM values
      if (titleRef.current) titleRef.current.value = data.title;
      if (slugRef.current) slugRef.current.value = slug;
      if (makeRef.current) makeRef.current.value = data.make;
      if (modelRef.current) modelRef.current.value = data.model;
      if (yearRef.current) yearRef.current.value = String(data.year);
      if (doorsRef.current) doorsRef.current.value = data.specs.doors ? String(data.specs.doors) : '';
      if (engineRef.current) engineRef.current.value = data.specs.engine || '';
      
      setTransmission(data.specs.transmission);
      setSize(data.specs.size);
      setFuel(data.specs.fuel);
      
      toast({
        title: "Vehicle found",
        description: `Details loaded for ${data.make} ${data.model}`,
      });
    } catch (error) {
      toast({
        title: "Lookup failed",
        description: "Could not find vehicle with that registration",
        variant: "destructive",
      });
    } finally {
      setIsLookingUp(false);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        onSubmit(formData);
      }}
    >
      <div className="grid gap-4">
        {!van && (
          <Card className="bg-accent/5">
            <CardContent className="pt-6">
              <Label htmlFor="registration">Vehicle Registration Lookup</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="registration"
                  value={registration}
                  onChange={(e) => setRegistration(e.target.value.toUpperCase())}
                  placeholder="Enter reg e.g. AB12 CDE"
                  className="font-mono"
                  data-testid="input-registration"
                />
                <Button
                  type="button"
                  onClick={handleLookup}
                  disabled={!registration.trim() || isLookingUp}
                  data-testid="button-lookup"
                >
                  <Search className="w-4 h-4 mr-2" />
                  {isLookingUp ? "Looking up..." : "Lookup"}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Enter a UK vehicle registration to auto-fill vehicle details
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              ref={titleRef}
              id="title"
              name="title"
              defaultValue={van?.title || ''}
              placeholder="Mobile Tyre Van - Ready to Go"
              required
              data-testid="input-van-title"
            />
          </div>
          <div>
            <Label htmlFor="slug">Slug</Label>
            <Input
              ref={slugRef}
              id="slug"
              name="slug"
              defaultValue={van?.slug || ''}
              placeholder="ford-transit-custom-2022"
              required
              data-testid="input-van-slug"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="make">Make</Label>
            <Input
              ref={makeRef}
              id="make"
              name="make"
              defaultValue={van?.make || ''}
              placeholder="Ford"
              required
              data-testid="input-van-make"
            />
          </div>
          <div>
            <Label htmlFor="model">Model</Label>
            <Input
              ref={modelRef}
              id="model"
              name="model"
              defaultValue={van?.model || ''}
              placeholder="Transit Custom"
              required
              data-testid="input-van-model"
            />
          </div>
          <div>
            <Label htmlFor="year">Year</Label>
            <Input
              ref={yearRef}
              id="year"
              name="year"
              type="number"
              defaultValue={van?.year || ''}
              placeholder="2022"
              required
              data-testid="input-van-year"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="mileage">Mileage</Label>
            <Input
              id="mileage"
              name="mileage"
              type="number"
              defaultValue={van?.mileage || ''}
              placeholder="15000"
              required
              data-testid="input-van-mileage"
            />
          </div>
          <div>
            <Label htmlFor="price">Price (£)</Label>
            <Input
              id="price"
              name="price"
              type="number"
              defaultValue={van ? van.price / 100 : ''}
              placeholder="45000"
              required
              data-testid="input-van-price"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="transmission">Transmission</Label>
            <Select name="transmission" value={transmission} onValueChange={setTransmission}>
              <SelectTrigger data-testid="select-van-transmission">
                <SelectValue placeholder="Select transmission" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Manual">Manual</SelectItem>
                <SelectItem value="Automatic">Automatic</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="size">Size</Label>
            <Select name="size" value={size} onValueChange={setSize}>
              <SelectTrigger data-testid="select-van-size">
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SWB">SWB (Short Wheel Base)</SelectItem>
                <SelectItem value="MWB">MWB (Medium Wheel Base)</SelectItem>
                <SelectItem value="LWB">LWB (Long Wheel Base)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="fuel">Fuel</Label>
            <Select name="fuel" value={fuel} onValueChange={setFuel}>
              <SelectTrigger data-testid="select-van-fuel">
                <SelectValue placeholder="Select fuel type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Diesel">Diesel</SelectItem>
                <SelectItem value="Petrol">Petrol</SelectItem>
                <SelectItem value="Electric">Electric</SelectItem>
                <SelectItem value="Hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="doors">Doors (optional)</Label>
            <Input
              ref={doorsRef}
              id="doors"
              name="doors"
              type="number"
              defaultValue={van?.specs.doors || ''}
              placeholder="4"
              data-testid="input-van-doors"
            />
          </div>
          <div>
            <Label htmlFor="engine">Engine (optional)</Label>
            <Input
              ref={engineRef}
              id="engine"
              name="engine"
              defaultValue={van?.specs.engine || ''}
              placeholder="2.0L TDCi"
              data-testid="input-van-engine"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="van-create-images">Van Images (optional)</Label>
          <p className="text-sm text-muted-foreground mb-2">
            Select images to upload. First image will be the hero image.
          </p>
          <Input
            id="van-create-images"
            type="file"
            accept="image/*"
            multiple
            className="cursor-pointer"
          />
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={''}
              placeholder="Van description..."
              rows={4}
              data-testid="input-van-description"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="vatIncluded"
            name="vatIncluded"
            defaultChecked={van?.vatIncluded || false}
            data-testid="switch-van-vat"
          />
          <Label htmlFor="vatIncluded">Price includes VAT</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="published"
            name="published"
            defaultChecked={van ? van.published !== false : true}
            data-testid="switch-van-published"
          />
          <Label htmlFor="published">Published</Label>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={isLoading} data-testid="button-submit-van">
            {isLoading ? "Saving..." : van ? "Update Van" : "Create Van"}
          </Button>
        </div>
      </div>
    </form>
  );
}
