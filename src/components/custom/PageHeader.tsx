interface PageHeaderProps {
    icon: React.ReactNode;
    title: string;
    description: string;
}

export default function PageHeader({ icon, title, description }: PageHeaderProps) {
    return (
        <div className="flex flex-row my-4 gap-2">
            <div className="p-4 bg-primary/50 rounded-xl">
                {icon}
            </div>
            <div className="flex flex-col">
                <p className="text-2xl font-bold">{title}</p>
                <p className="text-muted-foreground">{description}</p>
            </div>
        </div>
    )
}