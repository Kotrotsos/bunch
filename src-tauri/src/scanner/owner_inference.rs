use crate::models::AgentOwner;
use std::path::Path;

pub fn infer_agent_owner(file_path: &Path, content: &str) -> AgentOwner {
    // 1. Check filename
    if let Some(name) = file_path.file_stem().and_then(|s| s.to_str()) {
        let name_lower = name.to_lowercase();
        if name_lower.contains("claude") {
            return AgentOwner::Claude;
        }
        if name_lower.contains("codex") {
            return AgentOwner::Codex;
        }
        if name_lower.contains("cursor") {
            return AgentOwner::Cursor;
        }
        if name_lower.contains("windsurf") {
            return AgentOwner::Windsurf;
        }
        if name_lower.contains("antigravity") {
            return AgentOwner::Antigravity;
        }
    }

    let content_lower = content.to_lowercase();

    // 2. Check frontmatter model field
    if let Some(owner) = check_frontmatter_model(&content_lower) {
        return owner;
    }

    // 3. Keyword scoring
    let mut scores: [(AgentOwner, i32); 5] = [
        (AgentOwner::Claude, 0),
        (AgentOwner::Codex, 0),
        (AgentOwner::Cursor, 0),
        (AgentOwner::Windsurf, 0),
        (AgentOwner::Antigravity, 0),
    ];

    let keywords: &[(&str, usize, i32)] = &[
        ("anthropic", 0, 2),
        ("claude code", 0, 3),
        ("claude", 0, 1),
        ("openai", 1, 2),
        ("chatgpt", 1, 2),
        ("codex", 1, 3),
        ("cursor", 2, 3),
        ("codeium", 3, 3),
        ("windsurf", 3, 3),
        ("antigravity", 4, 3),
    ];

    for (keyword, idx, weight) in keywords {
        let count = content_lower.matches(keyword).count() as i32;
        if count > 0 {
            scores[*idx].1 += count.min(5) * weight;
        }
    }

    let best = scores.iter().max_by_key(|(_, s)| *s).unwrap();
    if best.1 > 0 {
        return best.0.clone();
    }

    AgentOwner::User
}

fn check_frontmatter_model(content: &str) -> Option<AgentOwner> {
    // Look for YAML frontmatter model field
    if !content.starts_with("---") {
        return None;
    }

    let end = content[3..].find("---")?;
    let frontmatter = &content[3..3 + end];

    for line in frontmatter.lines() {
        let trimmed = line.trim();
        if let Some(value) = trimmed.strip_prefix("model:") {
            let model = value.trim().trim_matches('"').trim_matches('\'');
            if model.starts_with("claude-")
                || model.starts_with("claude-opus")
                || model.starts_with("claude-sonnet")
                || model.starts_with("claude-haiku")
            {
                return Some(AgentOwner::Claude);
            }
            if model.starts_with("gpt-")
                || model.starts_with("o1-")
                || model.starts_with("o3-")
            {
                return Some(AgentOwner::Codex);
            }
        }
    }

    None
}
