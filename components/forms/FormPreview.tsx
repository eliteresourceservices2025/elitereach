export type PreviewField = {
  label: string;
  type: "text" | "email" | "phone" | "textarea" | "select";
  options?: string[];
  required?: boolean;
  half?: boolean;
};

export function FormPreview({
  headline,
  description,
  buttonText,
  fields,
}: {
  headline: string;
  description?: string;
  buttonText: string;
  fields: PreviewField[];
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm" style={{ maxWidth: 420 }}>
      <h3 className="text-lg font-semibold text-elite-navy-dark">{headline}</h3>
      {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      <div className="mt-4 flex flex-wrap gap-3">
        {fields.map((field, i) => (
          <div key={i} className={field.half ? "w-[calc(50%-6px)]" : "w-full"}>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              {field.label}
              {field.required && <span className="text-red-400"> *</span>}
            </label>
            {field.type === "textarea" ? (
              <textarea disabled rows={3} className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-400" />
            ) : field.type === "select" ? (
              <select disabled className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-400">
                <option>Select one</option>
                {field.options?.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            ) : (
              <input disabled type={field.type} className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-400" />
            )}
          </div>
        ))}
      </div>
      <button disabled className="mt-4 w-full rounded-lg bg-elite-violet px-4 py-2 text-sm font-medium text-white opacity-90">
        {buttonText}
      </button>
    </div>
  );
}
