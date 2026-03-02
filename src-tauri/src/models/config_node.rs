use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ConfigFileType {
    ClaudeMd,
    SettingsJson,
    SettingsLocalJson,
    AgentMd,
    CommandMd,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ConfigLevel {
    Global,
    Project,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AgentOwner {
    Claude,
    Codex,
    Cursor,
    Windsurf,
    Antigravity,
    User,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConfigFile {
    pub path: String,
    pub file_type: ConfigFileType,
    pub level: ConfigLevel,
    pub name: String,
    pub size: u64,
    pub modified: Option<String>,
    pub project_path: Option<String>,
    pub owner: Option<AgentOwner>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectNode {
    pub name: String,
    pub path: String,
    pub decoded_path: String,
    pub files: Vec<ConfigFile>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GlobalNode {
    pub files: Vec<ConfigFile>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConfigTree {
    pub global: GlobalNode,
    pub projects: Vec<ProjectNode>,
    pub scan_time_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InheritanceChainLevel {
    pub level: ConfigLevel,
    pub label: String,
    pub files: Vec<ConfigFile>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InheritanceChain {
    pub project_name: String,
    pub project_path: String,
    pub levels: Vec<InheritanceChainLevel>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchResult {
    pub file: ConfigFile,
    pub matches: Vec<SearchMatch>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchMatch {
    pub line_number: usize,
    pub line_content: String,
}
