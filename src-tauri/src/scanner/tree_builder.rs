use crate::models::*;
use std::path::Path;
use std::time::Instant;

use super::discovery;

pub fn build_config_tree() -> ConfigTree {
    let start = Instant::now();
    let claude_home = discovery::get_claude_home();

    let global = discovery::scan_global_files(&claude_home);
    let projects = discovery::scan_projects(&claude_home);

    let scan_time_ms = start.elapsed().as_millis() as u64;

    ConfigTree {
        global,
        projects,
        scan_time_ms,
    }
}

pub fn build_inheritance_chain(project_encoded_name: &str) -> Option<InheritanceChain> {
    let claude_home = discovery::get_claude_home();
    let global = discovery::scan_global_files(&claude_home);

    let projects = discovery::scan_projects(&claude_home);
    let project = projects.into_iter().find(|p| p.path == project_encoded_name)?;

    let global_level = InheritanceChainLevel {
        level: ConfigLevel::Global,
        label: "Global (~/.claude/)".to_string(),
        files: global.files,
    };

    let project_level = InheritanceChainLevel {
        level: ConfigLevel::Project,
        label: format!("Project ({})", project.decoded_path),
        files: project.files.clone(),
    };

    Some(InheritanceChain {
        project_name: project.name,
        project_path: project.decoded_path,
        levels: vec![global_level, project_level],
    })
}

pub fn search_content(query: &str, tree: &ConfigTree) -> Vec<SearchResult> {
    let query_lower = query.to_lowercase();
    let mut results = Vec::new();

    let all_files: Vec<&ConfigFile> = tree
        .global
        .files
        .iter()
        .chain(tree.projects.iter().flat_map(|p| p.files.iter()))
        .collect();

    for file in all_files {
        let path = Path::new(&file.path);
        if let Ok(content) = std::fs::read_to_string(path) {
            let matches: Vec<SearchMatch> = content
                .lines()
                .enumerate()
                .filter(|(_, line)| line.to_lowercase().contains(&query_lower))
                .map(|(i, line)| SearchMatch {
                    line_number: i + 1,
                    line_content: line.to_string(),
                })
                .collect();

            if !matches.is_empty() {
                results.push(SearchResult {
                    file: file.clone(),
                    matches,
                });
            }
        }
    }

    results
}
