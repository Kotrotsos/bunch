use crate::models::*;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::SystemTime;

pub fn get_claude_home() -> PathBuf {
    dirs::home_dir()
        .expect("Could not determine home directory")
        .join(".claude")
}

pub fn scan_global_files(claude_home: &Path) -> GlobalNode {
    let mut files = Vec::new();

    // Global CLAUDE.md
    let claude_md = claude_home.join("CLAUDE.md");
    if claude_md.exists() {
        if let Some(cf) = make_config_file(&claude_md, ConfigFileType::ClaudeMd, ConfigLevel::Global, None) {
            files.push(cf);
        }
    }

    // Global settings.json
    let settings = claude_home.join("settings.json");
    if settings.exists() {
        if let Some(cf) = make_config_file(&settings, ConfigFileType::SettingsJson, ConfigLevel::Global, None) {
            files.push(cf);
        }
    }

    // Global agents
    let agents_dir = claude_home.join("agents");
    if agents_dir.is_dir() {
        scan_md_dir(&agents_dir, ConfigFileType::AgentMd, ConfigLevel::Global, None, &mut files);
    }

    // Global commands
    let commands_dir = claude_home.join("commands");
    if commands_dir.is_dir() {
        scan_md_dir(&commands_dir, ConfigFileType::CommandMd, ConfigLevel::Global, None, &mut files);
    }

    GlobalNode { files }
}

pub fn scan_projects(claude_home: &Path) -> Vec<ProjectNode> {
    let projects_dir = claude_home.join("projects");
    if !projects_dir.is_dir() {
        return Vec::new();
    }

    let mut projects = Vec::new();

    let entries = match fs::read_dir(&projects_dir) {
        Ok(e) => e,
        Err(_) => return projects,
    };

    for entry in entries.flatten() {
        let entry_path = entry.path();
        if !entry_path.is_dir() {
            continue;
        }

        let dir_name = match entry.file_name().into_string() {
            Ok(n) => n,
            Err(_) => continue,
        };

        let decoded_path = decode_project_path(&dir_name);
        let project_path = decoded_path.clone();

        let mut files = Vec::new();

        // Project-level CLAUDE.md (at the decoded project root)
        let project_claude_md = PathBuf::from(&decoded_path).join("CLAUDE.md");
        if project_claude_md.exists() {
            if let Some(cf) = make_config_file(
                &project_claude_md,
                ConfigFileType::ClaudeMd,
                ConfigLevel::Project,
                Some(&project_path),
            ) {
                files.push(cf);
            }
        }

        // Project .claude/ directory
        let project_claude_dir = PathBuf::from(&decoded_path).join(".claude");

        // settings.local.json
        let settings_local = project_claude_dir.join("settings.local.json");
        if settings_local.exists() {
            if let Some(cf) = make_config_file(
                &settings_local,
                ConfigFileType::SettingsLocalJson,
                ConfigLevel::Project,
                Some(&project_path),
            ) {
                files.push(cf);
            }
        }

        // Project agents
        let proj_agents = project_claude_dir.join("agents");
        if proj_agents.is_dir() {
            scan_md_dir(&proj_agents, ConfigFileType::AgentMd, ConfigLevel::Project, Some(&project_path), &mut files);
        }

        // Project commands
        let proj_commands = project_claude_dir.join("commands");
        if proj_commands.is_dir() {
            scan_md_dir(&proj_commands, ConfigFileType::CommandMd, ConfigLevel::Project, Some(&project_path), &mut files);
        }

        // Also check CLAUDE.md inside the projects entry itself (stored config)
        let stored_claude_md = entry_path.join("CLAUDE.md");
        if stored_claude_md.exists() && !project_claude_md.exists() {
            if let Some(cf) = make_config_file(
                &stored_claude_md,
                ConfigFileType::ClaudeMd,
                ConfigLevel::Project,
                Some(&project_path),
            ) {
                files.push(cf);
            }
        }

        let short_name = extract_project_name(&decoded_path);

        projects.push(ProjectNode {
            name: short_name,
            path: dir_name,
            decoded_path,
            files,
        });
    }

    projects.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    projects
}

/// Decode a dash-encoded project path from ~/.claude/projects/ directory name.
/// Uses greedy filesystem resolution: tries longest segments first.
pub fn decode_project_path(encoded: &str) -> String {
    let parts: Vec<&str> = encoded.split('-').collect();
    if parts.is_empty() {
        return String::new();
    }

    let mut result = String::new();
    let mut i = 0;

    while i < parts.len() {
        // Try greedy: longest match first
        let mut best_end = i + 1;

        for end in (i + 1..=parts.len()).rev() {
            let segment = parts[i..end].join("-");
            let candidate = if result.is_empty() {
                format!("/{}", segment)
            } else {
                format!("{}/{}", result, segment)
            };

            let candidate_path = Path::new(&candidate);
            if candidate_path.exists() || end == i + 1 {
                best_end = end;
                break;
            }
        }

        let segment = parts[i..best_end].join("-");
        if result.is_empty() {
            result = format!("/{}", segment);
        } else {
            result = format!("{}/{}", result, segment);
        }

        i = best_end;
    }

    result
}

fn extract_project_name(path: &str) -> String {
    path.split('/')
        .filter(|s| !s.is_empty())
        .last()
        .unwrap_or("unknown")
        .to_string()
}

fn scan_md_dir(
    dir: &Path,
    file_type: ConfigFileType,
    level: ConfigLevel,
    project_path: Option<&str>,
    files: &mut Vec<ConfigFile>,
) {
    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.extension().and_then(|e| e.to_str()) == Some("md") {
                if let Some(cf) = make_config_file(&path, file_type.clone(), level.clone(), project_path) {
                    files.push(cf);
                }
            }
        }
    }
}

fn make_config_file(
    path: &Path,
    file_type: ConfigFileType,
    level: ConfigLevel,
    project_path: Option<&str>,
) -> Option<ConfigFile> {
    let metadata = fs::metadata(path).ok()?;
    let modified = metadata
        .modified()
        .ok()
        .and_then(|t| {
            t.duration_since(SystemTime::UNIX_EPOCH)
                .ok()
                .map(|d| {
                    chrono::DateTime::from_timestamp(d.as_secs() as i64, d.subsec_nanos())
                        .map(|dt| dt.format("%Y-%m-%d %H:%M:%S").to_string())
                        .unwrap_or_default()
                })
        });

    let name = path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("unknown")
        .to_string();

    Some(ConfigFile {
        path: path.to_string_lossy().to_string(),
        file_type,
        level,
        name,
        size: metadata.len(),
        modified,
        project_path: project_path.map(|s| s.to_string()),
    })
}
