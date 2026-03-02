import type { ConfigTree, TreeNodeData, ProjectNode } from "../types/config-tree";

export function buildTreeData(tree: ConfigTree): TreeNodeData[] {
  const roots: TreeNodeData[] = [];

  // Global section
  const globalNode: TreeNodeData = {
    id: "global",
    label: "Global (~/.claude/)",
    type: "root",
    children: [],
    expanded: true,
  };

  for (const file of tree.global.files) {
    globalNode.children.push({
      id: `global-${file.path}`,
      label: file.name,
      type: "file",
      configFile: file,
      children: [],
    });
  }

  roots.push(globalNode);

  // Group projects by parent directory
  const groups = groupProjectsByParent(tree.projects);

  for (const [groupName, projects] of Object.entries(groups)) {
    const groupNode: TreeNodeData = {
      id: `group-${groupName}`,
      label: groupName,
      type: "group",
      children: [],
      expanded: false,
    };

    for (const project of projects) {
      const projectNode: TreeNodeData = {
        id: `project-${project.path}`,
        label: project.name,
        type: "project",
        project,
        children: [],
        expanded: false,
      };

      for (const file of project.files) {
        projectNode.children.push({
          id: `project-${project.path}-${file.path}`,
          label: file.name,
          type: "file",
          configFile: file,
          children: [],
        });
      }

      groupNode.children.push(projectNode);
    }

    roots.push(groupNode);
  }

  return roots;
}

function groupProjectsByParent(
  projects: ProjectNode[]
): Record<string, ProjectNode[]> {
  const groups: Record<string, ProjectNode[]> = {};

  for (const project of projects) {
    const parts = project.decodedPath.split("/").filter(Boolean);
    // Use second-to-last segment as group, or root
    const groupName =
      parts.length >= 2 ? parts[parts.length - 2] : "Other";

    if (!groups[groupName]) {
      groups[groupName] = [];
    }
    groups[groupName].push(project);
  }

  return groups;
}

export function filterTreeByType(
  nodes: TreeNodeData[],
  filter: string | null
): TreeNodeData[] {
  if (!filter) return nodes;

  const typeMap: Record<string, string[]> = {
    claudemd: ["ClaudeMd"],
    settings: ["SettingsJson", "SettingsLocalJson"],
    agents: ["AgentMd"],
    commands: ["CommandMd"],
  };

  const allowedTypes = typeMap[filter];
  if (!allowedTypes) return nodes;

  return nodes
    .map((node) => filterNode(node, allowedTypes))
    .filter((n): n is TreeNodeData => n !== null);
}

function filterNode(
  node: TreeNodeData,
  allowedTypes: string[]
): TreeNodeData | null {
  if (node.type === "file") {
    if (node.configFile && allowedTypes.includes(node.configFile.fileType)) {
      return node;
    }
    return null;
  }

  const filteredChildren = node.children
    .map((child) => filterNode(child, allowedTypes))
    .filter((c): c is TreeNodeData => c !== null);

  if (filteredChildren.length === 0) return null;

  return { ...node, children: filteredChildren, expanded: true };
}
