// Best-effort replica set init when the entrypoint init scripts run.
// Compose healthcheck also initiates rs0 if needed.
try {
  rs.status();
} catch (e) {
  rs.initiate({
    _id: "rs0",
    members: [{ _id: 0, host: "localhost:27017" }]
  });
}
