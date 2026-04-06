# Velocigate: High-Precision API Protection Layer

Velocigate is a professional-grade, high-performance rate limiting and anti-abuse system built for modern web applications. It leverages a **Sliding Window Log** algorithm and a **Tiered Enforcement** strategy to provide surgical precision in request throttling and automated threat mitigation.

---

## 🛑 The Problem: Beyond Basic Rate Limiting

Standard rate limiters often fail in real-world production environments because they are:

1.  **Naive (Fixed Window):** Fixed window counters suffer from "boundary bursts," where a user can double their quota by sending requests at the end of one window and the start of the next.
2.  **Binary (Allow/Block):** Traditional systems either allow all traffic or block it completely. They lack an **Escalation Path**, failing to distinguish between a slightly over-active user and a malicious brute-force attack.
3.  **Invisible:** Most security layers operate as a "black box," providing zero real-time observability for DevOps teams to monitor active threats.

## 💡 The Approach: Velocigate's Core Pillars

Velocigate solves these challenges through three architectural pillars:

### 1. Precision Sliding Window Tracking
Instead of resetting counters every minute, Velocigate stores sub-second timestamps for every request in a high-speed in-memory cache. This allows for a **True Sliding Window** evaluation, ensuring that the 30 req/min limit is enforced strictly across any 60-second rolling period.

### 2. Tiered Enforcement (Escalation Path)
Velocigate implements a reactive penalty system that escalates based on the severity of the abuse:
*   **Threshold:** 30 requests / 60 seconds.
*   **First Violation:** 1-minute temporary ban.
*   **Repeated Violations:** 5-minute cooldown period.
This tiered approach protects infrastructure while providing legitimate users a clear path to self-recovery.

### 3. Real-time Security Observability
Velocigate ships with a built-in **React + Vite Security Dashboard**. This interface provides:
*   **Live Countdown Timers:** Real-time visibility into active bans and unblock times.
*   **Traffic Heatmaps:** Aggregated view of top offenders and request status distributions.
*   **System Telemetry:** Uptime monitoring and request throughput analytics.

## 🏗️ Architecture & Tech Stack

*   **Runtime:** Node.js (Event-driven, Non-blocking I/O)
*   **API Framework:** Express.js (Modular Middleware architecture)
*   **Primary Database:** MongoDB (Document-store for persistent logging and ban state)
*   **Caching Engine:** internal `node-cache` (Microsecond latency for hot tracking data)
*   **UI Engine:** React 18 + Vite (Optimized for speed and minimal footprint)
*   **Styling:** SCSS (Nested, variable-driven professional styles)

## ⚖️ Engineering Tradeoffs

| Decision | Tradeoff | Rationale |
| :--- | :--- | :--- |
| **In-Memory Cache** | Consistency vs. Speed | For single-node performance, in-memory counters provide zero-network-latency tracking, essential for high-throughput APIs. |
| **Sliding Window Log** | Precision vs. Memory | Uses more memory than Fixed Window (storing timestamps), but prevents boundary-bursting abuse common in high-value APIs. |
| **Indexed MongoDB** | Persistence vs. Write Speed | Logging every request adds overhead, but indexing the `ip` and `timestamp` fields ensures that ban checks remain O(1) even with millions of logs. |

## 📈 Scaling Thoughts

Velocigate is designed to grow with your infrastructure:

1.  **Distributed State:** For multi-node deployments, the cache layer is designed to be easily swapped for **Redis**, allowing all API nodes to share a global "source of truth" for rate limits.
2.  **Lazy Ban Checks:** The middleware performs an O(1) indexed check on the `BanModel` before processing logic, ensuring that malicious traffic is dropped before it hits expensive business logic.
3.  **Read/Write Splitting:** In a high-scale environment, logs can be directed to a **Time-Series Database (like InfluxDB)** or a dedicated logging cluster to prevent contention with the primary application database.

---
Built with 🛡️ for modern API security.
