import { ReactNode } from "react";
import Link from "next/link";
import { FolderKanban } from "lucide-react";

export default function OperationsLayout({ children }: { children: ReactNode }) {
    return (
        <div className="space-y-6 font-grotesk animate-in fade-in zoom-in duration-500">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <FolderKanban size={24} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold">Operations Queue</h1>
                    <p className="text-muted-foreground text-sm">Manage user requests, workflows, and fulfilled services</p>
                </div>
            </div>

            {/* Quick Navigation could go here if needed, but sidebar handles it mostly. */}

            {children}
        </div>
    );
}
