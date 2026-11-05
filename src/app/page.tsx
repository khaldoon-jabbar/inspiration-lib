import { Gallery } from "@/components/gallery";
import { familyBySlug } from "@/lib/families";
import { listItems } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ family?: string; item?: string }>;
}) {
  const params = await searchParams;
  const family = familyBySlug(params.family)?.slug ?? "";
  const items = await listItems();
  return <Gallery items={items} initialFamily={family} initialItem={params.item ?? ""} />;
}
