import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Paintbrush } from "lucide-react";
import {
  applyThemePreferences,
} from "@/utils/custom-theme-provider";
import { getThemePreferencesFromStore, useThemeStore } from "@/stores/theme-store";
import { HexColorPicker } from "react-colorful";

interface ColorPickerProps {
  value?: string;
  onChange?: (color: string) => void;
  label?: string;
  compact?: boolean;
  className?: string;
}

export function ColorPicker({
  value,
  onChange,
  label = "Choisir une couleur",
  compact = false,
  className,
}: ColorPickerProps) {
  const storeColor = useThemeStore((state) => state.primaryColor);
  const setPrimaryColor = useThemeStore((state) => state.setPrimaryColor);
  const color = value ?? storeColor;

  const handleColorChange = (nextColor: string) => {
    if (onChange) {
      onChange(nextColor);
      return;
    }
    setPrimaryColor(nextColor);
    applyThemePreferences({ ...getThemePreferencesFromStore(), primaryColor: nextColor });
  };

  return (
    <GradientPicker
      primaryColor={color}
      onColorChange={handleColorChange}
      label={label}
      compact={compact}
      className={className}
    />
  );
}

interface GradientPickerProps {
  primaryColor: string;
  onColorChange: (color: string) => void;
  className?: string;
  label?: string;
  compact?: boolean;
}

export function GradientPicker({
  primaryColor,
  onColorChange,
  className,
  label = "Choisir une couleur",
  compact = false,
}: GradientPickerProps) {
  const [tabValue, setTabValue] = useState("solid");
  const [customColor, setCustomColor] = useState(primaryColor);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const primaryColorChoices = ["#6463b6", "#eb25d8", "#FF5722", "#4A90E2"];

  const handleCustomColorChange = (nextColor: string) => {
    setCustomColor(nextColor);
    onColorChange(nextColor);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = e.currentTarget.value;
    setCustomColor(nextValue);
    if (/^#([0-9A-F]{3}){1,2}$/i.test(nextValue)) {
      onColorChange(nextValue);
    }
  };

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-[220px] justify-start text-left font-normal",
            compact && "w-[160px]",
            !primaryColor && "text-muted-foreground",
            className,
          )}
        >
          <div className="flex w-full items-center gap-2">
            {primaryColor ? (
              <div
                className="h-4 w-4 shrink-0 rounded"
                style={{ background: primaryColor }}
              />
            ) : (
              <Paintbrush className="h-4 w-4 shrink-0" />
            )}
            <div className="truncate flex-1">
              {primaryColor ? primaryColor : label}
            </div>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-72"
        data-no-window-drag
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Tabs
          value={tabValue}
          onValueChange={setTabValue}
          className="w-full"
          data-no-window-drag
        >
          <TabsList data-no-window-drag>
            <TabsTrigger value="solid">Par Défaut</TabsTrigger>
            <TabsTrigger value="custom">Personnalisée</TabsTrigger>
          </TabsList>
          <TabsContent
            value="solid"
            className="mt-2 flex flex-wrap gap-2"
            data-no-window-drag
          >
            {primaryColorChoices.map((choice) => (
              <button
                key={choice}
                type="button"
                data-no-window-drag
                style={{ background: choice }}
                className={cn(
                  "h-8 w-8 cursor-pointer rounded-md transition-transform hover:scale-105",
                  primaryColor === choice &&
                    "ring-2 ring-offset-2 ring-primary",
                )}
                onClick={() => onColorChange(choice)}
                aria-label={`Couleur ${choice}`}
              />
            ))}
          </TabsContent>
          <TabsContent value="custom" data-no-window-drag>
            <div
              className="mt-4"
              data-no-window-drag
              onMouseDown={(e) => e.stopPropagation()}
            >
              <HexColorPicker
                color={customColor}
                onChange={handleCustomColorChange}
              />
              <Input
                maxLength={7}
                value={customColor}
                onChange={handleInputChange}
                className="mt-2"
                data-no-window-drag
              />
            </div>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
