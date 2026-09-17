export function EmailPreview({ html }: { html: string }) {
  return (
    <iframe
      title="Email preview"
      srcDoc={html}
      sandbox=""
      className="h-[500px] w-full rounded-lg border border-gray-200 bg-white"
    />
  );
}
