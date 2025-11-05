import { useQuery } from "@tanstack/react-query";
import { useConfigurator } from "@/lib/ConfiguratorContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Car, Package, Wrench, GraduationCap } from "lucide-react";
import type { Van, Kit, Upgrade, TrainingOption } from "@shared/schema";

const formatPrice = (pence: number): string => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
  }).format(pence / 100);
};

export function ConfiguratorSummary() {
  const { state } = useConfigurator();

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

  const vanPrice = van?.price || 0;
  const kitPrice = kit?.price || 0;
  const upgradesTotal = upgrades.reduce((sum, upgrade) => sum + upgrade.price, 0);
  const trainingTotal = trainingOptions.reduce((sum, option) => sum + option.price, 0);
  
  const subtotal = vanPrice + kitPrice + upgradesTotal + trainingTotal;
  const vat = Math.round(subtotal * 0.2);
  const total = subtotal + vat;

  const hasItems = vanPrice > 0 || kitPrice > 0 || upgradesTotal > 0 || trainingTotal > 0;

  return (
    <Card className="sticky top-24 z-10 max-h-[calc(100vh-7rem)] overflow-y-auto" data-testid="summary-container">
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">Configuration Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasItems && (
          <p className="text-sm text-muted-foreground text-center py-4" data-testid="text-no-selections">
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

            {!state.vanId && (
              <Badge variant="secondary" className="w-full justify-center" data-testid="badge-select-van">
                Select a van to start
              </Badge>
            )}
            {state.vanId && !state.kitId && (
              <Badge variant="secondary" className="w-full justify-center" data-testid="badge-select-kit">
                Select an equipment kit
              </Badge>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
