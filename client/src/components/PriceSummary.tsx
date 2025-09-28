import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Calculator, Download } from "lucide-react";

interface PriceSummaryProps {
  basePrice: number;
  kitPrice: number;
  upgradesPrice: number;
  showVAT: boolean;
  onVATToggle: (show: boolean) => void;
  onRequestQuote: () => void;
}

export default function PriceSummary({ 
  basePrice, 
  kitPrice, 
  upgradesPrice, 
  showVAT, 
  onVATToggle,
  onRequestQuote 
}: PriceSummaryProps) {
  const subtotal = basePrice + kitPrice + upgradesPrice;
  const vat = subtotal * 0.2; // 20% VAT
  const total = showVAT ? subtotal + vat : subtotal;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price / 100);
  };

  return (
    <Card className="sticky top-24">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center">
          <Calculator className="w-5 h-5 mr-2" />
          Price Summary
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Price Breakdown */}
        <div className="space-y-3">
          {basePrice > 0 && (
            <div className="flex justify-between" data-testid="price-base-van">
              <span className="text-muted-foreground">Base Van</span>
              <span className="font-medium">{formatPrice(basePrice)}</span>
            </div>
          )}
          {kitPrice > 0 && (
            <div className="flex justify-between" data-testid="price-equipment-kit">
              <span className="text-muted-foreground">Equipment Kit</span>
              <span className="font-medium">{formatPrice(kitPrice)}</span>
            </div>
          )}
          {upgradesPrice > 0 && (
            <div className="flex justify-between" data-testid="price-upgrades">
              <span className="text-muted-foreground">Upgrades</span>
              <span className="font-medium">{formatPrice(upgradesPrice)}</span>
            </div>
          )}
        </div>

        <div className="border-t pt-3">
          <div className="flex justify-between text-lg font-semibold" data-testid="price-subtotal">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
        </div>

        {/* VAT Toggle */}
        <div className="flex items-center justify-between py-2 border rounded-lg px-3">
          <div>
            <span className="font-medium">Include VAT</span>
            <p className="text-xs text-muted-foreground">20% VAT</p>
          </div>
          <Switch 
            checked={showVAT} 
            onCheckedChange={onVATToggle}
            data-testid="switch-vat"
          />
        </div>

        {showVAT && (
          <div className="flex justify-between text-muted-foreground" data-testid="price-vat">
            <span>VAT (20%)</span>
            <span>{formatPrice(vat)}</span>
          </div>
        )}

        {/* Total */}
        <div className="border-t pt-3">
          <div className="flex justify-between text-xl font-bold" data-testid="price-total">
            <span>Total</span>
            <span className="text-chart-2">{formatPrice(total)}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {showVAT ? 'Inc. VAT' : 'Ex. VAT'}
          </p>
        </div>

        {/* Benefits */}
        <div className="space-y-2 py-3">
          <Badge variant="secondary" className="w-full justify-center">
            Nationwide Delivery Included
          </Badge>
          <Badge variant="secondary" className="w-full justify-center">
            12-Month Warranty
          </Badge>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <Button 
            className="w-full bg-chart-3 hover:bg-chart-3/90 text-black font-semibold"
            onClick={onRequestQuote}
            data-testid="button-request-quote"
          >
            Request Quote
          </Button>
          <Button 
            variant="outline" 
            className="w-full"
            data-testid="button-download-summary"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Summary
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Prices are estimates only. Final quotes will be provided based on your specific requirements.
        </p>
      </CardContent>
    </Card>
  );
}