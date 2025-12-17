import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Dashboard - Reddit Mastermind",
    description: "Manage your Reddit growth campaigns",
};

export default function PlatformLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
