interface Props {
  clients: Record<string, unknown>[];
  value: string;
  onChange: (id: string) => void;
}

export function ClientPicker({ clients, value, onChange }: Props) {
  if (clients.length <= 1) return null;
  return (
    <div>
      <label className="block text-xs font-semibold text-cr-slate mb-1.5">Client</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-cr-forest bg-white"
      >
        {clients.map(c => (
          <option key={c.id as string} value={c.id as string}>
            {c.first_name as string} {c.last_name as string}
          </option>
        ))}
      </select>
    </div>
  );
}
