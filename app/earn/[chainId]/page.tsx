import { redirect } from "next/navigation";

export default async function EarnPage({
  params,
}: {
  params: Promise<{ chainId: string }>;
}) {
  const { chainId } = await params;
  redirect(`/vaults/${chainId}`);
}
