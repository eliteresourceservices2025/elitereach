import { TagList } from "@/components/tags/TagList";

export default function TagsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-elite-navy-dark">Tags</h1>
        <p className="text-sm text-gray-500">Create and manage tags to organize your contacts.</p>
      </div>
      <TagList />
    </div>
  );
}
