interface FeaturePlaceholderPageProps {
  title: string;
  description: string;
}

export function FeaturePlaceholderPage({ title, description }: FeaturePlaceholderPageProps): JSX.Element {
  return (
    <div className="container">
      <section className="page-section placeholder-page">
        <h2>{title}</h2>
        <p>{description}</p>
      </section>
    </div>
  );
}
