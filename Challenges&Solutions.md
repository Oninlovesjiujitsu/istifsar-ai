//Outline Challenges faced in building this Application, and the solutions. Only the significant ones.


//Reference:

challengesAndSolutions: [
      {
        challenge: "Engineering for 3,000+ concurrent users without performance degradation.",
        solution: "Implemented Redis caching with multiple cache layers (SmartCache, AnalyticsCache, AICache), configured database connection pooling with pool size of 20 and max overflow of 40, and optimized database queries."
      },
      {
        challenge: "Managing complex role-based access across 5 different user types with varying permissions.",
        solution: "Designed a comprehensive RBAC system with JWT tokens, middleware-based permission checks, and database-level row security for sensitive data."
      },
      {
        challenge: "Integrating multiple AI providers while maintaining consistent response quality.",
        solution: "Built an AI orchestration layer that dynamically selects providers based on availability, cost, and latency. Optimized LLM prompts for the AI Classroom to improve student engagement."
      },
      {
        challenge: "Ensuring zero-downtime deployments with database schema changes.",
        solution: "Created 25+ incremental migration scripts with rollback capabilities, tested migrations in staging environment before production deployment."
      },
      {
        challenge: "Real-time collaboration features across multiple user sessions.",
        solution: "Implemented WebSocket server with room-based broadcasting, allowing targeted notifications and live updates without overwhelming the server."
      }
    ],

