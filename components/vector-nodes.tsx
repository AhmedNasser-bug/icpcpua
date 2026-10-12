/**
 * Decorative corner brackets for the neo-brutalist cards.
 * The parent element must establish a positioning context (`relative`).
 */
export function VectorNodes() {
  return (
    <>
      <span className="vector-node vector-node-tl" />
      <span className="vector-node vector-node-tr" />
      <span className="vector-node vector-node-bl" />
      <span className="vector-node vector-node-br" />
    </>
  )
}
