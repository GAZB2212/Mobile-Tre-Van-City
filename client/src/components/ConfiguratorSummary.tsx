import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useConfigurator } from "@/lib/ConfiguratorContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Car, Package, Wrench, GraduationCap } from "lucide-react";
import type { Van, Kit, Upgrade, TrainingOption } from "@shared/schema";

function OwnVanDetails({
  vanPriceStr,
  vanRegStr,
  onPriceChange,
  onRegChange,
}: {
  vanPriceStr: string;
  vanRegStr: string;
  onPriceChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRegChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const [open, setOpen] = useState(() => !!(vanPriceStr || vanRegStr));

  return (
    <div className="pt-1">
      <button
        type="button"
        className="w-full text-left text-xs font-semibold uppercase tracking-wide text-accent hover-elevate px-0 py-1"
        onClick={() => setOpen(v => !v)}
        data-testid="button-toggle-van-details"
      >
        {open ? 'Hide van details' : 'Want to add van details?'}
      </button>

      <div className={`overflow-hidden transition-all duration-200 ${open ? 'mt-3 space-y-3' : 'h-0'}`}>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Van price
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">£</span>
            <Input
              className="pl-7"
              placeholder="Optional"
              value={vanPriceStr}
              onChange={onPriceChange}
              data-testid="input-summary-van-price"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Van reg
          </label>
          <Input
            placeholder="e.g. AB12 CDE"
            value={vanRegStr}
            onChange={onRegChange}
            data-testid="input-summary-van-reg"
          />
        </div>
      </div>
    </div>
  );
}

const formatPrice = (pence: number): string => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
  }).format(pence / 100);
};

export function ConfiguratorSummary() {
  const { state, setCustomVanValue, setVanReg } = useConfigurator();

  // Local input state for own van price and reg (synced to context)
  const [vanPriceStr, setVanPriceStr] = useState(
    state.customVanValue ? (state.customVanValue / 100).toFixed(0) : ""
  );
  const [vanRegStr, setVanRegStr] = useState(state.vanReg ?? "");

  // Sync context → local when context changes externally (e.g. clearAll)
  useEffect(() => {
    setVanPriceStr(state.customVanValue ? (state.customVanValue / 100).toFixed(0) : "");
  }, [state.customVanValue]);

  useEffect(() => {
    setVanRegStr(state.vanReg ?? "");
  }, [state.vanReg]);

  const handleVanPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9.]/g, '');
    setVanPriceStr(raw);
    const num = parseFloat(raw);
    setCustomVanValue(!isNaN(num) && num > 0 ? Math.round(num * 100) : null);
  };

  const handleVanRegChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    setVanRegStr(val);
    setVanReg(val.trim() || null);
  };

  const { data: van } = useQuery<Van>({
    queryKey: ['/api/vans', state.vanId],
    enabled: !!state.vanId,
  });

  const { data: kit } = useQuery<Kit>({
    queryKey: ['/api/kits', state.kitId],
    enabled: !!state.kitId,
  });

  const { data: upgrades = [] } = useQuery<Upgrade[]>({
    queryKey: ['/api/upgrades'],
    select: (data) => data.filter(u => state.upgradeIds.includes(u.id)),
    enabled: state.upgradeIds.length > 0,
  });

  const { data: trainingOptions = [] } = useQuery<TrainingOption[]>({
    queryKey: ['/api/training-options'],
    select: (data) => data.filter(t => state.trainingOptionIds.includes(t.id)),
    enabled: state.trainingOptionIds.length > 0,
  });

  const vanPrice = van?.price || state.customVanValue || 0;
  const kitPrice = kit?.price || 0;
  const upgradesTotal = upgrades.reduce((sum, upgrade) => sum + upgrade.price, 0);
  const trainingTotal = trainingOptions.reduce((sum, option) => sum + option.price, 0);
  
  const subtotal = vanPrice + kitPrice + upgradesTotal + trainingTotal;
  const vat = Math.round(subtotal * 0.2);
  const total = subtotal + vat;

  const hasItems = vanPrice > 0 || kitPrice > 0 || upgradesTotal > 0 || trainingTotal > 0;

  return (
    <Card className="sticky top-[180px] sm:top-[200px] xl:top-[220px] z-10 max-h-[calc(100vh-200px)] overflow-y-auto" data-testid="summary-container">
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">Configuration Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* "Start configuring" message only shown when a catalog van is selected but nothing else chosen */}
        {!hasItems && !!state.vanId && (
          <p className="text-sm text-muted-foreground text-center py-2" data-testid="text-no-selections">
            Start configuring to see your total
          </p>
        )}

        {hasItems && (
          <>
            {van && (
              <div className="flex items-start gap-2">
                <Car className="w-4 h-4 text-accent mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" data-testid="text-summary-van-name">
                    {van.make} {van.model}
                  </p>
                  <p className="text-sm text-muted-foreground" data-testid="text-summary-van-price">
                    {formatPrice(van.price)}
                  </p>
                </div>
              </div>
            )}

            {!van && state.customVanValue && state.customVanValue > 0 && (
              <div className="flex items-start gap-2">
                <Car className="w-4 h-4 text-accent mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" data-testid="text-summary-own-van-label">
                    Own van
                  </p>
                  <p className="text-sm text-muted-foreground" data-testid="text-summary-own-van-price">
                    {formatPrice(state.customVanValue)}
                  </p>
                </div>
              </div>
            )}

            {kit && (
              <div className="flex items-start gap-2">
                <Package className="w-4 h-4 text-accent mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" data-testid="text-summary-kit-name">
                    {kit.name}
                  </p>
                  <p className="text-sm text-muted-foreground" data-testid="text-summary-kit-price">
                    {formatPrice(kit.price)}
                  </p>
                </div>
              </div>
            )}

            {upgrades.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-accent" />
                  <p className="text-sm font-medium">
                    Upgrades ({upgrades.length})
                  </p>
                </div>
                <div className="pl-6 space-y-1">
                  {upgrades.map((upgrade) => (
                    <div key={upgrade.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground truncate pr-2" data-testid={`text-summary-upgrade-name-${upgrade.id}`}>
                        {upgrade.name}
                      </span>
                      <span className="font-medium whitespace-nowrap" data-testid={`text-summary-upgrade-price-${upgrade.id}`}>
                        {formatPrice(upgrade.price)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {trainingOptions.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-accent" />
                  <p className="text-sm font-medium">
                    Training ({trainingOptions.length})
                  </p>
                </div>
                <div className="pl-6 space-y-1">
                  {trainingOptions.map((option) => (
                    <div key={option.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground truncate pr-2" data-testid={`text-summary-training-name-${option.id}`}>
                        {option.name}
                      </span>
                      <span className="font-medium whitespace-nowrap" data-testid={`text-summary-training-price-${option.id}`}>
                        {formatPrice(option.price)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium" data-testid="text-summary-subtotal">
                  {formatPrice(subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">VAT (20%)</span>
                <span className="font-medium" data-testid="text-summary-vat">
                  {formatPrice(vat)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="font-bold">Total</span>
                <span className="font-bold text-lg text-accent" data-testid="text-summary-total">
                  {formatPrice(total)}
                </span>
              </div>
            </div>

            {state.vanId && !state.serviceType && (
              <Badge variant="secondary" className="w-full justify-center" data-testid="badge-select-service-type">
                Select your service type
              </Badge>
            )}
            {state.vanId && state.serviceType === 'car' && !state.kitId && (
              <Badge variant="secondary" className="w-full justify-center" data-testid="badge-select-kit">
                Select an equipment kit
              </Badge>
            )}
          </>
        )}

        {/* Own van price + reg inputs — collapsible, shown when no catalog van is selected */}
        {!state.vanId && (
          <OwnVanDetails
            vanPriceStr={vanPriceStr}
            vanRegStr={vanRegStr}
            onPriceChange={handleVanPriceChange}
            onRegChange={handleVanRegChange}
          />
        )}

      </CardContent>
    </Card>
  );
}
