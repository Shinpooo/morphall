"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAppKitState } from "@reown/appkit/react";
import { Button } from "./ui/button";

type ExploreVaultsButtonProps = {
  label?: string;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "ghost" | "outline";
  withArrow?: boolean;
};

export default function ExploreVaultsButton({
  label = "Explore vaults",
  size = "lg",
  variant = "primary",
  withArrow = false,
}: ExploreVaultsButtonProps) {
  const router = useRouter();
  const { selectedNetworkId } = useAppKitState();

  const targetPath = useMemo(() => {
    if (!selectedNetworkId || !selectedNetworkId.startsWith("eip155:")) {
      return "/vaults/8453";
    }
    const chainId = selectedNetworkId.split(":")[1];
    return `/vaults/${chainId || "8453"}`;
  }, [selectedNetworkId]);

  return (
    <Button
      size={size}
      variant={variant}
      className="cursor-pointer"
      onClick={() => router.push(targetPath)}
      type="button"
    >
      {label}
      {withArrow ? <span aria-hidden="true">→</span> : null}
    </Button>
  );
}
