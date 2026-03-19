/**
 * Inline related-tools quick navigation shown at the top of tool components.
 * Lightweight links to related tools for easy cross-navigation.
 */
export default function QuickNav({ links }: { links: { label: string; href: string }[] }) {
  if (!links.length) return null;
  return (
    <div class="flex flex-wrap gap-2 mb-4 text-sm">
      <span class="text-gray-400 dark:text-gray-500">Related:</span>
      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          class="text-primary-600 dark:text-primary-400 hover:underline"
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}
