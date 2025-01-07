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
import { applyTheme } from "@/utils/custom-theme-provider";
import { useThemeStore } from "@/stores/theme-store";
import { HexColorPicker } from "react-colorful";

export function ColorPicker() {
    const { primaryColor, setPrimaryColor } = useThemeStore();

    const handleColorChange = (color: string) => {
        setPrimaryColor(color);
        applyTheme(color);
    };

    return (
        <GradientPicker
            primaryColor={primaryColor}
            onColorChange={handleColorChange}
        />
    );
}

interface GradientPickerProps {
    primaryColor: string;
    onColorChange: (color: string) => void;
    className?: string;
}

export function GradientPicker({
    primaryColor,
    onColorChange,
    className,
}: GradientPickerProps) {
    const [tabValue, setTabValue] = useState("solid");
    const [customColor, setCustomColor] = useState(primaryColor);
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);

    const primaryColorChoices = ["#6463b6", "#eb25d8", "#FF5722", "#4A90E2"];

    const handleCustomColorChange = (color: string) => {
        setCustomColor(color);
        onColorChange(color);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.currentTarget.value;
        setCustomColor(value);
        if (/^#([0-9A-F]{3}){1,2}$/i.test(value)) {
            onColorChange(value);
        }
    };

    return (
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-[220px] justify-start text-left font-normal",
                        !primaryColor && "text-muted-foreground",
                        className,
                    )}
                >
                    <div className="w-full flex items-center gap-2">
                        {primaryColor ? (
                            <div
                                className="h-4 w-4 rounded"
                                style={{ background: primaryColor }}
                            ></div>
                        ) : (
                            <Paintbrush className="h-4 w-4" />
                        )}
                        <div className="truncate flex-1">
                            {primaryColor
                                ? primaryColor
                                : "Choisir une couleur"}
                        </div>
                    </div>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72">
                <Tabs
                    value={tabValue}
                    onValueChange={setTabValue}
                    className="w-full"
                >
                    <TabsList>
                        <TabsTrigger value="solid">Par Défaut</TabsTrigger>
                        <TabsTrigger value="custom">Personnalisée</TabsTrigger>
                    </TabsList>
                    <TabsContent
                        value="solid"
                        className="flex flex-wrap gap-2 mt-2"
                    >
                        {primaryColorChoices.map((color) => (
                            <div
                                key={color}
                                style={{ background: color }}
                                className={cn(
                                    "rounded-md h-8 w-8 cursor-pointer hover:scale-105 transition-transform",
                                    primaryColor === color &&
                                        "ring-2 ring-offset-2 ring-primary",
                                )}
                                onClick={() => onColorChange(color)}
                            />
                        ))}
                    </TabsContent>
                    <TabsContent value="custom">
                        <div className="mt-4">
                            <HexColorPicker
                                color={customColor}
                                onChange={handleCustomColorChange}
                            />
                            <Input
                                maxLength={7}
                                value={customColor}
                                onChange={handleInputChange}
                                className="mt-2"
                            />
                        </div>
                    </TabsContent>
                </Tabs>
            </PopoverContent>
        </Popover>
    );
}