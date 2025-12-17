import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Reddit Mastermind - Authentic Growth Platform",
    description: "Drive authentic community engagement with intelligent automation",
};

export default function MarketingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
