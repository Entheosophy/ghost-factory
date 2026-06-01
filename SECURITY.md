# Security Policy

## Reporting A Vulnerability

Please do not open a public issue for security-sensitive reports.

Email or privately contact the maintainer with:

- a clear description of the issue;
- steps to reproduce it;
- the affected browser, command, or dependency if known;
- any suggested fix or mitigation.

The maintainer will review the report, confirm impact, and publish a fix or advisory when appropriate.

## Scope

Relevant security issues include:

- unsafe handling of imported or rendered assets;
- dependency vulnerabilities that affect users of the app;
- export behavior that leaks unexpected data;
- browser-side behavior that could execute untrusted code.

Ghost Factory is a static client-side creator tool. It should not require secrets or private API keys for normal use.
