use tokio::sync::mpsc;
use std::sync::Arc;
use tokio::sync::Mutex;
use std::time::Duration;

use crate::stats::{StatEvent, Stats};

pub fn spawn_stats_pool(rx: mpsc::Receiver<StatEvent>, interval_ms: u64) {
    let stats = Arc::new(Mutex::new(Stats::default()));
    let stats_clone = stats.clone();

    tokio::spawn(async move {
        let mut rx = rx;
        while let Some(event) = rx.recv().await {
            let mut s = stats_clone.lock().await;
            s.update(event.cpu, event.ram, event.disk, event.time);
        }
    });

    let stats_clone2 = stats.clone();
    let enable_console = crate::stats::is_console_output_enabled();
    tokio::spawn(async move {
        let interval = Duration::from_millis(interval_ms);
        let mut last_total_calls = 0u64;
        loop {
            {
                let s = stats_clone2.lock().await;
                if enable_console && s.total_calls != last_total_calls {
                    s.draw_table();
                    last_total_calls = s.total_calls;
                }
            }
            tokio::time::sleep(interval).await;
        }
    });
}
