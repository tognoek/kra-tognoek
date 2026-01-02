use std::collections::HashMap;

pub struct IsolateStats {
    pub time_sec: f64,
    pub max_rss_kb: u64,
    pub status: String, // OK, TO (Timeout), RE (Runtime Error), SG (Signal)
    pub exit_code: i32,
}

pub async fn parse_meta_file(path: &std::path::Path) -> Result<IsolateStats, crate::tog::types::BoxError> {
    let content = tokio::fs::read_to_string(path).await?;
    let mut map = HashMap::new();

    for line in content.lines() {
        let parts: Vec<&str> = line.split(':').collect();
        if parts.len() == 2 {
            map.insert(parts[0], parts[1]);
        }
    }

    Ok(IsolateStats {
        time_sec: map.get("time").unwrap_or(&"0.0").parse().unwrap_or(0.0),
        max_rss_kb: map.get("max-rss").unwrap_or(&"0").parse().unwrap_or(0),
        status: map.get("status").unwrap_or(&"OK").to_string(),
        exit_code: map.get("exitcode").unwrap_or(&"0").parse().unwrap_or(0),
    })
}