use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct ClaudeSettings {
    #[serde(default)]
    pub permissions: HashMap<String, serde_json::Value>,
    #[serde(default)]
    pub env: HashMap<String, String>,
    #[serde(flatten)]
    pub other: HashMap<String, serde_json::Value>,
}
