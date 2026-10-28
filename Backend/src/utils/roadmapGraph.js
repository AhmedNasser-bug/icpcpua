export function hasValidRoadmapNodeDependencyGraph(nodes, nodeId, dependencies) {
  const knownIds = new Set(nodes.map(({ _id }) => _id.toString()));
  const targetId = nodeId?.toString();
  if (dependencies.some((dependency) => !knownIds.has(dependency.toString()) || dependency.toString() === targetId)) {
    return false;
  }
  const graph = new Map(nodes.map((node) => [
    node._id.toString(),
    (node._id.toString() === targetId ? dependencies : node.dependencies || []).map(String),
  ]));
  if (targetId && !graph.has(targetId)) return false;
  if (targetId) graph.set(targetId, dependencies.map(String));
  const visiting = new Set();
  const visited = new Set();
  const hasCycle = (id) => {
    if (visiting.has(id)) return true;
    if (visited.has(id)) return false;
    visiting.add(id);
    for (const dependency of graph.get(id) || []) {
      if (hasCycle(dependency)) return true;
    }
    visiting.delete(id);
    visited.add(id);
    return false;
  };
  return ![...graph.keys()].some(hasCycle);
}
