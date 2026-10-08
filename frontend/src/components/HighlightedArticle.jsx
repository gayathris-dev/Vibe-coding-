export default function HighlightedArticle({
  content,
  matchingFragments = [],
}) {
  if (!content) {
    return null;
  }

  if (!matchingFragments.length) {
    return <p className="article-content">{content}</p>;
  }

  const escapedFragments = matchingFragments.map((fragment) =>
    fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  );

  const regex = new RegExp(
    `(${escapedFragments.join('|')})`,
    'gi'
  );

  const parts = content.split(regex);

  return (
    <p className="article-content">
      {parts.map((part, index) => {
        const isMatch = matchingFragments.some(
          (fragment) =>
            fragment.toLowerCase() === part.toLowerCase()
        );

        return isMatch ? (
          <mark key={index}>{part}</mark>
        ) : (
          part
        );
      })}
    </p>
  );
}