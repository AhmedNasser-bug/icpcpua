export function hasValidRoadmapNodeDependencyGraph(nodes, nodeId, dependencies) {
  if (!Array.isArray(nodes) || !Array.isArray(dependencies)
    || nodes.some((node) => !node?._id || !Array.isArray(node.dependencies ?? []))) return false;
  const knownIds = new Set(nodes.map(({ _id }) => _id.toString()));
  const targetId = nodeId?.toString();
  const graph = new Map(nodes.map((node) => [
    node._id.toString(),
    (node._id.toString() === targetId ? dependencies : node.dependencies ?? []).map(String),
  ]));
  if (targetId && !graph.has(targetId)) return false;
  if (targetId) graph.set(targetId, dependencies.map(String));
  for (const [id, nodeDependencies] of graph) {
    if (new Set(nodeDependencies).size !== nodeDependencies.length
      || nodeDependencies.some((dependency) => !knownIds.has(dependency) || dependency === id)) {
      return false;
    }
  }
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

export function isRoadmapNodeCompleteForStudent(node, solvedProblems) {
  if (!node) return false;
  const nodeId = node._id?.toString();
  if (!nodeId) return false;
  const problems = node.problems ?? [];
  if (!Array.isArray(problems)) return false;
  return problems.every(({ url }) => solvedProblems.has(`${nodeId}\u0000${url}`));
}

export function areRoadmapPrerequisitesComplete(node, nodes, solvedProblems) {
  if (!node) return false;
  const dependencies = node.dependencies ?? [];
  if (!Array.isArray(dependencies) || !Array.isArray(nodes)) return false;
  const nodesById = new Map(nodes.map((candidate) => [candidate._id.toString(), candidate]));
  return dependencies.every((dependency) => {
    if (!dependency) return false;
    const prerequisite = nodesById.get(dependency.toString());
    return prerequisite && isRoadmapNodeCompleteForStudent(prerequisite, solvedProblems);
  });
}

export function hasSolvedRoadmapProgressForNode(progressRecords, nodeId) {
  const targetId = nodeId?.toString();
  return progressRecords.some(({ solvedProblems }) => (solvedProblems || []).some(({ node }) => (
    node?.toString() === targetId
  )));
}

export function removesSolvedRoadmapProblems(progressRecords, nodeId, problems) {
  const targetId = nodeId?.toString();
  const retainedUrls = new Set(problems.map(({ url }) => url));
  return progressRecords.some(({ solvedProblems }) => (solvedProblems || []).some(({ node, problemUrl }) => (
    node?.toString() === targetId && !retainedUrls.has(problemUrl)
  )));
}
