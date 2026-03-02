use crate::models::*;
use crate::scanner::tree_builder;

#[tauri::command]
pub fn scan_config_tree() -> ConfigTree {
    tree_builder::build_config_tree()
}

#[tauri::command]
pub fn get_inheritance_chain(project_path: String) -> Option<InheritanceChain> {
    tree_builder::build_inheritance_chain(&project_path)
}

#[tauri::command]
pub fn search_config_content(query: String) -> Vec<SearchResult> {
    let tree = tree_builder::build_config_tree();
    tree_builder::search_content(&query, &tree)
}
