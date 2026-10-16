# Fenix TechLog page — iPad V1.6.1 candidate

Adds TechLog to the existing side navigation. Uses the Companion page hostname
with HTTP port 7733 and /#log by default. This avoids putting a user's private
network address into the public source. A per-browser address override is stored
locally; Use this PC resets to the current Companion host.

The iframe loads when TechLog is first selected and retains its state across tab
changes. Reload and Open separately remain available. No proxy, server changes,
credential forwarding, automatic PC installation or firewall changes are added.

Local Node checks passed: all inline script syntax, deferred loading, retained frame
state, persisted address, rejected unsupported schemes/embedded credentials,
and Tailscale/LAN/localhost defaults. The HTML blob matches the tested local file.
Actual embedding and interaction with the user's TechLog server remain unverified:
the development environment has no connection to the private simulator PC.
A frame load event is not used as proof of connection.

This branch is a prepared V1.6.1 candidate. Stable main remains V1.6.0 until
publication is authorised. Windows V4.21 can serve this independent UI update.
