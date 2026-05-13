/**
 * Server component for emitting JSON-LD structured data.
 * Renders inside a <script type="application/ld+json"> tag.
 * Always pass schema.org-shaped data; never invent values.
 */

type JsonLdProps = {
  data: Record<string, unknown> | Array<Record<string, unknown>>;
  id?: string;
};

export function JsonLd({ data, id }: JsonLdProps) {
  return (
    <script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
