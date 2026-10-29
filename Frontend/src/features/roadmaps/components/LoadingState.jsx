export function LoadingState({
  children = 'Loading roadmaps...'
}) {
  return <div className="empty-state"><span className="loader" /> {children}</div>;
}
